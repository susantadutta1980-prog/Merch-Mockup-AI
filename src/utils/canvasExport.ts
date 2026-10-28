import {
  MerchProduct,
  PrintArea,
  LogoConfig,
  TechPackSpec,
  VirtualLightingConfig,
  ProductSize,
} from '../types/merch';

/**
 * Generates a true 300 DPI Print-Ready master PNG with registration marks and technical slug
 */
export async function generatePrintReadyMasterFile(
  product: MerchProduct,
  area: PrintArea,
  logo: LogoConfig,
  includeCropMarks: boolean = true
): Promise<string> {
  const dpi = area.recommendedDpi || 300;
  const targetWidthPx = Math.round(area.physicalWidthInches * dpi);
  const targetHeightPx = Math.round(area.physicalHeightInches * dpi);

  // Margin for crop marks and slug
  const marginPx = includeCropMarks ? 180 : 0;
  const canvasWidth = targetWidthPx + marginPx * 2;
  const canvasHeight = targetHeightPx + marginPx * 2;

  const canvas = document.createElement('canvas');
  canvas.width = canvasWidth;
  canvas.height = canvasHeight;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Could not create 2D canvas context');

  // Transparent background for true print production
  ctx.clearRect(0, 0, canvasWidth, canvasHeight);

  // If crop marks requested, draw registration crosshairs and job slug
  if (includeCropMarks) {
    drawCropMarksAndSlug(ctx, marginPx, targetWidthPx, targetHeightPx, product, area, logo);
  }

  // Draw the logo inside the printable bounds
  const img = new Image();
  img.crossOrigin = 'anonymous';

  await new Promise<void>((resolve, reject) => {
    img.onload = () => resolve();
    img.onerror = (e) => reject(new Error('Failed to load artwork image for export: ' + e));
    img.src = logo.dataUrl;
  });

  ctx.save();
  // Clip to print boundary
  ctx.beginPath();
  ctx.rect(marginPx, marginPx, targetWidthPx, targetHeightPx);
  ctx.clip();

  // Calculate centered placement + user offsets
  const centerX = marginPx + targetWidthPx / 2 + (logo.xOffsetPercent / 100) * targetWidthPx;
  const centerY = marginPx + targetHeightPx / 2 + (logo.yOffsetPercent / 100) * targetHeightPx;

  // Aspect fit logo to target bounding box scaled by scalePercent
  const aspect = img.width / img.height;
  let baseLogoWidth = targetWidthPx * 0.75;
  let baseLogoHeight = baseLogoWidth / aspect;

  if (baseLogoHeight > targetHeightPx * 0.75) {
    baseLogoHeight = targetHeightPx * 0.75;
    baseLogoWidth = baseLogoHeight * aspect;
  }

  const finalWidth = baseLogoWidth * (logo.scalePercent / 100);
  const finalHeight = baseLogoHeight * (logo.scalePercent / 100);

  ctx.translate(centerX, centerY);
  ctx.rotate((logo.rotationDeg * Math.PI) / 180);

  // Apply color tint if specified
  if (logo.colorTint) {
    const tintCanvas = document.createElement('canvas');
    tintCanvas.width = img.width;
    tintCanvas.height = img.height;
    const tCtx = tintCanvas.getContext('2d');
    if (tCtx) {
      tCtx.drawImage(img, 0, 0);
      tCtx.globalCompositeOperation = 'source-in';
      tCtx.fillStyle = logo.colorTint;
      tCtx.fillRect(0, 0, img.width, img.height);
      ctx.drawImage(tintCanvas, -finalWidth / 2, -finalHeight / 2, finalWidth, finalHeight);
    } else {
      ctx.drawImage(img, -finalWidth / 2, -finalHeight / 2, finalWidth, finalHeight);
    }
  } else {
    ctx.drawImage(img, -finalWidth / 2, -finalHeight / 2, finalWidth, finalHeight);
  }

  ctx.restore();

  return canvas.toDataURL('image/png');
}

/**
 * Draws professional printing registration crosshairs, corner crop marks, and slug
 */
