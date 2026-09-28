/**
 * credentialPdfService.ts — REGLA GLOBAL / UNIVERSAL
 * ==================================================
 * Genera y comparte la Credencial Institucional ID Card en PDF.
 * Aplica en todos los perfiles: ALUMNO / DOCENTE / DIRECTOR.
 *
 * ⚠️ CLIENT-SIDE ONLY. No importar Prisma ni nada de Node.js.
 *    El QR se genera con la librería `qrcode` (sin depender del DOM).
 */
import { jsPDF } from 'jspdf';
import QRCode from 'qrcode';

export type CredentialRole = 'ALUMNO' | 'DOCENTE' | 'DIRECTOR';

export interface CredentialCardData {
  name: string;
  role: CredentialRole;
  roleLabel?: string;
  email?: string;
  curp?: string;
  controlLabel?: string;
  controlValue?: string;
  nivel?: string;
  grupo?: string;
  modulo?: string;
  career?: string;
  semestre?: string;
  modalidad?: string;
  chips?: string[];
  institutionName?: string;
  institutionCode?: string;
  institutionLogoUrl?: string;
  avatarUrl?: string;
  slogan?: string;
  userId?: string;
  qrValue?: string;
  /** @deprecated ya no se usa; el QR se genera desde qrValue */
  qrSelector?: string;
  issuedAt?: Date;
}

export type CredentialShareOutcome = 'shared' | 'downloaded' | 'cancelled' | 'failed';

interface CredentialAssets {
  avatarDataUrl: string | null;
  logoDataUrl: string | null;
  qrDataUrl: string | null;
}

// ============== Dimensiones — PORTRAIT CR80 (54 × 85.6 mm) ==============
const CARD_W = 54;
const CARD_H = 85.6;
const PAGE_W = 210;
const PAGE_H = 297;

type RGB = readonly [number, number, number];
const BG: RGB        = [6, 26, 26];
const BG_SOFT: RGB   = [12, 42, 42];
const WHITE: RGB     = [255, 255, 255];
const MUTED: RGB     = [150, 170, 170];
const MUTED_DIM: RGB = [120, 140, 140];
const CYAN: RGB      = [56, 189, 248];
const LIME: RGB      = [222, 255, 154];
const GREEN: RGB     = [74, 222, 128];
const CYAN_SOFT: RGB = [34, 211, 238];

const ISSUED_DATE_FALLBACK = new Date();

// ============== Helpers de color / texto ==============
const mix = (a: RGB, b: RGB, t: number): RGB =>
  [Math.round(a[0] + (b[0] - a[0]) * t),
   Math.round(a[1] + (b[1] - a[1]) * t),
   Math.round(a[2] + (b[2] - a[2]) * t)] as RGB;

const upper = (v?: string | null): string => (v ? String(v).trim().toUpperCase() : '');

function formatDate(d: Date): string {
  return d.toLocaleDateString('es-ES', { year: 'numeric', month: 'short', day: 'numeric' });
}

function fitText(doc: jsPDF, text: string, maxWidthMm: number): string {
  if (!text || maxWidthMm <= 2) return text || '';
  if (doc.getTextWidth(text) <= maxWidthMm) return text;
  let out = text;
  while (out.length > 1 && doc.getTextWidth(`${out}…`) > maxWidthMm) out = out.slice(0, -1);
  return `${out}…`;
}

export function credentialFileName(data: CredentialCardData): string {
  const safeName = upper(data.name).normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .replace(/[^A-Z0-9]+/g, '_').replace(/^_+|_+$/g, '').slice(0, 40) || 'TITULAR';
  const folio = (data.controlValue || data.userId || '').toString().replace(/[^A-Za-z0-9-]/g, '').slice(0, 24);
  return `Credencial_TECLINGO_${data.role}_${safeName}${folio ? `_${folio}` : ''}.pdf`;
}

function roleAccent(r: CredentialRole): RGB {
  if (r === 'ALUMNO') return CYAN_SOFT;
  if (r === 'DIRECTOR') return LIME;
  return GREEN;
}

export function verifiedLabelFor(r: CredentialRole): string {
  if (r === 'ALUMNO') return 'VERIFIED STUDENT';
  if (r === 'DIRECTOR') return 'VERIFIED DIRECTOR';
  return 'VERIFIED DOCENTE';
}

