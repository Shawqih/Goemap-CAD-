import React, { useState } from 'react';
import { VectorizationConfig, Layer, VectorFeature } from '../types/cad';
import { vectorizeImageData, ProcessProgress } from '../services/imageProcessing';
import { Language, translations } from '../locales/translations';
import { Sparkles, X, Sliders, CheckCircle2, AlertCircle } from 'lucide-react';

interface VectorizeModalProps {
  isOpen: boolean;
  onClose: () => void;
  image: {
    dataUrl: string | null;
    width: number;
    height: number;
  };
  layers: Layer[];
  onApplyFeatures: (features: VectorFeature[]) => void;
  lang: Language;
}

export const VectorizeModal: React.FC<VectorizeModalProps> = ({
  isOpen,
  onClose,
  image,
  layers,
  onApplyFeatures,
  lang
}) => {
  const t = translations[lang];

  const [config, setConfig] = useState<VectorizationConfig>({
    thresholdMode: 'otsu',
    manualThreshold: 128,
    noiseReduction: 1,
    edgeSensitivity: 35,
    morphology: 'close',
    simplifyEpsilon: 2.0,
    minArea: 150,
    detectBuildings: true,
    detectRoads: true,
    detectParcels: true,
    detectVegetation: true,
    detectWater: true,
    invertColors: false,
    orthogonalizeBuildings: true
  });

  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState<ProcessProgress | null>(null);
  const [extractedFeatures, setExtractedFeatures] = useState<VectorFeature[] | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleRun = async () => {
    if (!image.dataUrl) return;

    setIsProcessing(true);
    setProgress({ stage: 'Loading Image Pixels', stageAr: 'جاري تحميل بكسلات الصورة للذاكرة المحلية', percent: 5 });

    // Load image into temporary canvas to extract ImageData
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.src = image.dataUrl;

    img.onload = async () => {
      const tempCanvas = document.createElement('canvas');
      tempCanvas.width = image.width;
      tempCanvas.height = image.height;
      const ctx = tempCanvas.getContext('2d');
      if (!ctx) {
        setIsProcessing(false);
        return;
      }

      ctx.drawImage(img, 0, 0);
      const imgData = ctx.getImageData(0, 0, image.width, image.height);

      try {
        const result = await vectorizeImageData(imgData, config, layers, p => setProgress(p));
        setExtractedFeatures(result.features);
        if (result.processedPreviewUrl) {
          setPreviewUrl(result.processedPreviewUrl);
        }
      } catch (err) {
        console.error('Vectorization error:', err);
      } finally {
        setIsProcessing(false);
      }
    };
  };

  const handleAccept = () => {
    if (extractedFeatures) {
      onApplyFeatures(extractedFeatures);
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm select-none">
      <div className="bg-neutral-900 border border-neutral-800 rounded-2xl w-full max-w-2xl shadow-2xl flex flex-col max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 border-b border-neutral-800 flex items-center justify-between bg-neutral-950/50">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-cyan-500/20 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-semibold text-neutral-100">
                {t.cvTitle}
              </h2>
              <p className="text-[11px] text-neutral-400">
                {t.cvDesc}
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

        {/* Body */}
        <div className="p-6 overflow-y-auto flex-1 flex flex-col gap-5 text-xs text-neutral-300">
          {/* Thresholding Method */}
          <div className="flex flex-col gap-2">
            <label className="font-semibold text-neutral-200">
              {t.thresholdMode}
            </label>
            <div className="grid grid-cols-3 gap-2">
              {[
                { id: 'otsu', label: t.otsu },
                { id: 'adaptive', label: t.adaptive },
                { id: 'manual', label: t.manual }
              ].map(mode => (
                <button
                  key={mode.id}
                  onClick={() => setConfig(prev => ({ ...prev, thresholdMode: mode.id as any }))}
                  className={`p-2 rounded-lg border text-center font-medium transition-all ${
                    config.thresholdMode === mode.id
                      ? 'bg-cyan-950/60 border-cyan-500 text-cyan-300 shadow-sm'
                      : 'bg-neutral-950/40 border-neutral-800 text-neutral-400 hover:text-neutral-200'
                  }`}
                >
                  {mode.label}
                </button>
              ))}
            </div>

            {config.thresholdMode === 'manual' && (
              <div className="flex items-center gap-3 mt-1">
                <span className="text-neutral-400">{t.thresholdValue}:</span>
                <input
                  type="range"
                  min="20"
                  max="240"
                  value={config.manualThreshold}
                  onChange={e => setConfig(prev => ({ ...prev, manualThreshold: parseInt(e.target.value) }))}
                  className="flex-1 accent-cyan-500 cursor-pointer"
                />
                <span className="font-mono text-neutral-200 tabular-nums w-8">
                  {config.manualThreshold}
                </span>
              </div>
            )}
          </div>

          {/* Sliders Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Edge Sensitivity */}
            <div className="flex flex-col gap-1.5 bg-neutral-950/40 p-3 rounded-xl border border-neutral-800">
              <div className="flex justify-between items-center">
                <span className="font-medium text-neutral-200">{t.edgeSens}</span>
                <span className="font-mono text-cyan-400">{config.edgeSensitivity}</span>
              </div>
              <input
                type="range"
                min="10"
                max="80"
                value={config.edgeSensitivity}
                onChange={e => setConfig(prev => ({ ...prev, edgeSensitivity: parseInt(e.target.value) }))}
                className="accent-cyan-500 cursor-pointer"
              />
            </div>

            {/* Simplification Epsilon */}
            <div className="flex flex-col gap-1.5 bg-neutral-950/40 p-3 rounded-xl border border-neutral-800">
              <div className="flex justify-between items-center">
                <span className="font-medium text-neutral-200">{t.simplifyTol}</span>
                <span className="font-mono text-cyan-400">{config.simplifyEpsilon} px</span>
              </div>
              <input
                type="range"
                min="0.5"
                max="6.0"
                step="0.5"
                value={config.simplifyEpsilon}
                onChange={e => setConfig(prev => ({ ...prev, simplifyEpsilon: parseFloat(e.target.value) }))}
                className="accent-cyan-500 cursor-pointer"
              />
            </div>

            {/* Min Feature Area */}
            <div className="flex flex-col gap-1.5 bg-neutral-950/40 p-3 rounded-xl border border-neutral-800">
              <div className="flex justify-between items-center">
                <span className="font-medium text-neutral-200">{t.minArea}</span>
                <span className="font-mono text-cyan-400">{config.minArea} px²</span>
              </div>
              <input
                type="range"
                min="50"
                max="1000"
                step="25"
                value={config.minArea}
                onChange={e => setConfig(prev => ({ ...prev, minArea: parseInt(e.target.value) }))}
                className="accent-cyan-500 cursor-pointer"
              />
            </div>

            {/* Noise Filter */}
            <div className="flex flex-col gap-1.5 bg-neutral-950/40 p-3 rounded-xl border border-neutral-800">
              <div className="flex justify-between items-center">
                <span className="font-medium text-neutral-200">{t.noiseFilter}</span>
                <span className="font-mono text-cyan-400">Lvl {config.noiseReduction}</span>
              </div>
              <input
                type="range"
                min="0"
                max="3"
                step="1"
                value={config.noiseReduction}
                onChange={e => setConfig(prev => ({ ...prev, noiseReduction: parseInt(e.target.value) }))}
                className="accent-cyan-500 cursor-pointer"
              />
            </div>
          </div>

          {/* Checkboxes: Classification & Orthogonalization */}
          <div className="flex flex-col gap-2.5">
            <span className="font-semibold text-neutral-200">{t.detectCategories}</span>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {[
                { key: 'detectBuildings', label: t.buildings },
                { key: 'detectRoads', label: t.roads },
                { key: 'detectParcels', label: t.parcels },
                { key: 'detectVegetation', label: t.vegetation },
                { key: 'detectWater', label: t.water }
              ].map(cat => (
                <label key={cat.key} className="flex items-center gap-2 cursor-pointer text-xs">
                  <input
                    type="checkbox"
                    checked={(config as any)[cat.key]}
                    onChange={e => setConfig(prev => ({ ...prev, [cat.key]: e.target.checked }))}
                    className="accent-cyan-500 rounded cursor-pointer"
                  />
                  <span>{cat.label}</span>
                </label>
              ))}
            </div>

            <label className="flex items-center gap-2 cursor-pointer mt-2 text-cyan-300 font-medium">
              <input
                type="checkbox"
                checked={config.orthogonalizeBuildings}
                onChange={e => setConfig(prev => ({ ...prev, orthogonalizeBuildings: e.target.checked }))}
                className="accent-cyan-500 rounded cursor-pointer"
              />
              <span>{t.snapOrthogonal}</span>
            </label>
          </div>

          {/* Progress Indicator */}
          {progress && (
            <div className="flex flex-col gap-1.5 p-3 rounded-xl bg-neutral-950 border border-neutral-800">
              <div className="flex justify-between items-center text-xs">
                <span className="text-cyan-400 font-medium">
                  {lang === 'ar' ? progress.stageAr : progress.stage}
                </span>
                <span className="font-mono text-neutral-400">{progress.percent}%</span>
              </div>
              <div className="w-full h-2 bg-neutral-800 rounded-full overflow-hidden">
                <div
                  className="h-full bg-cyan-500 transition-all duration-200 rounded-full"
                  style={{ width: `${progress.percent}%` }}
                />
              </div>
            </div>
          )}

          {/* Extracted Stats */}
          {extractedFeatures && (
            <div className="p-3 rounded-xl bg-emerald-950/40 border border-emerald-600/40 flex items-center justify-between">
              <div className="flex items-center gap-2 text-emerald-300">
                <CheckCircle2 className="w-4 h-4" />
                <span>
                  {extractedFeatures.length} {t.featuresCount} successfully extracted
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="px-6 py-4 border-t border-neutral-800 bg-neutral-950/60 flex items-center justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-medium text-neutral-400 hover:text-white"
          >
            Cancel
          </button>

          {!extractedFeatures ? (
            <button
              onClick={handleRun}
              disabled={isProcessing}
              className="px-5 py-2 text-xs font-semibold text-white bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 rounded-xl shadow-lg shadow-cyan-600/20 disabled:opacity-50 transition-all flex items-center gap-2"
            >
              <Sparkles className="w-3.5 h-3.5 text-cyan-200" />
              <span>{isProcessing ? t.processing : t.startVectorize}</span>
            </button>
          ) : (
            <button
              onClick={handleAccept}
              className="px-5 py-2 text-xs font-semibold text-neutral-950 bg-cyan-400 hover:bg-cyan-300 rounded-xl shadow-lg transition-all"
            >
              Apply to CAD Canvas ({extractedFeatures.length} vectors)
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
