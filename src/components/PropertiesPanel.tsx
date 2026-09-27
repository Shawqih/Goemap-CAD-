import React from 'react';
import { VectorFeature, Layer, GeoTransform } from '../types/cad';
import { Language, translations } from '../locales/translations';
import { Info, Trash2, Edit2, Shield, Eye, Layers } from 'lucide-react';

interface PropertiesPanelProps {
  feature: VectorFeature | null;
  layers: Layer[];
  geoTransform: GeoTransform;
  onUpdateFeature: (feature: VectorFeature) => void;
  onDeleteFeature: (id: string) => void;
  lang: Language;
}

export const PropertiesPanel: React.FC<PropertiesPanelProps> = ({
  feature,
  layers,
  geoTransform,
  onUpdateFeature,
  onDeleteFeature,
  lang
}) => {
  const t = translations[lang];

  if (!feature) return null;

  const currentLayer = layers.find(l => l.id === feature.layerId) || layers[0];

  const handleNameChange = (name: string) => {
    onUpdateFeature({ ...feature, name });
  };

  const handleLayerChange = (layerId: string) => {
    onUpdateFeature({ ...feature, layerId });
  };

  const handleToggleClosed = () => {
    onUpdateFeature({ ...feature, closed: !feature.closed });
  };

  const area = feature.properties.area_m2 || feature.properties.area_px || 0;
  const length = feature.properties.length_m || feature.properties.perimeter_px || 0;

  return (
    <div className="absolute bottom-10 right-4 z-20 w-72 bg-neutral-900/90 backdrop-blur-md rounded-xl border border-neutral-800 shadow-xl overflow-hidden select-none text-xs">
      {/* Header */}
      <div className="px-3 py-2 border-b border-neutral-800 bg-neutral-950/60 flex items-center justify-between">
        <div className="flex items-center gap-1.5 font-semibold text-neutral-200">
          <Info className="w-3.5 h-3.5 text-cyan-400" />
          <span>Feature Properties</span>
        </div>
        <button
          onClick={() => onDeleteFeature(feature.id)}
          className="text-neutral-500 hover:text-red-400 p-1 rounded"
          title="Delete Feature"
        >
          <Trash2 className="w-3.5 h-3.5" />
        </button>
      </div>

      <div className="p-3 flex flex-col gap-2.5">
        {/* Name */}
        <div className="flex flex-col gap-1">
          <label className="text-[10px] text-neutral-400 uppercase tracking-wider font-semibold">
            Name
          </label>
          <input
            type="text"
            value={feature.name || ''}
            onChange={e => handleNameChange(e.target.value)}
            className="bg-neutral-950 border border-neutral-800 rounded px-2 py-1 text-xs text-neutral-100 font-medium"
          />
        </div>

        {/* Layer Assignment */}
        <div className="flex flex-col gap-1">
          <label className="text-[10px] text-neutral-400 uppercase tracking-wider font-semibold">
            Layer
          </label>
          <select
            value={feature.layerId}
            onChange={e => handleLayerChange(e.target.value)}
            className="bg-neutral-950 border border-neutral-800 rounded px-2 py-1 text-xs text-neutral-200"
          >
            {layers.map(l => (
              <option key={l.id} value={l.id}>
                {l.name} ({l.featureType})
              </option>
            ))}
          </select>
        </div>

        {/* Geometry Metrics */}
        <div className="grid grid-cols-2 gap-2 bg-neutral-950/60 p-2 rounded-lg border border-neutral-800/80 font-mono text-[11px]">
          <div>
            <span className="text-neutral-500 block">Type:</span>
            <span className="text-neutral-200">{feature.type}</span>
          </div>
          <div>
            <span className="text-neutral-500 block">Vertices:</span>
            <span className="text-cyan-400 font-bold">{feature.points.length}</span>
          </div>
          <div>
            <span className="text-neutral-500 block">Area:</span>
            <span className="text-neutral-200 tabular-nums">
              {area.toFixed(1)} {geoTransform.isCalibrated ? 'm²' : 'px²'}
            </span>
          </div>
          <div>
            <span className="text-neutral-500 block">Perimeter:</span>
            <span className="text-neutral-200 tabular-nums">
              {length.toFixed(1)} {geoTransform.isCalibrated ? 'm' : 'px'}
            </span>
          </div>
        </div>

        {/* Closed Polygon Toggle */}
        <label className="flex items-center justify-between text-neutral-300 cursor-pointer pt-1 border-t border-neutral-800">
          <span>Closed Polygon</span>
          <input
            type="checkbox"
            checked={feature.closed}
            onChange={handleToggleClosed}
            className="accent-cyan-500 rounded cursor-pointer"
          />
        </label>
      </div>
    </div>
  );
};
