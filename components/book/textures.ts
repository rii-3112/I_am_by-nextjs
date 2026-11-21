import * as THREE from 'three';
import { type Face, lastPage, leaves } from './content';
import { COVER_H, COVER_W, PAGE_H, PAGE_W } from './metrics';

const PAGE_TEX_W = 1100;
const PAGE_TEX_H = Math.round((PAGE_TEX_W * PAGE_H) / PAGE_W);
const COVER_TEX_W = 1100;
const COVER_TEX_H = Math.round((COVER_TEX_W * COVER_H) / COVER_W);

export type LeafTextures = {
  id: string;
  front: THREE.CanvasTexture;
  back: THREE.CanvasTexture;
};

export type LineHit = {
  href: string;
  label: string;
  x: number;
  y: number;
  w: number;
  h: number;
};

export type BookTextures = {
  leaves: LeafTextures[];
  last: THREE.CanvasTexture;
  wood: THREE.CanvasTexture;
  shadow: THREE.CanvasTexture;
  workHits: LineHit[];
};

function canvas2d(width: number, height: number) {
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('2d context unavailable');
  return { canvas, ctx };
}

function toTexture(canvas: HTMLCanvasElement, mirror = false) {
  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.flipY = true;
  tex.anisotropy = 8;
  if (mirror) {
    tex.wrapS = THREE.RepeatWrapping;
    tex.repeat.x = -1;
    tex.offset.x = 1;
  }
  tex.needsUpdate = true;
  return tex;
}

