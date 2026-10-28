import React, { useRef, useState, useEffect } from 'react';
import {
  MerchProduct,
  PrintArea,
  LogoConfig,
  ProductColorway,
  ProductSize,
  MockupBackground,
  VirtualLightingConfig,
  LightingMood,
} from '../types/merch';
import {
  Move,
  Eye,
  EyeOff,
  Sparkles,
  Sun,
  Sliders,
  ChevronDown,
  ChevronUp,
  RotateCcw,
  Undo2,
  Redo2,
  Bookmark,
} from 'lucide-react';

interface PlacementCanvasProps {
  product: MerchProduct;
  selectedColorway: ProductColorway;
  selectedSize: ProductSize;
  selectedArea: PrintArea;
  selectedBackground: MockupBackground;
  logo: LogoConfig;
  lighting: VirtualLightingConfig;
  canUndo?: boolean;
  canRedo?: boolean;
  pastCount?: number;
  futureCount?: number;
  onUndo?: () => void;
  onRedo?: () => void;
  onChangeColorway: (c: ProductColorway) => void;
  onChangeSize: (s: ProductSize) => void;
  onChangeArea: (a: PrintArea) => void;
  onChangeLogo: (updater: (prev: LogoConfig) => LogoConfig) => void;
  onChangeLighting: (updater: (prev: VirtualLightingConfig) => VirtualLightingConfig) => void;
  onOpenAiEdit: () => void;
  onOpenExportModal: () => void;
  onOpenPresetsModal?: () => void;
  onTriggerAiSmartBlend?: () => void;
  isAiBlending?: boolean;
}