function defaultRoleLabel(r: CredentialRole): string {
  if (r === 'ALUMNO') return 'ALUMNO';
  if (r === 'DIRECTOR') return 'DIRECTOR ACADÉMICO';
  return 'DOCENTE';
}

export function controlLabelFor(r: CredentialRole): string {
  if (r === 'ALUMNO') return 'CTL';
  if (r === 'DIRECTOR') return 'DIR';
  return 'DOC';
}

// ============== Utilidades de imagen ==============
async function squareImageDataUrl(url: string | undefined, px: number): Promise<string | null> {
  if (!url) return null;
  try {
    let source = url;
    if (!url.startsWith('data:') && !url.startsWith('blob:')) {
      if (typeof fetch === 'undefined') return null;
      const res = await fetch(url, { mode: 'cors', credentials: 'omit' });
      if (!res.ok) return null;
      const blob = await res.blob();
      if (!blob.type.startsWith('image/')) return null;
      source = URL.createObjectURL(blob);
    }
    const img = new Image();
    const loaded = new Promise<void>((res, rej) => { img.onload = () => res(); img.onerror = rej; });
    img.src = source;
    await loaded;
    const canvas = document.createElement('canvas');
    canvas.width = canvas.height = px;
    const ctx = canvas.getContext('2d');
    if (!ctx) return null;
    const side = Math.min(img.width, img.height);
    const sx = (img.width - side) / 2, sy = (img.height - side) / 2;
    ctx.drawImage(img, sx, sy, side, side, 0, 0, px, px);
    if (source !== url) URL.revokeObjectURL(source);
    return canvas.toDataURL('image/png');
  } catch { return null; }
}

/** Logo sin recorte (mantiene proporción, encaja en caja cuadrada) */
async function logoDataUrl(url: string | undefined, px: number): Promise<string | null> {
  if (!url) return null;
  try {
    let source = url;
    if (!url.startsWith('data:') && !url.startsWith('blob:')) {
      const res = await fetch(url, { mode: 'cors', credentials: 'omit' });
      if (!res.ok) return null;
      const blob = await res.blob();
      if (!blob.type.startsWith('image/')) return null;
      source = URL.createObjectURL(blob);
    }
    const img = new Image();
    const loaded = new Promise<void>((res, rej) => { img.onload = () => res(); img.onerror = rej; });
    img.src = source;
    await loaded;
    const canvas = document.createElement('canvas');
    canvas.width = canvas.height = px;
    const ctx = canvas.getContext('2d');
    if (!ctx) return null;
    const scale = Math.min(px / img.width, px / img.height);
    const w = img.width * scale;
    const h = img.height * scale;
    ctx.drawImage(img, (px - w) / 2, (px - h) / 2, w, h);
    if (source !== url) URL.revokeObjectURL(source);
    return canvas.toDataURL('image/png');
  } catch { return null; }
}

/** Genera el QR como PNG data URL usando la librería qrcode (sin DOM). */
async function generateQrDataUrl(value: string | undefined, px: number): Promise<string | null> {
  if (!value) return null;
  try {
    return await QRCode.toDataURL(value, {
      width: px,
      margin: 1,
      errorCorrectionLevel: 'M',
      color: { dark: '#061a1aff', light: '#ffffffff' },
    });
  } catch { return null; }
}

async function loadAssets(data: CredentialCardData): Promise<CredentialAssets> {
  const qrFallback = data.qrValue || data.userId || data.controlValue || data.email || data.name;
  const [avatarDataUrl, logo, qrDataUrl] = await Promise.all([
    squareImageDataUrl(data.avatarUrl, 128),
    logoDataUrl(data.institutionLogoUrl, 64),
    generateQrDataUrl(qrFallback, 160),
  ]);
  return { avatarDataUrl, logoDataUrl: logo, qrDataUrl };
}

// ============== Helpers de dibujo jsPDF ==============
function setRGB(doc: jsPDF, c: RGB)     { doc.setDrawColor(c[0], c[1], c[2]); }
function setFillRGB(doc: jsPDF, c: RGB) { doc.setFillColor(c[0], c[1], c[2]); }
function setTextRGB(doc: jsPDF, c: RGB) { doc.setTextColor(c[0], c[1], c[2]); }

