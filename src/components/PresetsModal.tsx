import React, { useState, useEffect } from 'react';
import {
  StudioPreset,
  MerchProduct,
  ProductColorway,
  ProductSize,
  PrintArea,
  MockupBackground,
  LogoConfig,
  VirtualLightingConfig,
} from '../types/merch';
import { COMMUNITY_PRESETS } from '../data/communityPresets';
import { MERCH_PRODUCTS, MOCKUP_BACKGROUNDS } from '../data/products';
import {
  Bookmark,
  Check,
  X,
  Plus,
  Trash2,
  Sparkles,
  Search,
  Sliders,
  Sun,
  Layers,
  ArrowRight,
  Cloud,
} from 'lucide-react';
import type { User as FirebaseUser } from 'firebase/auth';
import {
  savePresetToCloud,
  getUserPresetsFromCloud,
  deletePresetFromCloud,
} from '../lib/firebase';

interface PresetsModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentProduct: MerchProduct;
  currentColorway: ProductColorway;
  currentSize: ProductSize;
  currentArea: PrintArea;
  currentBackground: MockupBackground;
  currentLogo: LogoConfig;
  currentLighting: VirtualLightingConfig;
  onApplyPreset: (preset: StudioPreset) => void;
  user?: FirebaseUser | null;
}

const LOCAL_STORAGE_KEY = 'atelier_merch_custom_presets';