export const PlacementCanvas: React.FC<PlacementCanvasProps> = ({
  product,
  selectedColorway,
  selectedSize,
  selectedArea,
  selectedBackground,
  logo,
  lighting,
  canUndo = false,
  canRedo = false,
  pastCount = 0,
  futureCount = 0,
  onUndo,
  onRedo,
  onChangeColorway,
  onChangeSize,
  onChangeArea,
  onChangeLogo,
  onChangeLighting,
  onOpenAiEdit,
  onOpenExportModal,
  onOpenPresetsModal,
  onTriggerAiSmartBlend,
  isAiBlending = false,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [showGuides, setShowGuides] = useState(true);
  const [showLightingControls, setShowLightingControls] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const dragStartRef = useRef<{ x: number; y: number; initialOffsetX: number; initialOffsetY: number }>({
    x: 0,
    y: 0,
    initialOffsetX: 0,
    initialOffsetY: 0,
  });

  // Calculate actual logo width/height based on physical dimensions of chosen size
  const scaleFraction = logo.scalePercent / 100;
  const currentWidthInches = (selectedSize.printWidthInches * scaleFraction).toFixed(1);
  const currentHeightInches = (selectedSize.printHeightInches * scaleFraction).toFixed(1);
  const currentWidthCm = (parseFloat(currentWidthInches) * 2.54).toFixed(1);
  const currentHeightCm = (parseFloat(currentHeightInches) * 2.54).toFixed(1);

  // Mouse drag handlers for direct canvas manipulation
  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    dragStartRef.current = {
      x: e.clientX,
      y: e.clientY,
      initialOffsetX: logo.xOffsetPercent,
      initialOffsetY: logo.yOffsetPercent,
    };
  };

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isDragging || !containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      const deltaXPx = e.clientX - dragStartRef.current.x;
      const deltaYPx = e.clientY - dragStartRef.current.y;

      const printAreaWidthPx = (selectedArea.widthPercent / 100) * rect.width;
      const printAreaHeightPx = (selectedArea.heightPercent / 100) * rect.height;

      const deltaXPercent = (deltaXPx / printAreaWidthPx) * 100;
      const deltaYPercent = (deltaYPx / printAreaHeightPx) * 100;

      const newX = Math.max(-60, Math.min(60, dragStartRef.current.initialOffsetX + deltaXPercent));
      const newY = Math.max(-60, Math.min(60, dragStartRef.current.initialOffsetY + deltaYPercent));

      onChangeLogo((prev) => ({
        ...prev,
        xOffsetPercent: Math.round(newX * 10) / 10,
        yOffsetPercent: Math.round(newY * 10) / 10,
      }));
    };

    const handleMouseUp = () => {
      setIsDragging(false);
    };

    if (isDragging) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
    }
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, onChangeLogo, selectedArea]);

  // Texture filter style based on selected PrintMethod
  const getFinishFilterClass = () => {
    switch (logo.printMethod) {
      case '3D Heavy Embroidery':
        return 'embroidery-texture drop-shadow-[0_2px_4px_rgba(0,0,0,0.5)]';
      case 'Vintage Distressed Wash':
        return 'washed-texture';
      case 'Screenprint Plastisol':
        return 'screenprint-texture drop-shadow-[0_1px_1px_rgba(0,0,0,0.2)]';
      case 'Metallic Foil Stamp':
        return 'drop-shadow-[0_2px_3px_rgba(212,175,55,0.4)] brightness-110';
      default:
        return '';
    }
  };

  // Lighting Mood presets
  const lightingMoodPresets: { id: LightingMood; label: string; intensity: number; warmth: number; desc: string }[] = [
    { id: 'studio-daylight', label: 'Studio 5500K', intensity: 1.0, warmth: 0, desc: 'Clean balanced commercial light' },
    { id: 'golden-hour', label: 'Golden Sunset', intensity: 1.15, warmth: 35, desc: 'Warm amber directional glow' },
    { id: 'moody-twilight', label: 'Moody Twilight', intensity: 0.75, warmth: -25, desc: 'Cool atmospheric deep shadows' },
    { id: 'commercial-strobe', label: 'Strobe High-Key', intensity: 1.35, warmth: 5, desc: 'Crisp specular highlights' },
    { id: 'vintage-film', label: 'Vintage Warm', intensity: 0.95, warmth: 20, desc: 'Soft nostalgic film grading' },
    { id: 'overcast-soft', label: 'Overcast Soft', intensity: 0.9, warmth: -5, desc: 'Even diffused ambient daylight' },
  ];

  // Dynamic filter for product based on virtual lighting
  const productFilterStyle = {
    filter: `brightness(${lighting.intensity}) contrast(${1 + (lighting.intensity - 1) * 0.25}) saturate(${
      1 + lighting.warmth / 150
    })`,
  };

  // Dynamic shadow for product on background
  const angleRad = (lighting.angleDeg * Math.PI) / 180;
  const shadowX = Math.sin(angleRad) * 22;
  const shadowY = Math.cos(angleRad) * 26 + 10;
  const productShadowFilter = selectedBackground.image
    ? `drop-shadow(${shadowX}px ${shadowY}px 30px rgba(0,0,0,${lighting.shadowOpacity}))`
    : '';

  return (
    <div className="flex flex-col bg-white border border-slate-200 rounded-xl overflow-hidden shadow-xs">
      {/* Top Configuration Strip: Colorway & Size Selector */}
      <div className="flex flex-wrap items-center justify-between px-5 py-3 border-b border-slate-200 bg-slate-50/70 text-xs gap-3">
        {/* Colorway Swatches */}
        <div className="flex items-center gap-2">
          <span className="font-semibold text-slate-700">Color:</span>
          <div className="flex items-center gap-1.5 flex-wrap">
            {product.colorways.map((c) => (
              <button
                key={c.id}
                type="button"
                title={c.name}
                onClick={() => onChangeColorway(c)}
                className={`w-5 h-5 rounded-full border transition-all cursor-pointer ${
                  c.id === selectedColorway.id
                    ? 'border-slate-900 ring-2 ring-slate-900/40 scale-110 shadow-xs'
                    : 'border-slate-300 hover:scale-105'
                }`}
                style={{ backgroundColor: c.hex }}
              />
            ))}
          </div>
          <span className="text-slate-500 font-medium ml-1">({selectedColorway.name})</span>
        </div>

        {/* Size Selection */}
        <div className="flex items-center gap-2">
          <span className="font-semibold text-slate-700">Size:</span>
          <div className="flex items-center gap-1">
            {product.sizes.map((s) => (
              <button
                key={s.id}
                type="button"
                onClick={() => onChangeSize(s)}
                className={`px-2.5 py-1 text-xs font-semibold rounded-md border transition-colors cursor-pointer ${
                  s.id === selectedSize.id
                    ? 'border-slate-900 bg-slate-900 text-white shadow-2xs'
                    : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300'
                }`}
              >
                {s.label}
              </button>
            ))}
          </div>
        </div>

        {/* Action Controls & Lighting Toggle */}
        <div className="flex items-center gap-2">
          {/* Undo / Redo History Buttons */}
          <div className="flex items-center gap-1 border-r border-slate-200 pr-2 mr-1">
            <button
              type="button"
              onClick={onUndo}
              disabled={!canUndo}
              title="Undo (Ctrl+Z / ⌘Z)"
              className="px-2 py-1 text-xs rounded border border-slate-300 bg-white text-slate-700 hover:bg-slate-100 disabled:opacity-35 disabled:cursor-not-allowed transition-colors cursor-pointer flex items-center gap-1 shadow-2xs"
            >
              <Undo2 className="w-3.5 h-3.5" />
              <span className="hidden sm:inline text-[11px] font-medium">Undo</span>
              {pastCount > 0 && (
                <span className="text-[10px] text-slate-400 font-mono">({pastCount})</span>
              )}
            </button>

            <button
              type="button"
              onClick={onRedo}
              disabled={!canRedo}
              title="Redo (Ctrl+Y / ⌘⇧Z)"
              className="px-2 py-1 text-xs rounded border border-slate-300 bg-white text-slate-700 hover:bg-slate-100 disabled:opacity-35 disabled:cursor-not-allowed transition-colors cursor-pointer flex items-center gap-1 shadow-2xs"
            >
              <Redo2 className="w-3.5 h-3.5" />
              <span className="hidden sm:inline text-[11px] font-medium">Redo</span>
              {futureCount > 0 && (
                <span className="text-[10px] text-slate-400 font-mono">({futureCount})</span>
              )}
            </button>
          </div>

          {onOpenPresetsModal && (
            <button
              type="button"
              onClick={onOpenPresetsModal}
              title="Apply community templates or save configuration"
              className="flex items-center gap-1 px-2 py-1 rounded text-xs font-semibold border border-indigo-200 bg-indigo-50/80 text-indigo-700 hover:bg-indigo-100 transition-colors cursor-pointer shadow-2xs"
            >
              <Bookmark className="w-3.5 h-3.5 text-indigo-600" />
              <span>Presets</span>
            </button>
          )}

          {/* Lighting drawer toggle button */}
          <button
            onClick={() => setShowLightingControls(!showLightingControls)}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded text-xs font-semibold border transition-colors cursor-pointer ${
              showLightingControls
                ? 'bg-amber-100 border-amber-300 text-amber-900 shadow-2xs'
                : 'bg-white border-slate-300 text-slate-700 hover:bg-slate-100'
            }`}
          >
            <Sun className="w-3.5 h-3.5 text-amber-600" />
            <span>Lighting ({(lighting.intensity * 100).toFixed(0)}%)</span>
            {showLightingControls ? (
              <ChevronUp className="w-3 h-3 ml-0.5" />
            ) : (
              <ChevronDown className="w-3 h-3 ml-0.5" />
            )}
          </button>

          <button
            onClick={() => setShowGuides(!showGuides)}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded text-xs font-medium border transition-colors cursor-pointer ${
              showGuides
                ? 'bg-white border-slate-300 text-slate-800 shadow-2xs'
                : 'bg-transparent border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            {showGuides ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
            <span>Guides</span>
          </button>

          <button
            onClick={() =>
              onChangeLogo((prev) => ({
                ...prev,
                xOffsetPercent: 0,
                yOffsetPercent: 0,
                rotationDeg: 0,
              }))
            }
            className="px-2.5 py-1 text-xs font-medium text-slate-700 bg-white border border-slate-300 rounded hover:bg-slate-100 transition-colors cursor-pointer"
          >
            Center
          </button>
        </div>
      </div>

      {/* Expandable Virtual Lighting & Mood Panel */}
      {showLightingControls && (
        <div className="p-4 bg-slate-50 border-b border-slate-200 flex flex-col gap-3 text-xs animate-in slide-in-from-top-2 duration-150">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Sun className="w-4 h-4 text-amber-500" />
              <span className="font-bold text-slate-800">
                Virtual Scene Lighting & Environmental Blend
              </span>
            </div>

            <button
              onClick={() =>
                onChangeLighting(() => ({
                  intensity: 1.0,
                  mood: 'studio-daylight',
                  angleDeg: 25,
                  shadowOpacity: 0.45,
                  warmth: 0,
                  ambientReflection: 0.25,
                }))
              }
              className="text-[11px] text-slate-500 hover:text-slate-800 flex items-center gap-1 cursor-pointer"
            >
              <RotateCcw className="w-3 h-3" />
              <span>Reset Defaults</span>
            </button>
          </div>

          {/* Preset Moods */}
          <div className="flex items-center gap-1.5 flex-wrap">
            {lightingMoodPresets.map((preset) => (
              <button
                key={preset.id}
                type="button"
                onClick={() =>
                  onChangeLighting((prev) => ({
                    ...prev,
                    mood: preset.id,
                    intensity: preset.intensity,
                    warmth: preset.warmth,
                  }))
                }
                className={`px-2.5 py-1 text-xs font-medium rounded-md border transition-colors cursor-pointer ${
                  lighting.mood === preset.id
                    ? 'border-slate-900 bg-slate-900 text-white shadow-2xs font-semibold'
                    : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300'
                }`}
              >
                {preset.label}
              </button>
            ))}
          </div>

          {/* Sliders Grid: Intensity, Angle, Warmth, Shadow */}
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 pt-1">
            {/* 1. Virtual Lighting Intensity */}
            <div className="flex flex-col gap-1.5">
              <div className="flex items-center justify-between text-[11px]">
                <span className="font-semibold text-slate-700">Lighting Intensity</span>
                <span className="font-mono tabular-nums text-slate-600 font-bold">
                  {(lighting.intensity * 100).toFixed(0)}%
                </span>
              </div>
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
                className="w-full accent-slate-900 cursor-pointer"
              />
            </div>

            {/* 2. Light Source Angle */}
            <div className="flex flex-col gap-1.5">
              <div className="flex items-center justify-between text-[11px]">
                <span className="font-semibold text-slate-700">Key Light Angle</span>
                <span className="font-mono tabular-nums text-slate-600 font-bold">
                  {lighting.angleDeg > 0 ? `+${lighting.angleDeg}°` : `${lighting.angleDeg}°`}
                </span>
              </div>
              <input
                type="range"
                min="-90"
                max="90"
                step="5"
                value={lighting.angleDeg}
                onChange={(e) =>
                  onChangeLighting((prev) => ({
                    ...prev,
                    angleDeg: parseInt(e.target.value, 10),
                  }))
                }
                className="w-full accent-slate-900 cursor-pointer"
              />
            </div>

            {/* 3. Color Warmth / Temperature */}
            <div className="flex flex-col gap-1.5">
              <div className="flex items-center justify-between text-[11px]">
                <span className="font-semibold text-slate-700">Color Temperature</span>
                <span className="font-mono tabular-nums text-slate-600 font-bold">
                  {lighting.warmth > 0 ? `Warm +${lighting.warmth}` : lighting.warmth < 0 ? `Cool ${lighting.warmth}` : 'Neutral'}
                </span>
              </div>
              <input
                type="range"
                min="-50"
                max="50"
                step="5"
                value={lighting.warmth}
                onChange={(e) =>
                  onChangeLighting((prev) => ({
                    ...prev,
                    warmth: parseInt(e.target.value, 10),
                  }))
                }
                className="w-full accent-slate-900 cursor-pointer"
              />
            </div>

            {/* 4. Shadow Density */}
            <div className="flex flex-col gap-1.5">
              <div className="flex items-center justify-between text-[11px]">
                <span className="font-semibold text-slate-700">Contact Shadow</span>
                <span className="font-mono tabular-nums text-slate-600 font-bold">
                  {(lighting.shadowOpacity * 100).toFixed(0)}%
                </span>
              </div>
              <input
                type="range"
                min="0.1"
                max="0.8"
                step="0.05"
                value={lighting.shadowOpacity}
                onChange={(e) =>
                  onChangeLighting((prev) => ({
                    ...prev,
                    shadowOpacity: parseFloat(e.target.value),
                  }))
                }
                className="w-full accent-slate-900 cursor-pointer"
              />
            </div>
          </div>
        </div>
      )}

      {/* Main Interactive Viewport Canvas */}
      <div
        ref={containerRef}
        className="relative w-full aspect-4/3 max-h-[640px] bg-slate-900 select-none overflow-hidden flex items-center justify-center cursor-crosshair"
      >
        {/* Layer 1: Optional Custom or Predefined Background Environment */}
        {selectedBackground.image ? (
          <>
            <img
              src={selectedBackground.image}
              alt={selectedBackground.name}
              referrerPolicy="no-referrer"
              className="absolute inset-0 w-full h-full object-cover pointer-events-none"
            />
            {/* Ambient Lighting Gradient based on background lighting tone & warmth */}
            <div
              className={`absolute inset-0 pointer-events-none ${
                lighting.warmth > 10
                  ? 'bg-amber-500/8 mix-blend-overlay'
                  : lighting.warmth < -10
                  ? 'bg-sky-500/8 mix-blend-overlay'
                  : ''
              }`}
            />
          </>
        ) : (
          <div className="absolute inset-0 bg-slate-100" />
        )}

        {/* Layer 2: Product Mockup with Lighting Filter & Contact Shadow */}
        <div
          className="relative w-full h-full flex items-center justify-center transition-all duration-150"
          style={{
            filter: `${productShadowFilter} ${productFilterStyle.filter}`,
          }}
        >
          {/* Base Product Image */}
          <img
            src={product.image}
            alt={product.name}
            referrerPolicy="no-referrer"
            className="w-full h-full object-cover pointer-events-none"
          />

          {/* Fabric Color Overlay */}
          {selectedColorway.fabricOverlayRgba && (
            <div
              className="absolute inset-0 mix-blend-multiply pointer-events-none transition-colors duration-300"
              style={{ backgroundColor: selectedColorway.fabricOverlayRgba }}
            />
          )}

          {/* Layer 3: Print Boundary Box & Logo Overlay */}
          <div
            className={`absolute transition-all duration-150 ${
              showGuides
                ? 'border-2 border-dashed border-sky-400/80 bg-sky-400/5'
                : 'border border-transparent'
            }`}
            style={{
              left: `${selectedArea.xPercent}%`,
              top: `${selectedArea.yPercent}%`,
              width: `${selectedArea.widthPercent}%`,
              height: `${selectedArea.heightPercent}%`,
            }}
          >
            {showGuides && (
              <>
                {/* Alignment Axis Crosshairs */}
                <div className="absolute inset-x-0 top-1/2 -translate-y-1/2 h-px bg-sky-300/40 pointer-events-none" />
                <div className="absolute inset-y-0 left-1/2 -translate-x-1/2 w-px bg-sky-300/40 pointer-events-none" />

                {/* Dimension label */}
                <div className="absolute -top-6 left-1/2 -translate-x-1/2 text-[10px] font-mono bg-slate-900/80 text-white px-2 py-0.5 rounded pointer-events-none whitespace-nowrap">
                  {selectedSize.printWidthInches}&quot; W × {selectedSize.printHeightInches}&quot; H ({selectedSize.label})
                </div>
              </>
            )}

            {/* Interactive Draggable Logo */}
            <div
              onMouseDown={handleMouseDown}
              className={`w-full h-full flex items-center justify-center cursor-grab active:cursor-grabbing ${
                isDragging ? 'opacity-90 ring-1 ring-sky-400 ring-offset-1' : ''
              }`}
              style={{
                transform: `translate(${logo.xOffsetPercent}%, ${logo.yOffsetPercent}%) rotate(${logo.rotationDeg}deg) scale(${scaleFraction})`,
                opacity: logo.opacity,
              }}
            >
              <div
                className={`relative max-w-full max-h-full ${getFinishFilterClass()}`}
                style={{
                  filter: `brightness(${lighting.intensity}) contrast(${1 + (lighting.intensity - 1) * 0.2})`,
                }}
              >
                <img
                  src={logo.dataUrl}
                  alt={logo.name}
                  referrerPolicy="no-referrer"
                  className="max-w-full max-h-full object-contain pointer-events-none"
                  style={{
                    filter:
                      logo.colorTint && logo.colorTint !== '#ffffff'
                        ? `drop-shadow(0 0 0 ${logo.colorTint})`
                        : undefined,
                  }}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Floating Canvas Footer Badges */}
        <div className="absolute bottom-4 left-4 flex items-center gap-3 bg-slate-900/90 backdrop-blur-xs text-white px-3 py-1.5 rounded-lg text-xs pointer-events-none shadow-sm">
          <span className="font-semibold text-white">{selectedSize.name}</span>
          <span className="text-slate-500">|</span>
          <span className="font-medium text-slate-300">Method:</span>
          <span className="font-semibold text-white">{logo.printMethod}</span>
          <span className="text-slate-500">|</span>
          <span className="font-medium text-slate-300">Light:</span>
          <span className="font-mono tabular-nums text-white">
            {(lighting.intensity * 100).toFixed(0)}%
          </span>
          <span className="text-slate-500">|</span>
          <span className="text-slate-300 font-mono">
            {currentWidthInches}&quot; × {currentHeightInches}&quot;
          </span>
        </div>

        {/* Drag Helper Tip */}
        <div className="absolute top-4 right-4 flex items-center gap-1.5 bg-white/90 backdrop-blur-xs text-slate-700 px-2.5 py-1 rounded text-[11px] border border-slate-200 pointer-events-none shadow-2xs">
          <Move className="w-3 h-3 text-slate-500" />
          <span>Click & Drag artwork to position</span>
        </div>
      </div>
    </div>
  );
};