function roundedRect(doc: jsPDF, x: number, y: number, w: number, h: number, r: number, style: 'F' | 'S' | 'FD' = 'F') {
  const r2 = Math.min(r, w / 2, h / 2);
  (doc as any).roundedRect(x, y, w, h, r2, r2, style);
}

function drawChips(doc: jsPDF, x: number, y: number, maxWidth: number, h: number, chips: string[], accent: RGB) {
  let cx = x;
  for (const chip of chips.slice(0, 5)) {
    const txt = upper(chip);
    doc.setFontSize(3.6); doc.setFont('helvetica', 'bold');
    const w = Math.min(maxWidth, Math.max(11, doc.getTextWidth(txt) + 3.6));
    if (cx + w > x + maxWidth) break;
    setFillRGB(doc, mix(accent, BG, 0.75));
    roundedRect(doc, cx, y, w, h, 1.8, 'F');
    setRGB(doc, accent); doc.setLineWidth(0.14);
    roundedRect(doc, cx, y, w, h, 1.8, 'S');
    setTextRGB(doc, WHITE); doc.setFontSize(3.6); doc.setFont('helvetica', 'bold');
    doc.text(txt, cx + w / 2, y + h / 2 + 1.2, { align: 'center' });
    cx += w + 1.4;
  }
}