function drawCropMarksAndSlug(
  ctx: CanvasRenderingContext2D,
  m: number,
  w: number,
  h: number,
  product: MerchProduct,
  area: PrintArea,
  logo: LogoConfig
) {
  const markLen = 40;
  const markOffset = 15;

  ctx.strokeStyle = '#000000';
  ctx.lineWidth = 2;

  // 4 Corner crop marks
  // Top-left
  ctx.beginPath();
  ctx.moveTo(m - markOffset, m);
  ctx.lineTo(m - markOffset - markLen, m);
  ctx.moveTo(m, m - markOffset);
  ctx.lineTo(m, m - markOffset - markLen);
  // Top-right
  ctx.moveTo(m + w + markOffset, m);
  ctx.lineTo(m + w + markOffset + markLen, m);
  ctx.moveTo(m + w, m - markOffset);
  ctx.lineTo(m + w, m - markOffset - markLen);
  // Bottom-left
  ctx.beginPath();
  ctx.moveTo(m - markOffset, m + h);
  ctx.lineTo(m - markOffset - markLen, m + h);
  ctx.moveTo(m, m + h + markOffset);
  ctx.lineTo(m, m + h + markOffset + markLen);
  // Bottom-right
  ctx.moveTo(m + w + markOffset, m + h);
  ctx.lineTo(m + w + markOffset + markLen, m + h);
  ctx.moveTo(m + w, m + h + markOffset);
  ctx.lineTo(m + w, m + h + markOffset + markLen);
  ctx.stroke();

  // Center registration marks (crosshair with circle)
  const drawRegistration = (cx: number, cy: number) => {
    ctx.beginPath();
    ctx.arc(cx, cy, 14, 0, Math.PI * 2);
    ctx.moveTo(cx - 24, cy);
    ctx.lineTo(cx + 24, cy);
    ctx.moveTo(cx, cy - 24);
    ctx.lineTo(cx, cy + 24);
    ctx.stroke();
  };

  drawRegistration(m + w / 2, m - 50); // top center
  drawRegistration(m + w / 2, m + h + 50); // bottom center
  drawRegistration(m - 50, m + h / 2); // left center
  drawRegistration(m + w + 50, m + h / 2); // right center

  // Technical production slug text
  ctx.fillStyle = '#0f172a';
  ctx.font = 'bold 22px "JetBrains Mono", monospace';
  const dateStr = new Date().toISOString().split('T')[0];
  const slug1 = `ATELIER MERCH STUDIO · JOB: PR-${dateStr}-${Math.floor(Math.random() * 899 + 100)}`;
  const slug2 = `${product.name.toUpperCase()} · ${area.name} (${area.physicalWidthInches}" × ${area.physicalHeightInches}" @ ${area.recommendedDpi} DPI)`;
  const slug3 = `METHOD: ${logo.printMethod} · COLOR: ${logo.colorTint || 'ORIGINAL ASSET'}`;

  ctx.fillText(slug1, m, m - 90);
  ctx.font = '500 18px "JetBrains Mono", monospace';
  ctx.fillText(slug2, m, m - 62);
  ctx.fillText(slug3, m, m - 36);

  // Calibration CMYK swatches along bottom
  const cmykColors = ['#00ffff', '#ff00ff', '#ffff00', '#000000', '#94a3b8', '#ffffff'];
  cmykColors.forEach((color, i) => {
    ctx.fillStyle = color;
    ctx.fillRect(m + i * 40, m + h + 30, 32, 20);
    ctx.strokeStyle = '#64748b';
    ctx.lineWidth = 1;
    ctx.strokeRect(m + i * 40, m + h + 30, 32, 20);
  });
}

/**
 * Composite realistic full product mockup image with background, colorway, logo, and virtual lighting
 */
