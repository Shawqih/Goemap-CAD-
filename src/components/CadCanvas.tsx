import React, { useRef, useEffect, useState, useCallback } from 'react';
import { 
  VectorFeature, 
  Layer, 
  GCP, 
  GeoTransform, 
  CadTool, 
  SnapSettings, 
  Point 
} from '../types/cad';
import { pixelToMap } from '../services/georeference';

interface CadCanvasProps {
  image: {
    dataUrl: string | null;
    width: number;
    height: number;
  };
  features: VectorFeature[];
  layers: Layer[];
  gcps: GCP[];
  geoTransform: GeoTransform;
  activeLayerId: string;
  currentTool: CadTool;
  snapSettings: SnapSettings;
  theme: 'dark' | 'light' | 'blueprint';
  imageOpacity: number;
  showImage: boolean;
  showVectors: boolean;
  selectedFeatureIds: string[];
  onSelectFeature: (id: string | null, multi?: boolean) => void;
  onAddFeature: (feature: VectorFeature) => void;
  onUpdateFeature: (feature: VectorFeature) => void;
  onAddGcpPoint: (pt: Point) => void;
  zoom: number;
  setZoom: React.Dispatch<React.SetStateAction<number>>;
  panOffset: Point;
  setPanOffset: React.Dispatch<React.SetStateAction<Point>>;
  onCursorMove?: (pixel: Point, map?: { x: number; y: number }) => void;
}

