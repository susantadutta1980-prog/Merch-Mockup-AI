export type PrintMethod =
  | 'Screenprint Plastisol'
  | 'Direct-to-Garment (DTG)'
  | '3D Heavy Embroidery'
  | 'Metallic Foil Stamp'
  | 'Vintage Distressed Wash';

export type ProductType = 't-shirt' | 'hoodie' | 'mug' | 'tote' | 'cap';

export interface ProductColorway {
  id: string;
  name: string;
  hex: string;
  fabricOverlayRgba: string;
}

export interface ProductSize {
  id: string;
  label: string; // e.g. "S", "M", "L", "XL", "12 oz"
  name: string; // e.g. "Medium", "12 oz Artisan"
  chestWidthInches?: number;
  bodyLengthInches?: number;
  printWidthInches: number;
  printHeightInches: number;
}

export interface PrintArea {
  id: string;
  name: string;
  // Bounding box in percentage of product image (0-100)
  xPercent: number;
  yPercent: number;
  widthPercent: number;
  heightPercent: number;
  // Physical dimensions for tech pack
  physicalWidthInches: number;
  physicalHeightInches: number;
  recommendedDpi: number;
  maxColors?: number;
}

export interface MerchProduct {
  id: string;
  name: string;
  category: string;
  type: ProductType;
  image: string;
  description: string;
  fabricSpecs: string;
  weightGsm: number;
  sizes: ProductSize[];
  colorways: ProductColorway[];
  printAreas: PrintArea[];
  defaultAreaId: string;
  supportedMethods: PrintMethod[];
  curveDisplacement?: 'none' | 'cylinder' | 'spherical';
}

export type BackgroundCategory = 'studio' | 'lifestyle' | 'abstract' | 'outdoor' | 'custom';

export interface MockupBackground {
  id: string;
  name: string;
  category: BackgroundCategory;
  image: string;
  description: string;
  lightingTone?: 'warm' | 'cool' | 'neutral' | 'dramatic';
}

export type LightingMood =
  | 'studio-daylight'
  | 'golden-hour'
  | 'moody-twilight'
  | 'commercial-strobe'
  | 'vintage-film'
  | 'overcast-soft';

export interface VirtualLightingConfig {
  intensity: number; // 0.4 to 1.8 (default 1.0)
  mood: LightingMood;
  angleDeg: number; // -90 (left) to 90 (right), default 25
  shadowOpacity: number; // 0 to 1, default 0.45
  warmth: number; // -50 (cool blue) to 50 (warm amber), default 0
  ambientReflection: number; // 0 to 1, default 0.25
}

export interface LogoConfig {
  id: string;
  name: string;
  dataUrl: string; // Base64 or SVG data URI
  naturalWidth: number;
  naturalHeight: number;
  // Placement transform
  xOffsetPercent: number; // -50 to +50 relative to print area center
  yOffsetPercent: number;
  scalePercent: number; // 20 to 200
  rotationDeg: number; // -180 to 180
  opacity: number; // 0 to 1
  colorTint: string | null; // Hex or null for original
  removeBackground: boolean;
  printMethod: PrintMethod;
  blendMode: 'normal' | 'multiply' | 'screen' | 'overlay';
}

export interface StudioPresetConfig {
  productId: string;
  colorwayId: string;
  sizeId: string;
  areaId: string;
  backgroundId: string;
  logoPlacement: {
    xOffsetPercent: number;
    yOffsetPercent: number;
    scalePercent: number;
    rotationDeg: number;
    opacity: number;
    colorTint: string | null;
    printMethod: PrintMethod;
  };
  lighting: VirtualLightingConfig;
}

export interface StudioPreset {
  id: string;
  name: string;
  description: string;
  author: string;
  isCustom?: boolean;
  createdAt: number;
  tags: string[];
  config: StudioPresetConfig;
}

export interface TechPackSpec {
  jobId: string;
  productName: string;
  selectedSize: string;
  colorwayName: string;
  printAreaName: string;
  physicalDimensions: string;
  resolutionPx: string;
  printMethod: PrintMethod;
  pantoneApproximations: string[];
  fabricSpec: string;
  careInstructions: string[];
  placementOffset: string;
  dateCreated: string;
}

export interface AiGenerationResult {
  id: string;
  imageUrl: string;
  prompt: string;
  modelUsed: string;
  timestamp: number;
  type: 'scene' | 'edit' | 'background';
}