function mulberry32(seed: number) {
  let state = seed;
  return () => {
    state += 0x6d2b79f5;
    let t = state;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function drawWood(ctx: CanvasRenderingContext2D, w: number, h: number) {
  const rand = mulberry32(3112);
  const tones = ['#e2be86', '#d4aa6c', '#c99658', '#dcb67a'];
  const seams = [0, 0.23, 0.48, 0.74, 1];

  for (let i = 0; i < seams.length - 1; i++) {
    const y0 = seams[i] * h;
    const y1 = seams[i + 1] * h;
    ctx.fillStyle = tones[i % tones.length];
    ctx.fillRect(0, y0, w, y1 - y0);

    for (let y = y0 + 3; y < y1 - 4; y += 3) {
      const stripe = Math.floor(y) % 12 === 0;
      ctx.strokeStyle = stripe
        ? 'rgba(96, 58, 26, 0.16)'
        : 'rgba(92, 56, 24, 0.05)';
      ctx.lineWidth = stripe ? 2 : 1;
      ctx.beginPath();
      ctx.moveTo(0, y);
      for (let x = 0; x <= w; x += 28) {
        const wave =
          Math.sin(x * 0.01 + y * 0.03) * 1.6 + Math.sin(x * 0.002 + i) * 3;
        ctx.lineTo(x, y + wave);
      }
      ctx.stroke();
    }

    ctx.fillStyle = 'rgba(58, 32, 14, 0.42)';
    ctx.fillRect(0, y1 - 4, w, 4);
    ctx.fillStyle = 'rgba(255, 236, 210, 0.28)';
    ctx.fillRect(0, y1, w, 2);
  }

  for (let i = 0; i < 16; i++) {
    const y = rand() * h;
    ctx.strokeStyle = `rgba(112, 68, 28, ${0.08 + rand() * 0.14})`;
    ctx.lineWidth = 1 + rand() * 3.2;
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.bezierCurveTo(
      w * 0.33,
      y + (rand() - 0.5) * 18,
      w * 0.66,
      y + (rand() - 0.5) * 18,
      w,
      y + (rand() - 0.5) * 8
    );
    ctx.stroke();
  }

  drawKnot(ctx, w * 0.28, h * 0.36, 54);
  drawKnot(ctx, w * 0.74, h * 0.7, 38);
}

function drawKnot(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  radius: number
) {
  const gradient = ctx.createRadialGradient(x, y, radius * 0.15, x, y, radius);
  gradient.addColorStop(0, 'rgba(86, 48, 20, 0.55)');
  gradient.addColorStop(0.55, 'rgba(120, 74, 34, 0.22)');
  gradient.addColorStop(1, 'rgba(120, 74, 34, 0)');
  ctx.fillStyle = gradient;
  ctx.beginPath();
  ctx.ellipse(x, y, radius, radius * 0.7, 0.4, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = 'rgba(72, 40, 16, 0.35)';
  ctx.lineWidth = 2;
  ctx.stroke();
}

function drawShadow(ctx: CanvasRenderingContext2D, w: number, h: number) {
  const gradient = ctx.createRadialGradient(
    w / 2,
    h / 2,
    w * 0.08,
    w / 2,
    h / 2,
    w * 0.48
  );
  gradient.addColorStop(0, 'rgba(48, 28, 12, 0.38)');
  gradient.addColorStop(0.55, 'rgba(48, 28, 12, 0.16)');
  gradient.addColorStop(1, 'rgba(48, 28, 12, 0)');
  ctx.clearRect(0, 0, w, h);
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, w, h);
}

function paperFill(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  color: string
) {
  ctx.fillStyle = color;
  ctx.fillRect(0, 0, w, h);
  const rand = mulberry32(color.length * 97);
  for (let i = 0; i < 1400; i++) {
    ctx.fillStyle = `rgba(90, 70, 40, ${rand() * 0.045})`;
    ctx.fillRect(rand() * w, rand() * h, rand() * 16 + 2, 1);
  }
}

function paintGutter(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  side: 'left' | 'right'
) {
  const gradient = ctx.createLinearGradient(
    side === 'left' ? 0 : w,
    0,
    side === 'left' ? 150 : w - 150,
    0
  );
  gradient.addColorStop(0, 'rgba(62, 42, 22, 0.2)');
  gradient.addColorStop(1, 'rgba(62, 42, 22, 0)');
  ctx.fillStyle = gradient;
  ctx.fillRect(side === 'left' ? 0 : w - 150, 0, 150, h);
}

function wrapLines(
  ctx: CanvasRenderingContext2D,
  text: string,
  maxWidth: number
) {
  const lines: string[] = [];
  let line = '';
  for (const ch of text) {
    const test = line + ch;
    if (ctx.measureText(test).width > maxWidth && line.length > 0) {
      lines.push(line);
      line = ch;
    } else {
      line = test;
    }
  }
  if (line) lines.push(line);
  return lines;
}

function drawWrapped(
  ctx: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  maxWidth: number,
  lineHeight: number
) {
  let cursor = y;
  for (const line of wrapLines(ctx, text, maxWidth)) {
    ctx.fillText(line, x, cursor);
    cursor += lineHeight;
  }
  return cursor;
}

function drawRules(
  ctx: CanvasRenderingContext2D,
  x: number,
  top: number,
  width: number,
  bottom: number,
  pitch: number
) {
  ctx.save();
  ctx.strokeStyle = 'rgba(86, 118, 150, 0.45)';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  for (let rule = top; rule <= bottom; rule += pitch) {
    ctx.moveTo(x, rule);
    ctx.lineTo(x + width, rule);
  }
  ctx.stroke();
  ctx.strokeStyle = 'rgba(176, 78, 78, 0.55)';
  ctx.lineWidth = 1.75;
  ctx.beginPath();
  ctx.moveTo(x - pitch * 0.22, top - pitch);
  ctx.lineTo(x - pitch * 0.22, bottom);
  ctx.stroke();
  ctx.restore();
}

function loadImage(src: string) {
  return new Promise<HTMLImageElement>((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error(src));
    img.src = src;
  });
}

async function loadOptional(src: string) {
  try {
    return await loadImage(src);
  } catch {
    return null;
  }
}

function knockOutDark(img: HTMLImageElement) {
  const canvas = document.createElement('canvas');
  canvas.width = img.naturalWidth || img.width;
  canvas.height = img.naturalHeight || img.height;
  const ctx = canvas.getContext('2d');
  if (!ctx) return canvas;
  ctx.drawImage(img, 0, 0);
  const image = ctx.getImageData(0, 0, canvas.width, canvas.height);
  const px = image.data;
  if (px[3] < 16) return canvas;
  for (let i = 0; i < px.length; i += 4) {
    const max = Math.max(px[i], px[i + 1], px[i + 2]);
    if (max < 24) px[i + 3] = 0;
    else if (max < 52) {
      px[i + 3] = Math.round(((max - 24) / 28) * px[i + 3]);
    }
  }
  ctx.putImageData(image, 0, 0);
  return canvas;
}

function drawMark(
  ctx: CanvasRenderingContext2D,
  img: HTMLImageElement | null,
  x: number,
  y: number,
  maxW: number,
  maxH: number
) {
  if (!img) return;
  const cleaned = knockOutDark(img);
  const aspect = cleaned.width / Math.max(1, cleaned.height);
  let w = maxW;
  let h = w / aspect;
  if (h > maxH) {
    h = maxH;
    w = h * aspect;
  }
  ctx.drawImage(cleaned, x - w / 2, y, w, h);
}

function drawCover(
  ctx: CanvasRenderingContext2D,
  hane: HTMLImageElement | null,
  feather: HTMLImageElement | null
) {
  const w = ctx.canvas.width;
  const h = ctx.canvas.height;
  ctx.fillStyle = '#1a3c32';
  ctx.fillRect(0, 0, w, h);

  ctx.strokeStyle = 'rgba(255, 255, 255, 0.04)';
  ctx.lineWidth = 2;
  for (let i = -h; i < w + h; i += 6) {
    ctx.beginPath();
    ctx.moveTo(i, 0);
    ctx.lineTo(i + h * 0.35, h);
    ctx.stroke();
  }

  const vignette = ctx.createRadialGradient(
    w / 2,
    h * 0.42,
    w * 0.08,
    w / 2,
    h * 0.48,
    w * 0.78
  );
  vignette.addColorStop(0, 'rgba(255,255,255,0.05)');
  vignette.addColorStop(1, 'rgba(0,0,0,0.28)');
  ctx.fillStyle = vignette;
  ctx.fillRect(0, 0, w, h);

  ctx.strokeStyle = '#d9c48a';
  ctx.lineWidth = 3;
  ctx.strokeRect(72, 72, w - 144, h - 144);
  ctx.lineWidth = 1;
  ctx.strokeRect(88, 88, w - 176, h - 176);

  drawMark(ctx, hane, w / 2, h * 0.2, 280, 320);
  drawMark(ctx, feather, w * 0.72, h * 0.2, 120, 150);

  ctx.fillStyle = '#f3ead7';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.font = '700 210px "Shippori Mincho", serif';
  ctx.fillText('rii', w / 2, h * 0.58);

  ctx.font = '400 34px "Shippori Mincho", serif';
  const label = 'PORTFOLIO';
  const tracking = 18;
  const widths = [...label].map((ch) => ctx.measureText(ch).width);
  const total =
    widths.reduce((sum, width) => sum + width, 0) +
    tracking * (label.length - 1);
  let cursor = w / 2 - total / 2;
  ctx.textAlign = 'left';
  for (let i = 0; i < label.length; i++) {
    ctx.fillText(label[i], cursor, h * 0.68);
    cursor += widths[i] + tracking;
  }

  ctx.strokeStyle = '#d9c48a';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(w * 0.36, h * 0.74);
  ctx.lineTo(w * 0.64, h * 0.74);
  ctx.stroke();

  ctx.fillStyle = '#e7dcc4';
  ctx.textAlign = 'center';
  ctx.font = '400 32px "Shippori Mincho", serif';
  ctx.fillText('スクロールで開く', w / 2, h * 0.86);
  ctx.textAlign = 'left';
}

function mergeHits(lines: LineHit[]) {
  const merged: LineHit[] = [];
  for (const line of lines) {
    const prev = merged[merged.length - 1];
    const continues =
      prev &&
      prev.href === line.href &&
      Math.abs(prev.x - line.x) < 0.002 &&
      Math.abs(prev.y + prev.h - line.y) < 0.002;
    if (prev && continues) {
      prev.h += line.h;
      continue;
    }
    merged.push({ ...line });
  }
  return merged;
}

function drawFace(
  ctx: CanvasRenderingContext2D,
  face: Face,
  side: 'left' | 'right'
) {
  const w = ctx.canvas.width;
  const h = ctx.canvas.height;
  const base = face.kind === 'endpaper' ? '#e5f0e4' : '#f7f2e8';
  paperFill(ctx, w, h, base);
  paintGutter(ctx, w, h, side === 'right' ? 'left' : 'right');

  ctx.strokeStyle = 'rgba(90, 70, 46, 0.28)';
  ctx.lineWidth = 2;
  ctx.strokeRect(28, 28, w - 56, h - 56);

  const outer = w * 0.09;
  const inner = w * 0.13;
  const x = side === 'right' ? inner : outer;
  const maxWidth = w - inner - outer;
  const pitch = Math.round(w * 0.072);
  let y = h * 0.09;
  let gridTop = 0;
  const hits: LineHit[] = [];

  ctx.textBaseline = 'top';
  ctx.textAlign = 'left';
  ctx.fillStyle = '#241f1a';

  const writeOnRule = (text: string, font: string, href?: string) => {
    ctx.font = font;
    ctx.textBaseline = 'alphabetic';
    for (const line of wrapLines(ctx, text, maxWidth)) {
      if (gridTop === 0) {
        gridTop = y + pitch;
        drawRules(ctx, x, gridTop, maxWidth, h * 0.92, pitch);
        y = gridTop;
      }
      if (href) {
        hits.push({
          href,
          label: text,
          x: x / w,
          y: (y - pitch) / h,
          w: maxWidth / w,
          h: pitch / h,
        });
      }
      ctx.fillText(line, x + pitch * 0.12, y - pitch * 0.22);
      y += pitch;
    }
    ctx.textBaseline = 'top';
  };

  for (const block of face.blocks) {
    if (block.type === 'gap') {
      y += gridTop === 0 ? h * 0.028 : pitch;
      continue;
    }
    if (block.type === 'kicker') {
      ctx.fillStyle = '#3e6d58';
      ctx.font = `400 ${Math.round(w * 0.034)}px "Shippori Mincho", serif`;
      ctx.fillText(block.text, x, y);
      y += w * 0.07;
      ctx.fillStyle = '#241f1a';
      continue;
    }
    if (block.type === 'title') {
      ctx.font = `700 ${Math.round(w * 0.092)}px "Shippori Mincho", serif`;
      y = drawWrapped(ctx, block.text, x, y, maxWidth, w * 0.11);
      y += w * 0.02;
      ctx.strokeStyle = '#c9b89a';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(x, y);
      ctx.lineTo(x + maxWidth * 0.38, y);
      ctx.stroke();
      y += w * 0.04;
      ctx.fillStyle = '#241f1a';
      continue;
    }
    if (block.type === 'heading') {
      writeOnRule(
        block.text,
        `700 ${Math.round(w * 0.042)}px "Shippori Mincho", serif`,
        block.href
      );
      continue;
    }
    writeOnRule(
      block.text,
      `400 ${Math.round(w * 0.04)}px "Shippori Mincho", serif`,
      block.href
    );
  }

  return mergeHits(hits);
}

export async function createBookTextures(): Promise<BookTextures> {
  await document.fonts.load('400 48px "Shippori Mincho"');
  await document.fonts.load('700 120px "Shippori Mincho"');
  await document.fonts.ready;

  const [hane, feather] = await Promise.all([
    loadOptional('/hane.png'),
    loadOptional('/feather_green.png'),
  ]);

  const cover = canvas2d(COVER_TEX_W, COVER_TEX_H);
  drawCover(cover.ctx, hane, feather);

  const intro = canvas2d(COVER_TEX_W, COVER_TEX_H);
  drawFace(intro.ctx, leaves[0].back, 'left');

  const leafTextures: LeafTextures[] = [
    {
      id: leaves[0].id,
      front: toTexture(cover.canvas),
      back: toTexture(intro.canvas, true),
    },
  ];
  let workHits: LineHit[] = [];

  for (const leaf of leaves.slice(1)) {
    const front = canvas2d(PAGE_TEX_W, PAGE_TEX_H);
    const back = canvas2d(PAGE_TEX_W, PAGE_TEX_H);
    drawFace(front.ctx, leaf.front, 'right');
    const backHits = drawFace(back.ctx, leaf.back, 'left');
    if (leaf.back.id === 'work') workHits = backHits;
    leafTextures.push({
      id: leaf.id,
      front: toTexture(front.canvas),
      back: toTexture(back.canvas, true),
    });
  }

  const end = canvas2d(PAGE_TEX_W, PAGE_TEX_H);
  drawFace(end.ctx, lastPage, 'right');

  const wood = canvas2d(1024, 1024);
  drawWood(wood.ctx, 1024, 1024);

  const shadow = canvas2d(512, 512);
  drawShadow(shadow.ctx, 512, 512);

  const woodTex = toTexture(wood.canvas);
  woodTex.wrapS = THREE.RepeatWrapping;
  woodTex.wrapT = THREE.RepeatWrapping;
  woodTex.repeat.set(3, 3);

  return {
    leaves: leafTextures,
    last: toTexture(end.canvas),
    wood: woodTex,
    shadow: toTexture(shadow.canvas),
    workHits,
  };
}

export function disposeBookTextures(textures: BookTextures) {
  for (const leaf of textures.leaves) {
    leaf.front.dispose();
    leaf.back.dispose();
  }
  textures.last.dispose();
  textures.wood.dispose();
  textures.shadow.dispose();
}
