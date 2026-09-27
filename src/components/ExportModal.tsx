import React, { useState } from 'react';
import { VectorFeature, Layer, GeoTransform, ProjectState } from '../types/cad';
import { generateDXF } from '../services/exporters/dxfExporter';
import { generateShapefileZip } from '../services/exporters/shapefileExporter';
import { generateGeoJSON } from '../services/exporters/geoJsonExporter';
import { generateKML } from '../services/exporters/kmlExporter';
import { generateVerticesCSV, generateFeaturesSummaryCSV } from '../services/exporters/csvExporter';
import { generateWorldFileContent } from '../services/georeference';
import { Language, translations } from '../locales/translations';
import { 
  Download, 
  X, 
  FileCode, 
  Package, 
  Globe2, 
  Map, 
  Table, 
  FileSpreadsheet, 
  FileText,
  CheckCircle2
} from 'lucide-react';

interface ExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  project: ProjectState;
  lang: Language;
}

export const ExportModal: React.FC<ExportModalProps> = ({
  isOpen,
  onClose,
  project,
  lang
}) => {
  const t = translations[lang];

  const [useGeoCoords, setUseGeoCoords] = useState(true);
  const [downloadSuccess, setDownloadSuccess] = useState<string | null>(null);

  if (!isOpen) return null;

  const downloadBlob = (blob: Blob, filename: string) => {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
    setDownloadSuccess(filename);
    setTimeout(() => setDownloadSuccess(null), 4000);
  };

  const downloadText = (content: string, filename: string, mime = 'text/plain') => {
    const blob = new Blob([content], { type: `${mime};charset=utf-8` });
    downloadBlob(blob, filename);
  };

  // Exporters handlers
  const handleExportDXF = () => {
    const dxfString = generateDXF(project.features, project.layers, project.geoTransform, {
      useGeoreferencedCoords: useGeoCoords && project.geoTransform.isCalibrated,
      invertYAxisForPixels: true,
      imageHeight: project.image.height
    });
    downloadText(dxfString, `${project.name.toLowerCase().replace(/\s+/g, '_')}.dxf`, 'application/dxf');
  };

  const handleExportShapefile = async () => {
    const zipBlob = await generateShapefileZip(
      project.features,
      project.layers,
      project.geoTransform,
      'Polygon'
    );
    downloadBlob(zipBlob, `${project.name.toLowerCase().replace(/\s+/g, '_')}_shapefile.zip`);
  };

  const handleExportGeoJSON = () => {
    const geoJsonStr = generateGeoJSON(project.features, project.layers, project.geoTransform);
    downloadText(geoJsonStr, `${project.name.toLowerCase().replace(/\s+/g, '_')}.geojson`, 'application/geo+json');
  };

  const handleExportKML = () => {
    const kmlStr = generateKML(project.features, project.layers, project.geoTransform);
    downloadText(kmlStr, `${project.name.toLowerCase().replace(/\s+/g, '_')}.kml`, 'application/vnd.google-earth.kml+xml');
  };

  const handleExportVerticesCSV = () => {
    const csvStr = generateVerticesCSV(project.features, project.layers, project.geoTransform);
    downloadText(csvStr, `${project.name.toLowerCase().replace(/\s+/g, '_')}_vertices.csv`, 'text/csv');
  };

  const handleExportSummaryCSV = () => {
    const csvStr = generateFeaturesSummaryCSV(project.features, project.layers, project.geoTransform);
    downloadText(csvStr, `${project.name.toLowerCase().replace(/\s+/g, '_')}_summary.csv`, 'text/csv');
  };

  const handleExportWorldFile = () => {
    const tfwStr = generateWorldFileContent(project.geoTransform);
    downloadText(tfwStr, `${project.name.toLowerCase().replace(/\s+/g, '_')}.tfw`, 'text/plain');
  };

  const handleExportProjectJSON = () => {
    const jsonStr = JSON.stringify(project, null, 2);
    downloadText(jsonStr, `${project.name.toLowerCase().replace(/\s+/g, '_')}.geovector.json`, 'application/json');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm select-none">
      <div className="bg-neutral-900 border border-neutral-800 rounded-2xl w-full max-w-2xl shadow-2xl flex flex-col max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 border-b border-neutral-800 flex items-center justify-between bg-neutral-950/50">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
              <Download className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-semibold text-neutral-100">
                {t.exportTitle}
              </h2>
              <p className="text-[11px] text-neutral-400">
                {t.exportDesc}
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
          {/* Georeferenced Coordinates Toggle */}
          <div className="p-3.5 rounded-xl bg-neutral-950 border border-neutral-800 flex items-center justify-between">
            <div className="flex flex-col">
              <span className="font-semibold text-neutral-200">
                {t.useGeoCoordsCheck}
              </span>
              <span className="text-[11px] text-neutral-400">
                {project.geoTransform.isCalibrated 
                  ? `Active CRS: EPSG:${project.geoTransform.epsg} (${project.geoTransform.crsName})`
                  : 'Requires active GCPs. Defaulting to local metric scale.'
                }
              </span>
            </div>
            <input
              type="checkbox"
              checked={useGeoCoords}
              onChange={e => setUseGeoCoords(e.target.checked)}
              className="accent-emerald-500 w-4 h-4 rounded cursor-pointer"
            />
          </div>

          {/* Export Formats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {/* AutoCAD DXF R2013 */}
            <div className="p-4 rounded-xl bg-neutral-950/60 border border-neutral-800/80 hover:border-emerald-600/50 flex flex-col justify-between transition-all group">
              <div className="flex items-start gap-3">
                <div className="p-2 rounded-lg bg-red-950/40 text-red-400 border border-red-800/40">
                  <FileCode className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-semibold text-neutral-100 group-hover:text-emerald-400 transition-colors">
                    AutoCAD DXF R2013
                  </h3>
                  <p className="text-[11px] text-neutral-400 mt-0.5">
                    Genuine LWPOLYLINE geometry, metric units ($INSUNITS=6), AutoCAD Color Index (ACI) layers.
                  </p>
                </div>
              </div>
              <button
                onClick={handleExportDXF}
                className="mt-3 w-full py-1.5 bg-neutral-800 hover:bg-neutral-700 text-neutral-200 rounded-lg text-xs font-medium transition-colors flex items-center justify-center gap-1.5"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Export .DXF</span>
              </button>
            </div>

            {/* ESRI Shapefile Bundle */}
            <div className="p-4 rounded-xl bg-neutral-950/60 border border-neutral-800/80 hover:border-emerald-600/50 flex flex-col justify-between transition-all group">
              <div className="flex items-start gap-3">
                <div className="p-2 rounded-lg bg-amber-950/40 text-amber-400 border border-amber-800/40">
                  <Package className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-semibold text-neutral-100 group-hover:text-emerald-400 transition-colors">
                    ESRI Shapefile Bundle (.ZIP)
                  </h3>
                  <p className="text-[11px] text-neutral-400 mt-0.5">
                    Binary .shp (Polygon), index .shx, dBase III .dbf attributes, and WKT projection .prj.
                  </p>
                </div>
              </div>
              <button
                onClick={handleExportShapefile}
                className="mt-3 w-full py-1.5 bg-neutral-800 hover:bg-neutral-700 text-neutral-200 rounded-lg text-xs font-medium transition-colors flex items-center justify-center gap-1.5"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Export Shapefile ZIP</span>
              </button>
            </div>

            {/* GeoJSON */}
            <div className="p-4 rounded-xl bg-neutral-950/60 border border-neutral-800/80 hover:border-emerald-600/50 flex flex-col justify-between transition-all group">
              <div className="flex items-start gap-3">
                <div className="p-2 rounded-lg bg-cyan-950/40 text-cyan-400 border border-cyan-800/40">
                  <Globe2 className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-semibold text-neutral-100 group-hover:text-emerald-400 transition-colors">
                    GeoJSON (RFC 7946)
                  </h3>
                  <p className="text-[11px] text-neutral-400 mt-0.5">
                    FeatureCollection with layer attributes, perimeter, area, and CRS URN header.
                  </p>
                </div>
              </div>
              <button
                onClick={handleExportGeoJSON}
                className="mt-3 w-full py-1.5 bg-neutral-800 hover:bg-neutral-700 text-neutral-200 rounded-lg text-xs font-medium transition-colors flex items-center justify-center gap-1.5"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Export .geojson</span>
              </button>
            </div>

            {/* Google Earth KML */}
            <div className="p-4 rounded-xl bg-neutral-950/60 border border-neutral-800/80 hover:border-emerald-600/50 flex flex-col justify-between transition-all group">
              <div className="flex items-start gap-3">
                <div className="p-2 rounded-lg bg-blue-950/40 text-blue-400 border border-blue-800/40">
                  <Map className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-semibold text-neutral-100 group-hover:text-emerald-400 transition-colors">
                    Google Earth KML
                  </h3>
                  <p className="text-[11px] text-neutral-400 mt-0.5">
                    Keyhole Markup with layer styles, polygon coordinates, and descriptions.
                  </p>
                </div>
              </div>
              <button
                onClick={handleExportKML}
                className="mt-3 w-full py-1.5 bg-neutral-800 hover:bg-neutral-700 text-neutral-200 rounded-lg text-xs font-medium transition-colors flex items-center justify-center gap-1.5"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Export .kml</span>
              </button>
            </div>

            {/* Vertices CSV */}
            <div className="p-4 rounded-xl bg-neutral-950/60 border border-neutral-800/80 hover:border-emerald-600/50 flex flex-col justify-between transition-all group">
              <div className="flex items-start gap-3">
                <div className="p-2 rounded-lg bg-purple-950/40 text-purple-400 border border-purple-800/40">
                  <Table className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-semibold text-neutral-100 group-hover:text-emerald-400 transition-colors">
                    Coordinates & Vertices CSV
                  </h3>
                  <p className="text-[11px] text-neutral-400 mt-0.5">
                    Table of all vertices: Pixel $(X, Y)$ and Map $(X, Y)$ Easting/Northing coordinates.
                  </p>
                </div>
              </div>
              <button
                onClick={handleExportVerticesCSV}
                className="mt-3 w-full py-1.5 bg-neutral-800 hover:bg-neutral-700 text-neutral-200 rounded-lg text-xs font-medium transition-colors flex items-center justify-center gap-1.5"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Export Vertices CSV</span>
              </button>
            </div>

            {/* Feature Attributes Summary CSV */}
            <div className="p-4 rounded-xl bg-neutral-950/60 border border-neutral-800/80 hover:border-emerald-600/50 flex flex-col justify-between transition-all group">
              <div className="flex items-start gap-3">
                <div className="p-2 rounded-lg bg-emerald-950/40 text-emerald-400 border border-emerald-800/40">
                  <FileSpreadsheet className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-semibold text-neutral-100 group-hover:text-emerald-400 transition-colors">
                    Feature Summary CSV
                  </h3>
                  <p className="text-[11px] text-neutral-400 mt-0.5">
                    Cadastral record table with feature IDs, layers, calculated areas ($m^2$), and perimeters.
                  </p>
                </div>
              </div>
              <button
                onClick={handleExportSummaryCSV}
                className="mt-3 w-full py-1.5 bg-neutral-800 hover:bg-neutral-700 text-neutral-200 rounded-lg text-xs font-medium transition-colors flex items-center justify-center gap-1.5"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Export Summary CSV</span>
              </button>
            </div>

            {/* World File .TFW */}
            <div className="p-4 rounded-xl bg-neutral-950/60 border border-neutral-800/80 hover:border-emerald-600/50 flex flex-col justify-between transition-all group">
              <div className="flex items-start gap-3">
                <div className="p-2 rounded-lg bg-zinc-800 text-zinc-300 border border-neutral-700">
                  <FileText className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-semibold text-neutral-100 group-hover:text-emerald-400 transition-colors">
                    World File (.tfw / .pgw)
                  </h3>
                  <p className="text-[11px] text-neutral-400 mt-0.5">
                    ESRI 6-parameter affine georeferencing header for GIS image alignment.
                  </p>
                </div>
              </div>
              <button
                onClick={handleExportWorldFile}
                className="mt-3 w-full py-1.5 bg-neutral-800 hover:bg-neutral-700 text-neutral-200 rounded-lg text-xs font-medium transition-colors flex items-center justify-center gap-1.5"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Export .tfw</span>
              </button>
            </div>

            {/* Project JSON */}
            <div className="p-4 rounded-xl bg-neutral-950/60 border border-neutral-800/80 hover:border-emerald-600/50 flex flex-col justify-between transition-all group">
              <div className="flex items-start gap-3">
                <div className="p-2 rounded-lg bg-cyan-950/40 text-cyan-400 border border-cyan-800/40">
                  <Package className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-semibold text-neutral-100 group-hover:text-emerald-400 transition-colors">
                    GeoVector Project (.json)
                  </h3>
                  <p className="text-[11px] text-neutral-400 mt-0.5">
                    Complete internal project state: raster image, all layers, vectors, GCPs, and transforms.
                  </p>
                </div>
              </div>
              <button
                onClick={handleExportProjectJSON}
                className="mt-3 w-full py-1.5 bg-neutral-800 hover:bg-neutral-700 text-neutral-200 rounded-lg text-xs font-medium transition-colors flex items-center justify-center gap-1.5"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Export Project State</span>
              </button>
            </div>
          </div>

          {/* Success Notification */}
          {downloadSuccess && (
            <div className="p-3 rounded-xl bg-emerald-950/60 border border-emerald-500/50 text-emerald-300 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              <span>Downloaded {downloadSuccess} successfully</span>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-neutral-800 bg-neutral-950/60 flex items-center justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 text-xs font-semibold text-neutral-950 bg-neutral-200 hover:bg-white rounded-xl shadow-lg transition-all"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