export const CadCanvas: React.FC<CadCanvasProps> = ({
  image,
  features,
  layers,
  gcps,
  geoTransform,
  activeLayerId,
  currentTool,
  snapSettings,
  theme,
  imageOpacity,
  showImage,
  showVectors,
  selectedFeatureIds,
  onSelectFeature,
  onAddFeature,
  onUpdateFeature,
  onAddGcpPoint,
  zoom,
  setZoom,
  panOffset,
  setPanOffset,
  onCursorMove
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const imgElementRef = useRef<HTMLImageElement | null>(null);

  // Interaction State
  const [isPanning, setIsPanning] = useState(false);
  const [panStart, setPanStart] = useState<Point>({ x: 0, y: 0 });
  const [currentMouseScreen, setCurrentMouseScreen] = useState<Point>({ x: 0, y: 0 });
  const [currentMouseWorld, setCurrentMouseWorld] = useState<Point>({ x: 0, y: 0 });
  const [snapPoint, setSnapPoint] = useState<Point | null>(null);

  // Drawing State
  const [drawPoints, setDrawPoints] = useState<Point[]>([]);
  const [measurePoints, setMeasurePoints] = useState<Point[]>([]);
  const [activeVertexDrag, setActiveVertexDrag] = useState<{ featureId: string; vertexIdx: number } | null>(null);

  // Load Image element
  useEffect(() => {
    if (image.dataUrl) {
      const img = new Image();
      img.src = image.dataUrl;
      img.onload = () => {
        imgElementRef.current = img;
        draw();
      };
    }
  }, [image.dataUrl]);

  // Coordinate Conversion: Screen -> World (Pixel coordinates on image)
  const screenToWorld = useCallback((screenPt: Point): Point => {
    return {
      x: (screenPt.x - panOffset.x) / zoom,
      y: (screenPt.y - panOffset.y) / zoom
    };
  }, [panOffset, zoom]);

  // Coordinate Conversion: World -> Screen
  const worldToScreen = useCallback((worldPt: Point): Point => {
    return {
      x: worldPt.x * zoom + panOffset.x,
      y: worldPt.y * zoom + panOffset.y
    };
  }, [panOffset, zoom]);

  // Find Snap Point
  const getSnappedPoint = useCallback((rawWorldPt: Point): Point => {
    if (!snapSettings.enabled) return rawWorldPt;

    const snapTol = snapSettings.tolerance / zoom;
    let closestPt: Point | null = null;
    let minDist = snapTol;

    // 1. Snap to feature vertices & midpoints
    for (const feat of features) {
      const pts = feat.points;
      for (let i = 0; i < pts.length; i++) {
        // Vertex snap
        if (snapSettings.vertex || snapSettings.endpoint) {
          const d = Math.hypot(pts[i].x - rawWorldPt.x, pts[i].y - rawWorldPt.y);
          if (d < minDist) {
            minDist = d;
            closestPt = pts[i];
          }
        }

        // Midpoint snap
        if (snapSettings.midpoint && (i < pts.length - 1 || feat.closed)) {
          const next = pts[(i + 1) % pts.length];
          const mid = { x: (pts[i].x + next.x) / 2, y: (pts[i].y + next.y) / 2 };
          const d = Math.hypot(mid.x - rawWorldPt.x, mid.y - rawWorldPt.y);
          if (d < minDist) {
            minDist = d;
            closestPt = mid;
          }
        }
      }
    }

    // 2. Snap to GCPs
    for (const g of gcps) {
      const d = Math.hypot(g.pixelX - rawWorldPt.x, g.pixelY - rawWorldPt.y);
      if (d < minDist) {
        minDist = d;
        closestPt = { x: g.pixelX, y: g.pixelY };
      }
    }

    // 3. Grid snap
    if (!closestPt && snapSettings.grid) {
      const grid = snapSettings.gridSize;
      const gx = Math.round(rawWorldPt.x / grid) * grid;
      const gy = Math.round(rawWorldPt.y / grid) * grid;
      if (Math.hypot(gx - rawWorldPt.x, gy - rawWorldPt.y) < snapTol) {
        closestPt = { x: gx, y: gy };
      }
    }

    return closestPt || rawWorldPt;
  }, [snapSettings, zoom, features, gcps]);

  // Main Render Function
  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const width = canvas.width;
    const height = canvas.height;

    ctx.clearRect(0, 0, width, height);

    // 1. Draw Background based on Theme
    if (theme === 'blueprint') {
      ctx.fillStyle = '#0b2545';
      ctx.fillRect(0, 0, width, height);
    } else if (theme === 'light') {
      ctx.fillStyle = '#F8FAFC';
      ctx.fillRect(0, 0, width, height);
    } else {
      ctx.fillStyle = '#0B0F19';
      ctx.fillRect(0, 0, width, height);
    }

    // 2. Draw CAD Grid
    const gridSpacing = 50 * zoom;
    const majorGridSpacing = 250 * zoom;

    ctx.lineWidth = 1;
    ctx.strokeStyle = theme === 'light' ? 'rgba(0,0,0,0.06)' : 'rgba(255,255,255,0.05)';

    const startX = panOffset.x % gridSpacing;
    const startY = panOffset.y % gridSpacing;

    ctx.beginPath();
    for (let x = startX; x < width; x += gridSpacing) {
      ctx.moveTo(x, 0);
      ctx.lineTo(x, height);
    }
    for (let y = startY; y < height; y += gridSpacing) {
      ctx.moveTo(0, y);
      ctx.lineTo(width, y);
    }
    ctx.stroke();

    // Major grid
    ctx.strokeStyle = theme === 'light' ? 'rgba(0,0,0,0.12)' : (theme === 'blueprint' ? 'rgba(144,205,244,0.2)' : 'rgba(255,255,255,0.1)');
    const majorStartX = panOffset.x % majorGridSpacing;
    const majorStartY = panOffset.y % majorGridSpacing;

    ctx.beginPath();
    for (let x = majorStartX; x < width; x += majorGridSpacing) {
      ctx.moveTo(x, 0);
      ctx.lineTo(x, height);
    }
    for (let y = majorStartY; y < height; y += majorGridSpacing) {
      ctx.moveTo(0, y);
      ctx.lineTo(width, y);
    }
    ctx.stroke();

    ctx.save();
    // Apply Viewport Transformation
    ctx.translate(panOffset.x, panOffset.y);
    ctx.scale(zoom, zoom);

    // 3. Draw Aerial Background Raster Image
    if (showImage && imgElementRef.current && image.dataUrl) {
      ctx.save();
      ctx.globalAlpha = imageOpacity;
      ctx.drawImage(imgElementRef.current, 0, 0, image.width, image.height);
      ctx.restore();

      // Image border
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
      ctx.lineWidth = 1 / zoom;
      ctx.strokeRect(0, 0, image.width, image.height);
    }

    // 4. Draw Vector Features
    if (showVectors) {
      const layerMap = new Map<string, Layer>();
      layers.forEach(l => layerMap.set(l.id, l));

      for (const feat of features) {
        const layer = layerMap.get(feat.layerId);
        if (!layer || !layer.visible) continue;

        const isSelected = selectedFeatureIds.includes(feat.id);
        const pts = feat.points;
        if (pts.length < 2) continue;

        ctx.beginPath();
        ctx.moveTo(pts[0].x, pts[0].y);
        for (let i = 1; i < pts.length; i++) {
          ctx.lineTo(pts[i].x, pts[i].y);
        }
        if (feat.closed) {
          ctx.closePath();
        }

        // Polygon Fill
        if (feat.closed) {
          ctx.fillStyle = isSelected 
            ? 'rgba(6, 182, 212, 0.25)' 
            : `${layer.color}25`; // ~15% opacity hex
          ctx.fill();
        }

        // Outline Stroke
        ctx.strokeStyle = isSelected ? '#00FFFF' : layer.color;
        ctx.lineWidth = Math.max(1 / zoom, (layer.lineweight * 2.5) / Math.sqrt(zoom));
        ctx.lineJoin = 'miter';
        ctx.lineCap = 'round';
        ctx.stroke();

        // Selected Halo
        if (isSelected) {
          ctx.save();
          ctx.strokeStyle = 'rgba(6, 182, 212, 0.4)';
          ctx.lineWidth = (layer.lineweight * 4) / Math.sqrt(zoom);
          ctx.stroke();
          ctx.restore();

          // Draw vertex handles
          for (let i = 0; i < pts.length; i++) {
            const vx = pts[i].x;
            const vy = pts[i].y;
            const size = 5 / zoom;

            ctx.fillStyle = '#FFFFFF';
            ctx.fillRect(vx - size / 2, vy - size / 2, size, size);
            ctx.strokeStyle = '#000000';
            ctx.lineWidth = 1 / zoom;
            ctx.strokeRect(vx - size / 2, vy - size / 2, size, size);
          }
        }
      }
    }

    // 5. Draw Ground Control Points (GCPs)
    for (const g of gcps) {
      const gx = g.pixelX;
      const gy = g.pixelY;
      const targetR = 8 / zoom;

      ctx.save();
      ctx.strokeStyle = g.active ? '#F59E0B' : '#71717A'; // Amber or Zinc
      ctx.lineWidth = 1.5 / zoom;

      // Circle
      ctx.beginPath();
      ctx.arc(gx, gy, targetR, 0, Math.PI * 2);
      ctx.stroke();

      // Crosshairs
      ctx.beginPath();
      ctx.moveTo(gx - targetR * 1.5, gy);
      ctx.lineTo(gx + targetR * 1.5, gy);
      ctx.moveTo(gx, gy - targetR * 1.5);
      ctx.lineTo(gx, gy + targetR * 1.5);
      ctx.stroke();

      // Label
      ctx.font = `${Math.max(10, 11 / zoom)}px monospace`;
      ctx.fillStyle = '#F59E0B';
      ctx.fillText(g.name, gx + targetR + 2 / zoom, gy - 2 / zoom);
      ctx.restore();
    }

    // 6. Draw In-Progress Drawing Polyline/Polygon/Rectangle
    if (drawPoints.length > 0) {
      ctx.beginPath();
      ctx.moveTo(drawPoints[0].x, drawPoints[0].y);

      for (let i = 1; i < drawPoints.length; i++) {
        ctx.lineTo(drawPoints[i].x, drawPoints[i].y);
      }

      // Rubberband to mouse
      if (currentTool === 'draw_rect' && drawPoints.length === 1) {
        const p1 = drawPoints[0];
        const p2 = currentMouseWorld;
        ctx.lineTo(p2.x, p1.y);
        ctx.lineTo(p2.x, p2.y);
        ctx.lineTo(p1.x, p2.y);
        ctx.closePath();
      } else {
        ctx.lineTo(currentMouseWorld.x, currentMouseWorld.y);
        if (currentTool === 'draw_polygon' && drawPoints.length >= 2) {
          ctx.lineTo(drawPoints[0].x, drawPoints[0].y);
        }
      }

      ctx.strokeStyle = '#FACC15'; // Yellow guide
      ctx.lineWidth = 1.5 / zoom;
      ctx.setLineDash([4 / zoom, 4 / zoom]);
      ctx.stroke();
      ctx.setLineDash([]);

      // Draw point markers
      for (const p of drawPoints) {
        ctx.fillStyle = '#FACC15';
        ctx.beginPath();
        ctx.arc(p.x, p.y, 4 / zoom, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    // 7. Draw In-Progress Measurement
    if (measurePoints.length > 0) {
      ctx.beginPath();
      ctx.moveTo(measurePoints[0].x, measurePoints[0].y);
      for (let i = 1; i < measurePoints.length; i++) {
        ctx.lineTo(measurePoints[i].x, measurePoints[i].y);
      }
      ctx.lineTo(currentMouseWorld.x, currentMouseWorld.y);

      ctx.strokeStyle = '#EC4899'; // Pink measurement line
      ctx.lineWidth = 2 / zoom;
      ctx.stroke();

      // Calculate distance in meters
      const lastPt = measurePoints[measurePoints.length - 1];
      const distPx = Math.hypot(currentMouseWorld.x - lastPt.x, currentMouseWorld.y - lastPt.y);
      const distM = geoTransform.isCalibrated ? distPx * geoTransform.scaleX : distPx * 0.1;

      // Draw dimension text
      const midX = (lastPt.x + currentMouseWorld.x) / 2;
      const midY = (lastPt.y + currentMouseWorld.y) / 2;

      ctx.fillStyle = '#0F172A';
      const text = `${distM.toFixed(2)} m`;
      ctx.font = `bold ${Math.max(12, 13 / zoom)}px monospace`;
      const txtWidth = ctx.measureText(text).width;
      ctx.fillRect(midX - 2 / zoom, midY - 14 / zoom, txtWidth + 6 / zoom, 18 / zoom);
      ctx.fillStyle = '#EC4899';
      ctx.fillText(text, midX, midY);
    }

    // 8. Draw Object Snap Indicator
    if (snapPoint) {
      const sz = 6 / zoom;
      ctx.strokeStyle = '#06B6D4';
      ctx.lineWidth = 2 / zoom;
      ctx.strokeRect(snapPoint.x - sz / 2, snapPoint.y - sz / 2, sz, sz);
    }

    ctx.restore();
  }, [
    theme,
    zoom,
    panOffset,
    showImage,
    imageOpacity,
    image,
    showVectors,
    features,
    layers,
    selectedFeatureIds,
    gcps,
    drawPoints,
    currentMouseWorld,
    currentTool,
    measurePoints,
    geoTransform,
    snapPoint
  ]);

  // Canvas Resize Listener
  useEffect(() => {
    const handleResize = () => {
      const container = containerRef.current;
      const canvas = canvasRef.current;
      if (!container || !canvas) return;
      canvas.width = container.clientWidth;
      canvas.height = container.clientHeight;
      draw();
    };

    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [draw]);

  // Redraw when state updates
  useEffect(() => {
    draw();
  }, [draw]);

  // Mouse Move
  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;
    const screenPt = { x: e.clientX - rect.left, y: e.clientY - rect.top };
    setCurrentMouseScreen(screenPt);

    if (isPanning) {
      const dx = screenPt.x - panStart.x;
      const dy = screenPt.y - panStart.y;
      setPanOffset(prev => ({ x: prev.x + dx, y: prev.y + dy }));
      setPanStart(screenPt);
      return;
    }

    const rawWorld = screenToWorld(screenPt);
    const snapped = getSnappedPoint(rawWorld);
    setCurrentMouseWorld(snapped);
    setSnapPoint(snapped !== rawWorld ? snapped : null);

    // Report coordinates to parent
    if (onCursorMove) {
      const mapPt = geoTransform.isCalibrated ? pixelToMap(snapped, geoTransform) : undefined;
      onCursorMove(snapped, mapPt);
    }

    // Vertex dragging
    if (activeVertexDrag) {
      const targetFeat = features.find(f => f.id === activeVertexDrag.featureId);
      if (targetFeat) {
        const updatedPts = [...targetFeat.points];
        updatedPts[activeVertexDrag.vertexIdx] = snapped;
        onUpdateFeature({
          ...targetFeat,
          points: updatedPts
        });
      }
    }
  };

  // Mouse Down
  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;
    const screenPt = { x: e.clientX - rect.left, y: e.clientY - rect.top };

    // Pan with Middle Click or Pan Tool or Space Key
    if (e.button === 1 || currentTool === 'pan' || e.altKey) {
      setIsPanning(true);
      setPanStart(screenPt);
      return;
    }

    if (e.button !== 0) return; // Left click only

    const worldPt = snapPoint || screenToWorld(screenPt);

    // 1. Tool: Select Feature or Edit Vertices
    if (currentTool === 'select' || currentTool === 'edit_vertices') {
      // Check if clicked near an existing vertex of selected feature
      if (selectedFeatureIds.length > 0) {
        const selFeat = features.find(f => f.id === selectedFeatureIds[0]);
        if (selFeat) {
          for (let i = 0; i < selFeat.points.length; i++) {
            if (Math.hypot(selFeat.points[i].x - worldPt.x, selFeat.points[i].y - worldPt.y) < 10 / zoom) {
              setActiveVertexDrag({ featureId: selFeat.id, vertexIdx: i });
              return;
            }
          }
        }
      }

      // Check if clicked inside or near any feature
      let clickedFeatureId: string | null = null;
      for (let i = features.length - 1; i >= 0; i--) {
        const feat = features[i];
        for (const pt of feat.points) {
          if (Math.hypot(pt.x - worldPt.x, pt.y - worldPt.y) < 12 / zoom) {
            clickedFeatureId = feat.id;
            break;
          }
        }
        if (clickedFeatureId) break;
      }

      onSelectFeature(clickedFeatureId, e.shiftKey);
      return;
    }

    // 2. Tool: Draw Polyline / Polygon
    if (currentTool === 'draw_polyline' || currentTool === 'draw_polygon') {
      setDrawPoints(prev => [...prev, worldPt]);
      return;
    }

    // 3. Tool: Draw Rectangle
    if (currentTool === 'draw_rect') {
      if (drawPoints.length === 0) {
        setDrawPoints([worldPt]);
      } else {
        const p1 = drawPoints[0];
        const p2 = worldPt;
        const rectPoints = [
          { x: p1.x, y: p1.y },
          { x: p2.x, y: p1.y },
          { x: p2.x, y: p2.y },
          { x: p1.x, y: p2.y }
        ];

        const newFeat: VectorFeature = {
          id: `rect_${Date.now()}`,
          layerId: activeLayerId,
          name: `Rectangle #${features.length + 1}`,
          type: 'Polygon',
          points: rectPoints,
          closed: true,
          properties: {
            area_px: Math.abs((p2.x - p1.x) * (p2.y - p1.y)),
            length_m: (Math.abs(p2.x - p1.x) + Math.abs(p2.y - p1.y)) * 2 * (geoTransform.isCalibrated ? geoTransform.scaleX : 0.1)
          }
        };

        onAddFeature(newFeat);
        setDrawPoints([]);
      }
      return;
    }

    // 4. Tool: Measure Distance
    if (currentTool === 'measure_dist') {
      setMeasurePoints(prev => [...prev, worldPt]);
      return;
    }

    // 5. Tool: Add GCP
    if (currentTool === 'add_gcp') {
      onAddGcpPoint(worldPt);
      return;
    }
  };

  // Mouse Up
  const handleMouseUp = () => {
    setIsPanning(false);
    setActiveVertexDrag(null);
  };

  // Double Click / Finish Drawing
  const handleDoubleClick = () => {
    if (drawPoints.length >= 2) {
      const isPolygon = currentTool === 'draw_polygon';
      const newFeat: VectorFeature = {
        id: `feat_${Date.now()}`,
        layerId: activeLayerId,
        name: `${isPolygon ? 'Polygon' : 'Polyline'} #${features.length + 1}`,
        type: isPolygon ? 'Polygon' : 'Polyline',
        points: [...drawPoints],
        closed: isPolygon,
        properties: {
          pointsCount: drawPoints.length
        }
      };
      onAddFeature(newFeat);
      setDrawPoints([]);
    }
    if (measurePoints.length > 0) {
      setMeasurePoints([]);
    }
  };

  // Wheel Zoom
  const handleWheel = (e: React.WheelEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;

    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;

    const zoomFactor = e.deltaY < 0 ? 1.15 : 0.85;
    const newZoom = Math.min(25, Math.max(0.1, zoom * zoomFactor));

    // Zoom towards cursor
    setPanOffset(prev => ({
      x: mouseX - (mouseX - prev.x) * (newZoom / zoom),
      y: mouseY - (mouseY - prev.y) * (newZoom / zoom)
    }));

    setZoom(newZoom);
  };

  return (
    <div ref={containerRef} className="relative w-full h-full overflow-hidden select-none cursor-crosshair">
      <canvas
        ref={canvasRef}
        onMouseMove={handleMouseMove}
        onMouseDown={handleMouseDown}
        onMouseUp={handleMouseUp}
        onDoubleClick={handleDoubleClick}
        onWheel={handleWheel}
        className="w-full h-full block"
      />

      {/* Drawing Instruction Pill */}
      {drawPoints.length > 0 && (
        <div className="absolute top-4 left-1/2 -translate-x-1/2 px-3 py-1.5 bg-neutral-900/90 border border-neutral-700 rounded-lg text-xs text-cyan-300 shadow-xl pointer-events-none flex items-center gap-2">
          <span>Click to add vertex · Double-click to complete</span>
          <span className="font-mono text-neutral-400">({drawPoints.length} pts)</span>
        </div>
      )}
    </div>
  );
};
