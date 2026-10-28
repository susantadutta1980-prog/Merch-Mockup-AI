import React, { useState, useEffect } from 'react';
import type { User as FirebaseUser } from 'firebase/auth';
import {
  MerchProduct,
  ProductColorway,
  ProductSize,
  PrintArea,
  LogoConfig,
  MockupBackground,
  ProductType,
  VirtualLightingConfig,
  StudioPreset,
} from './types/merch';
import { MERCH_PRODUCTS, MOCKUP_BACKGROUNDS } from './data/products';
import { SAMPLE_LOGOS } from './data/sampleLogos';
import { useStudioHistory } from './hooks/useStudioHistory';
import { Header } from './components/Header';
import { ProductCard } from './components/ProductCard';
import { PlacementCanvas } from './components/PlacementCanvas';
import { LogoControls } from './components/LogoControls';
import { BackgroundSelector } from './components/BackgroundSelector';
import { AiStudioModal } from './components/AiStudioModal';
import { PrintReadyModal } from './components/PrintReadyModal';
import { PresetsModal } from './components/PresetsModal';
import { Sparkles, Download, Undo2, Redo2, Bookmark } from 'lucide-react';
import { generateCompositeMockupImage } from './utils/canvasExport';
import { subscribeToAuth, loginWithGoogle, logoutUser } from './lib/firebase';