export async function generateCompositeMockupImage(
  product: MerchProduct,
  colorwayHex: string,
  colorwayOverlayRgba: string,
  area: PrintArea,
  logo: LogoConfig,
  backgroundImageUrl?: string,
  lightingConfig?: VirtualLightingConfig
): Promise<string> {
  const canvas = document.createElement('canvas');
  canvas.width = 1600;
  canvas.height = 1200;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Canvas not available');

  // 1. If background image provided, draw background first
  if (backgroundImageUrl) {
    const bgImg = new Image();
    bgImg.crossOrigin = 'anonymous';
    await new Promise<void>((resolve, reject) => {
      bgImg.onload = () => resolve();
      bgImg.onerror = () => reject(new Error('Failed to load background image'));
      bgImg.src = backgroundImageUrl;
    });
    ctx.drawImage(bgImg, 0, 0, canvas.width, canvas.height);
  }

  // 2. Draw base product image with lighting adjustments
  const baseImg = new Image();
  baseImg.crossOrigin = 'anonymous';
  await new Promise<void>((resolve, reject) => {
    baseImg.onload = () => resolve();
    baseImg.onerror = () => reject(new Error('Failed to load base image'));
    baseImg.src = product.image;
  });

  ctx.save();
  // Apply contact shadow if placed over background
  if (backgroundImageUrl) {
    const shadowOpacity = lightingConfig ? lightingConfig.shadowOpacity : 0.45;
    const angleRad = lightingConfig ? (lightingConfig.angleDeg * Math.PI) / 180 : 0.35;
    ctx.shadowColor = `rgba(0, 0, 0, ${shadowOpacity})`;
    ctx.shadowBlur = 30;
    ctx.shadowOffsetX = Math.sin(angleRad) * 20;
    ctx.shadowOffsetY = Math.cos(angleRad) * 25 + 10;
  }

  // Apply virtual lighting intensity & warmth filter
  if (lightingConfig) {
    const intensity = lightingConfig.intensity;
    const warmth = lightingConfig.warmth;
    ctx.filter = `brightness(${intensity}) contrast(${1 + (intensity - 1) * 0.25}) saturate(${1 + warmth / 150})`;
  }

  ctx.drawImage(baseImg, 0, 0, canvas.width, canvas.height);
  ctx.restore();

  // 3. Apply fabric color tint overlay if not natural
  if (colorwayOverlayRgba) {
    ctx.save();
    ctx.fillStyle = colorwayOverlayRgba;
    ctx.globalCompositeOperation = 'multiply';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.restore();
  }

  // 4. Draw logo placed at print area coordinates
  const printX = (area.xPercent / 100) * canvas.width;
  const printY = (area.yPercent / 100) * canvas.height;
  const printW = (area.widthPercent / 100) * canvas.width;
  const printH = (area.heightPercent / 100) * canvas.height;

  const logoImg = new Image();
  logoImg.crossOrigin = 'anonymous';
  await new Promise<void>((resolve, reject) => {
    logoImg.onload = () => resolve();
    logoImg.onerror = () => reject(new Error('Failed to load logo image'));
    logoImg.src = logo.dataUrl;
  });

  ctx.save();

  // Print method blend modes
  if (logo.printMethod === 'Direct-to-Garment (DTG)' || logo.printMethod === 'Vintage Distressed Wash') {
    ctx.globalCompositeOperation = 'multiply';
    ctx.globalAlpha = 0.92 * logo.opacity;
  } else {
    ctx.globalAlpha = logo.opacity;
  }

  // Integrate lighting intensity into logo rendering
  if (lightingConfig) {
    const intensity = lightingConfig.intensity;
    ctx.filter = `brightness(${intensity}) contrast(${1 + (intensity - 1) * 0.2})`;
  }

  const centerX = printX + printW / 2 + (logo.xOffsetPercent / 100) * printW;
  const centerY = printY + printH / 2 + (logo.yOffsetPercent / 100) * printH;

  const aspect = logoImg.width / logoImg.height;
  let targetLogoW = printW;
  let targetLogoH = targetLogoW / aspect;
  if (targetLogoH > printH) {
    targetLogoH = printH;
    targetLogoW = targetLogoH * aspect;
  }

  const finalW = targetLogoW * (logo.scalePercent / 100);
  const finalH = targetLogoH * (logo.scalePercent / 100);

  ctx.translate(centerX, centerY);
  ctx.rotate((logo.rotationDeg * Math.PI) / 180);

  // Embroidery 3D drop shadow simulation
  if (logo.printMethod === '3D Heavy Embroidery') {
    ctx.shadowColor = 'rgba(0, 0, 0, 0.45)';
    ctx.shadowBlur = 6;
    ctx.shadowOffsetX = 1;
    ctx.shadowOffsetY = 3;
  }

  if (logo.colorTint) {
    const tintCanvas = document.createElement('canvas');
    tintCanvas.width = logoImg.width;
    tintCanvas.height = logoImg.height;
    const tCtx = tintCanvas.getContext('2d');
    if (tCtx) {
      tCtx.drawImage(logoImg, 0, 0);
      tCtx.globalCompositeOperation = 'source-in';
      tCtx.fillStyle = logo.colorTint;
      tCtx.fillRect(0, 0, logoImg.width, logoImg.height);
      ctx.drawImage(tintCanvas, -finalW / 2, -finalH / 2, finalW, finalH);
    }
  } else {
    ctx.drawImage(logoImg, -finalW / 2, -finalH / 2, finalW, finalH);
  }

  ctx.restore();

  return canvas.toDataURL('image/jpeg', 0.95);
}

/**
 * Downloads a data URL as a file in the browser
 */
export function downloadDataUrl(dataUrl: string, filename: string) {
  const link = document.createElement('a');
  link.href = dataUrl;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}
