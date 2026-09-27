import React from 'react';
import { Point, GeoTransform, Layer } from '../types/cad';
import { Language, translations } from '../locales/translations';
import { Compass, Layers, Crosshair, Scale } from 'lucide-react';

interface StatusBarProps {
  cursorPixel: Point;
  cursorMap?: { x: number; y: number };
  zoom: number;
  geoTransform: GeoTransform;
  activeLayer: Layer;
  featureCount: number;
  lang: Language;
}

export const StatusBar: React.FC<StatusBarProps> = ({
  cursorPixel,
  cursorMap,
  zoom,
  geoTransform,
  activeLayer,
  featureCount,
  lang
}) => {
  const t = translations[lang];

  return (
    <footer className="h-7 border-t border-neutral-800 bg-neutral-900/95 px-4 flex items-center justify-between text-[11px] font-mono text-neutral-400 select-none shrink-0 z-30">
      {/* Left: Cursor coordinates */}
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-1.5">
          <Crosshair className="w-3 h-3 text-cyan-400" />
          <span>PX:</span>
          <span className="text-neutral-200 tabular-nums">
            {cursorPixel.x.toFixed(1)}, {cursorPixel.y.toFixed(1)}
          </span>
        </div>

        {cursorMap && (
          <div className="flex items-center gap-1.5 text-cyan-300">
            <Compass className="w-3 h-3 text-amber-400" />
            <span>MAP:</span>
            <span className="tabular-nums font-semibold">
              E: {cursorMap.x.toFixed(2)} N: {cursorMap.y.toFixed(2)} {geoTransform.unit}
            </span>
          </div>
        )}
      </div>

      {/* Right: Scale, CRS, Active Layer, Total Features */}
      <div className="flex items-center gap-4">
        {/* Scale */}
        <div className="flex items-center gap-1.5">
          <Scale className="w-3 h-3 text-neutral-500" />
          <span>1 px ≈ {(geoTransform.isCalibrated ? geoTransform.scaleX : 0.1).toFixed(2)}m</span>
        </div>

        {/* CRS */}
        <div className="hidden sm:flex items-center gap-1 text-neutral-300">
          <span className="text-neutral-500">CRS:</span>
          <span className="font-semibold text-amber-400">EPSG:{geoTransform.epsg}</span>
        </div>

        {/* Active Layer */}
        <div className="flex items-center gap-1.5">
          <span
            className="w-2 h-2 rounded-full"
            style={{ backgroundColor: activeLayer.color }}
          />
          <span className="text-neutral-300 font-sans font-medium">
            {activeLayer.name}
          </span>
        </div>

        {/* Total Features */}
        <div className="text-neutral-400 font-mono">
          <span className="text-cyan-400 font-bold tabular-nums">{featureCount}</span> {t.featuresCount}
        </div>
      </div>
    </footer>
  );
};
