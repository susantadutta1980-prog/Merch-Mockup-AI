import React from 'react';
import { Bookmark, LogIn, LogOut, Cloud } from 'lucide-react';
import type { User as FirebaseUser } from 'firebase/auth';

interface HeaderProps {
  activeTab: 'catalog' | 'placement' | 'ai-lab' | 'techpack';
  onSelectTab: (tab: 'catalog' | 'placement' | 'ai-lab' | 'techpack') => void;
  onOpenExportModal: () => void;
  onOpenPresetsModal?: () => void;
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
          className={`hover:text-slate-900 transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
            activeTab === 'catalog' ? 'text-slate-900 underline underline-offset-8 decoration-2 font-semibold' : ''
          }`}
        >
          Product Catalog
        </button>
        <button
          onClick={() => onSelectTab('placement')}
          className={`hover:text-slate-900 transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
            activeTab === 'placement' ? 'text-slate-900 underline underline-offset-8 decoration-2 font-semibold' : ''
          }`}
        >
          Placement Inspector
        </button>
        <button
          onClick={() => onSelectTab('ai-lab')}
          className={`hover:text-slate-900 transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
            activeTab === 'ai-lab' ? 'text-slate-900 underline underline-offset-8 decoration-2 font-semibold' : ''
          }`}
        >
          AI Scene & Edit Lab
        </button>
        <button
          onClick={() => onSelectTab('techpack')}
          className={`hover:text-slate-900 transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
            activeTab === 'techpack' ? 'text-slate-900 underline underline-offset-8 decoration-2 font-semibold' : ''
          }`}
        >
          Print Spec Sheet
        </button>
      </nav>

      {/* Zone 3: Actions - Presets, Cloud Auth & Primary Export */}
      <div className="flex items-center gap-2.5 shrink-0">
        {onOpenPresetsModal && (
          <button
            onClick={onOpenPresetsModal}
            title="Browse shared community presets or save your own template"
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


