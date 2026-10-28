import React, { useState } from 'react';
import { MerchProduct, LogoConfig, AiGenerationResult } from '../types/merch';
import { Sparkles, Wand2, RefreshCw, X, Download, Check, ArrowRight, Image as ImageIcon } from 'lucide-react';
import { downloadDataUrl } from '../utils/canvasExport';

interface AiStudioModalProps {
  isOpen: boolean;
  onClose: () => void;
  product: MerchProduct;
  logo: LogoConfig;
  currentMockupDataUrl: string;
  onApplyNewMockupBase: (newImageUrl: string) => void;
}

export const AiStudioModal: React.FC<AiStudioModalProps> = ({
  isOpen,
  onClose,
  product,
  logo,
  currentMockupDataUrl,
  onApplyNewMockupBase,
}) => {
  const [mode, setMode] = useState<'edit' | 'generate'>('edit');
  const [prompt, setPrompt] = useState('');
  const [aspectRatio, setAspectRatio] = useState<'4:3' | '1:1' | '16:9'>('4:3');
  const [isLoading, setIsLoading] = useState(false);
  const [currentResult, setCurrentResult] = useState<AiGenerationResult | null>(null);
  const [history, setHistory] = useState<AiGenerationResult[]>([]);
  const [applied, setApplied] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  if (!isOpen) return null;

  const quickEditPrompts = [
    'Add vintage wash texture, distressed micro-cracks, and soft fading across the fabric',
    'Set product in a sunlit Scandinavian loft with light oak floors and monstera leaf shadows',
    'Transform environment into a brutalist architectural gallery with directional sunlight',
    'Add dramatic golden hour warm rim lighting and subtle atmospheric studio dust particles',
    'Model wearing this garment on a Tokyo streetwear sidewalk with soft cinematic neon reflections',
  ];

  const quickGeneratePrompts = [
    `Studio editorial photograph of a ${product.name} worn by a model in a minimalist modern loft, soft natural side lighting, 8k catalog`,
    `Flat lay product photography of ${product.name} on raw polished travertine stone with an open design monograph and ceramic espresso cup`,
    `Streetwear lookbook shot of ${product.name} in an industrial warehouse with warm atmospheric haze and metal beams`,
  ];

  const handleExecuteAi = async () => {
    if (!prompt.trim()) return;
    setIsLoading(true);
    setErrorMessage(null);
    setApplied(false);

    try {
      const endpoint = mode === 'edit' ? '/api/gemini/edit-image' : '/api/gemini/generate-mockup-scene';
      const payload: any = {
        prompt: prompt.trim(),
        aspectRatio,
        productType: product.type,
      };

      if (mode === 'edit') {
        payload.imageBase64 = currentMockupDataUrl || product.image;
      }

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error || 'AI generation failed. Please try a different prompt.');
      }

      const newResult: AiGenerationResult = {
        id: 'gen-' + Date.now(),
        imageUrl: data.imageUrl,
        prompt: prompt.trim(),
        modelUsed: data.modelUsed || 'gemini-nano-banana-2.1',
        timestamp: Date.now(),
        type: mode === 'edit' ? 'edit' : 'scene',
      };

      setCurrentResult(newResult);
      setHistory((prev) => [newResult, ...prev]);
    } catch (err: any) {
      setErrorMessage(err.message || 'An unexpected error occurred during generation.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleApply = (imageUrl: string) => {
    onApplyNewMockupBase(imageUrl);
    setApplied(true);
    setTimeout(() => {
      onClose();
    }, 800);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl max-w-4xl w-full max-h-[92vh] flex flex-col shadow-2xl border border-slate-200 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-amber-500/10 text-amber-600 flex items-center justify-center">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900">
                AI Scene Studio & Text-to-Image Editor
              </h2>
              <p className="text-xs text-slate-500">
                Powered by <span className="font-mono font-medium text-slate-800">gemini-nano-banana-2.1</span>
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

        {/* Mode Selector */}
        <div className="flex px-6 pt-4 gap-2 bg-slate-50/50 border-b border-slate-200 pb-3">
          <button
            onClick={() => {
              setMode('edit');
              setPrompt('');
            }}
            className={`py-2 px-4 rounded-lg text-xs font-semibold flex items-center gap-2 transition-colors cursor-pointer ${
              mode === 'edit'
                ? 'bg-slate-900 text-white shadow-xs'
                : 'bg-white text-slate-600 border border-slate-200 hover:border-slate-300'
            }`}
          >
            <Wand2 className="w-3.5 h-3.5" />
            <span>Edit Current Mockup Image</span>
          </button>

          <button
            onClick={() => {
              setMode('generate');
              setPrompt('');
            }}
            className={`py-2 px-4 rounded-lg text-xs font-semibold flex items-center gap-2 transition-colors cursor-pointer ${
              mode === 'generate'
                ? 'bg-slate-900 text-white shadow-xs'
                : 'bg-white text-slate-600 border border-slate-200 hover:border-slate-300'
            }`}
          >
            <ImageIcon className="w-3.5 h-3.5" />
            <span>Generate New Mockup Scene</span>
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 flex-1 overflow-y-auto flex flex-col md:flex-row gap-6">
          {/* Left Column: Prompt Input & Controls */}
          <div className="flex-1 flex flex-col gap-4">
            <div className="flex flex-col gap-2">
              <label className="text-xs font-bold text-slate-800 flex items-center justify-between">
                <span>{mode === 'edit' ? 'Instructions to Edit Image:' : 'Scene Description:'}</span>
                <span className="font-mono text-[11px] text-slate-400">Natural Language</span>
              </label>

              <textarea
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder={
                  mode === 'edit'
                    ? 'e.g. Add subtle vintage fabric wear, wash fade, and set on a dark granite pedestal with soft rim lighting...'
                    : `e.g. Clean catalog shot of ${product.name} folded on an architect desk with drafting pencils and coffee...`
                }
                rows={3}
                className="w-full text-xs p-3 border border-slate-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-slate-900 resize-none font-sans"
              />
            </div>

            {/* Quick Prompt Ideas */}
            <div className="flex flex-col gap-1.5">
              <span className="text-[11px] font-semibold text-slate-500">Quick Prompt Inspirations:</span>
              <div className="flex flex-col gap-1">
                {(mode === 'edit' ? quickEditPrompts : quickGeneratePrompts).map((sample, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setPrompt(sample)}
                    className="text-left text-[11px] text-slate-600 hover:text-slate-900 bg-slate-50 hover:bg-slate-100 p-2 rounded-md transition-colors cursor-pointer border border-slate-200/60 truncate"
                  >
                    &ldquo;{sample}&rdquo;
                  </button>
                ))}
              </div>
            </div>

            {/* Aspect Ratio */}
            <div className="flex items-center justify-between pt-2">
              <span className="text-xs font-medium text-slate-700">Aspect Ratio:</span>
              <div className="flex items-center gap-1.5">
                {(['4:3', '1:1', '16:9'] as const).map((ratio) => (
                  <button
                    key={ratio}
                    type="button"
                    onClick={() => setAspectRatio(ratio)}
                    className={`px-2.5 py-1 text-xs font-mono rounded cursor-pointer transition-colors ${
                      aspectRatio === ratio
                        ? 'bg-slate-900 text-white font-bold'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    {ratio}
                  </button>
                ))}
              </div>
            </div>

            {/* Error banner */}
            {errorMessage && (
              <div className="p-3 bg-rose-50 border border-rose-200 text-rose-800 text-xs rounded-lg">
                {errorMessage}
              </div>
            )}

            {/* Generate Action Button */}
            <button
              onClick={handleExecuteAi}
              disabled={isLoading || !prompt.trim()}
              className="mt-2 py-3 px-4 bg-slate-900 hover:bg-slate-800 disabled:opacity-50 text-white font-semibold rounded-xl flex items-center justify-center gap-2 cursor-pointer shadow-md transition-all active:scale-98"
            >
              {isLoading ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin text-amber-400" />
                  <span>Processing with Gemini Nano Banana 2.1...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4 text-amber-400" />
                  <span>
                    {mode === 'edit' ? 'Apply AI Image Edit' : 'Generate Mockup Scene'}
                  </span>
                </>
              )}
            </button>
          </div>

          {/* Right Column: Output Preview */}
          <div className="flex-1 flex flex-col gap-3 min-w-0">
            <span className="text-xs font-bold text-slate-800">Result Preview</span>

            <div className="relative aspect-4/3 w-full bg-slate-100 rounded-xl overflow-hidden border border-slate-200 flex items-center justify-center">
              {isLoading ? (
                <div className="flex flex-col items-center gap-3 p-6 text-center">
                  <RefreshCw className="w-8 h-8 text-slate-400 animate-spin" />
                  <div className="text-xs font-medium text-slate-600">
                    Generating photorealistic high-res render...
                  </div>
                  <div className="text-[11px] text-slate-400">
                    Model: gemini-nano-banana-2.1 (1K resolution)
                  </div>
                </div>
              ) : currentResult ? (
                <img
                  src={currentResult.imageUrl}
                  alt="AI Generated Mockup"
                  referrerPolicy="no-referrer"
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="flex flex-col items-center gap-2 text-slate-400 p-6 text-center">
                  <Sparkles className="w-8 h-8 opacity-40" />
                  <span className="text-xs">
                    Choose a prompt and click generate to create or edit imagery with Gemini
                  </span>
                </div>
              )}

              {currentResult && (
                <div className="absolute top-2 left-2 bg-slate-900/80 backdrop-blur-xs text-white text-[10px] font-mono px-2 py-0.5 rounded">
                  {currentResult.modelUsed}
                </div>
              )}
            </div>

            {/* Action Bar when image generated */}
            {currentResult && (
              <div className="flex items-center gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => handleApply(currentResult.imageUrl)}
                  className={`flex-1 py-2 px-3 text-xs font-semibold rounded-lg flex items-center justify-center gap-1.5 transition-colors cursor-pointer ${
                    applied
                      ? 'bg-emerald-600 text-white'
                      : 'bg-slate-900 text-white hover:bg-slate-800'
                  }`}
                >
                  {applied ? (
                    <>
                      <Check className="w-3.5 h-3.5" />
                      <span>Applied to Studio!</span>
                    </>
                  ) : (
                    <>
                      <ArrowRight className="w-3.5 h-3.5" />
                      <span>Use as Active Mockup Base</span>
                    </>
                  )}
                </button>

                <button
                  type="button"
                  onClick={() =>
                    downloadDataUrl(
                      currentResult.imageUrl,
                      `atelier-ai-${mode}-${Date.now()}.png`
                    )
                  }
                  className="p-2 text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors cursor-pointer"
                  title="Download Image"
                >
                  <Download className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
