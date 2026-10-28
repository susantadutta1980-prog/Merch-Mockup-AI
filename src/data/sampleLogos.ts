// Clean, high-contrast SVG sample logos for instant testing
export interface SampleLogoItem {
  id: string;
  name: string;
  category: string;
  svgDataUri: string;
}

// 1. Heritage Arch Apparel Logo
const heritageArchSvg = `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 500 400" width="500" height="400">
  <defs>
    <path id="curveTop" d="M 50,180 A 200,90 0 0,1 450,180" fill="none" />
  </defs>
  <!-- Main Arch Text -->
  <text font-family="'Plus Jakarta Sans', sans-serif" font-weight="800" font-size="44" fill="#ffffff" letter-spacing="4">
    <textPath href="#curveTop" startOffset="50%" text-anchor="middle">
      ATELIER ARCHIVE
    </textPath>
  </text>
  <!-- Laurel / Emblem center -->
  <circle cx="250" cy="235" r="42" fill="none" stroke="#ffffff" stroke-width="4" stroke-dasharray="6,4" />
  <polygon points="250,210 260,230 282,232 265,248 270,270 250,258 230,270 235,248 218,232 240,230" fill="#ffffff" />
  <!-- Subtitle -->
  <text x="250" y="315" font-family="'JetBrains Mono', monospace" font-size="14" font-weight="600" fill="#e2e8f0" letter-spacing="6" text-anchor="middle">
    EST. 1994 · TOKYO / NYC
  </text>
  <text x="250" y="345" font-family="'Plus Jakarta Sans', sans-serif" font-size="12" font-weight="500" fill="#cbd5e1" letter-spacing="2" text-anchor="middle">
    STANDARD LUXURY HEAVYWEIGHT
  </text>
</svg>
`.trim();

// 2. Cyber Kinetic Geometric Wordmark & Glyph
const kineticGeometricSvg = `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 500 300" width="500" height="300">
  <g transform="translate(250, 110)">
    <!-- Geometric Hexagon Polygon Icon -->
    <polygon points="0,-55 48,-27 48,27 0,55 -48,27 -48,-27" fill="none" stroke="#ffffff" stroke-width="6" />
    <polygon points="0,-32 28,-16 28,16 0,32 -28,16 -28,-16" fill="#ffffff" />
    <line x1="-70" y1="0" x2="-55" y2="0" stroke="#ffffff" stroke-width="4" />
    <line x1="55" y1="0" x2="70" y2="0" stroke="#ffffff" stroke-width="4" />
  </g>
  <text x="250" y="215" font-family="'Plus Jakarta Sans', sans-serif" font-weight="900" font-size="34" fill="#ffffff" letter-spacing="6" text-anchor="middle">
    KINETIC LABS
  </text>
  <text x="250" y="248" font-family="'JetBrains Mono', monospace" font-size="12" font-weight="600" fill="#94a3b8" letter-spacing="4" text-anchor="middle">
    AUTONOMOUS SYSTEMS // 09
  </text>
</svg>
`.trim();

// 3. Solis Botanica Luxury Serif Crest
const solisBotanicaSvg = `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 500 380" width="500" height="380">
  <circle cx="250" cy="140" r="60" fill="none" stroke="#ffffff" stroke-width="2.5" />
  <circle cx="250" cy="140" r="50" fill="none" stroke="#ffffff" stroke-width="1" />
  <!-- Radiant Sunburst lines -->
  <g stroke="#ffffff" stroke-width="2" stroke-linecap="round">
    <line x1="250" y1="65" x2="250" y2="52" />
    <line x1="250" y1="215" x2="250" y2="228" />
    <line x1="175" y1="140" x2="162" y2="140" />
    <line x1="325" y1="140" x2="338" y2="140" />
    <line x1="197" y1="87" x2="188" y2="78" />
    <line x1="303" y1="193" x2="312" y2="202" />
    <line x1="197" y1="193" x2="188" y2="202" />
    <line x1="303" y1="87" x2="312" y2="78" />
  </g>
  <!-- Botanical leaves icon in center -->
  <path d="M 250,110 C 270,125 270,150 250,165 C 230,150 230,125 250,110 Z" fill="#ffffff" />
  <text x="250" y="270" font-family="serif" font-weight="700" font-size="36" fill="#ffffff" letter-spacing="8" text-anchor="middle">
    SOLIS BOTANICA
  </text>
  <text x="250" y="305" font-family="'Plus Jakarta Sans', sans-serif" font-size="13" font-weight="500" fill="#cbd5e1" letter-spacing="5" text-anchor="middle">
    ORGANIC ROASTERY & CO.
  </text>
</svg>
`.trim();

// 4. Brutalist Soundwaves Logo
const soundwaveSvg = `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 500 280" width="500" height="280">
  <g transform="translate(140, 60)" fill="#ffffff">
    <rect x="0" y="35" width="8" height="30" rx="3" />
    <rect x="18" y="20" width="8" height="60" rx="3" />
    <rect x="36" y="5" width="8" height="90" rx="3" />
    <rect x="54" y="25" width="8" height="50" rx="3" />
    <rect x="72" y="0" width="8" height="100" rx="3" />
    <rect x="90" y="15" width="8" height="70" rx="3" />
    <rect x="108" y="30" width="8" height="40" rx="3" />
    <rect x="126" y="10" width="8" height="80" rx="3" />
    <rect x="144" y="28" width="8" height="44" rx="3" />
    <rect x="162" y="2" width="8" height="96" rx="3" />
    <rect x="180" y="22" width="8" height="56" rx="3" />
    <rect x="198" y="38" width="8" height="24" rx="3" />
  </g>
  <text x="250" y="205" font-family="'JetBrains Mono', monospace" font-weight="700" font-size="28" fill="#ffffff" letter-spacing="6" text-anchor="middle">
    MONO AUDIO LABS
  </text>
  <text x="250" y="235" font-family="'Plus Jakarta Sans', sans-serif" font-size="11" font-weight="600" fill="#94a3b8" letter-spacing="3" text-anchor="middle">
    FREQUENCY CALIBRATED MERCHANDISE
  </text>
</svg>
`.trim();

export const SAMPLE_LOGOS: SampleLogoItem[] = [
  {
    id: 'heritage-arch',
    name: 'Atelier Archive (Heritage Arch)',
    category: 'Vintage Apparel',
    svgDataUri: `data:image/svg+xml;utf8,${encodeURIComponent(heritageArchSvg)}`,
  },
  {
    id: 'kinetic-labs',
    name: 'Kinetic Labs (Modern Geometric)',
    category: 'Streetwear / Tech',
    svgDataUri: `data:image/svg+xml;utf8,${encodeURIComponent(kineticGeometricSvg)}`,
  },
  {
    id: 'solis-botanica',
    name: 'Solis Botanica (Luxury Crest)',
    category: 'Artisanal / Lifestyle',
    svgDataUri: `data:image/svg+xml;utf8,${encodeURIComponent(solisBotanicaSvg)}`,
  },
  {
    id: 'soundwave-labs',
    name: 'Mono Audio (Brutalist Soundwave)',
    category: 'Music / Audio',
    svgDataUri: `data:image/svg+xml;utf8,${encodeURIComponent(soundwaveSvg)}`,
  },
];
