import React, { useState } from 'react';
import { ANDROID_FILES, downloadAndroidProjectZip } from '../android-project/androidProjectFiles';
import { Language, translations } from '../locales/translations';
import { 
  Smartphone, 
  X, 
  Download, 
  Copy, 
  Check, 
  FileCode, 
  FolderTree, 
  Terminal,
  ExternalLink
} from 'lucide-react';

interface AndroidProjectModalProps {
  isOpen: boolean;
  onClose: () => void;
  lang: Language;
}

export const AndroidProjectModal: React.FC<AndroidProjectModalProps> = ({
  isOpen,
  onClose,
  lang
}) => {
  const t = translations[lang];

  const [selectedFilePath, setSelectedFilePath] = useState(ANDROID_FILES[3].path); // app/build.gradle.kts default
  const [copied, setCopied] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);

  if (!isOpen) return null;

  const currentFile = ANDROID_FILES.find(f => f.path === selectedFilePath) || ANDROID_FILES[0];

  const handleCopy = () => {
    navigator.clipboard.writeText(currentFile.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownloadZip = async () => {
    setIsDownloading(true);
    try {
      const zipBlob = await downloadAndroidProjectZip();
      const url = URL.createObjectURL(zipBlob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'geovector-cad-mobile-android-project.zip';
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Error generating Android zip:', err);
    } finally {
      setIsDownloading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm select-none">
      <div className="bg-neutral-900 border border-neutral-800 rounded-2xl w-full max-w-5xl shadow-2xl flex flex-col h-[85vh] overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 border-b border-neutral-800 flex items-center justify-between bg-neutral-950/60 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
              <Smartphone className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-sm font-semibold text-neutral-100 flex items-center gap-2">
                <span>{t.androidTitle}</span>
                <span className="text-[10px] bg-emerald-950 text-emerald-400 border border-emerald-800 px-2 py-0.5 rounded font-mono">
                  Kotlin 1.9 · Jetpack Compose · Material 3
                </span>
              </h2>
              <p className="text-[11px] text-neutral-400">
                {t.androidDesc}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleDownloadZip}
              disabled={isDownloading}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-neutral-950 bg-emerald-400 hover:bg-emerald-300 disabled:opacity-50 rounded-xl shadow-lg transition-all"
            >
              <Download className="w-3.5 h-3.5" />
              <span>{isDownloading ? 'Generating ZIP...' : t.downloadAndroidZip}</span>
            </button>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-neutral-400 hover:text-white hover:bg-neutral-800 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Content Body: Sidebar Tree + Code Viewer */}
        <div className="flex-1 flex overflow-hidden">
          {/* File Tree Sidebar */}
          <div className="w-64 border-r border-neutral-800 bg-neutral-950/50 p-2.5 overflow-y-auto flex flex-col gap-1 text-xs shrink-0 font-mono">
            <div className="px-2 py-1 text-[11px] uppercase tracking-wider text-neutral-500 font-sans font-semibold flex items-center gap-1.5">
              <FolderTree className="w-3.5 h-3.5" />
              <span>{t.fileTree}</span>
            </div>

            {ANDROID_FILES.map(file => {
              const isSelected = file.path === selectedFilePath;
              return (
                <button
                  key={file.path}
                  onClick={() => setSelectedFilePath(file.path)}
                  className={`px-2.5 py-1.5 rounded-lg text-left truncate transition-colors flex items-center gap-2 ${
                    isSelected
                      ? 'bg-neutral-800 text-cyan-400 font-semibold'
                      : 'text-neutral-400 hover:text-neutral-200 hover:bg-neutral-900'
                  }`}
                  title={file.path}
                >
                  <FileCode className="w-3.5 h-3.5 shrink-0 opacity-70" />
                  <span className="truncate">{file.path.split('/').pop()}</span>
                </button>
              );
            })}
          </div>

          {/* Code Viewer */}
          <div className="flex-1 flex flex-col bg-neutral-950 overflow-hidden">
            {/* File Path & Copy Toolbar */}
            <div className="h-10 border-b border-neutral-800 px-4 flex items-center justify-between bg-neutral-900/60 shrink-0">
              <div className="flex items-center gap-2 font-mono text-xs text-neutral-300 truncate">
                <span className="text-cyan-400">{currentFile.path}</span>
                <span className="text-neutral-500 text-[11px]">({currentFile.description})</span>
              </div>

              <button
                onClick={handleCopy}
                className="flex items-center gap-1.5 px-2.5 py-1 text-xs rounded-md bg-neutral-800 hover:bg-neutral-700 text-neutral-200 transition-colors"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copied ? t.copied : t.copyCode}</span>
              </button>
            </div>

            {/* Code Body */}
            <pre className="flex-1 p-4 overflow-auto font-mono text-xs text-neutral-300 leading-relaxed bg-neutral-950 selection:bg-cyan-500/30 selection:text-cyan-200">
              <code>{currentFile.content}</code>
            </pre>

            {/* Quick Build Instructions Bar */}
            <div className="px-4 py-2 border-t border-neutral-800 bg-neutral-900/80 flex items-center justify-between text-[11px] text-neutral-400 shrink-0">
              <div className="flex items-center gap-2">
                <Terminal className="w-3.5 h-3.5 text-emerald-400" />
                <span>Build Command:</span>
                <code className="bg-neutral-950 px-2 py-0.5 rounded text-neutral-200 border border-neutral-800">
                  ./gradlew assembleDebug
                </code>
              </div>
              <span className="font-mono text-neutral-500">Android Studio Hedgehog+ / JDK 17</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
