import React, { useState } from 'react';
import { GCP, GeoTransform } from '../types/cad';
import { SUPPORTED_CRS, computeAffineTransform, generateWorldFileContent } from '../services/georeference';
import { Language, translations } from '../locales/translations';
import { MapPin, X, Plus, Trash2, CheckCircle2, Download, HelpCircle } from 'lucide-react';

interface GeoreferenceModalProps {
  isOpen: boolean;
  onClose: () => void;
  gcps: GCP[];
  onUpdateGcps: (gcps: GCP[]) => void;
  geoTransform: GeoTransform;
  onUpdateGeoTransform: (transform: GeoTransform) => void;
  imageWidth: number;
  imageHeight: number;
  lang: Language;
}

export const GeoreferenceModal: React.FC<GeoreferenceModalProps> = ({
  isOpen,
  onClose,
  gcps,
  onUpdateGcps,
  geoTransform,
  onUpdateGeoTransform,
  imageWidth,
  imageHeight,
  lang
}) => {
  const t = translations[lang];

  const [selectedEpsg, setSelectedEpsg] = useState<number>(geoTransform.epsg || 32636);
  const [newGcpName, setNewGcpName] = useState('');
  const [newPixelX, setNewPixelX] = useState('');
  const [newPixelY, setNewPixelY] = useState('');
  const [newMapX, setNewMapX] = useState('');
  const [newMapY, setNewMapY] = useState('');

  if (!isOpen) return null;

  const handleCalculate = () => {
    const { transform, updatedGcps } = computeAffineTransform(
      gcps,
      selectedEpsg,
      imageWidth,
      imageHeight
    );
    onUpdateGeoTransform(transform);
    onUpdateGcps(updatedGcps);
  };

  const handleToggleActive = (id: string) => {
    const updated = gcps.map(g => g.id === id ? { ...g, active: !g.active } : g);
    onUpdateGcps(updated);
  };

  const handleDeleteGcp = (id: string) => {
    onUpdateGcps(gcps.filter(g => g.id !== id));
  };

  const handleAddGcp = (e: React.FormEvent) => {
    e.preventDefault();
    const px = parseFloat(newPixelX);
    const py = parseFloat(newPixelY);
    const mx = parseFloat(newMapX);
    const my = parseFloat(newMapY);

    if (isNaN(px) || isNaN(py) || isNaN(mx) || isNaN(my)) return;

    const newG: GCP = {
      id: `gcp_${Date.now()}`,
      name: newGcpName.trim() || `GCP-0${gcps.length + 1}`,
      pixelX: px,
      pixelY: py,
      mapX: mx,
      mapY: my,
      active: true
    };

    onUpdateGcps([...gcps, newG]);
    setNewGcpName('');
    setNewPixelX('');
    setNewPixelY('');
    setNewMapX('');
    setNewMapY('');
  };

  const handleDownloadWorldFile = () => {
    const content = generateWorldFileContent(geoTransform);
    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'aerial_map.tfw';
    a.click();
    URL.revokeObjectURL(url);
  };

  const activeCount = gcps.filter(g => g.active).length;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm select-none">
      <div className="bg-neutral-900 border border-neutral-800 rounded-2xl w-full max-w-3xl shadow-2xl flex flex-col max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 border-b border-neutral-800 flex items-center justify-between bg-neutral-950/50">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-amber-500/20 border border-amber-500/30 flex items-center justify-center text-amber-400">
              <MapPin className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-semibold text-neutral-100">
                {t.gcpTitle}
              </h2>
              <p className="text-[11px] text-neutral-400">
                {t.gcpDesc}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-neutral-400 hover:text-white hover:bg-neutral-800 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto flex-1 flex flex-col gap-5 text-xs text-neutral-300">
          {/* CRS Selection */}
          <div className="flex flex-col gap-1.5">
            <label className="font-semibold text-neutral-200">
              {t.crsSelect}
            </label>
            <select
              value={selectedEpsg}
              onChange={e => setSelectedEpsg(parseInt(e.target.value))}
              className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-3 py-2 text-xs text-cyan-300 font-medium focus:border-cyan-500 outline-none"
            >
              {SUPPORTED_CRS.map(crs => (
                <option key={crs.epsg} value={crs.epsg}>
                  EPSG:{crs.epsg} — {crs.name}
                </option>
              ))}
            </select>
          </div>

          {/* Affine Transformation Summary Banner */}
          <div className="p-4 rounded-xl bg-neutral-950 border border-neutral-800 flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <span className="font-semibold text-neutral-200">
                2D Affine Transformation (6 Parameters)
              </span>
              <span className={`px-2 py-0.5 rounded text-[11px] font-mono ${
                geoTransform.isCalibrated ? 'bg-emerald-950/60 text-emerald-400 border border-emerald-800/60' : 'bg-amber-950/60 text-amber-400 border border-amber-800/60'
              }`}>
                {geoTransform.isCalibrated ? t.calibrated : t.notCalibrated}
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-[11px] font-mono">
              <div>
                <span className="text-neutral-500 block">RMS Error:</span>
                <span className="text-cyan-400 font-bold tabular-nums">
                  {geoTransform.rmsError.toFixed(4)} m
                </span>
              </div>
              <div>
                <span className="text-neutral-500 block">Scale X / Y:</span>
                <span className="text-neutral-200 tabular-nums">
                  {geoTransform.scaleX.toFixed(3)} m/px
                </span>
              </div>
              <div>
                <span className="text-neutral-500 block">Rotation:</span>
                <span className="text-neutral-200 tabular-nums">
                  {geoTransform.rotationDeg.toFixed(2)}°
                </span>
              </div>
              <div>
                <span className="text-neutral-500 block">Active GCPs:</span>
                <span className="text-neutral-200 tabular-nums">
                  {activeCount} / {gcps.length}
                </span>
              </div>
            </div>
          </div>

          {/* GCPs Table */}
          <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <span className="font-semibold text-neutral-200">{t.gcpTable}</span>
              <span className="text-[11px] text-neutral-400">
                Min 3 points required (4 recommended)
              </span>
            </div>

            <div className="border border-neutral-800 rounded-xl overflow-hidden bg-neutral-950/40">
              <table className="w-full text-[11px] text-left">
                <thead className="bg-neutral-950 text-neutral-400 border-b border-neutral-800 font-semibold">
                  <tr>
                    <th className="p-2.5 w-10 text-center">Active</th>
                    <th className="p-2.5">{t.ptName}</th>
                    <th className="p-2.5 font-mono">{t.pixelX}</th>
                    <th className="p-2.5 font-mono">{t.pixelY}</th>
                    <th className="p-2.5 font-mono">{t.mapX}</th>
                    <th className="p-2.5 font-mono">{t.mapY}</th>
                    <th className="p-2.5 font-mono">{t.residual}</th>
                    <th className="p-2.5 w-8"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-800/60 font-mono">
                  {gcps.map(g => (
                    <tr key={g.id} className="hover:bg-neutral-800/30">
                      <td className="p-2.5 text-center">
                        <input
                          type="checkbox"
                          checked={g.active}
                          onChange={() => handleToggleActive(g.id)}
                          className="accent-amber-500 rounded cursor-pointer"
                        />
                      </td>
                      <td className="p-2.5 font-sans font-medium text-neutral-200">
                        {g.name}
                      </td>
                      <td className="p-2.5 text-neutral-300 tabular-nums">{g.pixelX.toFixed(1)}</td>
                      <td className="p-2.5 text-neutral-300 tabular-nums">{g.pixelY.toFixed(1)}</td>
                      <td className="p-2.5 text-cyan-300 tabular-nums">{g.mapX.toFixed(2)}</td>
                      <td className="p-2.5 text-cyan-300 tabular-nums">{g.mapY.toFixed(2)}</td>
                      <td className="p-2.5 tabular-nums">
                        {g.residualError !== undefined ? (
                          <span className={g.residualError > 0.5 ? 'text-red-400' : 'text-emerald-400'}>
                            {g.residualError.toFixed(3)} m
                          </span>
                        ) : (
                          '-'
                        )}
                      </td>
                      <td className="p-2.5 text-right">
                        <button
                          onClick={() => handleDeleteGcp(g.id)}
                          className="text-neutral-500 hover:text-red-400 transition-colors p-1"
                          title="Remove GCP"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Quick Add GCP Row */}
            <form onSubmit={handleAddGcp} className="grid grid-cols-6 gap-2 mt-1">
              <input
                type="text"
                placeholder="GCP Name"
                value={newGcpName}
                onChange={e => setNewGcpName(e.target.value)}
                className="bg-neutral-950 border border-neutral-800 rounded-lg px-2.5 py-1.5 text-xs text-neutral-200"
              />
              <input
                type="number"
                step="any"
                placeholder="Pixel X"
                value={newPixelX}
                onChange={e => setNewPixelX(e.target.value)}
                className="bg-neutral-950 border border-neutral-800 rounded-lg px-2.5 py-1.5 text-xs text-neutral-200 font-mono"
              />
              <input
                type="number"
                step="any"
                placeholder="Pixel Y"
                value={newPixelY}
                onChange={e => setNewPixelY(e.target.value)}
                className="bg-neutral-950 border border-neutral-800 rounded-lg px-2.5 py-1.5 text-xs text-neutral-200 font-mono"
              />
              <input
                type="number"
                step="any"
                placeholder="Map X"
                value={newMapX}
                onChange={e => setNewMapX(e.target.value)}
                className="bg-neutral-950 border border-neutral-800 rounded-lg px-2.5 py-1.5 text-xs text-neutral-200 font-mono"
              />
              <input
                type="number"
                step="any"
                placeholder="Map Y"
                value={newMapY}
                onChange={e => setNewMapY(e.target.value)}
                className="bg-neutral-950 border border-neutral-800 rounded-lg px-2.5 py-1.5 text-xs text-neutral-200 font-mono"
              />
              <button
                type="submit"
                className="flex items-center justify-center gap-1 bg-neutral-800 hover:bg-neutral-700 text-neutral-200 rounded-lg text-xs font-medium transition-colors"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add</span>
              </button>
            </form>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-neutral-800 bg-neutral-950/60 flex items-center justify-between">
          <button
            onClick={handleDownloadWorldFile}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-neutral-300 hover:text-white bg-neutral-800/80 hover:bg-neutral-800 border border-neutral-700 rounded-xl transition-colors"
          >
            <Download className="w-3.5 h-3.5 text-cyan-400" />
            <span>{t.downloadWorldFile}</span>
          </button>

          <div className="flex items-center gap-3">
            <button
              onClick={onClose}
              className="px-4 py-2 text-xs font-medium text-neutral-400 hover:text-white"
            >
              Close
            </button>
            <button
              onClick={handleCalculate}
              disabled={activeCount < 3}
              className="px-5 py-2 text-xs font-semibold text-neutral-950 bg-amber-400 hover:bg-amber-300 disabled:opacity-40 disabled:pointer-events-none rounded-xl shadow-lg transition-all"
            >
              {t.calcTransform}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
