import React from 'react';
import { Language, translations } from '../locales/translations';
import { 
  FolderOpen, 
  Sparkles, 
  Layers, 
  MapPin, 
  Download, 
  Smartphone, 
  SplitSquareVertical, 
  Sun, 
  Moon,
  Globe
} from 'lucide-react';

interface HeaderProps {
  lang: Language;
  onToggleLang: () => void;
  theme: 'dark' | 'light' | 'blueprint';
  onThemeChange: (t: 'dark' | 'light' | 'blueprint') => void;
  activeView: 'cad' | 'compare';
  onViewChange: (v: 'cad' | 'compare') => void;
  onOpenVectorize: () => void;
  onOpenGeoreference: () => void;
  onOpenExport: () => void;
  onOpenAndroid: () => void;
  onOpenProject: () => void;
  onImportImage: () => void;
  featureCount: number;
}

export const Header: React.FC<HeaderProps> = ({
  lang,
  onToggleLang,
  theme,
  onThemeChange,
  activeView,
  onViewChange,
  onOpenVectorize,
  onOpenGeoreference,
  onOpenExport,
  onOpenAndroid,
  onOpenProject,
  onImportImage,
  featureCount
}) => {
  const t = translations[lang];

  return (
    <header className="h-14 border-b border-neutral-800 bg-neutral-900/90 backdrop-blur-md px-4 flex items-center justify-between shrink-0 select-none z-30">
      {/* Zone 1: Single text element wordmark with domain badge */}
      <div className="flex items-center gap-3">
        <button 
          onClick={onOpenProject}
          className="flex items-center gap-2 group text-left"
          title="Project Settings"
        >
          <div className="w-8 h-8 rounded-lg bg-cyan-600/20 border border-cyan-500/30 flex items-center justify-center text-cyan-400 font-bold text-sm tracking-wider">
            GV
          </div>
          <div>
            <h1 className="text-sm font-semibold tracking-tight text-neutral-100 group-hover:text-cyan-400 transition-colors">
              {t.appTitle}
            </h1>
            <p className="text-[10px] text-neutral-400 hidden sm:block">
              CAD · GIS · OpenCV Mobile
            </p>
          </div>
        </button>
      </div>

      {/* Zone 2: Navigation Links & Studio Actions */}
      <nav className="flex items-center gap-1 sm:gap-2">
        {/* View Toggle */}
        <div className="flex items-center bg-neutral-950/80 p-0.5 rounded-lg border border-neutral-800 text-xs">
          <button
            onClick={() => onViewChange('cad')}
            className={`px-2.5 py-1.5 rounded-md font-medium transition-colors ${
              activeView === 'cad'
                ? 'bg-neutral-800 text-cyan-400 shadow-sm'
                : 'text-neutral-400 hover:text-neutral-200'
            }`}
          >
            CAD View
          </button>
          <button
            onClick={() => onViewChange('compare')}
            className={`flex items-center gap-1 px-2.5 py-1.5 rounded-md font-medium transition-colors ${
              activeView === 'compare'
                ? 'bg-neutral-800 text-cyan-400 shadow-sm'
                : 'text-neutral-400 hover:text-neutral-200'
            }`}
          >
            <SplitSquareVertical className="w-3.5 h-3.5" />
            <span className="hidden md:inline">{t.dualView}</span>
          </button>
        </div>

        {/* Import Image */}
        <button
          onClick={onImportImage}
          className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium text-neutral-300 hover:text-white bg-neutral-800/60 hover:bg-neutral-800 rounded-lg border border-neutral-700/60 transition-colors"
          title={t.importImage}
        >
          <FolderOpen className="w-3.5 h-3.5 text-neutral-400" />
          <span className="hidden lg:inline">{t.importImage}</span>
        </button>

        {/* Vectorize CV Engine */}
        <button
          onClick={onOpenVectorize}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-white bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 rounded-lg shadow-sm transition-all"
        >
          <Sparkles className="w-3.5 h-3.5 text-cyan-200" />
          <span className="font-semibold">{t.vectorize}</span>
        </button>

        {/* Georeference */}
        <button
          onClick={onOpenGeoreference}
          className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium text-neutral-300 hover:text-white bg-neutral-800/60 hover:bg-neutral-800 rounded-lg border border-neutral-700/60 transition-colors"
          title={t.georeference}
        >
          <MapPin className="w-3.5 h-3.5 text-amber-400" />
          <span className="hidden md:inline">{t.georeference}</span>
        </button>

        {/* Export CAD/GIS */}
        <button
          onClick={onOpenExport}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-emerald-300 bg-emerald-950/60 hover:bg-emerald-900/60 border border-emerald-700/50 rounded-lg transition-colors"
          title={t.export}
        >
          <Download className="w-3.5 h-3.5 text-emerald-400" />
          <span>{t.export}</span>
        </button>
      </nav>

      {/* Zone 3: Android Studio & Settings Actions */}
      <div className="flex items-center gap-2">
        {/* Android Studio Source & APK */}
        <button
          onClick={onOpenAndroid}
          className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium text-emerald-300 bg-emerald-950/40 hover:bg-emerald-900/50 border border-emerald-600/40 rounded-lg transition-colors"
          title="Android Studio Kotlin Codebase"
        >
          <Smartphone className="w-3.5 h-3.5 text-emerald-400" />
          <span className="hidden xl:inline">{t.androidCode}</span>
        </button>

        {/* Theme Switcher */}
        <div className="flex items-center bg-neutral-950 rounded-lg border border-neutral-800 p-0.5">
          <button
            onClick={() => onThemeChange('dark')}
            className={`p-1 rounded ${theme === 'dark' ? 'bg-neutral-800 text-cyan-400' : 'text-neutral-500 hover:text-neutral-300'}`}
            title="CAD Dark"
          >
            <Moon className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => onThemeChange('blueprint')}
            className={`p-1 rounded text-[10px] font-mono font-bold ${theme === 'blueprint' ? 'bg-cyan-900 text-cyan-200' : 'text-neutral-500 hover:text-neutral-300'}`}
            title="CAD Blueprint"
          >
            BP
          </button>
          <button
            onClick={() => onThemeChange('light')}
            className={`p-1 rounded ${theme === 'light' ? 'bg-neutral-800 text-amber-400' : 'text-neutral-500 hover:text-neutral-300'}`}
            title="Print Light"
          >
            <Sun className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Language Switcher */}
        <button
          onClick={onToggleLang}
          className="flex items-center gap-1 px-2 py-1 text-xs font-medium text-neutral-300 hover:text-white bg-neutral-800/80 rounded-lg border border-neutral-700/60 transition-colors"
          title={lang === 'ar' ? 'Switch to English' : 'التحويل إلى العربية'}
        >
          <Globe className="w-3.5 h-3.5 text-cyan-400" />
          <span>{lang === 'ar' ? 'EN' : 'عربي'}</span>
        </button>
      </div>
    </header>
  );
};
