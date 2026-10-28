import React, { useState } from 'react';
import { MerchProduct, LogoConfig, ProductColorway } from '../types/merch';

interface ProductCardProps {
  product: MerchProduct;
  selectedColorwayId: string;
  logo: LogoConfig;
  onSelect: (product: MerchProduct, colorway?: ProductColorway) => void;
  onOpenAiEdit: (product: MerchProduct) => void;
}

export const ProductCard: React.FC<ProductCardProps> = ({
  product,
  selectedColorwayId,
  logo,
  onSelect,
  onOpenAiEdit,
}) => {
  const [activeColorwayId, setActiveColorwayId] = useState(
    product.colorways.some((c) => c.id === selectedColorwayId)
      ? selectedColorwayId
      : product.colorways[0].id
  );

  const currentColorway =
    product.colorways.find((c) => c.id === activeColorwayId) || product.colorways[0];
  const defaultArea =
    product.printAreas.find((a) => a.id === product.defaultAreaId) || product.printAreas[0];

  return (
    <div className="group flex flex-col bg-white border border-slate-200/80 rounded-xl overflow-hidden shadow-xs hover:shadow-md transition-all duration-200 hover:-translate-y-0.5">
      {/* Product Image Area with Placed Logo Preview */}
      <div
        onClick={() => onSelect(product, currentColorway)}
        className="relative aspect-4/3 w-full bg-slate-100 overflow-hidden cursor-pointer"
      >
        <img
          src={product.image}
          alt={product.name}
          referrerPolicy="no-referrer"
          className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-102"
        />

        {/* Colorway fabric tint overlay */}
        {currentColorway.fabricOverlayRgba && (
          <div
            className="absolute inset-0 mix-blend-multiply pointer-events-none transition-colors duration-200"
            style={{ backgroundColor: currentColorway.fabricOverlayRgba }}
          />
        )}

        {/* Real-time logo placement overlay */}
        <div
          className="absolute pointer-events-none transition-all duration-200"
          style={{
            left: `${defaultArea.xPercent}%`,
            top: `${defaultArea.yPercent}%`,
            width: `${defaultArea.widthPercent}%`,
            height: `${defaultArea.heightPercent}%`,
          }}
        >
          <div
            className="w-full h-full flex items-center justify-center"
            style={{
              transform: `translate(${logo.xOffsetPercent}%, ${logo.yOffsetPercent}%) rotate(${logo.rotationDeg}deg) scale(${logo.scalePercent / 100})`,
              opacity: logo.opacity,
            }}
          >
            <img
              src={logo.dataUrl}
              alt="Logo Placement"
              referrerPolicy="no-referrer"
              className="max-w-full max-h-full object-contain filter drop-shadow-xs"
              style={{
                filter:
                  logo.colorTint && logo.colorTint !== '#ffffff'
                    ? `drop-shadow(0 0 0 ${logo.colorTint})`
                    : undefined,
              }}
            />
          </div>
        </div>

        {/* Quick action buttons on hover */}
        <div className="absolute inset-x-3 bottom-3 flex items-center justify-between opacity-0 group-hover:opacity-100 transition-opacity gap-2">
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onOpenAiEdit(product);
            }}
            className="px-3 py-1.5 text-xs font-semibold bg-white/95 backdrop-blur-xs text-slate-800 rounded-md hover:bg-white shadow-xs cursor-pointer transition-colors"
          >
            AI Scene / Edit
          </button>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onSelect(product, currentColorway);
            }}
            className="px-3 py-1.5 text-xs font-semibold bg-slate-900 text-white rounded-md hover:bg-slate-800 shadow-xs cursor-pointer transition-colors"
          >
            Customize
          </button>
        </div>
      </div>

      {/* Card Body */}
      <div className="p-4 flex flex-col flex-1 justify-between gap-3">
        <div>
          {/* Clean unboxed metadata with separators (Zero-Pill compliant) */}
          <div className="flex items-center gap-2 text-xs text-slate-500 mb-1">
            <span>{product.category}</span>
            <span aria-hidden="true">·</span>
            <span className="font-mono tabular-nums">{product.weightGsm} GSM</span>
            <span aria-hidden="true">·</span>
            <span>{product.printAreas.length} Print Zones</span>
          </div>

          <h3
            onClick={() => onSelect(product, currentColorway)}
            className="text-base font-semibold text-slate-900 hover:text-slate-700 cursor-pointer transition-colors"
          >
            {product.name}
          </h3>

          <p className="text-xs text-slate-600 line-clamp-2 mt-1 leading-relaxed">
            {product.description}
          </p>
        </div>

        {/* Interactive Colorway Swatches */}
        <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-xs text-slate-500">
          <div className="flex items-center gap-1.5">
            {product.colorways.map((c) => (
              <button
                key={c.id}
                type="button"
                title={`${c.name} - Click to preview`}
                onClick={(e) => {
                  e.stopPropagation();
                  setActiveColorwayId(c.id);
                }}
                className={`w-4 h-4 rounded-full border transition-transform cursor-pointer ${
                  c.id === currentColorway.id
                    ? 'border-slate-900 ring-2 ring-slate-900/40 scale-110 shadow-xs'
                    : 'border-slate-300 hover:scale-105'
                }`}
                style={{ backgroundColor: c.hex }}
              />
            ))}
            <span className="text-[11px] text-slate-600 ml-1 font-medium">{currentColorway.name}</span>
          </div>

          <span className="font-mono tabular-nums text-[11px] text-slate-500">
            {defaultArea.physicalWidthInches}&quot; × {defaultArea.physicalHeightInches}&quot; Max
          </span>
        </div>
      </div>
    </div>
  );
};
