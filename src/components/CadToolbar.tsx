import React from 'react';
import { CadTool, SnapSettings } from '../types/cad';
import { Language, translations } from '../locales/translations';
import {
  MousePointer,
  Hand,
  PenTool,
  Hexagon,
  Square,
  Edit3,
  Ruler,
  Maximize2,
  MapPin,
  Magnet,
  Undo2,
  Redo2,
  Trash2,
  ZoomIn,
  ZoomOut,
  Scan
} from 'lucide-react';

interface CadToolbarProps {
  currentTool: CadTool;
  onSelectTool: (tool: CadTool) => void;
  snapSettings: SnapSettings;
  onToggleSnap: () => void;
  canUndo: boolean;
  canRedo: boolean;
  onUndo: () => void;
  onRedo: () => void;
  onDeleteSelected: () => void;
  hasSelection: boolean;
  zoom: number;
  onZoomIn: () => void;
  onZoomOut: () => void;
  onZoomFit: () => void;
  lang: Language;
}

export const CadToolbar: React.FC<CadToolbarProps> = ({
  currentTool,
  onSelectTool,
  snapSettings,
  onToggleSnap,
  canUndo,
  canRedo,
  onUndo,
  onRedo,
  onDeleteSelected,
  hasSelection,
  zoom,
  onZoomIn,
  onZoomOut,
  onZoomFit,
  lang
}) => {
  const t = translations[lang];

  const tools: { id: CadTool; label: string; icon: React.ReactNode }[] = [
    { id: 'select', label: t.select, icon: <MousePointer className="w-4 h-4" /> },
    { id: 'pan', label: t.pan, icon: <Hand className="w-4 h-4" /> },
    { id: 'draw_polyline', label: t.drawPolyline, icon: <PenTool className="w-4 h-4" /> },
    { id: 'draw_polygon', label: t.drawPolygon, icon: <Hexagon className="w-4 h-4" /> },
    { id: 'draw_rect', label: t.drawRect, icon: <Square className="w-4 h-4" /> },
    { id: 'edit_vertices', label: t.editVertices, icon: <Edit3 className="w-4 h-4" /> },
    { id: 'measure_dist', label: t.measureDist, icon: <Ruler className="w-4 h-4" /> },
    { id: 'measure_area', label: t.measureArea, icon: <Maximize2 className="w-4 h-4" /> },
    { id: 'add_gcp', label: t.addGcp, icon: <MapPin className="w-4 h-4" /> },
  ];

  return (
    <div className="absolute top-3 left-4 z-20 flex flex-col gap-1.5 bg-neutral-900/90 backdrop-blur-md p-1.5 rounded-xl border border-neutral-800 shadow-xl select-none">
      {/* CAD Draw & Select Tools */}
      <div className="flex flex-col gap-1">
        {tools.map(tool => {
          const isActive = currentTool === tool.id;
          return (
            <button
              key={tool.id}
              onClick={() => onSelectTool(tool.id)}
              className={`p-2 rounded-lg transition-all relative group flex items-center justify-center ${
                isActive
                  ? 'bg-cyan-500 text-neutral-950 font-bold shadow-md shadow-cyan-500/20'
                  : 'text-neutral-400 hover:text-neutral-100 hover:bg-neutral-800/80'
              }`}
              title={tool.label}
            >
              {tool.icon}
              {/* Tooltip */}
              <span className="absolute left-full ml-2 px-2 py-1 bg-neutral-950 text-neutral-200 text-xs rounded border border-neutral-800 shadow-lg whitespace-nowrap opacity-0 pointer-events-none group-hover:opacity-100 transition-opacity z-30">
                {tool.label}
              </span>
            </button>
          );
        })}
      </div>

      <div className="h-[1px] bg-neutral-800 my-0.5" />

      {/* Snap Toggle */}
      <button
        onClick={onToggleSnap}
        className={`p-2 rounded-lg transition-all relative group flex items-center justify-center ${
          snapSettings.enabled
            ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
            : 'text-neutral-500 hover:text-neutral-300 hover:bg-neutral-800/60'
        }`}
        title={t.snap}
      >
        <Magnet className="w-4 h-4" />
        <span className="absolute left-full ml-2 px-2 py-1 bg-neutral-950 text-neutral-200 text-xs rounded border border-neutral-800 shadow-lg whitespace-nowrap opacity-0 pointer-events-none group-hover:opacity-100 transition-opacity z-30">
          {t.snap} ({snapSettings.enabled ? 'ON' : 'OFF'})
        </span>
      </button>

      {/* Undo / Redo */}
      <div className="flex flex-col gap-1">
        <button
          onClick={onUndo}
          disabled={!canUndo}
          className="p-2 rounded-lg text-neutral-400 hover:text-neutral-100 hover:bg-neutral-800/80 disabled:opacity-30 disabled:pointer-events-none transition-colors"
          title={t.undo}
        >
          <Undo2 className="w-4 h-4" />
        </button>
        <button
          onClick={onRedo}
          disabled={!canRedo}
          className="p-2 rounded-lg text-neutral-400 hover:text-neutral-100 hover:bg-neutral-800/80 disabled:opacity-30 disabled:pointer-events-none transition-colors"
          title={t.redo}
        >
          <Redo2 className="w-4 h-4" />
        </button>
      </div>

      {/* Delete */}
      {hasSelection && (
        <>
          <div className="h-[1px] bg-neutral-800 my-0.5" />
          <button
            onClick={onDeleteSelected}
            className="p-2 rounded-lg text-red-400 hover:text-red-200 hover:bg-red-950/50 transition-colors"
            title={t.delete}
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </>
      )}

      <div className="h-[1px] bg-neutral-800 my-0.5" />

      {/* Zoom Controls */}
      <div className="flex flex-col gap-1 items-center">
        <button
          onClick={onZoomIn}
          className="p-2 rounded-lg text-neutral-400 hover:text-neutral-100 hover:bg-neutral-800/80 transition-colors"
          title="Zoom In"
        >
          <ZoomIn className="w-4 h-4" />
        </button>
        <button
          onClick={onZoomOut}
          className="p-2 rounded-lg text-neutral-400 hover:text-neutral-100 hover:bg-neutral-800/80 transition-colors"
          title="Zoom Out"
        >
          <ZoomOut className="w-4 h-4" />
        </button>
        <button
          onClick={onZoomFit}
          className="p-2 rounded-lg text-neutral-400 hover:text-neutral-100 hover:bg-neutral-800/80 transition-colors"
          title="Fit to Extents"
        >
          <Scan className="w-4 h-4" />
        </button>
        <span className="text-[10px] font-mono text-neutral-500 py-0.5 tabular-nums">
          {Math.round(zoom * 100)}%
        </span>
      </div>
    </div>
  );
};