export default function App() {
  // Navigation / View Tab
  const [activeTab, setActiveTab] = useState<'catalog' | 'placement' | 'ai-lab' | 'techpack'>('placement');

  // Selected Product Blank
  const [selectedProduct, setSelectedProduct] = useState<MerchProduct>(MERCH_PRODUCTS[0]);

  // Initial State definitions for Undo/Redo History Stack
  const initialLogoConfig: LogoConfig = {
    id: SAMPLE_LOGOS[0].id,
    name: SAMPLE_LOGOS[0].name,
    dataUrl: SAMPLE_LOGOS[0].svgDataUri,
    naturalWidth: 500,
    naturalHeight: 400,
    xOffsetPercent: 0,
    yOffsetPercent: 0,
    scalePercent: 95,
    rotationDeg: 0,
    opacity: 1,
    colorTint: null,
    removeBackground: false,
    printMethod: 'Screenprint Plastisol',
    blendMode: 'normal',
  };

  const initialLighting: VirtualLightingConfig = {
    intensity: 1.0,
    mood: 'studio-daylight',
    angleDeg: 25,
    shadowOpacity: 0.45,
    warmth: 0,
    ambientReflection: 0.25,
  };

  // Undo / Redo History Stack Management
  const {
    state: studioState,
    canUndo,
    canRedo,
    pastCount,
    futureCount,
    undo,
    redo,
    recordState,
    recordStateDebounced,
  } = useStudioHistory({
    logo: initialLogoConfig,
    lighting: initialLighting,
    selectedColorwayId: MERCH_PRODUCTS[0].colorways[0].id,
    selectedSizeId: MERCH_PRODUCTS[0].sizes[1].id,
    selectedAreaId: MERCH_PRODUCTS[0].printAreas[0].id,
    selectedBackgroundId: MOCKUP_BACKGROUNDS[0].id,
  });

  // Category filter for Catalog view
  const [catalogCategory, setCatalogCategory] = useState<ProductType | 'all'>('all');

  // Modals state
  const [isAiModalOpen, setIsAiModalOpen] = useState(false);
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  const [isPresetsModalOpen, setIsPresetsModalOpen] = useState(false);
  const [isAiBlending, setIsAiBlending] = useState(false);

  // Firebase Authentication State
  const [currentUser, setCurrentUser] = useState<FirebaseUser | null>(null);
  const [isAuthLoading, setIsAuthLoading] = useState(false);

  useEffect(() => {
    const unsubscribe = subscribeToAuth((user) => {
      setCurrentUser(user);
    });
    return () => unsubscribe();
  }, []);

  const handleLogin = async () => {
    try {
      setIsAuthLoading(true);
      await loginWithGoogle();
    } catch (err: any) {
      console.warn('Google sign-in error:', err);
    } finally {
      setIsAuthLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      await logoutUser();
    } catch (err) {
      console.error('Sign-out error:', err);
    }
  };

  // Derived current active selections from history state
  const logo = studioState.logo;
  const lighting = studioState.lighting;
  const selectedColorway =
    selectedProduct.colorways.find((c) => c.id === studioState.selectedColorwayId) ||
    selectedProduct.colorways[0];
  const selectedSize =
    selectedProduct.sizes.find((s) => s.id === studioState.selectedSizeId) ||
    selectedProduct.sizes[0];
  const selectedArea =
    selectedProduct.printAreas.find((a) => a.id === studioState.selectedAreaId) ||
    selectedProduct.printAreas[0];
  const selectedBackground =
    MOCKUP_BACKGROUNDS.find((b) => b.id === studioState.selectedBackgroundId) ||
    MOCKUP_BACKGROUNDS[0];

  // Updaters with history recording
  const handleUpdateLogo = (updater: (prev: LogoConfig) => LogoConfig) => {
    const nextLogo = updater(studioState.logo);
    recordStateDebounced({
      ...studioState,
      logo: nextLogo,
    });
  };

  const handleUpdateLighting = (
    updater: (prev: VirtualLightingConfig) => VirtualLightingConfig
  ) => {
    const nextLighting = updater(studioState.lighting);
    recordStateDebounced({
      ...studioState,
      lighting: nextLighting,
    });
  };

  const handleSelectColorway = (c: ProductColorway) => {
    recordState({
      ...studioState,
      selectedColorwayId: c.id,
    });
  };

  const handleSelectSize = (s: ProductSize) => {
    recordState({
      ...studioState,
      selectedSizeId: s.id,
    });
  };

  const handleSelectArea = (a: PrintArea) => {
    recordState({
      ...studioState,
      selectedAreaId: a.id,
    });
  };

  const handleSelectBackground = (bg: MockupBackground) => {
    recordState({
      ...studioState,
      selectedBackgroundId: bg.id,
    });
  };

  // Switch product helper
  const handleSelectProduct = (product: MerchProduct, colorway?: ProductColorway) => {
    setSelectedProduct(product);
    recordState({
      ...studioState,
      selectedColorwayId: colorway ? colorway.id : product.colorways[0].id,
      selectedSizeId: product.sizes[0].id,
      selectedAreaId: product.printAreas[0].id,
    });
    setActiveTab('placement');
  };

  // Apply a shared community preset or user saved configuration
  const handleApplyPreset = (preset: StudioPreset) => {
    // 1. Identify product from catalog
    const targetProduct =
      MERCH_PRODUCTS.find((p) => p.id === preset.config.productId) || selectedProduct;
    setSelectedProduct(targetProduct);

    // 2. Push full new state to undo/redo history stack so user can easily revert with ⌘Z
    recordState({
      logo: {
        ...studioState.logo,
        ...preset.config.logoPlacement,
      },
      lighting: { ...preset.config.lighting },
      selectedColorwayId: preset.config.colorwayId,
      selectedSizeId: preset.config.sizeId,
      selectedAreaId: preset.config.areaId,
      selectedBackgroundId: preset.config.backgroundId,
    });

    // 3. Switch to placement inspector view
    setActiveTab('placement');
  };

  // Trigger AI Smart Blend between product mockup & active background
  const handleTriggerAiSmartBlend = async () => {
    if (!selectedBackground.image) {
      alert('Please select a background scene first to use AI Smart Blend.');
      return;
    }
    setIsAiBlending(true);
    try {
      // 1. Render composite mockup image
      const mockupBase64 = await generateCompositeMockupImage(
        selectedProduct,
        selectedColorway.hex,
        selectedColorway.fabricOverlayRgba,
        selectedArea,
        logo,
        selectedBackground.image,
        lighting
      );

      // 2. Call server-side AI Blending endpoint
      const res = await fetch('/api/gemini/blend-mockup-background', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          productMockupBase64: mockupBase64,
          backgroundBase64: selectedBackground.image,
          lightingConfig: lighting,
          instructions: `Position the ${selectedProduct.name} in color ${selectedColorway.name} naturally in this setting with realistic contact shadows and ${lighting.mood} ambient light grading.`,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Failed to blend mockup into background.');
      }

      // Update the active product image with the blended version
      setSelectedProduct((prev) => ({
        ...prev,
        image: data.imageUrl,
      }));
      alert('AI Lighting and Shadow blend completed successfully!');
    } catch (err: any) {
      alert('AI Blend notice: ' + err.message);
    } finally {
      setIsAiBlending(false);
    }
  };

  // Filtered products for catalog tab
  const filteredProducts =
    catalogCategory === 'all'
      ? MERCH_PRODUCTS
      : MERCH_PRODUCTS.filter((p) => p.type === catalogCategory);

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col font-sans selection:bg-slate-900 selection:text-white">
      {/* 3-Zone Top Navigation Contract */}
      <Header
        activeTab={activeTab}
        onSelectTab={setActiveTab}
        onOpenExportModal={() => setIsExportModalOpen(true)}
        onOpenPresetsModal={() => setIsPresetsModalOpen(true)}
        user={currentUser}
        onLogin={handleLogin}
        onLogout={handleLogout}
        isAuthLoading={isAuthLoading}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 py-6 flex flex-col gap-6">
        {/* VIEW 1: PLACEMENT STUDIO & BACKGROUND INSPECTOR */}
        {activeTab === 'placement' && (
          <div className="flex flex-col gap-6">
            {/* Top Workspace Bar */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-200">
              <div className="flex items-center gap-4">
                <div>
                  <h1 className="text-xl font-bold tracking-tight text-slate-900">
                    Merch Mockup & Background Studio
                  </h1>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Position artwork, adjust virtual lighting, switch sizes, and revert changes with Undo/Redo.
                  </p>
                </div>

                {/* Global Undo / Redo & Presets Quick Controls */}
                <div className="hidden md:flex items-center gap-1.5 pl-4 border-l border-slate-200">
                  <button
                    type="button"
                    onClick={undo}
                    disabled={!canUndo}
                    title="Undo last adjustment (Ctrl+Z / ⌘Z)"
                    className="px-2.5 py-1 text-xs font-semibold rounded-md border border-slate-300 bg-white text-slate-700 hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors cursor-pointer flex items-center gap-1.5 shadow-2xs"
                  >
                    <Undo2 className="w-3.5 h-3.5" />
                    <span>Undo</span>
                    {pastCount > 0 && (
                      <span className="text-[10px] text-slate-400 font-mono">({pastCount})</span>
                    )}
                  </button>

                  <button
                    type="button"
                    onClick={redo}
                    disabled={!canRedo}
                    title="Redo adjustment (Ctrl+Y / ⌘⇧Z)"
                    className="px-2.5 py-1 text-xs font-semibold rounded-md border border-slate-300 bg-white text-slate-700 hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors cursor-pointer flex items-center gap-1.5 shadow-2xs"
                  >
                    <Redo2 className="w-3.5 h-3.5" />
                    <span>Redo</span>
                    {futureCount > 0 && (
                      <span className="text-[10px] text-slate-400 font-mono">({futureCount})</span>
                    )}
                  </button>

                  <button
                    type="button"
                    onClick={() => setIsPresetsModalOpen(true)}
                    title="Browse shared community templates or save custom preset"
                    className="ml-2 px-2.5 py-1 text-xs font-semibold rounded-md border border-indigo-200 bg-indigo-50/80 text-indigo-800 hover:bg-indigo-100 transition-colors cursor-pointer flex items-center gap-1.5 shadow-2xs"
                  >
                    <Bookmark className="w-3.5 h-3.5 text-indigo-600" />
                    <span>Presets & Templates</span>
                  </button>
                </div>
              </div>

              {/* Quick Product Switcher Tabs */}
              <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
                {MERCH_PRODUCTS.map((prod) => (
                  <button
                    key={prod.id}
                    onClick={() => handleSelectProduct(prod)}
                    className={`px-3 py-1.5 text-xs font-semibold rounded-lg whitespace-nowrap transition-colors cursor-pointer ${
                      selectedProduct.id === prod.id
                        ? 'bg-slate-900 text-white shadow-xs'
                        : 'bg-white text-slate-600 border border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    {prod.name.split(' ')[0]} {prod.type === 't-shirt' ? 'Tee' : prod.type}
                  </button>
                ))}
              </div>
            </div>

            {/* Split Grid: Canvas on Left (7 cols), Controls on Right (5 cols) */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
              {/* Left Column: Interactive Canvas & Background Switcher */}
              <div className="lg:col-span-7 flex flex-col gap-6">
                <PlacementCanvas
                  product={selectedProduct}
                  selectedColorway={selectedColorway}
                  selectedSize={selectedSize}
                  selectedArea={selectedArea}
                  selectedBackground={selectedBackground}
                  logo={logo}
                  lighting={lighting}
                  canUndo={canUndo}
                  canRedo={canRedo}
                  pastCount={pastCount}
                  futureCount={futureCount}
                  onUndo={undo}
                  onRedo={redo}
                  onChangeColorway={handleSelectColorway}
                  onChangeSize={handleSelectSize}
                  onChangeArea={handleSelectArea}
                  onChangeLogo={handleUpdateLogo}
                  onChangeLighting={handleUpdateLighting}
                  onOpenAiEdit={() => setIsAiModalOpen(true)}
                  onOpenExportModal={() => setIsExportModalOpen(true)}
                  onOpenPresetsModal={() => setIsPresetsModalOpen(true)}
                  onTriggerAiSmartBlend={handleTriggerAiSmartBlend}
                  isAiBlending={isAiBlending}
                />

                {/* Customizable Backgrounds & AI Scene Generator */}
                <BackgroundSelector
                  selectedBackground={selectedBackground}
                  lighting={lighting}
                  onSelectBackground={handleSelectBackground}
                  onAddCustomBackground={(bg) => handleSelectBackground(bg)}
                  onChangeLighting={handleUpdateLighting}
                  onTriggerAiSmartBlend={handleTriggerAiSmartBlend}
                  isAiBlending={isAiBlending}
                />
              </div>

              {/* Right Column: Logo Controls & Finishes */}
              <div className="lg:col-span-5 flex flex-col gap-6">
                <LogoControls
                  logo={logo}
                  onChangeLogo={handleUpdateLogo}
                  supportedMethods={selectedProduct.supportedMethods}
                />

                {/* Quick Spec Callout Card */}
                <div className="p-4 bg-white border border-slate-200 rounded-xl shadow-xs flex flex-col gap-2.5 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-900">Physical Size & Specs</span>
                    <span className="font-mono text-slate-500 font-semibold">{selectedSize.label}</span>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-slate-600 pt-1 border-t border-slate-100">
                    <div>
                      <span className="text-[11px] text-slate-400 block">Printable Zone:</span>
                      <span className="font-semibold text-slate-800">
                        {selectedSize.printWidthInches}&quot; × {selectedSize.printHeightInches}&quot;
                      </span>
                    </div>
                    <div>
                      <span className="text-[11px] text-slate-400 block">Fabric Weight:</span>
                      <span className="font-semibold text-slate-800">{selectedProduct.weightGsm} GSM</span>
                    </div>
                    <div>
                      <span className="text-[11px] text-slate-400 block">Colorway:</span>
                      <span className="font-semibold text-slate-800">{selectedColorway.name}</span>
                    </div>
                    <div>
                      <span className="text-[11px] text-slate-400 block">Lighting:</span>
                      <span className="font-semibold text-slate-800">{(lighting.intensity * 100).toFixed(0)}%</span>
                    </div>
                  </div>

                  <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
                    <button
                      onClick={() => setIsExportModalOpen(true)}
                      className="w-full py-2 px-3 bg-slate-900 hover:bg-slate-800 text-white font-semibold rounded-lg text-center transition-colors cursor-pointer shadow-xs"
                    >
                      Export Print-Ready 300 DPI File
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* VIEW 2: PRODUCT CATALOG GRID */}
        {activeTab === 'catalog' && (
          <div className="flex flex-col gap-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-3 border-b border-slate-200">
              <div>
                <h1 className="text-xl font-bold tracking-tight text-slate-900">
                  Merchandise Product Catalog
                </h1>
                <p className="text-xs text-slate-500 mt-0.5">
                  Browse heavyweight blanks, drinkware, and accessories. Click any color swatch to preview instantly.
                </p>
              </div>

              {/* Category Filters */}
              <div className="flex items-center gap-1.5 flex-wrap">
                {(
                  [
                    { id: 'all', label: 'All Products' },
                    { id: 't-shirt', label: 'T-Shirts' },
                    { id: 'hoodie', label: 'Hoodies' },
                    { id: 'mug', label: 'Mugs' },
                    { id: 'tote', label: 'Tote Bags' },
                    { id: 'cap', label: 'Caps' },
                  ] as const
                ).map((cat) => (
                  <button
                    key={cat.id}
                    onClick={() => setCatalogCategory(cat.id)}
                    className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors cursor-pointer ${
                      catalogCategory === cat.id
                        ? 'bg-slate-900 text-white shadow-xs'
                        : 'bg-white text-slate-600 border border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    {cat.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Product Cards Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredProducts.map((prod) => (
                <ProductCard
                  key={prod.id}
                  product={prod}
                  selectedColorwayId={selectedColorway.id}
                  logo={logo}
                  onSelect={(p, c) => {
                    handleSelectProduct(p, c);
                  }}
                  onOpenAiEdit={(p) => {
                    setSelectedProduct(p);
                    setIsAiModalOpen(true);
                  }}
                />
              ))}
            </div>
          </div>
        )}

        {/* VIEW 3: AI SCENE & EDIT LAB */}
        {activeTab === 'ai-lab' && (
          <div className="flex flex-col gap-6">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
              <div>
                <h1 className="text-xl font-bold tracking-tight text-slate-900 flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-amber-500" />
                  <span>AI Scene Studio & Text-Prompted Editor</span>
                </h1>
                <p className="text-xs text-slate-500 mt-0.5">
                  Generate photorealistic custom environments, photoshoot scenes, and text-prompted edits powered by <span className="font-mono font-medium text-slate-800">gemini-nano-banana-2.1</span>.
                </p>
              </div>

              <button
                onClick={() => setIsAiModalOpen(true)}
                className="px-4 py-2 bg-slate-900 text-white text-xs font-semibold rounded-lg hover:bg-slate-800 transition-colors cursor-pointer shadow-xs flex items-center gap-2"
              >
                <Sparkles className="w-4 h-4 text-amber-400" />
                <span>Open AI Prompt Editor</span>
              </button>
            </div>

            {/* AI Workspace cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="p-5 bg-white border border-slate-200 rounded-xl shadow-xs flex flex-col justify-between gap-4">
                <div>
                  <h3 className="text-sm font-bold text-slate-900 mb-1">
                    1. Text-to-Background Scenes
                  </h3>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    Describe any commercial photoshoot environment (&quot;minimalist desk setup with warm wood&quot;, &quot;coastal sunset deck&quot;) and Gemini generates a clean 8k background.
                  </p>
                </div>
                <button
                  onClick={() => {
                    setActiveTab('placement');
                  }}
                  className="px-3 py-2 text-xs font-semibold text-slate-800 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors cursor-pointer text-center"
                >
                  Configure Backgrounds
                </button>
              </div>

              <div className="p-5 bg-white border border-slate-200 rounded-xl shadow-xs flex flex-col justify-between gap-4">
                <div>
                  <h3 className="text-sm font-bold text-slate-900 mb-1">
                    2. AI Lighting & Shadow Blend
                  </h3>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    Multimodal synthesis integrates your product and artwork into chosen environments, matching specular rim lighting, directional contact shadows, and perspective depth.
                  </p>
                </div>
                <button
                  onClick={handleTriggerAiSmartBlend}
                  disabled={isAiBlending}
                  className="px-3 py-2 text-xs font-semibold text-amber-900 bg-amber-100 hover:bg-amber-200 rounded-lg transition-colors cursor-pointer text-center"
                >
                  {isAiBlending ? 'Blending...' : 'Run Smart Lighting Blend'}
                </button>
              </div>

              <div className="p-5 bg-white border border-slate-200 rounded-xl shadow-xs flex flex-col justify-between gap-4">
                <div>
                  <h3 className="text-sm font-bold text-slate-900 mb-1">
                    3. Text-Prompted Image Edits
                  </h3>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    Instruct Gemini to add vintage fabric distressing, wash fades, or shift atmospheric tones directly on the mockup.
                  </p>
                </div>
                <button
                  onClick={() => setIsAiModalOpen(true)}
                  className="px-3 py-2 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-lg transition-colors cursor-pointer text-center"
                >
                  Launch Editor Modal
                </button>
              </div>
            </div>

            {/* Current Active Mockup Preview in Scene */}
            <div className="p-6 bg-white border border-slate-200 rounded-xl shadow-xs flex flex-col gap-4">
              <span className="text-xs font-bold text-slate-800">Current Active Mockup Composition:</span>
              <div className="relative aspect-4/3 max-h-[500px] w-full bg-slate-900 rounded-xl overflow-hidden flex items-center justify-center">
                {selectedBackground.image && (
                  <img
                    src={selectedBackground.image}
                    alt={selectedBackground.name}
                    referrerPolicy="no-referrer"
                    className="absolute inset-0 w-full h-full object-cover"
                  />
                )}
                <img
                  src={selectedProduct.image}
                  alt={selectedProduct.name}
                  referrerPolicy="no-referrer"
                  className="relative max-w-full max-h-full object-contain filter drop-shadow-2xl"
                  style={{
                    filter: `brightness(${lighting.intensity}) saturate(${1 + lighting.warmth / 150}) drop-shadow(0 25px 35px rgba(0,0,0,0.5))`,
                  }}
                />
              </div>
            </div>
          </div>
        )}

        {/* VIEW 4: FACTORY TECH PACK SPEC SHEET */}
        {activeTab === 'techpack' && (
          <div className="flex flex-col gap-6">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
              <div>
                <h1 className="text-xl font-bold tracking-tight text-slate-900">
                  Manufacturing Tech Pack & Production Specs
                </h1>
                <p className="text-xs text-slate-500 mt-0.5">
                  Complete technical specification sheet ready to hand off to screenprinters, embroiderers, or garment factories.
                </p>
              </div>

              <button
                onClick={() => setIsExportModalOpen(true)}
                className="px-4 py-2 bg-slate-900 text-white text-xs font-semibold rounded-lg hover:bg-slate-800 transition-colors cursor-pointer shadow-xs flex items-center gap-2"
              >
                <Download className="w-4 h-4" />
                <span>Export 300 DPI Package</span>
              </button>
            </div>

            {/* Tech Pack Details Sheet */}
            <div className="p-6 bg-white border border-slate-200 rounded-xl shadow-xs flex flex-col gap-5 text-xs text-slate-800">
              <div className="flex items-center justify-between border-b border-slate-200 pb-4">
                <div>
                  <h2 className="text-base font-bold text-slate-900">
                    {selectedProduct.name.toUpperCase()} — PRODUCTION TECH PACK
                  </h2>
                  <span className="font-mono text-xs text-slate-500">
                    SKU: {selectedProduct.id.toUpperCase()} · SIZE: {selectedSize.label} · FABRIC: {selectedProduct.weightGsm} GSM
                  </span>
                </div>
                <span className="font-mono font-bold text-emerald-800 bg-emerald-100 px-3 py-1 rounded">
                  FACTORY APPROVED
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                <div className="flex flex-col gap-1.5 p-3.5 bg-slate-50 rounded-lg border border-slate-200">
                  <span className="text-[11px] font-semibold text-slate-500">DECORATION METHOD:</span>
                  <span className="text-sm font-bold text-slate-900">{logo.printMethod}</span>
                  <span className="text-[11px] text-slate-500 mt-1">
                    Cured at 320°F / plastisol or DTG pigment ink with heat press seal
                  </span>
                </div>

                <div className="flex flex-col gap-1.5 p-3.5 bg-slate-50 rounded-lg border border-slate-200">
                  <span className="text-[11px] font-semibold text-slate-500">PRINTABLE AREA:</span>
                  <span className="text-sm font-bold text-slate-900">
                    {selectedSize.printWidthInches}&quot; × {selectedSize.printHeightInches}&quot; (300 DPI)
                  </span>
                  <span className="text-[11px] text-slate-500 mt-1">
                    Centered on vertical chest axis, 3.0&quot; down from neckline collar seam
                  </span>
                </div>

                <div className="flex flex-col gap-1.5 p-3.5 bg-slate-50 rounded-lg border border-slate-200">
                  <span className="text-[11px] font-semibold text-slate-500">COLOR SPECIFICATIONS:</span>
                  <div className="flex items-center gap-2 mt-1">
                    <span
                      className="w-4 h-4 rounded-full border border-slate-400"
                      style={{ backgroundColor: selectedColorway.hex }}
                    />
                    <span className="font-mono font-semibold text-slate-900">
                      Garment: {selectedColorway.name} ({selectedColorway.hex})
                    </span>
                  </div>
                  <span className="text-[11px] text-slate-500">
                    Ink: {logo.colorTint || 'Original Art Colors'}
                  </span>
                </div>
              </div>

              <div className="pt-2 border-t border-slate-200">
                <span className="font-bold text-slate-900 block mb-1">Garment Material Specifications:</span>
                <p className="text-slate-600 leading-relaxed">{selectedProduct.fabricSpecs}</p>
              </div>

              <div className="pt-2 border-t border-slate-200 flex items-center justify-between">
                <span className="text-slate-500">
                  Ready to produce? Export the 300 DPI master file with crop marks.
                </span>
                <button
                  onClick={() => setIsExportModalOpen(true)}
                  className="px-4 py-2 bg-slate-900 text-white font-semibold rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
                >
                  Download Complete Factory Package
                </button>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* AI Studio & Text-to-Image Editor Modal */}
      <AiStudioModal
        isOpen={isAiModalOpen}
        onClose={() => setIsAiModalOpen(false)}
        product={selectedProduct}
        logo={logo}
        currentMockupDataUrl={selectedProduct.image}
        onApplyNewMockupBase={(newImg) => {
          setSelectedProduct((prev) => ({
            ...prev,
            image: newImg,
          }));
        }}
      />

      {/* Print-Ready Export & Tech Pack Modal */}
      <PrintReadyModal
        isOpen={isExportModalOpen}
        onClose={() => setIsExportModalOpen(false)}
        product={selectedProduct}
        selectedColorway={selectedColorway}
        selectedSize={selectedSize}
        selectedArea={selectedArea}
        selectedBackground={selectedBackground}
        logo={logo}
        lighting={lighting}
      />

      {/* Studio Presets & Community Templates Modal */}
      <PresetsModal
        isOpen={isPresetsModalOpen}
        onClose={() => setIsPresetsModalOpen(false)}
        currentProduct={selectedProduct}
        currentColorway={selectedColorway}
        currentSize={selectedSize}
        currentArea={selectedArea}
        currentBackground={selectedBackground}
        currentLogo={logo}
        currentLighting={lighting}
        onApplyPreset={handleApplyPreset}
        user={currentUser}
      />
    </div>
  );
}
