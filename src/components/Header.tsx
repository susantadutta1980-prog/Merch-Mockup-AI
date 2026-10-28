import React from 'react';
import { Bookmark, LogIn, LogOut, Cloud, Keyboard } from 'lucide-react';
import type { User as FirebaseUser } from 'firebase/auth';

interface HeaderProps {
  activeTab: 'catalog' | 'placement' | 'ai-lab' | 'techpack';
  onSelectTab: (tab: 'catalog' | 'placement' | 'ai-lab' | 'techpack') => void;
  onOpenExportModal: () => void;
  onOpenPresetsModal?: () => void;
  onOpenShortcutsModal?: () => void;
  user: FirebaseUser | null;
  onLogin: () => void;
  onLogout: () => void;
  isAuthLoading?: boolean;
}

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  onSelectTab,
  onOpenExportModal,
  onOpenPresetsModal,
  onOpenShortcutsModal,
  user,
  onLogin,
  onLogout,
  isAuthLoading = false,
}) => {
  return (
    <header className="flex items-center justify-between gap-6 px-6 py-4 bg-white border-b border-slate-200 sticky top-0 z-40">
      {/* Zone 1: Single text element wordmark */}
      <button
        onClick={() => onSelectTab('catalog')}
        className="text-lg font-bold tracking-tight text-slate-900 whitespace-nowrap shrink-0 hover:opacity-80 transition-opacity text-left cursor-pointer"
      >
        Atelier Merch Studio
      </button>

      {/* Zone 2: 4 clean single-line text navigation links */}
      <nav className="hidden md:flex items-center gap-7 text-sm font-medium text-slate-600">
        <button
          onClick={() => onSelectTab('catalog')}
          title="Switch to Product Catalog (Hotkey: 1)"
          className={`hover:text-slate-900 transition-colors whitespace-nowrap shrink-0 cursor-pointer flex items-center gap-1.5 ${
            activeTab === 'catalog' ? 'text-slate-900 underline underline-offset-8 decoration-2 font-semibold' : ''
          }`}
        >
          <span>Product Catalog</span>
          <span className="text-[10px] text-slate-400 font-mono font-normal">1</span>
        </button>
        <button
          onClick={() => onSelectTab('placement')}
          title="Switch to Placement Inspector (Hotkey: 2)"
          className={`hover:text-slate-900 transition-colors whitespace-nowrap shrink-0 cursor-pointer flex items-center gap-1.5 ${
            activeTab === 'placement' ? 'text-slate-900 underline underline-offset-8 decoration-2 font-semibold' : ''
          }`}
        >
          <span>Placement Inspector</span>
          <span className="text-[10px] text-slate-400 font-mono font-normal">2</span>
        </button>
        <button
          onClick={() => onSelectTab('ai-lab')}
          title="Switch to AI Scene & Edit Lab (Hotkey: 3)"
          className={`hover:text-slate-900 transition-colors whitespace-nowrap shrink-0 cursor-pointer flex items-center gap-1.5 ${
            activeTab === 'ai-lab' ? 'text-slate-900 underline underline-offset-8 decoration-2 font-semibold' : ''
          }`}
        >
          <span>AI Scene & Edit Lab</span>
          <span className="text-[10px] text-slate-400 font-mono font-normal">3</span>
        </button>
        <button
          onClick={() => onSelectTab('techpack')}
          title="Switch to Print Spec Sheet (Hotkey: 4)"
          className={`hover:text-slate-900 transition-colors whitespace-nowrap shrink-0 cursor-pointer flex items-center gap-1.5 ${
            activeTab === 'techpack' ? 'text-slate-900 underline underline-offset-8 decoration-2 font-semibold' : ''
          }`}
        >
          <span>Print Spec Sheet</span>
          <span className="text-[10px] text-slate-400 font-mono font-normal">4</span>
        </button>
      </nav>

      {/* Zone 3: Actions - Shortcuts, Presets, Cloud Auth & Primary Export */}
      <div className="flex items-center gap-2.5 shrink-0">
        {onOpenShortcutsModal && (
          <div className="relative group">
            <button
              onClick={onOpenShortcutsModal}
              title="Keyboard Shortcuts (?)"
              aria-label="Keyboard Shortcuts"
              className="p-2 text-xs font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 hover:text-slate-900 border border-slate-200 rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer flex items-center justify-center active:scale-95"
            >
              <Keyboard className="w-4 h-4 text-slate-600 group-hover:text-slate-900" />
            </button>
            {/* Tooltip overlay on hover */}
            <div className="absolute right-0 top-full mt-2 hidden group-hover:flex flex-col bg-slate-900 text-white text-xs rounded-xl py-2 px-3 shadow-xl whitespace-nowrap z-50 pointer-events-none min-w-[200px]">
              <div className="flex items-center justify-between gap-3 font-semibold text-[11px] pb-1 border-b border-slate-700/60 mb-1">
                <span>Keyboard Shortcuts</span>
                <kbd className="px-1.5 py-0.5 text-[10px] bg-slate-800 rounded border border-slate-700 font-mono text-slate-200">?</kbd>
              </div>
              <div className="space-y-1 text-[11px] text-slate-300">
                <div className="flex items-center justify-between gap-3">
                  <span className="text-slate-400">Undo / Redo</span>
                  <span className="font-mono text-slate-200">Ctrl+Z / Ctrl+Y</span>
                </div>
                <div className="flex items-center justify-between gap-3">
                  <span className="text-slate-400">Switch Views</span>
                  <span className="font-mono text-slate-200">1, 2, 3, 4</span>
                </div>
                <div className="flex items-center justify-between gap-3">
                  <span className="text-slate-400">Presets & Templates</span>
                  <span className="font-mono text-slate-200">P</span>
                </div>
              </div>
              <div className="pt-1.5 mt-1 border-t border-slate-800 text-[10px] text-indigo-300 font-medium text-center">
                Click to view full cheat sheet
              </div>
            </div>
          </div>
        )}

        {onOpenPresetsModal && (
          <button
            onClick={onOpenPresetsModal}
            title="Browse shared community presets or save your own template (Hotkey: P)"
            className="px-3 py-2 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 border border-slate-200 rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer flex items-center gap-1.5 active:scale-95"
          >
            <Bookmark className="w-3.5 h-3.5 text-indigo-600" />
            <span>Presets & Templates</span>
          </button>
        )}

        {/* Firebase Authentication State */}
        {user ? (
          <div className="flex items-center gap-2 pl-2 border-l border-slate-200">
            {user.photoURL ? (
              <img
                src={user.photoURL}
                alt={user.displayName || 'User'}
                referrerPolicy="no-referrer"
                className="w-7 h-7 rounded-full border border-slate-300 object-cover"
              />
            ) : (
              <div className="w-7 h-7 rounded-full bg-indigo-600 text-white font-bold text-xs flex items-center justify-center">
                {(user.displayName || user.email || 'U')[0].toUpperCase()}
              </div>
            )}
            <div className="hidden lg:flex flex-col text-left">
              <span className="text-xs font-semibold text-slate-900 leading-tight truncate max-w-[110px]">
                {user.displayName || user.email?.split('@')[0]}
              </span>
              <span className="text-[10px] text-emerald-600 font-medium flex items-center gap-0.5">
                <Cloud className="w-2.5 h-2.5" /> Synced
              </span>
            </div>
            <button
              onClick={onLogout}
              title="Sign Out"
              className="p-1.5 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-md transition-colors cursor-pointer"
            >
              <LogOut className="w-3.5 h-3.5" />
            </button>
          </div>
        ) : (
          <button
            onClick={onLogin}
            disabled={isAuthLoading}
            title="Sign in with Google to sync presets and projects to Firebase Cloud"
            className="px-3 py-2 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-50 border border-slate-300 rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer flex items-center gap-1.5 shadow-2xs active:scale-95"
          >
            <LogIn className="w-3.5 h-3.5 text-slate-600" />
            <span>{isAuthLoading ? 'Connecting...' : 'Sign in'}</span>
          </button>
        )}

        <button
          onClick={onOpenExportModal}
          className="px-4 py-2 text-xs font-semibold text-white bg-slate-900 rounded-lg hover:bg-slate-800 transition-colors whitespace-nowrap shrink-0 cursor-pointer shadow-sm active:scale-95"
        >
          Export Print Files
        </button>
      </div>
    </header>
  );
};


