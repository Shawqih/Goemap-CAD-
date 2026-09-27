import React, { useState } from 'react';
import { ProjectState } from '../types/cad';
import { Language, translations } from '../locales/translations';
import { createInitialProject } from '../services/sampleData';
import { 
  FolderKanban, 
  X, 
  Upload, 
  Save, 
  RotateCcw, 
  FileImage, 
  CheckCircle2, 
  Layers, 
  FileCode,
  MapPin
} from 'lucide-react';

interface ProjectManagerModalProps {
  isOpen: boolean;
  onClose: () => void;
  project: ProjectState;
  onUpdateProject: (p: ProjectState) => void;
  onUploadImage: (file: File) => void;
  lang: Language;
}

export const ProjectManagerModal: React.FC<ProjectManagerModalProps> = ({
  isOpen,
  onClose,
  project,
  onUpdateProject,
  onUploadImage,
  lang
}) => {
  const t = translations[lang];

  const [projectName, setProjectName] = useState(project.name);
  const [saveStatus, setSaveStatus] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSaveLocalStorage = () => {
    try {
      const data = JSON.stringify({ ...project, name: projectName, updatedAt: new Date().toISOString() });
      localStorage.setItem('geovector_saved_project', data);
      onUpdateProject({ ...project, name: projectName });
      setSaveStatus('Project saved successfully to local device storage!');
      setTimeout(() => setSaveStatus(null), 3000);
    } catch (e) {
      setSaveStatus('Storage error: Project data may exceed localStorage limit.');
    }
  };

  const handleLoadLocalStorage = () => {
    try {
      const saved = localStorage.getItem('geovector_saved_project');
      if (saved) {
        const parsed = JSON.parse(saved) as ProjectState;
        onUpdateProject(parsed);
        setProjectName(parsed.name);
        setSaveStatus('Loaded previously saved project from local storage!');
        setTimeout(() => setSaveStatus(null), 3000);
      } else {
        setSaveStatus('No saved project found in local storage.');
      }
    } catch (e) {
      setSaveStatus('Error loading project file.');
    }
  };

  const handleResetSample = () => {
    const initial = createInitialProject();
    onUpdateProject(initial);
    setProjectName(initial.name);
    setSaveStatus('Loaded sample Urban Aerial Cadastral survey project.');
    setTimeout(() => setSaveStatus(null), 3000);
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      onUploadImage(e.target.files[0]);
      onClose();
    }
  };

  const megapixels = ((project.image.width * project.image.height) / 1000000).toFixed(2);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm select-none">
      <div className="bg-neutral-900 border border-neutral-800 rounded-2xl w-full max-w-xl shadow-2xl flex flex-col max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 border-b border-neutral-800 flex items-center justify-between bg-neutral-950/50">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-cyan-500/20 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
              <FolderKanban className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-semibold text-neutral-100">
                {t.project} Manager
              </h2>
              <p className="text-[11px] text-neutral-400">
                Manage aerial datasets, local project saves, and raster resolutions.
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
          {/* Project Name */}
          <div className="flex flex-col gap-1.5">
            <label className="font-semibold text-neutral-200">
              Project Title
            </label>
            <input
              type="text"
              value={projectName}
              onChange={e => setProjectName(e.target.value)}
              className="bg-neutral-950 border border-neutral-800 rounded-xl px-3 py-2 text-xs text-neutral-100 font-medium focus:border-cyan-500 outline-none"
            />
          </div>

          {/* Raster Image Metadata Banner */}
          <div className="p-4 rounded-xl bg-neutral-950 border border-neutral-800 flex flex-col gap-3">
            <div className="flex items-center gap-2 text-neutral-200 font-semibold">
              <FileImage className="w-4 h-4 text-cyan-400" />
              <span>Loaded Image Metadata</span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 font-mono text-[11px]">
              <div>
                <span className="text-neutral-500 block">Resolution:</span>
                <span className="text-neutral-200 tabular-nums">
                  {project.image.width} × {project.image.height} px
                </span>
              </div>
              <div>
                <span className="text-neutral-500 block">Megapixels:</span>
                <span className="text-cyan-400 font-bold tabular-nums">
                  {megapixels} MP
                </span>
              </div>
              <div>
                <span className="text-neutral-500 block">DPI / Density:</span>
                <span className="text-neutral-200 tabular-nums">
                  {project.image.dpi} DPI
                </span>
              </div>
              <div>
                <span className="text-neutral-500 block">Vectors:</span>
                <span className="text-emerald-400 font-bold tabular-nums">
                  {project.features.length}
                </span>
              </div>
            </div>

            {/* Upload Custom Image Button */}
            <label className="mt-2 flex items-center justify-center gap-2 py-2 px-3 bg-neutral-800/80 hover:bg-neutral-800 border border-neutral-700 rounded-xl cursor-pointer text-neutral-200 transition-colors">
              <Upload className="w-4 h-4 text-cyan-400" />
              <span className="font-medium">Import Custom JPG / PNG / TIFF Image</span>
              <input
                type="file"
                accept="image/png, image/jpeg, image/tiff"
                onChange={handleFileInput}
                className="hidden"
              />
            </label>
          </div>

          {/* Actions: Save LocalStorage, Load, Reset */}
          <div className="grid grid-cols-3 gap-2">
            <button
              onClick={handleSaveLocalStorage}
              className="flex items-center justify-center gap-1.5 py-2 px-3 bg-neutral-800 hover:bg-neutral-700 text-neutral-200 rounded-xl border border-neutral-700/80 transition-colors font-medium"
            >
              <Save className="w-3.5 h-3.5 text-cyan-400" />
              <span>Save Local</span>
            </button>
            <button
              onClick={handleLoadLocalStorage}
              className="flex items-center justify-center gap-1.5 py-2 px-3 bg-neutral-800 hover:bg-neutral-700 text-neutral-200 rounded-xl border border-neutral-700/80 transition-colors font-medium"
            >
              <FolderKanban className="w-3.5 h-3.5 text-amber-400" />
              <span>Load Saved</span>
            </button>
            <button
              onClick={handleResetSample}
              className="flex items-center justify-center gap-1.5 py-2 px-3 bg-neutral-800 hover:bg-neutral-700 text-neutral-200 rounded-xl border border-neutral-700/80 transition-colors font-medium"
            >
              <RotateCcw className="w-3.5 h-3.5 text-red-400" />
              <span>Reset Sample</span>
            </button>
          </div>

          {/* Status Alert */}
          {saveStatus && (
            <div className="p-3 rounded-xl bg-neutral-950 border border-cyan-500/40 text-cyan-300 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-cyan-400 shrink-0" />
              <span>{saveStatus}</span>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-neutral-800 bg-neutral-950/60 flex items-center justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 text-xs font-semibold text-neutral-950 bg-cyan-400 hover:bg-cyan-300 rounded-xl shadow-lg transition-all"
          >
            Apply & Close
          </button>
        </div>
      </div>
    </div>
  );
};
