import React, { useState } from 'react';
import {
  MerchProduct,
  PrintArea,
  LogoConfig,
  ProductColorway,
  ProductSize,
  MockupBackground,
  TechPackSpec,
  VirtualLightingConfig,
} from '../types/merch';
import { MERCH_PRODUCTS } from '../data/products';
import {
  generatePrintReadyMasterFile,
  generateCompositeMockupImage,
  downloadDataUrl,
} from '../utils/canvasExport';
import { Download, FileText, Check, X, Printer, Layers, RefreshCw } from 'lucide-react';

interface PrintReadyModalProps {
  isOpen: boolean;
  onClose: () => void;
  product: MerchProduct;
  selectedColorway: ProductColorway;
  selectedSize: ProductSize;
  selectedArea: PrintArea;
  selectedBackground: MockupBackground;
  logo: LogoConfig;
  lighting?: VirtualLightingConfig;
}

export const PrintReadyModal: React.FC<PrintReadyModalProps> = ({
  isOpen,
  onClose,
  product,
  selectedColorway,
  selectedSize,
  selectedArea,
  selectedBackground,
  logo,
  lighting,
}) => {
  const [activeTab, setActiveTab] = useState<'master' | 'mockup' | 'techpack' | 'batch'>('master');
  const [includeCropMarks, setIncludeCropMarks] = useState(true);
  const [isExporting, setIsExporting] = useState(false);
  const [batchProgress, setBatchProgress] = useState<number | null>(null);

  if (!isOpen) return null;

  const dpi = selectedArea.recommendedDpi || 300;
  const scaleFraction = logo.scalePercent / 100;
  const printWidthInches = (selectedSize.printWidthInches * scaleFraction).toFixed(2);
  const printHeightInches = (selectedSize.printHeightInches * scaleFraction).toFixed(2);
  const printWidthCm = (parseFloat(printWidthInches) * 2.54).toFixed(1);
  const printHeightCm = (parseFloat(printHeightInches) * 2.54).toFixed(1);
  const printWidthPx = Math.round(parseFloat(printWidthInches) * dpi);
  const printHeightPx = Math.round(parseFloat(printHeightInches) * dpi);

  // Generate and download 300 DPI master production file
  const handleExportMaster = async () => {
    setIsExporting(true);
    try {
      const dataUrl = await generatePrintReadyMasterFile(
        product,
        selectedArea,
        logo,
        includeCropMarks
      );
      const filename = `MASTER-300DPI-${product.type}-${selectedSize.label}-${Date.now()}.png`;
      downloadDataUrl(dataUrl, filename);
    } catch (err: any) {
      alert('Error generating master print file: ' + err.message);
    } finally {
      setIsExporting(false);
    }
  };

  // Generate and download composite presentation mockup
  const handleExportMockup = async () => {
    setIsExporting(true);
    try {
      const dataUrl = await generateCompositeMockupImage(
        product,
        selectedColorway.hex,
        selectedColorway.fabricOverlayRgba,
        selectedArea,
        logo,
        selectedBackground.image,
        lighting
      );
      const filename = `MOCKUP-STUDIO-${product.type}-${selectedColorway.id}-${selectedSize.label}.jpg`;
      downloadDataUrl(dataUrl, filename);
    } catch (err: any) {
      alert('Error exporting mockup image: ' + err.message);
    } finally {
      setIsExporting(false);
    }
  };

  // Batch Export all 5 core products
  const handleBatchExport = async () => {
    setIsExporting(true);
    setBatchProgress(0);

    try {
      for (let i = 0; i < MERCH_PRODUCTS.length; i++) {
        const p = MERCH_PRODUCTS[i];
        const area = p.printAreas[0];
        const colorway = p.colorways[0];
        const dataUrl = await generateCompositeMockupImage(
          p,
          colorway.hex,
          colorway.fabricOverlayRgba,
          area,
          logo
        );
        downloadDataUrl(dataUrl, `MOCKUP-${p.id}-${colorway.id}.jpg`);
        setBatchProgress(Math.round(((i + 1) / MERCH_PRODUCTS.length) * 100));
        await new Promise((r) => setTimeout(r, 350));
      }
    } catch (err: any) {
      alert('Batch export error: ' + err.message);
    } finally {
      setIsExporting(false);
      setBatchProgress(null);
    }
  };

  // Build Tech Pack data
  const techPack: TechPackSpec = {
    jobId: `JOB-${new Date().getFullYear()}-${Math.floor(Math.random() * 8999 + 1000)}`,
    productName: product.name,
    selectedSize: `${selectedSize.name} (${selectedSize.label})`,
    colorwayName: selectedColorway.name,
    printAreaName: selectedArea.name,
    physicalDimensions: `${printWidthInches}" W × ${printHeightInches}" H (${printWidthCm} × ${printHeightCm} cm)`,
    resolutionPx: `${printWidthPx} × ${printHeightPx} px @ ${dpi} DPI`,
    printMethod: logo.printMethod,
    pantoneApproximations: [
      logo.colorTint || '#FFFFFF',
      selectedColorway.hex,
      'PMS 000C Neutral Baseline',
    ],
    fabricSpec: product.fabricSpecs,
    careInstructions: [
      'Machine wash cold inside-out with like colors',
      'Gentle cycle, do not use fabric softeners or bleach',
      'Tumble dry low or hang dry for longevity',
      'Cool iron on reverse side; never iron directly over decoration',
    ],
    placementOffset: `Offset X: ${logo.xOffsetPercent}%, Offset Y: ${logo.yOffsetPercent}%, Rotation: ${logo.rotationDeg}°`,
    dateCreated: new Date().toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    }),
  };

  // Download Tech Pack JSON
  const handleDownloadTechPackJson = () => {
    const dataStr =
      'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(techPack, null, 2));
    downloadDataUrl(dataStr, `TECHPACK-${product.id}-${techPack.jobId}.json`);
  };

  // Print Tech Pack
  const handlePrintTechPack = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl max-w-3xl w-full max-h-[92vh] flex flex-col shadow-2xl border border-slate-200 overflow-hidden">
        {/* Modal Top Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200">
          <div>
            <h2 className="text-base font-bold text-slate-900">
              Print-Ready Export & Manufacturing Tech Pack
            </h2>
            <p className="text-xs text-slate-500">
              {product.name} · Size: {selectedSize.label} · Color: {selectedColorway.name}
            </p>
          </div>

          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Controls */}
        <div className="flex border-b border-slate-200 bg-slate-50/60 px-6 pt-3 gap-2">
          <button
            onClick={() => setActiveTab('master')}
            className={`py-2 px-3 text-xs font-semibold rounded-t-lg transition-colors cursor-pointer ${
              activeTab === 'master'
                ? 'bg-white border-t border-x border-slate-200 text-slate-900 -mb-px'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            300 DPI Master Print File
          </button>
          <button
            onClick={() => setActiveTab('mockup')}
            className={`py-2 px-3 text-xs font-semibold rounded-t-lg transition-colors cursor-pointer ${
              activeTab === 'mockup'
                ? 'bg-white border-t border-x border-slate-200 text-slate-900 -mb-px'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Presentation Mockup
          </button>
          <button
            onClick={() => setActiveTab('techpack')}
            className={`py-2 px-3 text-xs font-semibold rounded-t-lg transition-colors cursor-pointer ${
              activeTab === 'techpack'
                ? 'bg-white border-t border-x border-slate-200 text-slate-900 -mb-px'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Factory Tech Pack
          </button>
          <button
            onClick={() => setActiveTab('batch')}
            className={`py-2 px-3 text-xs font-semibold rounded-t-lg transition-colors cursor-pointer ${
              activeTab === 'batch'
                ? 'bg-white border-t border-x border-slate-200 text-slate-900 -mb-px'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Batch All Products
          </button>
        </div>

        {/* Tab Content */}
        <div className="p-6 flex-1 overflow-y-auto">
          {/* TAB 1: MASTER PRODUCTION FILE */}
          {activeTab === 'master' && (
            <div className="flex flex-col gap-5 text-xs">
              <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl flex flex-col gap-3">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-900 text-sm">
                    High-Resolution Master File Specifications
                  </span>
                  <span className="font-mono bg-emerald-100 text-emerald-800 font-bold px-2 py-0.5 rounded text-[11px]">
                    300 DPI TRUE PRINT
                  </span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs pt-1 border-t border-slate-200">
                  <div>
                    <span className="text-slate-500 block text-[11px]">Output Resolution:</span>
                    <span className="font-mono font-semibold text-slate-800">
                      {printWidthPx} × {printHeightPx} px
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-500 block text-[11px]">Physical Dimensions:</span>
                    <span className="font-mono font-semibold text-slate-800">
                      {printWidthInches}&quot; × {printHeightInches}&quot;
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-500 block text-[11px]">Metric Dimension:</span>
                    <span className="font-mono font-semibold text-slate-800">
                      {printWidthCm} × {printHeightCm} cm
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-500 block text-[11px]">Print Method:</span>
                    <span className="font-semibold text-slate-800">{logo.printMethod}</span>
                  </div>
                </div>
              </div>

              {/* Crop mark toggle */}
              <label className="flex items-center gap-3 p-3 bg-white border border-slate-200 rounded-lg cursor-pointer hover:bg-slate-50">
                <input
                  type="checkbox"
                  checked={includeCropMarks}
                  onChange={(e) => setIncludeCropMarks(e.target.checked)}
                  className="rounded accent-slate-900 cursor-pointer w-4 h-4"
                />
                <div className="flex flex-col">
                  <span className="font-semibold text-slate-800">
                    Include Registration Crosshairs, Corner Crop Marks & Job Slug
                  </span>
                  <span className="text-[11px] text-slate-500">
                    Recommended for screenprinting film positives and color calibration
                  </span>
                </div>
              </label>

              <button
                onClick={handleExportMaster}
                disabled={isExporting}
                className="py-3 px-4 bg-slate-900 hover:bg-slate-800 text-white font-semibold rounded-xl flex items-center justify-center gap-2 cursor-pointer shadow-md transition-all active:scale-98 disabled:opacity-50"
              >
                {isExporting ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Rendering 300 DPI Canvas...</span>
                  </>
                ) : (
                  <>
                    <Download className="w-4 h-4" />
                    <span>Download Production Master PNG (300 DPI)</span>
                  </>
                )}
              </button>
            </div>
          )}

          {/* TAB 2: PRESENTATION MOCKUP */}
          {activeTab === 'mockup' && (
            <div className="flex flex-col gap-4 text-xs">
              <p className="text-slate-600">
                Download a high-resolution clean photographic mockup composite of {product.name} in{' '}
                <span className="font-semibold">{selectedColorway.name}</span> with your artwork
                blended into the scene for client approvals, lookbooks, and online stores.
              </p>

              <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl flex items-center gap-4">
                <div className="w-20 h-20 bg-slate-200 rounded-lg overflow-hidden shrink-0 border border-slate-300">
                  <img
                    src={product.image}
                    alt={product.name}
                    referrerPolicy="no-referrer"
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-bold text-slate-900 text-sm">{product.name}</div>
                  <div className="text-slate-500 text-[11px]">
                    Garment Size: {selectedSize.name} · Color: {selectedColorway.name}
                  </div>
                  <div className="text-slate-500 text-[11px]">
                    Environment: {selectedBackground.name}
                  </div>
                </div>
              </div>

              <button
                onClick={handleExportMockup}
                disabled={isExporting}
                className="py-3 px-4 bg-slate-900 hover:bg-slate-800 text-white font-semibold rounded-xl flex items-center justify-center gap-2 cursor-pointer shadow-md transition-all active:scale-98 disabled:opacity-50"
              >
                {isExporting ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Generating Mockup...</span>
                  </>
                ) : (
                  <>
                    <Download className="w-4 h-4" />
                    <span>Download Lookbook Mockup (JPEG)</span>
                  </>
                )}
              </button>
            </div>
          )}

          {/* TAB 3: FACTORY TECH PACK SPEC SHEET */}
          {activeTab === 'techpack' && (
            <div className="flex flex-col gap-4 text-xs">
              <div className="flex items-center justify-between pb-2 border-b border-slate-200">
                <span className="text-slate-600">
                  Official Manufacturing Specification Document
                </span>
                <div className="flex items-center gap-2">
                  <button
                    onClick={handleDownloadTechPackJson}
                    className="px-2.5 py-1 text-slate-700 bg-white border border-slate-300 rounded hover:bg-slate-100 flex items-center gap-1 cursor-pointer"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>JSON</span>
                  </button>
                  <button
                    onClick={handlePrintTechPack}
                    className="px-2.5 py-1 text-white bg-slate-900 rounded hover:bg-slate-800 flex items-center gap-1 cursor-pointer"
                  >
                    <Printer className="w-3.5 h-3.5" />
                    <span>Print PDF</span>
                  </button>
                </div>
              </div>

              {/* Printable Spec Sheet Sheet */}
              <div className="p-5 bg-white border border-slate-300 rounded-xl flex flex-col gap-4 text-slate-800 font-sans shadow-2xs">
                {/* Header */}
                <div className="flex items-center justify-between border-b border-slate-200 pb-3">
                  <div>
                    <h3 className="text-sm font-bold tracking-tight text-slate-900">
                      ATELIER MERCH STUDIO — TECH PACK
                    </h3>
                    <span className="font-mono text-[11px] text-slate-500">
                      JOB NO: {techPack.jobId} · DATE: {techPack.dateCreated}
                    </span>
                  </div>
                  <span className="font-mono text-xs font-bold text-slate-900 bg-slate-100 px-2.5 py-1 rounded">
                    APPROVED SPEC
                  </span>
                </div>

                {/* Grid of specs */}
                <div className="grid grid-cols-2 gap-4 text-xs">
                  <div>
                    <span className="font-semibold text-slate-500 block text-[11px]">
                      PRODUCT CATEGORY:
                    </span>
                    <span className="font-medium text-slate-900">{techPack.productName}</span>
                  </div>

                  <div>
                    <span className="font-semibold text-slate-500 block text-[11px]">
                      ORDERED SIZE:
                    </span>
                    <span className="font-medium text-slate-900">{techPack.selectedSize}</span>
                  </div>

                  <div>
                    <span className="font-semibold text-slate-500 block text-[11px]">
                      COLORWAY & HEX:
                    </span>
                    <div className="flex items-center gap-1.5">
                      <span
                        className="w-3 h-3 rounded-full border border-slate-400"
                        style={{ backgroundColor: selectedColorway.hex }}
                      />
                      <span className="font-mono text-slate-900">
                        {techPack.colorwayName} ({selectedColorway.hex})
                      </span>
                    </div>
                  </div>

                  <div>
                    <span className="font-semibold text-slate-500 block text-[11px]">
                      DECORATION METHOD:
                    </span>
                    <span className="font-semibold text-slate-900">{techPack.printMethod}</span>
                  </div>

                  <div>
                    <span className="font-semibold text-slate-500 block text-[11px]">
                      PRINT ZONE & SIZING:
                    </span>
                    <span className="font-mono font-medium text-slate-900">
                      {techPack.printAreaName} — {techPack.physicalDimensions}
                    </span>
                  </div>

                  <div>
                    <span className="font-semibold text-slate-500 block text-[11px]">
                      PLACEMENT INSTRUCTIONS:
                    </span>
                    <span className="font-mono text-slate-700">{techPack.placementOffset}</span>
                  </div>
                </div>

                {/* Fabric Specifications */}
                <div className="pt-2 border-t border-slate-200">
                  <span className="font-semibold text-slate-500 block text-[11px]">
                    FABRIC & MATERIAL COMPOSITION:
                  </span>
                  <span className="text-slate-800">{techPack.fabricSpec}</span>
                </div>

                {/* Care instructions */}
                <div className="pt-2 border-t border-slate-200">
                  <span className="font-semibold text-slate-500 block text-[11px] mb-1">
                    MANUFACTURER CARE INSTRUCTIONS:
                  </span>
                  <ul className="list-disc list-inside text-[11px] text-slate-600 space-y-0.5">
                    {techPack.careInstructions.map((c, i) => (
                      <li key={i}>{c}</li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: BATCH ALL PRODUCTS */}
          {activeTab === 'batch' && (
            <div className="flex flex-col gap-4 text-xs">
              <p className="text-slate-600">
                1-Click Export: Automatically render and download mockups for all 5 merchandise
                products (Boxy Tee, Heavy Hoodie, Ceramic Mug, Canvas Tote, Dad Cap) with your
                active artwork.
              </p>

              <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between">
                <div>
                  <span className="font-bold text-slate-900 block text-sm">5 Core Products</span>
                  <span className="text-[11px] text-slate-500">
                    High-resolution 1600 × 1200 px lookbook previews
                  </span>
                </div>
                <Layers className="w-6 h-6 text-slate-400" />
              </div>

              {batchProgress !== null && (
                <div className="flex flex-col gap-1.5">
                  <div className="flex justify-between text-[11px] text-slate-600 font-mono">
                    <span>Exporting Mockup Assets...</span>
                    <span>{batchProgress}%</span>
                  </div>
                  <div className="w-full bg-slate-200 rounded-full h-2 overflow-hidden">
                    <div
                      className="bg-slate-900 h-full transition-all duration-300"
                      style={{ width: `${batchProgress}%` }}
                    />
                  </div>
                </div>
              )}

              <button
                onClick={handleBatchExport}
                disabled={isExporting}
                className="py-3 px-4 bg-slate-900 hover:bg-slate-800 text-white font-semibold rounded-xl flex items-center justify-center gap-2 cursor-pointer shadow-md transition-all active:scale-98 disabled:opacity-50"
              >
                {isExporting ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Processing Batch Exports...</span>
                  </>
                ) : (
                  <>
                    <Download className="w-4 h-4" />
                    <span>Download All 5 Product Mockups</span>
                  </>
                )}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
