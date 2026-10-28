import React, { useEffect, useState } from 'react';
import { X, Keyboard, Sparkles, Command, CornerDownLeft, RotateCcw, RotateCw } from 'lucide-react';

interface KeyboardShortcutsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSwitchTab?: (tab: 'catalog' | 'placement' | 'ai-lab' | 'techpack') => void;
  onUndo?: () => void;
  onRedo?: () => void;
  canUndo?: boolean;
  canRedo?: boolean;
}

interface ShortcutItem {
  keys: string[];
  action: string;
  description: string;
  category: 'Navigation' | 'History & Studio' | 'General';
  codeKey?: string;
  onTrigger?: () => void;
  disabled?: boolean;
}

export const KeyboardShortcutsModal: React.FC<KeyboardShortcutsModalProps> = ({
  isOpen,
  onClose,
  onSwitchTab,
  onUndo,
  onRedo,
  canUndo = false,
  canRedo = false,
}) => {
  const [isMac, setIsMac] = useState(false);
  const [pressedKey, setPressedKey] = useState<string | null>(null);

  useEffect(() => {
    // Detect OS
    if (typeof window !== 'undefined' && typeof navigator !== 'undefined') {
      setIsMac(/(Mac|iPhone|iPod|iPad)/i.test(navigator.userAgent || navigator.platform));
    }
  }, []);

  // Listen for momentary keypresses while modal is open to light up keys interactively
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      let keyIdent = e.key.toUpperCase();
      if (e.key === '?') keyIdent = '?';
      else if (e.key === 'Escape') keyIdent = 'ESC';
      setPressedKey(keyIdent);

      const timer = setTimeout(() => {
        setPressedKey(null);
      }, 350);

      return () => clearTimeout(timer);
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen]);

  if (!isOpen) return null;

  const cmdKey = isMac ? '⌘' : 'Ctrl';

  const shortcuts: ShortcutItem[] = [
    // Navigation
    {
      keys: ['1'],
      action: 'Product Catalog',
      description: 'Switch to catalog view to browse and filter garment silhouettes',
      category: 'Navigation',
      codeKey: '1',
      onTrigger: () => {
        onSwitchTab?.('catalog');
        onClose();
      },
    },
    {
      keys: ['2'],
      action: 'Placement Studio',
      description: 'Open interactive canvas to position logos, tweak lighting & scenes',
      category: 'Navigation',
      codeKey: '2',
      onTrigger: () => {
        onSwitchTab?.('placement');
        onClose();
      },
    },
    {
      keys: ['3'],
      action: 'AI Scene Lab',
      description: 'Generate custom studio/lifestyle backdrops with Gemini AI',
      category: 'Navigation',
      codeKey: '3',
      onTrigger: () => {
        onSwitchTab?.('ai-lab');
        onClose();
      },
    },
    {
      keys: ['4'],
      action: 'Print Spec Sheet',
      description: 'Inspect exact DPI print dimensions, safe zones, and garment specs',
      category: 'Navigation',
      codeKey: '4',
      onTrigger: () => {
        onSwitchTab?.('techpack');
        onClose();
      },
    },

    // History & Studio
    {
      keys: [cmdKey, 'Z'],
      action: 'Undo Adjustment',
      description: 'Revert logo placement, rotation, scale, or lighting changes',
      category: 'History & Studio',
      codeKey: 'Z',
      onTrigger: onUndo,
      disabled: !canUndo,
    },
    {
      keys: isMac ? ['⌘', '⇧', 'Z'] : ['Ctrl', 'Y'],
      action: 'Redo Adjustment',
      description: 'Re-apply previously reverted canvas or lighting adjustments',
      category: 'History & Studio',
      codeKey: isMac ? 'Z' : 'Y',
      onTrigger: onRedo,
      disabled: !canRedo,
    },
    {
      keys: ['P'],
      action: 'Presets & Templates',
      description: 'Open studio presets to save templates or apply community styles',
      category: 'History & Studio',
      codeKey: 'P',
    },
    {
      keys: ['E'],
      action: 'Export Package',
      description: 'Open factory export package modal for 300 DPI production files',
      category: 'History & Studio',
      codeKey: 'E',
    },

    // General
    {
      keys: ['?'],
      action: 'Toggle Shortcuts',
      description: 'Show or hide this keyboard shortcut guide overlay',
      category: 'General',
      codeKey: '?',
    },
    {
      keys: ['Esc'],
      action: 'Close / Dismiss',
      description: 'Dismiss current modal, overlay, or active dropdown',
      category: 'General',
      codeKey: 'ESC',
      onTrigger: onClose,
    },
  ];

  const categories: Array<'Navigation' | 'History & Studio' | 'General'> = [
    'Navigation',
    'History & Studio',
    'General',
  ];

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Keyboard Shortcuts"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/70">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-slate-900 text-white flex items-center justify-center shadow-xs">
              <Keyboard className="w-5 h-5 text-indigo-300" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-slate-900">Keyboard Shortcuts</h3>
                <span className="px-1.5 py-0.5 rounded text-[10px] font-semibold bg-slate-200/80 text-slate-700">
                  {isMac ? 'macOS' : 'Windows/Linux'}
                </span>
              </div>
              <p className="text-xs text-slate-500">
                Speed up your merch workflow with instant hotkeys
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-200/60 transition-colors cursor-pointer"
            title="Close (Esc)"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Shortcuts list grouped by category */}
        <div className="overflow-y-auto p-6 space-y-6">
          {categories.map((category) => {
            const items = shortcuts.filter((s) => s.category === category);
            return (
              <div key={category} className="space-y-2">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                    {category}
                  </span>
                  <div className="flex-1 h-px bg-slate-100" />
                </div>

                <div className="divide-y divide-slate-100 rounded-xl border border-slate-200/80 bg-white overflow-hidden shadow-2xs">
                  {items.map((item, idx) => {
                    const isKeyHighlighted =
                      pressedKey &&
                      item.codeKey &&
                      pressedKey.toLowerCase() === item.codeKey.toLowerCase();

                    return (
                      <div
                        key={idx}
                        className={`flex items-center justify-between gap-4 px-4 py-2.5 transition-colors ${
                          isKeyHighlighted
                            ? 'bg-indigo-50/80 ring-1 ring-indigo-400'
                            : 'hover:bg-slate-50/70'
                        }`}
                      >
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-semibold text-slate-900">
                              {item.action}
                            </span>
                            {item.action.includes('Undo') && onUndo && (
                              <span
                                className={`text-[10px] font-medium px-1.5 py-0.2 rounded ${
                                  canUndo
                                    ? 'bg-emerald-50 text-emerald-700'
                                    : 'bg-slate-100 text-slate-400'
                                }`}
                              >
                                {canUndo ? 'Available' : 'No history'}
                              </span>
                            )}
                            {item.action.includes('Redo') && onRedo && (
                              <span
                                className={`text-[10px] font-medium px-1.5 py-0.2 rounded ${
                                  canRedo
                                    ? 'bg-emerald-50 text-emerald-700'
                                    : 'bg-slate-100 text-slate-400'
                                }`}
                              >
                                {canRedo ? 'Available' : 'No history'}
                              </span>
                            )}
                          </div>
                          <p className="text-[11px] text-slate-500 truncate mt-0.5">
                            {item.description}
                          </p>
                        </div>

                        {/* Keycap badges */}
                        <div className="flex items-center gap-1 shrink-0">
                          {item.keys.map((k, kIdx) => (
                            <React.Fragment key={kIdx}>
                              <kbd
                                className={`inline-flex items-center justify-center min-w-[24px] h-6 px-1.5 text-xs font-semibold font-mono rounded-md border shadow-2xs transition-all ${
                                  isKeyHighlighted
                                    ? 'bg-indigo-600 text-white border-indigo-700 scale-105'
                                    : 'bg-slate-100 text-slate-800 border-slate-300'
                                }`}
                              >
                                {k}
                              </kbd>
                              {kIdx < item.keys.length - 1 && (
                                <span className="text-[10px] text-slate-400 font-bold">+</span>
                              )}
                            </React.Fragment>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>

        {/* Footer info banner */}
        <div className="px-6 py-3 bg-slate-50 border-t border-slate-200 flex items-center justify-between text-xs text-slate-500">
          <div className="flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
            <span>Shortcuts are inactive while typing in text inputs</span>
          </div>
          <button
            onClick={onClose}
            className="px-3 py-1 bg-slate-900 text-white font-medium rounded-lg hover:bg-slate-800 transition-colors cursor-pointer text-xs"
          >
            Got it (Esc)
          </button>
        </div>
      </div>
    </div>
  );
};
