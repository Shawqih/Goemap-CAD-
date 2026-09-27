import React, { useState, useRef, useEffect } from 'react';
import { VectorFeature, Layer } from '../types/cad';
import { Language, translations } from '../locales/translations';
import { Sliders, Eye, EyeOff, Layers, Contrast } from 'lucide-react';

interface DualViewSliderProps {
  image: {
    dataUrl: string | null;
    width: number;
    height: number;
  };
  features: VectorFeature[];
  layers: Layer[];
  lang: Language;
}

export const DualViewSlider: React.FC<DualViewSliderProps> = ({
  image,
  features,
  layers,
  lang
}) => {
  const t = translations[lang];
  const containerRef = useRef<HTMLDivElement>(null);
  const [sliderPos, setSliderPos] = useState(50); // percentage (0 to 100)
  const [isDragging, setIsDragging] = useState(false);
  const [opacity, setOpacity] = useState(0.85);
  const [themeMode, setThemeMode] = useState<'white_print' | 'dark_cad' | 'blueprint'>('white_print');

  // Handle Dragging Divider
  const handlePointerDown = () => setIsDragging(true);
  const handlePointerUp = () => setIsDragging(false);

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!isDragging || !containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const pct = Math.max(5, Math.min(95, (x / rect.width) * 100));
    setSliderPos(pct);
  };

  // Canvas Renders for Left and Right
  const imgCanvasRef = useRef<HTMLCanvasElement>(null);
  const vecCanvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    // 1. Draw Aerial Image Canvas
    const imgCanvas = imgCanvasRef.current;
    if (imgCanvas && image.dataUrl) {
      imgCanvas.width = image.width;
      imgCanvas.height = image.height;
      const ctx = imgCanvas.getContext('2d');
      if (ctx) {
        const img = new Image();
        img.src = image.dataUrl;
        img.onload = () => {
          ctx.drawImage(img, 0, 0);
        };
      }
    }

    // 2. Draw Vector Drawing Canvas
    const vecCanvas = vecCanvasRef.current;
    if (vecCanvas) {
      vecCanvas.width = image.width;
      vecCanvas.height = image.height;
      const ctx = vecCanvas.getContext('2d');
      if (ctx) {
        // Background based on theme
        if (themeMode === 'white_print') {
          ctx.fillStyle = '#FFFFFF';
          ctx.fillRect(0, 0, image.width, image.height);
          // Engineering grid
          ctx.strokeStyle = 'rgba(0, 0, 0, 0.04)';
          ctx.lineWidth = 1;
          for (let x = 0; x < image.width; x += 40) {
            ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, image.height); ctx.stroke();
          }
          for (let y = 0; y < image.height; y += 40) {
            ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(image.width, y); ctx.stroke();
          }
        } else if (themeMode === 'blueprint') {
          ctx.fillStyle = '#0b2545';
          ctx.fillRect(0, 0, image.width, image.height);
          ctx.strokeStyle = 'rgba(144, 205, 244, 0.15)';
          ctx.lineWidth = 1;
          for (let x = 0; x < image.width; x += 40) {
            ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, image.height); ctx.stroke();
          }
          for (let y = 0; y < image.height; y += 40) {
            ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(image.width, y); ctx.stroke();
          }
        } else {
          ctx.fillStyle = '#0F172A';
          ctx.fillRect(0, 0, image.width, image.height);
          ctx.strokeStyle = 'rgba(255, 255, 255, 0.05)';
          ctx.lineWidth = 1;
          for (let x = 0; x < image.width; x += 40) {
            ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, image.height); ctx.stroke();
          }
          for (let y = 0; y < image.height; y += 40) {
            ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(image.width, y); ctx.stroke();
          }
        }

        // Draw Features
        const layerMap = new Map<string, Layer>();
        layers.forEach(l => layerMap.set(l.id, l));

        for (const feat of features) {
          const layer = layerMap.get(feat.layerId);
          if (!layer || !layer.visible) continue;

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

          // In white_print mode, line colors can be crisp black or layer colors
          const strokeColor = themeMode === 'white_print' ? (layer.color === '#FFFFFF' ? '#1E293B' : layer.color) : layer.color;
          ctx.strokeStyle = strokeColor;
          ctx.lineWidth = layer.lineweight * 2.8;

          if (feat.closed) {
            ctx.fillStyle = themeMode === 'white_print' ? `${layer.color}15` : `${layer.color}30`;
            ctx.fill();
          }
          ctx.stroke();
        }
      }
    }
  }, [image, features, layers, themeMode]);

  return (
    <div className="relative w-full h-full flex flex-col bg-neutral-950 select-none overflow-hidden">
      {/* Controls Bar */}
      <div className="h-12 bg-neutral-900 border-b border-neutral-800 px-4 flex items-center justify-between z-10 shrink-0">
        <div className="flex items-center gap-4 text-xs">
          <span className="font-semibold text-neutral-200 flex items-center gap-1.5">
            <Contrast className="w-4 h-4 text-cyan-400" />
            <span>{t.dualView}</span>
          </span>

          {/* Theme Mode for Vector side */}
          <div className="flex items-center bg-neutral-950 p-0.5 rounded-lg border border-neutral-800">
            <button
              onClick={() => setThemeMode('white_print')}
              className={`px-2 py-1 rounded text-xs transition-colors ${
                themeMode === 'white_print' ? 'bg-neutral-800 text-neutral-100 font-semibold' : 'text-neutral-400'
              }`}
            >
              {t.lightCadMode}
            </button>
            <button
              onClick={() => setThemeMode('dark_cad')}
              className={`px-2 py-1 rounded text-xs transition-colors ${
                themeMode === 'dark_cad' ? 'bg-neutral-800 text-cyan-400 font-semibold' : 'text-neutral-400'
              }`}
            >
              {t.darkCadMode}
            </button>
            <button
              onClick={() => setThemeMode('blueprint')}
              className={`px-2 py-1 rounded text-xs transition-colors ${
                themeMode === 'blueprint' ? 'bg-cyan-900/60 text-cyan-200 font-semibold' : 'text-neutral-400'
              }`}
            >
              {t.blueprintMode}
            </button>
          </div>
        </div>

        {/* Opacity slider */}
        <div className="flex items-center gap-2 text-xs">
          <span className="text-neutral-400">{t.opacity}:</span>
          <input
            type="range"
            min="0.1"
            max="1"
            step="0.05"
            value={opacity}
            onChange={e => setOpacity(parseFloat(e.target.value))}
            className="w-24 accent-cyan-500 cursor-pointer"
          />
          <span className="font-mono text-neutral-300 w-8 tabular-nums">
            {Math.round(opacity * 100)}%
          </span>
        </div>
      </div>

      {/* Interactive Split Viewport */}
      <div
        ref={containerRef}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerLeave={handlePointerUp}
        className="relative flex-1 w-full h-full overflow-hidden flex items-center justify-center p-4 bg-neutral-950"
      >
        <div className="relative max-w-full max-h-full aspect-[1000/900] shadow-2xl rounded-lg overflow-hidden border border-neutral-800">
          {/* Base: Vector Canvas */}
          <canvas
            ref={vecCanvasRef}
            className="block w-full h-full object-contain"
          />

          {/* Overlay: Clipped Aerial Image Canvas */}
          <div
            className="absolute inset-0 overflow-hidden"
            style={{
              clipPath: `polygon(0 0, ${sliderPos}% 0, ${sliderPos}% 100%, 0 100%)`,
              opacity
            }}
          >
            <canvas
              ref={imgCanvasRef}
              className="block w-full h-full object-contain"
            />
          </div>

          {/* Swipe Divider Bar */}
          <div
            onPointerDown={handlePointerDown}
            className="absolute top-0 bottom-0 w-1 bg-white cursor-ew-resize flex items-center justify-center shadow-[0_0_15px_rgba(0,0,0,0.8)] z-20"
            style={{ left: `${sliderPos}%` }}
          >
            <div className="w-7 h-7 -ml-3 rounded-full bg-neutral-900 border-2 border-white shadow-xl flex items-center justify-center text-[10px] text-white font-mono font-bold">
              ↔
            </div>
          </div>

          {/* Badges */}
          <div className="absolute top-3 left-3 bg-neutral-900/80 backdrop-blur-md px-2.5 py-1 rounded text-xs text-neutral-200 border border-neutral-700 pointer-events-none">
            {t.originalImage}
          </div>
          <div className="absolute top-3 right-3 bg-neutral-900/80 backdrop-blur-md px-2.5 py-1 rounded text-xs text-cyan-300 border border-neutral-700 pointer-events-none">
            {t.vectorResult}
          </div>
        </div>
      </div>
    </div>
  );
};
