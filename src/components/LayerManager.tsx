import React, { useState } from 'react';
import { Layer, FeatureType } from '../types/cad';
import { Language, translations } from '../locales/translations';
import { 
  Layers, 
  Eye, 
  EyeOff, 
  Lock, 
  Unlock, 
  Plus, 
  Check, 
  Trash2, 
  ChevronRight,
  ChevronDown
} from 'lucide-react';

interface LayerManagerProps {
  layers: Layer[];
  activeLayerId: string;
  onSelectActiveLayer: (id: string) => void;
  onToggleVisibility: (id: string) => void;
  onToggleLock: (id: string) => void;
  onChangeColor: (id: string, color: string) => void;
  onChangeLineweight: (id: string, lw: number) => void;
  onAddLayer: (name: string, featureType: FeatureType, color: string) => void;
  onDeleteLayer: (id: string) => void;
  featureCounts: Record<string, number>;
  lang: Language;
}

export const LayerManager: React.FC<LayerManagerProps> = ({
  layers,
  activeLayerId,
  onSelectActiveLayer,
  onToggleVisibility,
  onToggleLock,
  onChangeColor,
  onChangeLineweight,
  onAddLayer,
  onDeleteLayer,
  featureCounts,
  lang
}) => {
  const t = translations[lang];
  const [collapsed, setCollapsed] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [newLayerName, setNewLayerName] = useState('');
  const [newLayerType, setNewLayerType] = useState<FeatureType>('OTHER');
  const [newLayerColor, setNewLayerColor] = useState('#EC4899');

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newLayerName.trim()) return;
    onAddLayer(newLayerName.trim().toUpperCase(), newLayerType, newLayerColor);
    setNewLayerName('');
    setShowAddModal(false);
  };

  return (
    <aside className="absolute top-3 right-4 z-20 w-72 bg-neutral-900/90 backdrop-blur-md rounded-xl border border-neutral-800 shadow-xl overflow-hidden select-none">
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-2.5 border-b border-neutral-800/80 bg-neutral-950/40">
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="flex items-center gap-2 text-xs font-semibold text-neutral-200 hover:text-white transition-colors"
        >
          <Layers className="w-4 h-4 text-cyan-400" />
          <span>{t.layers}</span>
          <span className="text-[11px] text-neutral-400 font-mono">({layers.length})</span>
          {collapsed ? <ChevronRight className="w-3.5 h-3.5 text-neutral-500" /> : <ChevronDown className="w-3.5 h-3.5 text-neutral-500" />}
        </button>

        <button
          onClick={() => setShowAddModal(true)}
          className="p-1 rounded-md text-neutral-400 hover:text-cyan-400 hover:bg-neutral-800 transition-colors"
          title="Add New Layer"
        >
          <Plus className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Layer List */}
      {!collapsed && (
        <div className="max-h-80 overflow-y-auto p-1.5 flex flex-col gap-1">
          {layers.map(layer => {
            const isActive = activeLayerId === layer.id;
            const count = featureCounts[layer.id] || 0;

            return (
              <div
                key={layer.id}
                onClick={() => onSelectActiveLayer(layer.id)}
                className={`flex items-center justify-between px-2 py-1.5 rounded-lg border text-xs cursor-pointer transition-all ${
                  isActive
                    ? 'bg-neutral-800/90 border-cyan-500/40 shadow-sm'
                    : 'bg-neutral-950/30 border-neutral-800/50 hover:bg-neutral-800/50'
                }`}
              >
                {/* Left: Color dot & Layer Name */}
                <div className="flex items-center gap-2 min-w-0">
                  <label 
                    className="relative cursor-pointer shrink-0" 
                    onClick={e => e.stopPropagation()}
                    title="Change Layer Color"
                  >
                    <span
                      className="block w-3 h-3 rounded-full border border-black/40 shadow-sm"
                      style={{ backgroundColor: layer.color }}
                    />
                    <input
                      type="color"
                      value={layer.color}
                      onChange={e => onChangeColor(layer.id, e.target.value)}
                      className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                    />
                  </label>

                  <div className="flex flex-col min-w-0">
                    <span className="font-semibold text-neutral-200 truncate">
                      {layer.name}
                    </span>
                    <span className="text-[10px] text-neutral-400 font-mono">
                      {layer.lineweight}mm · {count} {t.featuresCount}
                    </span>
                  </div>
                </div>

                {/* Right: Actions */}
                <div className="flex items-center gap-1 shrink-0" onClick={e => e.stopPropagation()}>
                  {/* Lineweight selector */}
                  <select
                    value={layer.lineweight}
                    onChange={e => onChangeLineweight(layer.id, parseFloat(e.target.value))}
                    className="bg-neutral-900 border border-neutral-800 text-[10px] text-neutral-300 rounded px-1 py-0.5"
                    title="Lineweight"
                  >
                    <option value="0.18">0.18</option>
                    <option value="0.25">0.25</option>
                    <option value="0.35">0.35</option>
                    <option value="0.50">0.50</option>
                    <option value="0.70">0.70</option>
                  </select>

                  {/* Lock */}
                  <button
                    onClick={() => onToggleLock(layer.id)}
                    className={`p-1 rounded transition-colors ${
                      layer.locked ? 'text-amber-400 bg-amber-950/40' : 'text-neutral-500 hover:text-neutral-300'
                    }`}
                    title={layer.locked ? 'Unlock Layer' : 'Lock Layer'}
                  >
                    {layer.locked ? <Lock className="w-3.5 h-3.5" /> : <Unlock className="w-3.5 h-3.5" />}
                  </button>

                  {/* Visibility */}
                  <button
                    onClick={() => onToggleVisibility(layer.id)}
                    className={`p-1 rounded transition-colors ${
                      layer.visible ? 'text-cyan-400 hover:text-cyan-300' : 'text-neutral-600 hover:text-neutral-400'
                    }`}
                    title={layer.visible ? 'Hide Layer' : 'Show Layer'}
                  >
                    {layer.visible ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
                  </button>

                  {/* Delete button (only for custom layers) */}
                  {!['layer_buildings', 'layer_roads', 'layer_parcels', 'layer_vegetation', 'layer_water', 'layer_other'].includes(layer.id) && (
                    <button
                      onClick={() => onDeleteLayer(layer.id)}
                      className="p-1 rounded text-neutral-600 hover:text-red-400 transition-colors"
                      title="Delete Layer"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Add Layer Dialog */}
      {showAddModal && (
        <form onSubmit={handleCreate} className="p-3 border-t border-neutral-800 bg-neutral-950/80 flex flex-col gap-2">
          <div className="text-xs font-semibold text-neutral-300">New CAD Layer</div>
          <input
            type="text"
            placeholder="LAYER_NAME"
            value={newLayerName}
            onChange={e => setNewLayerName(e.target.value)}
            className="w-full bg-neutral-900 border border-neutral-700 rounded px-2 py-1 text-xs text-neutral-100 placeholder:text-neutral-600 uppercase"
            autoFocus
          />
          <div className="flex items-center gap-2">
            <select
              value={newLayerType}
              onChange={e => setNewLayerType(e.target.value as FeatureType)}
              className="bg-neutral-900 border border-neutral-700 text-xs text-neutral-200 rounded px-2 py-1 flex-1"
            >
              <option value="BUILDINGS">BUILDINGS</option>
              <option value="ROADS">ROADS</option>
              <option value="PARCELS">PARCELS</option>
              <option value="VEGETATION">VEGETATION</option>
              <option value="WATER">WATER</option>
              <option value="OTHER">OTHER</option>
            </select>
            <input
              type="color"
              value={newLayerColor}
              onChange={e => setNewLayerColor(e.target.value)}
              className="w-8 h-7 bg-transparent rounded cursor-pointer border border-neutral-700"
            />
          </div>
          <div className="flex items-center justify-end gap-1.5 mt-1">
            <button
              type="button"
              onClick={() => setShowAddModal(false)}
              className="px-2 py-1 text-xs text-neutral-400 hover:text-white"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-3 py-1 bg-cyan-600 hover:bg-cyan-500 text-white font-medium rounded text-xs"
            >
              Create
            </button>
          </div>
        </form>
      )}
    </aside>
  );
};
