import React, { useState } from 'react';
import { LogoConfig, PrintMethod } from '../types/merch';
import { SAMPLE_LOGOS } from '../data/sampleLogos';
import { Upload, Sparkles, Sliders, Palette, RefreshCw, Layers } from 'lucide-react';

interface LogoControlsProps {
  logo: LogoConfig;
  onChangeLogo: (updater: (prev: LogoConfig) => LogoConfig) => void;
  supportedMethods: PrintMethod[];
}

export const LogoControls: React.FC<LogoControlsProps> = ({
  logo,
  onChangeLogo,
  supportedMethods,
}) => {
  const [activeTab, setActiveTab] = useState<'adjust' | 'library' | 'ai-advisor'>('adjust');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<any>(null);

  // File upload handler
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const dataUrl = event.target?.result as string;
      const img = new Image();
      img.onload = () => {
        onChangeLogo((prev) => ({
          ...prev,
          name: file.name.replace(/\.[^/.]+$/, ''),
          dataUrl,
          naturalWidth: img.width,
          naturalHeight: img.height,
        }));
      };
      img.src = dataUrl;
    };
    reader.readAsDataURL(file);
  };

  // AI Logo Intelligence call
  const handleAnalyzeLogo = async () => {
    setIsAnalyzing(true);
    setAnalysisResult(null);
    try {
      const res = await fetch('/api/gemini/analyze-logo', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ imageBase64: logo.dataUrl }),
      });
      const data = await res.json();
      if (data.success && data.analysis) {
        setAnalysisResult(data.analysis);
      } else {
        alert(data.error || 'Failed to analyze logo');
      }
    } catch (err: any) {
      alert('Error analyzing logo: ' + err.message);
    } finally {
      setIsAnalyzing(false);
    }
  };

  // Preset color tints
  const colorPresets = [
    { label: 'Original', hex: null },
    { label: 'Pure White', hex: '#ffffff' },
    { label: 'Pitch Black', hex: '#111827' },
    { label: 'Chalk Bone', hex: '#f4ede4' },
    { label: 'Metallic Gold', hex: '#d4af37' },
    { label: 'Silver Chrome', hex: '#cbd5e1' },
    { label: 'Vintage Coral', hex: '#e11d48' },
    { label: 'Pine Forest', hex: '#166534' },
  ];

  return (
    <div className="flex flex-col bg-white border border-slate-200 rounded-xl overflow-hidden shadow-xs">
      {/* Tab Navigation */}
      <div className="flex border-b border-slate-200 bg-slate-50/50 p-1 gap-1">
        <button
          onClick={() => setActiveTab('adjust')}
          className={`flex-1 py-1.5 px-3 text-xs font-semibold rounded-lg transition-colors cursor-pointer flex items-center justify-center gap-1.5 ${
            activeTab === 'adjust'
              ? 'bg-white text-slate-900 shadow-xs'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <Sliders className="w-3.5 h-3.5" />
          <span>Transform & Finish</span>
        </button>

        <button
          onClick={() => setActiveTab('library')}
          className={`flex-1 py-1.5 px-3 text-xs font-semibold rounded-lg transition-colors cursor-pointer flex items-center justify-center gap-1.5 ${
            activeTab === 'library'
              ? 'bg-white text-slate-900 shadow-xs'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <Layers className="w-3.5 h-3.5" />
          <span>Vector Library</span>
        </button>

        <button
          onClick={() => setActiveTab('ai-advisor')}
          className={`flex-1 py-1.5 px-3 text-xs font-semibold rounded-lg transition-colors cursor-pointer flex items-center justify-center gap-1.5 ${
            activeTab === 'ai-advisor'
              ? 'bg-white text-slate-900 shadow-xs'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <Sparkles className="w-3.5 h-3.5 text-amber-500" />
          <span>AI Advisor</span>
        </button>
      </div>

      <div className="p-5 flex flex-col gap-5">
        {/* Active Logo Thumbnail & Upload Dropzone */}
        <div className="flex items-center gap-4 p-3 bg-slate-50 border border-slate-200/80 rounded-lg">
          <div className="w-14 h-14 bg-slate-900 rounded-md p-1.5 flex items-center justify-center overflow-hidden shrink-0 border border-slate-700">
            <img
              src={logo.dataUrl}
              alt="Logo"
              referrerPolicy="no-referrer"
              className="max-w-full max-h-full object-contain"
            />
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-xs font-bold text-slate-900 truncate">{logo.name}</div>
            <div className="text-[11px] text-slate-500 truncate">
              {logo.naturalWidth} × {logo.naturalHeight} px artwork
            </div>
          </div>
          <label className="cursor-pointer px-3 py-1.5 text-xs font-semibold text-slate-700 bg-white border border-slate-300 rounded-md hover:bg-slate-100 transition-colors shrink-0 shadow-2xs">
            <span>Upload New</span>
            <input
              type="file"
              accept="image/png,image/svg+xml,image/jpeg,image/webp"
              onChange={handleFileUpload}
              className="hidden"
            />
          </label>
        </div>

        {/* TAB 1: ADJUST & FINISH */}
        {activeTab === 'adjust' && (
          <div className="flex flex-col gap-4 text-xs">
            {/* Manufacturing Print Method */}
            <div className="flex flex-col gap-1.5">
              <label className="font-semibold text-slate-800">Manufacturing Print Method</label>
              <div className="grid grid-cols-2 gap-2">
                {supportedMethods.map((method) => (
                  <button
                    key={method}
                    type="button"
                    onClick={() =>
                      onChangeLogo((prev) => ({
                        ...prev,
                        printMethod: method,
                      }))
                    }
                    className={`py-2 px-2.5 text-left rounded-md border text-xs font-medium transition-colors cursor-pointer ${
                      logo.printMethod === method
                        ? 'border-slate-900 bg-slate-900 text-white shadow-2xs'
                        : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300'
                    }`}
                  >
                    {method}
                  </button>
                ))}
              </div>
            </div>

            {/* Color Tinting */}
            <div className="flex flex-col gap-2">
              <div className="flex items-center justify-between">
                <label className="font-semibold text-slate-800">Artwork Color Tint</label>
                <span className="font-mono text-slate-500 text-[11px]">
                  {logo.colorTint || 'Original File'}
                </span>
              </div>
              <div className="flex items-center gap-1.5 flex-wrap">
                {colorPresets.map((preset) => (
                  <button
                    key={preset.label}
                    type="button"
                    title={preset.label}
                    onClick={() =>
                      onChangeLogo((prev) => ({
                        ...prev,
                        colorTint: preset.hex,
                      }))
                    }
                    className={`w-7 h-7 rounded-md border flex items-center justify-center transition-transform cursor-pointer ${
                      logo.colorTint === preset.hex
                        ? 'border-slate-900 ring-2 ring-slate-400 ring-offset-1 scale-105'
                        : 'border-slate-300 hover:scale-105'
                    }`}
                    style={{
                      backgroundColor: preset.hex || '#e2e8f0',
                    }}
                  >
                    {!preset.hex && <span className="text-[9px] font-bold text-slate-600">ORIG</span>}
                  </button>
                ))}
              </div>
            </div>

            {/* Scale Slider */}
            <div className="flex flex-col gap-1.5 pt-1">
              <div className="flex items-center justify-between">
                <label className="font-medium text-slate-700">Artwork Scale</label>
                <span className="font-mono tabular-nums text-slate-500">{logo.scalePercent}%</span>
              </div>
              <input
                type="range"
                min="20"
                max="180"
                value={logo.scalePercent}
                onChange={(e) =>
                  onChangeLogo((prev) => ({
                    ...prev,
                    scalePercent: Number(e.target.value),
                  }))
                }
                className="w-full accent-slate-900 cursor-pointer"
              />
            </div>

            {/* Rotation Slider */}
            <div className="flex flex-col gap-1.5">
              <div className="flex items-center justify-between">
                <label className="font-medium text-slate-700">Rotation Angle</label>
                <div className="flex items-center gap-2">
                  <span className="font-mono tabular-nums text-slate-500">{logo.rotationDeg}°</span>
                  {logo.rotationDeg !== 0 && (
                    <button
                      onClick={() =>
                        onChangeLogo((prev) => ({
                          ...prev,
                          rotationDeg: 0,
                        }))
                      }
                      className="text-[10px] text-slate-600 underline cursor-pointer hover:text-slate-900"
                    >
                      Reset 0°
                    </button>
                  )}
                </div>
              </div>
              <input
                type="range"
                min="-180"
                max="180"
                value={logo.rotationDeg}
                onChange={(e) =>
                  onChangeLogo((prev) => ({
                    ...prev,
                    rotationDeg: Number(e.target.value),
                  }))
                }
                className="w-full accent-slate-900 cursor-pointer"
              />
            </div>

            {/* Position X / Y Offset */}
            <div className="grid grid-cols-2 gap-3 pt-1">
              <div className="flex flex-col gap-1">
                <div className="flex items-center justify-between text-[11px]">
                  <span className="text-slate-600">Offset X</span>
                  <span className="font-mono tabular-nums text-slate-500">{logo.xOffsetPercent}%</span>
                </div>
                <input
                  type="range"
                  min="-50"
                  max="50"
                  value={logo.xOffsetPercent}
                  onChange={(e) =>
                    onChangeLogo((prev) => ({
                      ...prev,
                      xOffsetPercent: Number(e.target.value),
                    }))
                  }
                  className="w-full accent-slate-900 cursor-pointer"
                />
              </div>

              <div className="flex flex-col gap-1">
                <div className="flex items-center justify-between text-[11px]">
                  <span className="text-slate-600">Offset Y</span>
                  <span className="font-mono tabular-nums text-slate-500">{logo.yOffsetPercent}%</span>
                </div>
                <input
                  type="range"
                  min="-50"
                  max="50"
                  value={logo.yOffsetPercent}
                  onChange={(e) =>
                    onChangeLogo((prev) => ({
                      ...prev,
                      yOffsetPercent: Number(e.target.value),
                    }))
                  }
                  className="w-full accent-slate-900 cursor-pointer"
                />
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: VECTOR LIBRARY */}
        {activeTab === 'library' && (
          <div className="flex flex-col gap-3">
            <span className="text-xs text-slate-500">
              Select one of our pre-built high-resolution apparel logos:
            </span>
            <div className="grid grid-cols-1 gap-2.5">
              {SAMPLE_LOGOS.map((sample) => (
                <div
                  key={sample.id}
                  onClick={() => {
                    const img = new Image();
                    img.onload = () => {
                      onChangeLogo((prev) => ({
                        ...prev,
                        id: sample.id,
                        name: sample.name,
                        dataUrl: sample.svgDataUri,
                        naturalWidth: img.width,
                        naturalHeight: img.height,
                      }));
                    };
                    img.src = sample.svgDataUri;
                  }}
                  className={`flex items-center gap-3 p-2.5 rounded-lg border cursor-pointer transition-all ${
                    logo.name.includes(sample.name.split(' ')[0])
                      ? 'border-slate-900 bg-slate-900 text-white shadow-xs'
                      : 'border-slate-200 bg-white text-slate-800 hover:border-slate-300'
                  }`}
                >
                  <div className="w-12 h-10 bg-black/80 rounded p-1 flex items-center justify-center shrink-0">
                    <img
                      src={sample.svgDataUri}
                      alt={sample.name}
                      referrerPolicy="no-referrer"
                      className="max-w-full max-h-full object-contain"
                    />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="text-xs font-semibold truncate">{sample.name}</div>
                    <div className="text-[11px] opacity-70 truncate">{sample.category}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 3: AI ADVISOR */}
        {activeTab === 'ai-advisor' && (
          <div className="flex flex-col gap-4 text-xs">
            <p className="text-slate-600 leading-relaxed">
              Gemini analyzes your artwork colors, geometry, and linework to provide manufacturing recommendations, Pantone estimates, and recommended apparel colorways.
            </p>

            <button
              type="button"
              onClick={handleAnalyzeLogo}
              disabled={isAnalyzing}
              className="py-2.5 px-4 bg-slate-900 hover:bg-slate-800 text-white font-semibold rounded-lg flex items-center justify-center gap-2 cursor-pointer shadow-xs disabled:opacity-50 transition-colors"
            >
              {isAnalyzing ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Analyzing Artwork with Gemini...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4 text-amber-400" />
                  <span>Run AI Manufacturing Audit</span>
                </>
              )}
            </button>

            {analysisResult && (
              <div className="flex flex-col gap-3 p-3.5 bg-slate-50 border border-slate-200 rounded-lg">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-900">{analysisResult.brandStyle}</span>
                  <span className="text-[11px] font-mono text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded">
                    Audit Passed
                  </span>
                </div>

                <div className="flex flex-col gap-1">
                  <span className="text-slate-500 font-medium">Recommended Print Method:</span>
                  <span className="font-semibold text-slate-800">
                    {analysisResult.recommendedPrintMethod}
                  </span>
                  <p className="text-[11px] text-slate-600">{analysisResult.printMethodReasoning}</p>
                </div>

                <div className="flex flex-col gap-1">
                  <span className="text-slate-500 font-medium">Optimal Placement:</span>
                  <span className="text-slate-800 font-medium">{analysisResult.recommendedPlacement}</span>
                </div>

                {analysisResult.primaryColors && (
                  <div className="flex flex-col gap-1.5">
                    <span className="text-slate-500 font-medium">Detected Pantone Estimations:</span>
                    <div className="flex items-center gap-2 flex-wrap">
                      {analysisResult.primaryColors.map((c: any, idx: number) => (
                        <div
                          key={idx}
                          className="flex items-center gap-1.5 bg-white border border-slate-200 px-2 py-1 rounded text-[11px]"
                        >
                          <span
                            className="w-3 h-3 rounded-full border border-slate-300"
                            style={{ backgroundColor: c.hex }}
                          />
                          <span className="font-mono">{c.pantoneEstimate || c.hex}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {analysisResult.compositionAdvice && (
                  <div className="text-[11px] text-slate-600 bg-amber-50/70 border border-amber-200/60 p-2 rounded">
                    <span className="font-semibold text-amber-900">Tech Note: </span>
                    {analysisResult.compositionAdvice}
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