export const PresetsModal: React.FC<PresetsModalProps> = ({
  isOpen,
  onClose,
  currentProduct,
  currentColorway,
  currentSize,
  currentArea,
  currentBackground,
  currentLogo,
  currentLighting,
  onApplyPreset,
  user,
}) => {
  const [activeTab, setActiveTab] = useState<'community' | 'saved' | 'save-new'>('community');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTag, setSelectedTag] = useState<string | 'all'>('all');
  const [customPresets, setCustomPresets] = useState<StudioPreset[]>([]);
  const [appliedPresetId, setAppliedPresetId] = useState<string | null>(null);
  const [isCloudSyncing, setIsCloudSyncing] = useState(false);

  // New preset form state
  const [newPresetName, setNewPresetName] = useState('');
  const [newPresetDesc, setNewPresetDesc] = useState('');
  const [newPresetTags, setNewPresetTags] = useState('My Brand, Custom');
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Load custom presets from localStorage and sync from Firestore if user is logged in
  useEffect(() => {
    let localList: StudioPreset[] = [];
    try {
      const stored = localStorage.getItem(LOCAL_STORAGE_KEY);
      if (stored) {
        localList = JSON.parse(stored);
        setCustomPresets(localList);
      }
    } catch (e) {
      console.warn('Failed to load custom presets from localStorage', e);
    }

    if (user?.uid) {
      setIsCloudSyncing(true);
      getUserPresetsFromCloud(user.uid)
        .then((cloudPresets) => {
          if (cloudPresets && cloudPresets.length > 0) {
            // Merge cloud presets with local list without duplicates
            const map = new Map<string, StudioPreset>();
            cloudPresets.forEach((p) => map.set(p.id, p));
            localList.forEach((p) => {
              if (!map.has(p.id)) map.set(p.id, p);
            });
            const merged = Array.from(map.values());
            setCustomPresets(merged);
            localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(merged));
          }
        })
        .catch((err) => {
          console.warn('Could not sync presets from Firestore cloud:', err);
        })
        .finally(() => {
          setIsCloudSyncing(false);
        });
    }
  }, [user?.uid]);

  if (!isOpen) return null;

  // Save current studio configuration as a new template
  const handleSaveCurrentPreset = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPresetName.trim()) return;

    const parsedTags = newPresetTags
      .split(',')
      .map((t) => t.trim())
      .filter(Boolean);

    const newPreset: StudioPreset = {
      id: 'custom-preset-' + Date.now(),
      name: newPresetName.trim(),
      description: newPresetDesc.trim() || `Custom configuration saved on ${new Date().toLocaleDateString()}`,
      author: 'You',
      isCustom: true,
      createdAt: Date.now(),
      tags: parsedTags.length > 0 ? parsedTags : ['Custom'],
      config: {
        productId: currentProduct.id,
        colorwayId: currentColorway.id,
        sizeId: currentSize.id,
        areaId: currentArea.id,
        backgroundId: currentBackground.id,
        logoPlacement: {
          xOffsetPercent: currentLogo.xOffsetPercent,
          yOffsetPercent: currentLogo.yOffsetPercent,
          scalePercent: currentLogo.scalePercent,
          rotationDeg: currentLogo.rotationDeg,
          opacity: currentLogo.opacity,
          colorTint: currentLogo.colorTint,
          printMethod: currentLogo.printMethod,
        },
        lighting: { ...currentLighting },
      },
    };

    const updated = [newPreset, ...customPresets];
    setCustomPresets(updated);
    try {
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(updated));
    } catch (err) {
      console.error('Failed to save preset to localStorage', err);
    }

    // Persist to Firebase Firestore if authenticated
    if (user?.uid) {
      savePresetToCloud(user.uid, newPreset).catch((err) => {
        console.warn('Could not save preset to Firebase cloud:', err);
      });
    }

    setSaveSuccess(true);
    setTimeout(() => {
      setSaveSuccess(false);
      setNewPresetName('');
      setNewPresetDesc('');
      setActiveTab('saved');
    }, 800);
  };

  // Delete custom preset
  const handleDeletePreset = (id: string) => {
    const updated = customPresets.filter((p) => p.id !== id);
    setCustomPresets(updated);
    try {
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(updated));
    } catch (err) {
      console.error(err);
    }

    // Delete from Firebase Firestore if authenticated
    if (user?.uid) {
      deletePresetFromCloud(user.uid, id).catch((err) => {
        console.warn('Could not delete preset from Firebase cloud:', err);
      });
    }
  };

  // Apply a preset
  const handleApply = (preset: StudioPreset) => {
    setAppliedPresetId(preset.id);
    onApplyPreset(preset);
    setTimeout(() => {
      setAppliedPresetId(null);
      onClose();
    }, 600);
  };

  // Filter templates list
  const allPresets =
    activeTab === 'community'
      ? COMMUNITY_PRESETS
      : activeTab === 'saved'
      ? customPresets
      : [];

  const filteredPresets = allPresets.filter((p) => {
    const matchesSearch =
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.tags.some((t) => t.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesTag = selectedTag === 'all' || p.tags.includes(selectedTag);
    return matchesSearch && matchesTag;
  });

  // Extract all unique tags
  const availableTags = Array.from(
    new Set(allPresets.flatMap((p) => p.tags))
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl max-w-4xl w-full max-h-[92vh] flex flex-col shadow-2xl border border-slate-200 overflow-hidden">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-slate-900 text-white flex items-center justify-center shadow-xs">
              <Bookmark className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900">
                Studio Templates & Preset Library
              </h2>
              <p className="text-xs text-slate-500">
                Save your custom mockup setups or apply shared community lookbooks in 1-click
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center justify-between px-6 pt-3 border-b border-slate-200 bg-slate-50/60">
          <div className="flex gap-2">
            <button
              onClick={() => setActiveTab('community')}
              className={`py-2 px-3 text-xs font-semibold rounded-t-lg transition-colors cursor-pointer ${
                activeTab === 'community'
                  ? 'bg-white border-t border-x border-slate-200 text-slate-900 -mb-px'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Shared Community Templates ({COMMUNITY_PRESETS.length})
            </button>

            <button
              onClick={() => setActiveTab('saved')}
              className={`py-2 px-3 text-xs font-semibold rounded-t-lg transition-colors cursor-pointer ${
                activeTab === 'saved'
                  ? 'bg-white border-t border-x border-slate-200 text-slate-900 -mb-px'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              My Saved Presets ({customPresets.length})
            </button>

            <button
              onClick={() => setActiveTab('save-new')}
              className={`py-2 px-3 text-xs font-semibold rounded-t-lg transition-colors cursor-pointer flex items-center gap-1.5 ${
                activeTab === 'save-new'
                  ? 'bg-white border-t border-x border-slate-200 text-slate-900 -mb-px'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Save Current as Preset</span>
            </button>
          </div>

          {/* Firestore Cloud Sync Badge */}
          <div className="pb-2 hidden sm:flex items-center gap-1.5 text-[11px]">
            {user ? (
              <span className="text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full flex items-center gap-1">
                <Cloud className="w-3 h-3 text-emerald-600" />
                <span>{isCloudSyncing ? 'Syncing...' : 'Firestore Cloud Active'}</span>
              </span>
            ) : (
              <span className="text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full flex items-center gap-1">
                <span>Local Mode (Sign in to sync)</span>
              </span>
            )}
          </div>
        </div>

        {/* Modal Body */}
        <div className="p-6 flex-1 overflow-y-auto flex flex-col gap-5">
          {/* TAB 1 & 2: TEMPLATE LISTINGS */}
          {activeTab !== 'save-new' && (
            <div className="flex flex-col gap-4">
              {/* Search & Tag filter bar */}
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
                <div className="relative flex-1">
                  <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search templates by style, mood, or tag..."
                    className="w-full text-xs pl-9 pr-3 py-2 border border-slate-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-slate-900 bg-white"
                  />
                </div>

                {availableTags.length > 0 && (
                  <div className="flex items-center gap-1 overflow-x-auto pb-1 text-xs">
                    <button
                      onClick={() => setSelectedTag('all')}
                      className={`px-2.5 py-1 rounded-md whitespace-nowrap transition-colors cursor-pointer ${
                        selectedTag === 'all'
                          ? 'bg-slate-900 text-white font-medium shadow-2xs'
                          : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                      }`}
                    >
                      All Tags
                    </button>
                    {availableTags.map((tag) => (
                      <button
                        key={tag}
                        onClick={() => setSelectedTag(tag)}
                        className={`px-2.5 py-1 rounded-md whitespace-nowrap transition-colors cursor-pointer ${
                          selectedTag === tag
                            ? 'bg-slate-900 text-white font-medium shadow-2xs'
                            : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                        }`}
                      >
                        {tag}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Template Cards Grid */}
              {filteredPresets.length === 0 ? (
                <div className="p-12 text-center flex flex-col items-center justify-center gap-2 bg-slate-50 rounded-xl border border-dashed border-slate-200">
                  <Bookmark className="w-8 h-8 text-slate-400" />
                  <span className="text-xs font-semibold text-slate-700">
                    {activeTab === 'saved'
                      ? 'No custom presets saved yet'
                      : 'No templates match your search'}
                  </span>
                  <span className="text-[11px] text-slate-500">
                    {activeTab === 'saved'
                      ? 'Click "Save Current as Preset" above to create your first reusable setup.'
                      : 'Try adjusting your search terms or filter tags.'}
                  </span>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {filteredPresets.map((preset) => {
                    const matchedProduct = MERCH_PRODUCTS.find(
                      (p) => p.id === preset.config.productId
                    );
                    const matchedBg = MOCKUP_BACKGROUNDS.find(
                      (b) => b.id === preset.config.backgroundId
                    );
                    const isApplied = appliedPresetId === preset.id;

                    return (
                      <div
                        key={preset.id}
                        className="group p-4 bg-white border border-slate-200/90 rounded-xl shadow-xs hover:border-slate-300 hover:shadow-md transition-all flex flex-col justify-between gap-3.5"
                      >
                        <div>
                          {/* Header with Title and Delete action */}
                          <div className="flex items-start justify-between gap-2 mb-1.5">
                            <div>
                              <h3 className="text-sm font-bold text-slate-900">{preset.name}</h3>
                              <span className="text-[11px] text-slate-500">
                                by {preset.author} · {matchedProduct?.name || 'Product'}
                              </span>
                            </div>

                            {preset.isCustom && (
                              <button
                                onClick={() => handleDeletePreset(preset.id)}
                                title="Delete preset"
                                className="text-slate-400 hover:text-rose-600 p-1 rounded transition-colors cursor-pointer"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </div>

                          <p className="text-xs text-slate-600 leading-relaxed line-clamp-2">
                            {preset.description}
                          </p>
                        </div>

                        {/* Configuration summary pills */}
                        <div className="flex items-center gap-2 text-[11px] text-slate-500 pt-2 border-t border-slate-100 flex-wrap">
                          <span className="flex items-center gap-1 font-medium text-slate-700">
                            <Layers className="w-3 h-3 text-slate-400" />
                            {preset.config.logoPlacement.printMethod}
                          </span>
                          <span aria-hidden="true">·</span>
                          <span className="flex items-center gap-1 font-medium text-slate-700">
                            <Sun className="w-3 h-3 text-amber-500" />
                            {(preset.config.lighting.intensity * 100).toFixed(0)}% Light
                          </span>
                          <span aria-hidden="true">·</span>
                          <span className="text-slate-600">
                            Scene: {matchedBg?.name.split(' ')[0] || 'Studio'}
                          </span>
                        </div>

                        {/* Tags & 1-Click Apply Button */}
                        <div className="flex items-center justify-between gap-2 pt-1">
                          <div className="flex items-center gap-1 flex-wrap">
                            {preset.tags.slice(0, 3).map((tag, i) => (
                              <span
                                key={i}
                                className="text-[10px] bg-slate-100 text-slate-600 px-2 py-0.5 rounded font-medium"
                              >
                                {tag}
                              </span>
                            ))}
                          </div>

                          <button
                            type="button"
                            onClick={() => handleApply(preset)}
                            className={`px-3 py-1.5 text-xs font-semibold rounded-lg flex items-center gap-1.5 transition-all cursor-pointer shadow-2xs ${
                              isApplied
                                ? 'bg-emerald-600 text-white'
                                : 'bg-slate-900 text-white hover:bg-slate-800'
                            }`}
                          >
                            {isApplied ? (
                              <>
                                <Check className="w-3.5 h-3.5" />
                                <span>Applied!</span>
                              </>
                            ) : (
                              <>
                                <span>Apply Preset</span>
                                <ArrowRight className="w-3.5 h-3.5" />
                              </>
                            )}
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* TAB 3: SAVE CURRENT AS PRESET FORM */}
          {activeTab === 'save-new' && (
            <form onSubmit={handleSaveCurrentPreset} className="flex flex-col gap-5 text-xs">
              <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl flex flex-col gap-2">
                <span className="font-bold text-slate-900 text-xs">
                  Active Configuration to Save:
                </span>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-[11px] text-slate-600 pt-1 border-t border-slate-200">
                  <div>
                    <span className="text-slate-400 block">Product:</span>
                    <span className="font-semibold text-slate-800">{currentProduct.name}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block">Color & Size:</span>
                    <span className="font-semibold text-slate-800">
                      {currentColorway.name} · {currentSize.label}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-400 block">Background:</span>
                    <span className="font-semibold text-slate-800">{currentBackground.name}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block">Lighting:</span>
                    <span className="font-semibold text-slate-800">
                      {currentLighting.mood} ({(currentLighting.intensity * 100).toFixed(0)}%)
                    </span>
                  </div>
                </div>
              </div>

              {/* Preset Name */}
              <div className="flex flex-col gap-1.5">
                <label className="font-bold text-slate-800">Template / Preset Name *</label>
                <input
                  type="text"
                  required
                  value={newPresetName}
                  onChange={(e) => setNewPresetName(e.target.value)}
                  placeholder="e.g. Summer Lookbook 2026, Tokyo Street Drop, Minimalist Ceramic"
                  className="w-full text-xs p-2.5 border border-slate-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-slate-900 bg-white"
                />
              </div>

              {/* Description */}
              <div className="flex flex-col gap-1.5">
                <label className="font-semibold text-slate-700">Description / Production Notes</label>
                <textarea
                  rows={2}
                  value={newPresetDesc}
                  onChange={(e) => setNewPresetDesc(e.target.value)}
                  placeholder="Briefly describe the visual mood, target season, or manufacturing note..."
                  className="w-full text-xs p-2.5 border border-slate-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-slate-900 bg-white resize-none"
                />
              </div>

              {/* Tags */}
              <div className="flex flex-col gap-1.5">
                <label className="font-semibold text-slate-700">Tags (comma separated)</label>
                <input
                  type="text"
                  value={newPresetTags}
                  onChange={(e) => setNewPresetTags(e.target.value)}
                  placeholder="e.g. Streetwear, Golden Hour, Heavyweight"
                  className="w-full text-xs p-2.5 border border-slate-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-slate-900 bg-white"
                />
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                className={`py-3 px-4 font-semibold rounded-xl text-white flex items-center justify-center gap-2 cursor-pointer shadow-md transition-all active:scale-98 ${
                  saveSuccess ? 'bg-emerald-600' : 'bg-slate-900 hover:bg-slate-800'
                }`}
              >
                {saveSuccess ? (
                  <>
                    <Check className="w-4 h-4" />
                    <span>Saved to Preset Library!</span>
                  </>
                ) : (
                  <>
                    <Bookmark className="w-4 h-4" />
                    <span>Save Template to My Library</span>
                  </>
                )}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