// ============== Render del PDF ==============
export async function credentialPdfBlob(data: CredentialCardData): Promise<{ blob: Blob; filename: string }> {
  const accent = roleAccent(data.role);
  const accentSoft = mix(accent, BG, 0.78);
  const accentDim = mix(accent, WHITE, 0.35);
  const assets = await loadAssets(data);

  const doc = new jsPDF({ unit: 'mm', format: [PAGE_W, PAGE_H], orientation: 'portrait' });
  const gx = (PAGE_W - CARD_W) / 2;
  const gy = (PAGE_H - CARD_H) / 2 + 20;

  const padX = 3;

  // ───── Guías de recorte laterales
  doc.setDrawColor(180, 180, 180); doc.setLineWidth(0.15); doc.setLineCap(1);
  doc.moveTo(gx - 6, gy + CARD_H / 2).lineTo(gx - 1, gy + CARD_H / 2);
  doc.moveTo(gx + CARD_W + 1, gy + CARD_H / 2).lineTo(gx + CARD_W + 6, gy + CARD_H / 2);

  // ───── Fondo
  setFillRGB(doc, BG);
  roundedRect(doc, gx, gy, CARD_W, CARD_H, 3.2, 'F');

  // Banda sutil detrás de la zona QR (para destacarla)
  setFillRGB(doc, BG_SOFT);
  roundedRect(doc, gx + 2, gy + 34, CARD_W - 4, 42, 2.4, 'F');

  // Barra superior acento
  setFillRGB(doc, accent);
  roundedRect(doc, gx, gy, CARD_W, 1.4, 3.2, 'F');
  (doc as any).rect(gx, gy + 0.7, CARD_W, 0.7, 'F');

  // Borde exterior
  setRGB(doc, accent); doc.setLineWidth(0.4);
  roundedRect(doc, gx, gy, CARD_W, CARD_H, 3.2, 'S');

  // ═══════════ HEADER (y: 2 → 10.5) ═══════════
  const headerY = gy + 2.8;
  const logoSize = 6.4;

  if (assets.logoDataUrl) {
    try { doc.addImage(assets.logoDataUrl, 'PNG', gx + padX, headerY, logoSize, logoSize, undefined, 'FAST'); } catch {}
  } else {
    setFillRGB(doc, accentSoft);
    roundedRect(doc, gx + padX, headerY, logoSize, logoSize, 1.4, 'F');
    setRGB(doc, accent); doc.setLineWidth(0.2);
    roundedRect(doc, gx + padX, headerY, logoSize, logoSize, 1.4, 'S');
    setTextRGB(doc, accent); doc.setFont('helvetica', 'bold'); doc.setFontSize(3.8);
    doc.text(upper(data.institutionName || 'TEC').slice(0, 3), gx + padX + logoSize / 2, headerY + 4.1, { align: 'center' });
  }

  // Nombre institución (a la derecha del logo)
  const instX = gx + padX + logoSize + 1.6;
  setTextRGB(doc, WHITE); doc.setFont('helvetica', 'bold'); doc.setFontSize(4.2);
  doc.text(fitText(doc, upper(data.institutionName || 'TECLINGO ACADEMY'), CARD_W - (instX - gx) - padX), instX, headerY + 2.6);
  setTextRGB(doc, MUTED); doc.setFont('helvetica', 'normal'); doc.setFontSize(2.4);
  doc.text('ID CARD INSTITUCIONAL', instX, headerY + 5.3);

  // Badge VERIFIED compacto (esquina superior derecha)
  const badgeW = 17; const badgeH = 5.6;
  const badgeX = gx + CARD_W - padX - badgeW;
  const badgeY = headerY - 0.2;
  setFillRGB(doc, accentSoft);
  roundedRect(doc, badgeX, badgeY, badgeW, badgeH, 1.4, 'F');
  setRGB(doc, accent); doc.setLineWidth(0.2);
  roundedRect(doc, badgeX, badgeY, badgeW, badgeH, 1.4, 'S');
  setTextRGB(doc, WHITE); doc.setFont('helvetica', 'bold'); doc.setFontSize(2.6);
  doc.text('VERIFIED', badgeX + badgeW / 2, badgeY + 2.4, { align: 'center' });
  doc.setFont('helvetica', 'normal'); doc.setFontSize(1.9);
  setTextRGB(doc, accentDim);
  doc.text(verifiedLabelFor(data.role).replace('VERIFIED ', ''), badgeX + badgeW / 2, badgeY + 4.5, { align: 'center' });

  // Separador header
  setRGB(doc, mix(accent, BG, 0.5)); doc.setLineWidth(0.16);
  doc.line(gx + padX, gy + 11, gx + CARD_W - padX, gy + 11);

  // ═══════════ BODY: Avatar + Nombre + Rol (y: 12 → 36) ═══════════
  const bodyTop = gy + 13;

  // Avatar circular
  const avatarD = 15;
  const avatarX = gx + padX;
  const avatarY = bodyTop;

  setFillRGB(doc, accentSoft);
  (doc as any).circle(avatarX + avatarD / 2, avatarY + avatarD / 2, avatarD / 2 + 0.5, 'F');
  setRGB(doc, accent); doc.setLineWidth(0.6);
  (doc as any).circle(avatarX + avatarD / 2, avatarY + avatarD / 2, avatarD / 2 + 0.5, 'S');

  if (assets.avatarDataUrl) {
    try {
      const docAny = doc as any;
      docAny.saveGraphicsState?.();
      docAny.circle(avatarX + avatarD / 2, avatarY + avatarD / 2, avatarD / 2, null);
      docAny.clip?.();
      docAny.discardPath?.();
      doc.addImage(assets.avatarDataUrl, 'PNG', avatarX, avatarY, avatarD, avatarD, undefined, 'FAST');
      docAny.restoreGraphicsState?.();
    } catch {
      try { doc.addImage(assets.avatarDataUrl, 'PNG', avatarX, avatarY, avatarD, avatarD, undefined, 'FAST'); } catch {}
    }
  } else {
    setTextRGB(doc, WHITE); doc.setFont('helvetica', 'bold'); doc.setFontSize(8);
    doc.text(upper(data.name?.[0] || 'U'), avatarX + avatarD / 2, avatarY + avatarD / 2 + 2.8, { align: 'center' });
  }

  // Nombre + Rol + ROL + CTL
  const infoX = avatarX + avatarD + 2.4;
  const infoW = CARD_W - (infoX - gx) - padX - 0.5;

  setTextRGB(doc, WHITE); doc.setFont('helvetica', 'bold'); doc.setFontSize(6.4);
  doc.text(fitText(doc, upper(data.name), infoW), infoX, bodyTop + 3.4);

  doc.setFont('helvetica', 'normal'); doc.setFontSize(3.4);
  setTextRGB(doc, accentDim);
  doc.text(fitText(doc, upper(data.roleLabel || defaultRoleLabel(data.role)), infoW), infoX, bodyTop + 7.1);

  doc.setFont('helvetica', 'bold'); doc.setFontSize(3);
  setTextRGB(doc, mix(accent, WHITE, 0.55));
  doc.text(fitText(doc, `ROL: ${data.role}`, infoW), infoX, bodyTop + 10.5);

  if (data.controlValue) {
    const lbl = upper(data.controlLabel || controlLabelFor(data.role));
    doc.setFont('courier', 'bold'); doc.setFontSize(3);
    setTextRGB(doc, accent);
    doc.text(fitText(doc, `${lbl}: ${data.controlValue}`, infoW), infoX, bodyTop + 13.8);
  }

  // Chips (fila completa debajo del avatar)
  const chipsRow: string[] = [];
  if (data.grupo) chipsRow.push(`GRP ${data.grupo}`);
  if (data.nivel) chipsRow.push(`NIVEL ${data.nivel}`);
  if (data.semestre) chipsRow.push(`SEM ${data.semestre}`);
  if (data.modulo) chipsRow.push(`MÓD ${data.modulo}`);
  if (data.modalidad) chipsRow.push(data.modalidad);
  if (data.career) chipsRow.push(data.career);
  if (Array.isArray(data.chips)) chipsRow.push(...data.chips);

  if (chipsRow.length > 0) {
    drawChips(doc, gx + padX, bodyTop + avatarD + 1.4, CARD_W - padX * 2, 3.8, chipsRow, accent);
  }

      // ZONA QR + FOOTER
  const qrSize = 36;
  const qrX = gx + (CARD_W - qrSize) / 2;
  const qrY = gy + 36.5;
  if (assets.qrDataUrl) {
    setFillRGB(doc, WHITE);
    roundedRect(doc, qrX - 1.2, qrY - 1.2, qrSize + 2.4, qrSize + 2.4, 1.8, 'F');
    setRGB(doc, accent); doc.setLineWidth(0.5);
    roundedRect(doc, qrX - 1.2, qrY - 1.2, qrSize + 2.4, qrSize + 2.4, 1.8, 'S');
    try { doc.addImage(assets.qrDataUrl, 'PNG', qrX, qrY, qrSize, qrSize, undefined, 'FAST'); } catch {}
  }
  setRGB(doc, mix(accent, BG, 0.5)); doc.setLineWidth(0.16);
  doc.line(gx + padX, gy + 76, gx + CARD_W - padX, gy + 76);
  const creditsText = 'CONCEPTOS AI MX - PANUCO VER - 2026';
  const creditsMaxW = CARD_W - padX * 2;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(5.2);
  setTextRGB(doc, mix(accent, WHITE, 0.65));
  const creditsW = doc.getTextWidth(creditsText);
  let creditsFinal = creditsText;
  if (creditsW > creditsMaxW) { doc.setFontSize(Math.max(3.6, 5.2 * (creditsMaxW / creditsW))); creditsFinal = fitText(doc, creditsText, creditsMaxW); }
  doc.text(creditsFinal, gx + CARD_W / 2, gy + 82.4, { align: 'center' });  const blob = doc.output('blob');
  return { blob, filename: credentialFileName(data) };
}

