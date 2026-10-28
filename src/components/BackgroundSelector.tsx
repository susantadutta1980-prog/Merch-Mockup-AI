import React, { useState } from 'react';
import {
  MockupBackground,
  BackgroundCategory,
  VirtualLightingConfig,
  LightingMood,
} from '../types/merch';
import { MOCKUP_BACKGROUNDS } from '../data/products';
import { Sparkles, Upload, Image as ImageIcon, Check, RefreshCw, Sun, Compass } from 'lucide-react';

interface BackgroundSelectorProps {
  selectedBackground: MockupBackground;
  lighting: VirtualLightingConfig;
  onSelectBackground: (bg: MockupBackground) => void;
  onAddCustomBackground: (bg: MockupBackground) => void;
  onChangeLighting: (updater: (prev: VirtualLightingConfig) => VirtualLightingConfig) => void;
  onTriggerAiSmartBlend?: () => void;
  isAiBlending?: boolean;
}

export const BackgroundSelector: React.FC<BackgroundSelectorProps> = ({
  selectedBackground,
  lighting,
  onSelectBackground,
  onAddCustomBackground,
  onChangeLighting,
  onTriggerAiSmartBlend,
  isAiBlending = false,
}) => {
  const [filterCategory, setFilterCategory] = useState<BackgroundCategory | 'all'>('all');
  const [backgroundsList, setBackgroundsList] = useState<MockupBackground[]>(MOCKUP_BACKGROUNDS);
  const [customPrompt, setCustomPrompt] = useState('');
  const [isGeneratingBg, setIsGeneratingBg] = useState(false);
  const [generateError, setGenerateError] = useState<string | null>(null);
  const [noticeMessage, setNoticeMessage] = useState<string | null>(null);

  // Filtered background list
  const filteredList =
    filterCategory === 'all'
      ? backgroundsList
      : backgroundsList.filter((b) => b.category === filterCategory);

  // Handle user uploaded background image
  const handleUploadBackground = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const dataUrl = event.target?.result as string;
      const customBg: MockupBackground = {
        id: 'user-bg-' + Date.now(),
        name: file.name.replace(/\.[^/.]+$/, ''),
        category: 'custom',
        image: dataUrl,
        description: 'User uploaded custom background scene.',
      };

      setBackgroundsList((prev) => [customBg, ...prev]);
      onAddCustomBackground(customBg);
      onSelectBackground(customBg);
    };
    reader.readAsDataURL(file);
  };

  // AI Background Generation
  const handleGenerateCustomBackground = async () => {
    if (!customPrompt.trim()) return;
    setIsGeneratingBg(true);
    setGenerateError(null);

    try {
      const res = await fetch('/api/gemini/generate-background', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: customPrompt.trim(),
          aspectRatio: '4:3',
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Failed to generate background.');
      }

      const newBg: MockupBackground = {
        id: 'ai-bg-' + Date.now(),
        name: customPrompt.length > 25 ? customPrompt.slice(0, 25) + '...' : customPrompt,
        category: 'lifestyle',
        image: data.imageUrl,
        description: `AI generated: ${customPrompt}`,
      };

      setBackgroundsList((prev) => [newBg, ...prev]);
      onAddCustomBackground(newBg);
      onSelectBackground(newBg);
      setCustomPrompt('');

      if (data.notice) {
        setNoticeMessage(data.notice);
        setTimeout(() => setNoticeMessage(null), 8000);
      }
    } catch (err: any) {
      const msg = err.message || '';
      if (msg.includes('429') || msg.includes('quota') || msg.includes('Quota')) {
        setGenerateError(
          'AI Image Generation quota limit reached on Free Tier. Select from our built-in scene library or upload any photo.'
        );
      } else {
        setGenerateError(msg || 'Error creating custom background');
      }
    } finally {
      setIsGeneratingBg(false);
    }
  };

  return (
    <div className="flex flex-col bg-white border border-slate-200 rounded-xl overflow-hidden shadow-xs">
      {/* Header & Category Filter Tabs */}
      <div className="p-4 border-b border-slate-200 bg-slate-50/60 flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <div>
            <h4 className="text-xs font-bold text-slate-900">
              Background Scenes & Environments
            </h4>
            <p className="text-[11px] text-slate-500">
              Select outdoor, studio, urban lifestyle or generate custom AI scenes
            </p>
          </div>

          <label className="cursor-pointer px-2.5 py-1 text-xs font-semibold text-slate-700 bg-white border border-slate-300 rounded-md hover:bg-slate-100 transition-colors flex items-center gap-1.5 shadow-2xs">
            <Upload className="w-3.5 h-3.5 text-slate-500" />
            <span>Upload Photo</span>
            <input
              type="file"
              accept="image/jpeg,image/png,image/webp"
              onChange={handleUploadBackground}
              className="hidden"
            />
          </label>
        </div>

        {/* Filter categories including Outdoor */}
        <div className="flex items-center gap-1.5 flex-wrap">
          {(
            [
              { id: 'all', label: 'All Scenes' },
              { id: 'outdoor', label: 'Outdoor' },
              { id: 'studio', label: 'Studio' },
              { id: 'lifestyle', label: 'Lifestyle' },
              { id: 'abstract', label: 'Abstract' },
              { id: 'custom', label: 'Custom' },
            ] as const
          ).map((cat) => (
            <button
              key={cat.id}
              onClick={() => setFilterCategory(cat.id)}
              className={`px-2.5 py-1 text-xs font-medium rounded-md transition-colors cursor-pointer ${
                filterCategory === cat.id
                  ? 'bg-slate-900 text-white shadow-2xs font-semibold'
                  : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-100'
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>
      </div>

      {/* Background Cards Grid */}
      <div className="p-4 grid grid-cols-3 sm:grid-cols-6 gap-2.5 max-h-[240px] overflow-y-auto">
        {filteredList.map((bg) => {
          const isSelected = selectedBackground.id === bg.id;
          return (
            <div
              key={bg.id}
              onClick={() => onSelectBackground(bg)}
              className={`group relative aspect-4/3 rounded-lg overflow-hidden border cursor-pointer transition-all ${
                isSelected
                  ? 'border-slate-900 ring-2 ring-slate-900/40 shadow-xs scale-102'
                  : 'border-slate-200 hover:border-slate-400'
              }`}
            >
              {bg.image ? (
                <img
                  src={bg.image}
                  alt={bg.name}
                  referrerPolicy="no-referrer"
                  className="w-full h-full object-cover transition-transform duration-200 group-hover:scale-105"
                />
              ) : (
                <div className="w-full h-full bg-slate-100 flex flex-col items-center justify-center p-2 text-center text-[10px] text-slate-500 font-medium">
                  <ImageIcon className="w-4 h-4 mb-1 text-slate-400" />
                  <span>Studio Clean</span>
                </div>
              )}

              {/* Selection Checkmark */}
              {isSelected && (
                <div className="absolute top-1 right-1 w-4 h-4 rounded-full bg-slate-900 text-white flex items-center justify-center shadow-xs">
                  <Check className="w-2.5 h-2.5" />
                </div>
              )}

              {/* Title overlay */}
              <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/85 via-black/45 to-transparent p-1 pt-3">
                <span className="text-[10px] font-semibold text-white truncate block">
                  {bg.name}
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Virtual Lighting Quick Blend Strip */}
      <div className="px-4 py-3 bg-slate-50 border-t border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 text-slate-700 font-semibold">
            <Sun className="w-4 h-4 text-amber-500" />
            <span>Virtual Lighting Intensity:</span>
          </div>
          <div className="flex items-center gap-2">
            <input
              type="range"
              min="0.4"
              max="1.8"
              step="0.05"
              value={lighting.intensity}
              onChange={(e) =>
                onChangeLighting((prev) => ({
                  ...prev,
                  intensity: parseFloat(e.target.value),
                }))
              }
              className="w-28 sm:w-36 accent-slate-900 cursor-pointer"
            />
            <span className="font-mono text-slate-800 font-bold tabular-nums">
              {(lighting.intensity * 100).toFixed(0)}%
            </span>
          </div>
        </div>

        {/* AI Smart Blend Button */}
        {selectedBackground.image && onTriggerAiSmartBlend && (
          <button
            onClick={onTriggerAiSmartBlend}
            disabled={isAiBlending}
            className="px-3 py-1.5 text-xs font-semibold text-amber-900 bg-amber-100 hover:bg-amber-200 border border-amber-300 rounded-lg flex items-center justify-center gap-1.5 cursor-pointer transition-colors disabled:opacity-50 shadow-2xs"
          >
            {isAiBlending ? (
              <>
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                <span>AI Blending Scene...</span>
              </>
            ) : (
              <>
                <Sparkles className="w-3.5 h-3.5 text-amber-600" />
                <span>AI Realistically Integrate Scene</span>
              </>
            )}
          </button>
        )}
      </div>

      {/* AI Custom Background Generator Box */}
      <div className="p-4 border-t border-slate-200 bg-slate-50/30 flex flex-col gap-2.5">
        <div className="flex items-center justify-between text-xs">
          <span className="font-semibold text-slate-800 flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-amber-500" />
            <span>AI Text-to-Background Generator:</span>
          </span>
          <span className="text-[11px] text-slate-400 font-mono">gemini-nano-banana-2.1</span>
        </div>

        <div className="flex items-center gap-2">
          <input
            type="text"
            value={customPrompt}
            onChange={(e) => setCustomPrompt(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleGenerateCustomBackground()}
            placeholder="e.g. minimalist desk setup, urban storefront, coastal sunset deck, tokyo alley dusk..."
            className="flex-1 text-xs px-3 py-2 border border-slate-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-slate-900 bg-white"
          />

          <button
            onClick={handleGenerateCustomBackground}
            disabled={isGeneratingBg || !customPrompt.trim()}
            className="px-3.5 py-2 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 disabled:opacity-50 rounded-lg flex items-center gap-1.5 cursor-pointer shrink-0 transition-colors shadow-2xs"
          >
            {isGeneratingBg ? (
              <>
                <RefreshCw className="w-3.5 h-3.5 animate-spin text-amber-400" />
                <span>Generating...</span>
              </>
            ) : (
              <>
                <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                <span>Generate</span>
              </>
            )}
          </button>
        </div>

        {/* Quick prompt suggestions */}
        <div className="flex items-center gap-1.5 flex-wrap text-[11px]">
          <span className="text-slate-400">Popular Scenes:</span>
          {[
            'minimalist desk setup',
            'urban storefront',
            'outdoor pine trail',
            'coastal sunset deck',
            'brutalist concrete plaza',
          ].map((p) => (
            <button
              key={p}
              type="button"
              onClick={() => setCustomPrompt(p)}
              className="text-slate-600 hover:text-slate-900 bg-white border border-slate-200 px-2 py-0.5 rounded cursor-pointer transition-colors"
            >
              {p}
            </button>
          ))}
        </div>

        {noticeMessage && (
          <div className="text-xs text-amber-800 bg-amber-50 border border-amber-200 p-2.5 rounded-lg flex items-center justify-between">
            <span className="flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-amber-600 shrink-0" />
              <span>{noticeMessage}</span>
            </span>
            <button
              onClick={() => setNoticeMessage(null)}
              className="text-amber-600 hover:text-amber-900 ml-2 font-bold cursor-pointer"
            >
              ×
            </button>
          </div>
        )}

        {generateError && (
          <div className="text-xs text-rose-700 bg-rose-50 border border-rose-200 p-2 rounded">
            {generateError}
          </div>
        )}
      </div>
    </div>
  );
};
