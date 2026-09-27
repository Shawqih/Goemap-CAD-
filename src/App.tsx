/**
 * GeoVector CAD Mobile — Vector GIS/CAD Engine
 * Complete On-Device Aerial Image to Vector CAD/GIS Studio
 */

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { 
  ProjectState, 
  CadTool, 
  SnapSettings, 
  VectorFeature, 
  Point, 
  GCP, 
  GeoTransform, 
  FeatureType 
} from './types/cad';
import { createInitialProject } from './services/sampleData';
import { computeAffineTransform } from './services/georeference';
import { Language, translations } from './locales/translations';

// Components
import { Header } from './components/Header';
import { CadCanvas } from './components/CadCanvas';
import { CadToolbar } from './components/CadToolbar';
import { LayerManager } from './components/LayerManager';
import { DualViewSlider } from './components/DualViewSlider';
import { VectorizeModal } from './components/VectorizeModal';
import { GeoreferenceModal } from './components/GeoreferenceModal';
import { ExportModal } from './components/ExportModal';
import { AndroidProjectModal } from './components/AndroidProjectModal';
import { ProjectManagerModal } from './components/ProjectManagerModal';
import { PropertiesPanel } from './components/PropertiesPanel';
import { StatusBar } from './components/StatusBar';

export default function App() {
  // Locale & Direction
  const [lang, setLang] = useState<Language>('ar');
  const t = translations[lang];

  useEffect(() => {
    document.documentElement.lang = lang;
    document.documentElement.dir = lang === 'ar' ? 'rtl' : 'ltr';
  }, [lang]);

  // Theme
  const [theme, setTheme] = useState<'dark' | 'light' | 'blueprint'>('dark');

  // Main View Mode: CAD Editor vs Split Comparison
  const [activeView, setActiveView] = useState<'cad' | 'compare'>('cad');

  // Project State
  const [project, setProject] = useState<ProjectState>(createInitialProject);

  // Undo / Redo History
  const [history, setHistory] = useState<VectorFeature[][]>([]);
  const [redoStack, setRedoStack] = useState<VectorFeature[][]>([]);

  const pushHistory = useCallback((currentFeatures: VectorFeature[]) => {
    setHistory(prev => [...prev.slice(-30), currentFeatures]);
    setRedoStack([]);
  }, []);

  const handleUndo = useCallback(() => {
    if (history.length === 0) return;
    const prev = history[history.length - 1];
    setRedoStack(r => [project.features, ...r]);
    setHistory(h => h.slice(0, -1));
    setProject(p => ({ ...p, features: prev }));
  }, [history, project.features]);

  const handleRedo = useCallback(() => {
    if (redoStack.length === 0) return;
    const next = redoStack[0];
    setRedoStack(r => r.slice(1));
    setHistory(h => [...h, project.features]);
    setProject(p => ({ ...p, features: next }));
  }, [redoStack, project.features]);

  // Active Tool & Selection
  const [currentTool, setCurrentTool] = useState<CadTool>('select');
  const [selectedFeatureIds, setSelectedFeatureIds] = useState<string[]>([]);

  // Snapping Settings
  const [snapSettings, setSnapSettings] = useState<SnapSettings>({
    enabled: true,
    endpoint: true,
    midpoint: true,
    vertex: true,
    grid: true,
    gridSize: 25,
    tolerance: 12
  });

  // Canvas Viewport State
  const [zoom, setZoom] = useState(1.0);
  const [panOffset, setPanOffset] = useState<Point>({ x: 120, y: 60 });
  const [cursorPixel, setCursorPixel] = useState<Point>({ x: 0, y: 0 });
  const [cursorMap, setCursorMap] = useState<{ x: number; y: number } | undefined>();

  // Modals
  const [isVectorizeOpen, setIsVectorizeOpen] = useState(false);
  const [isGeoreferenceOpen, setIsGeoreferenceOpen] = useState(false);
  const [isExportOpen, setIsExportOpen] = useState(false);
  const [isAndroidOpen, setIsAndroidOpen] = useState(false);
  const [isProjectOpen, setIsProjectOpen] = useState(false);

  // Active Layer
  const activeLayer = useMemo(() => {
    return project.layers.find(l => l.id === project.activeLayerId) || project.layers[0];
  }, [project.layers, project.activeLayerId]);

  // Feature counts per layer
  const featureCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const f of project.features) {
      counts[f.layerId] = (counts[f.layerId] || 0) + 1;
    }
    return counts;
  }, [project.features]);

  // Selected Feature
  const selectedFeature = useMemo(() => {
    if (selectedFeatureIds.length === 0) return null;
    return project.features.find(f => f.id === selectedFeatureIds[0]) || null;
  }, [selectedFeatureIds, project.features]);

  // Feature handlers
  const handleAddFeature = (feat: VectorFeature) => {
    pushHistory(project.features);
    setProject(p => ({
      ...p,
      features: [...p.features, feat]
    }));
    setSelectedFeatureIds([feat.id]);
  };

  const handleUpdateFeature = (updatedFeat: VectorFeature) => {
    setProject(p => ({
      ...p,
      features: p.features.map(f => f.id === updatedFeat.id ? updatedFeat : f)
    }));
  };

  const handleDeleteSelected = () => {
    if (selectedFeatureIds.length === 0) return;
    pushHistory(project.features);
    setProject(p => ({
      ...p,
      features: p.features.filter(f => !selectedFeatureIds.includes(f.id))
    }));
    setSelectedFeatureIds([]);
  };

  const handleDeleteFeature = (id: string) => {
    pushHistory(project.features);
    setProject(p => ({
      ...p,
      features: p.features.filter(f => f.id !== id)
    }));
    setSelectedFeatureIds(prev => prev.filter(item => item !== id));
  };

  // Layer handlers
  const handleToggleLayerVisibility = (id: string) => {
    setProject(p => ({
      ...p,
      layers: p.layers.map(l => l.id === id ? { ...l, visible: !l.visible } : l)
    }));
  };

  const handleToggleLayerLock = (id: string) => {
    setProject(p => ({
      ...p,
      layers: p.layers.map(l => l.id === id ? { ...l, locked: !l.locked } : l)
    }));
  };

  const handleChangeLayerColor = (id: string, color: string) => {
    setProject(p => ({
      ...p,
      layers: p.layers.map(l => l.id === id ? { ...l, color } : l)
    }));
  };

  const handleChangeLayerLineweight = (id: string, lineweight: number) => {
    setProject(p => ({
      ...p,
      layers: p.layers.map(l => l.id === id ? { ...l, lineweight } : l)
    }));
  };

  const handleAddLayer = (name: string, featureType: FeatureType, color: string) => {
    const newLayer = {
      id: `layer_${Date.now()}`,
      name,
      featureType,
      color,
      lineweight: 0.25,
      visible: true,
      locked: false,
      dxfAciColor: 7
    };
    setProject(p => ({
      ...p,
      layers: [...p.layers, newLayer],
      activeLayerId: newLayer.id
    }));
  };

  const handleDeleteLayer = (id: string) => {
    setProject(p => ({
      ...p,
      layers: p.layers.filter(l => l.id !== id),
      features: p.features.filter(f => f.layerId !== id),
      activeLayerId: p.activeLayerId === id ? p.layers[0].id : p.activeLayerId
    }));
  };

  // GCPs and Georeference
  const handleUpdateGcps = (gcps: GCP[]) => {
    setProject(p => ({ ...p, gcps }));
  };

  const handleUpdateGeoTransform = (geoTransform: GeoTransform) => {
    setProject(p => ({ ...p, geoTransform }));
  };

  const handleAddGcpPoint = (pt: Point) => {
    const nextIdx = project.gcps.length + 1;
    const newGcp: GCP = {
      id: `gcp_${Date.now()}`,
      name: `GCP-0${nextIdx}`,
      pixelX: Number(pt.x.toFixed(1)),
      pixelY: Number(pt.y.toFixed(1)),
      mapX: Number((326400 + pt.x * 0.95).toFixed(2)),
      mapY: Number((3328500 - pt.y * 0.95).toFixed(2)),
      active: true
    };
    const updatedGcps = [...project.gcps, newGcp];
    const { transform } = computeAffineTransform(
      updatedGcps,
      project.geoTransform.epsg,
      project.image.width,
      project.image.height
    );
    setProject(p => ({
      ...p,
      gcps: updatedGcps,
      geoTransform: transform
    }));
    setCurrentTool('select');
  };

  // Handle Image Upload
  const handleUploadImage = (file: File) => {
    const reader = new FileReader();
    reader.onload = e => {
      const dataUrl = e.target?.result as string;
      const img = new Image();
      img.onload = () => {
        setProject(p => ({
          ...p,
          name: file.name.replace(/\.[^/.]+$/, ''),
          image: {
            dataUrl,
            width: img.width,
            height: img.height,
            dpi: 300,
            fileName: file.name
          },
          features: [] // fresh start for new aerial image
        }));
        setZoom(1.0);
        setPanOffset({ x: 80, y: 60 });
        setIsVectorizeOpen(true);
      };
      img.src = dataUrl;
    };
    reader.readAsDataURL(file);
  };

  // Keyboard Shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return;
      }

      if ((e.ctrlKey || e.metaKey) && e.key === 'z') {
        if (e.shiftKey) {
          handleRedo();
        } else {
          handleUndo();
        }
        e.preventDefault();
      } else if ((e.ctrlKey || e.metaKey) && e.key === 'y') {
        handleRedo();
        e.preventDefault();
      } else if (e.key === 'Delete' || e.key === 'Backspace') {
        handleDeleteSelected();
      } else if (e.key === 'Escape') {
        setSelectedFeatureIds([]);
        setCurrentTool('select');
      } else if (e.key === 'v' || e.key === 'V') {
        setCurrentTool('select');
      } else if (e.key === 'h' || e.key === 'H') {
        setCurrentTool('pan');
      } else if (e.key === 'l' || e.key === 'L') {
        setCurrentTool('draw_polyline');
      } else if (e.key === 'p' || e.key === 'P') {
        setCurrentTool('draw_polygon');
      } else if (e.key === 'r' || e.key === 'R') {
        setCurrentTool('draw_rect');
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleUndo, handleRedo, selectedFeatureIds]);

  return (
    <div className="flex flex-col w-screen h-screen overflow-hidden bg-neutral-950 text-neutral-100">
      {/* Header */}
      <Header
        lang={lang}
        onToggleLang={() => setLang(l => l === 'ar' ? 'en' : 'ar')}
        theme={theme}
        onThemeChange={setTheme}
        activeView={activeView}
        onViewChange={setActiveView}
        onOpenVectorize={() => setIsVectorizeOpen(true)}
        onOpenGeoreference={() => setIsGeoreferenceOpen(true)}
        onOpenExport={() => setIsExportOpen(true)}
        onOpenAndroid={() => setIsAndroidOpen(true)}
        onOpenProject={() => setIsProjectOpen(true)}
        onImportImage={() => setIsProjectOpen(true)}
        featureCount={project.features.length}
      />

      {/* Main Workspace Area */}
      <main className="relative flex-1 w-full overflow-hidden">
        {activeView === 'cad' ? (
          <>
            {/* Interactive CAD Canvas */}
            <CadCanvas
              image={project.image}
              features={project.features}
              layers={project.layers}
              gcps={project.gcps}
              geoTransform={project.geoTransform}
              activeLayerId={project.activeLayerId}
              currentTool={currentTool}
              snapSettings={snapSettings}
              theme={theme}
              imageOpacity={0.8}
              showImage={true}
              showVectors={true}
              selectedFeatureIds={selectedFeatureIds}
              onSelectFeature={(id, multi) => {
                if (!id) {
                  setSelectedFeatureIds([]);
                  return;
                }
                setSelectedFeatureIds(prev => multi ? [...prev, id] : [id]);
              }}
              onAddFeature={handleAddFeature}
              onUpdateFeature={handleUpdateFeature}
              onAddGcpPoint={handleAddGcpPoint}
              zoom={zoom}
              setZoom={setZoom}
              panOffset={panOffset}
              setPanOffset={setPanOffset}
              onCursorMove={(pixel, map) => {
                setCursorPixel(pixel);
                setCursorMap(map);
              }}
            />

            {/* Floating CAD Toolbar */}
            <CadToolbar
              currentTool={currentTool}
              onSelectTool={setCurrentTool}
              snapSettings={snapSettings}
              onToggleSnap={() => setSnapSettings(s => ({ ...s, enabled: !s.enabled }))}
              canUndo={history.length > 0}
              canRedo={redoStack.length > 0}
              onUndo={handleUndo}
              onRedo={handleRedo}
              onDeleteSelected={handleDeleteSelected}
              hasSelection={selectedFeatureIds.length > 0}
              zoom={zoom}
              onZoomIn={() => setZoom(z => Math.min(25, z * 1.25))}
              onZoomOut={() => setZoom(z => Math.max(0.1, z * 0.8))}
              onZoomFit={() => {
                setZoom(0.85);
                setPanOffset({ x: 100, y: 50 });
              }}
              lang={lang}
            />

            {/* Floating Layer Manager */}
            <LayerManager
              layers={project.layers}
              activeLayerId={project.activeLayerId}
              onSelectActiveLayer={id => setProject(p => ({ ...p, activeLayerId: id }))}
              onToggleVisibility={handleToggleLayerVisibility}
              onToggleLock={handleToggleLayerLock}
              onChangeColor={handleChangeLayerColor}
              onChangeLineweight={handleChangeLayerLineweight}
              onAddLayer={handleAddLayer}
              onDeleteLayer={handleDeleteLayer}
              featureCounts={featureCounts}
              lang={lang}
            />

            {/* Floating Feature Properties Panel */}
            <PropertiesPanel
              feature={selectedFeature}
              layers={project.layers}
              geoTransform={project.geoTransform}
              onUpdateFeature={handleUpdateFeature}
              onDeleteFeature={handleDeleteFeature}
              lang={lang}
            />
          </>
        ) : (
          /* Dual-View Split Screen Comparison */
          <DualViewSlider
            image={project.image}
            features={project.features}
            layers={project.layers}
            lang={lang}
          />
        )}
      </main>

      {/* Status Bar */}
      <StatusBar
        cursorPixel={cursorPixel}
        cursorMap={cursorMap}
        zoom={zoom}
        geoTransform={project.geoTransform}
        activeLayer={activeLayer}
        featureCount={project.features.length}
        lang={lang}
      />

      {/* Vectorization CV Modal */}
      <VectorizeModal
        isOpen={isVectorizeOpen}
        onClose={() => setIsVectorizeOpen(false)}
        image={project.image}
        layers={project.layers}
        onApplyFeatures={newFeatures => {
          pushHistory(project.features);
          setProject(p => ({
            ...p,
            features: newFeatures
          }));
        }}
        lang={lang}
      />

      {/* Georeferencing Modal */}
      <GeoreferenceModal
        isOpen={isGeoreferenceOpen}
        onClose={() => setIsGeoreferenceOpen(false)}
        gcps={project.gcps}
        onUpdateGcps={handleUpdateGcps}
        geoTransform={project.geoTransform}
        onUpdateGeoTransform={handleUpdateGeoTransform}
        imageWidth={project.image.width}
        imageHeight={project.image.height}
        lang={lang}
      />

      {/* CAD & GIS Export Modal */}
      <ExportModal
        isOpen={isExportOpen}
        onClose={() => setIsExportOpen(false)}
        project={project}
        lang={lang}
      />

      {/* Android Studio Native Project Modal */}
      <AndroidProjectModal
        isOpen={isAndroidOpen}
        onClose={() => setIsAndroidOpen(false)}
        lang={lang}
      />

      {/* Project & Raster Manager Modal */}
      <ProjectManagerModal
        isOpen={isProjectOpen}
        onClose={() => setIsProjectOpen(false)}
        project={project}
        onUpdateProject={setProject}
        onUploadImage={handleUploadImage}
        lang={lang}
      />
    </div>
  );
}