// ============== API pública ==============
export async function credentialPdfDataUrl(data: CredentialCardData): Promise<string> {
  const { blob } = await credentialPdfBlob(data);
  return await new Promise<string>((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(String(r.result || ''));
    r.onerror = () => reject(r.error);
    r.readAsDataURL(blob);
  });
}

export async function downloadCredentialCardPdf(data: CredentialCardData): Promise<void> {
  const { blob, filename } = await credentialPdfBlob(data);
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = filename;
  document.body.appendChild(a);
  a.click();
  setTimeout(() => { document.body.removeChild(a); URL.revokeObjectURL(url); }, 1000);
}

export async function shareCredentialCardPdf(data: CredentialCardData): Promise<CredentialShareOutcome> {
  const { blob, filename } = await credentialPdfBlob(data);
  const file = new File([blob], filename, { type: 'application/pdf' });

  if (typeof navigator !== 'undefined' && typeof navigator.share === 'function') {
    try {
      await navigator.share({
        title: filename,
        text: `${upper(data.name)} — Credencial Institucional Teclingo`,
        files: [file],
      });
      return 'shared';
    } catch (err: any) {
      if (err?.name === 'AbortError') return 'cancelled';
    }
  }
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = filename;
  document.body.appendChild(a); a.click();
  setTimeout(() => { document.body.removeChild(a); URL.revokeObjectURL(url); }, 1000);
  return 'downloaded';
}