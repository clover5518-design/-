import fs from 'fs';
import path from 'path';
import zlib from 'zlib';

function crc32(buf) {
  let table = new Uint32Array(256);
  for (let i = 0; i < 256; i++) {
    let c = i;
    for (let k = 0; k < 8; k++) {
      c = (c & 1) ? (0xEDB88320 ^ (c >>> 1)) : (c >>> 1);
    }
    table[i] = c;
  }
  let crc = -1;
  for (let i = 0; i < buf.length; i++) {
    crc = (crc >>> 8) ^ table[(crc ^ buf[i]) & 0xFF];
  }
  return (crc ^ -1) >>> 0;
}

function makeChunk(type, data) {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length, 0);
  const typeBuf = Buffer.from(type, 'ascii');
  const body = Buffer.concat([typeBuf, data]);
  const crcBuf = Buffer.alloc(4);
  crcBuf.writeUInt32BE(crc32(body), 0);
  return Buffer.concat([len, body, crcBuf]);
}

function createPng(width, height, isMaskable = false) {
  // Signature
  const signature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);

  // IHDR
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8; // 8 bits per channel
  ihdr[9] = 6; // RGBA
  ihdr[10] = 0; // deflate
  ihdr[11] = 0; // standard filter
  ihdr[12] = 0; // no interlace

  const ihdrChunk = makeChunk('IHDR', ihdr);

  // Raw image data with filter byte (0) per row
  const rowSize = 1 + width * 4;
  const rawData = Buffer.alloc(rowSize * height);

  const cx = width / 2;
  const cy = height / 2;
  const radius = width * (isMaskable ? 0.46 : 0.44);

  for (let y = 0; y < height; y++) {
    const rowOffset = y * rowSize;
    rawData[rowOffset] = 0; // None filter

    for (let x = 0; x < width; x++) {
      const pxOffset = rowOffset + 1 + x * 4;
      const dx = x - cx;
      const dy = y - cy;
      const dist = Math.sqrt(dx * dx + dy * dy);

      // Background gradient: Elegant midnight indigo (#18181b to #312e81)
      const gradT = y / height;
      let r = Math.round(24 + gradT * 25);
      let g = Math.round(24 + gradT * 22);
      let b = Math.round(27 + gradT * 100);
      let a = 255;

      if (!isMaskable) {
        // Squircle / rounded rect for normal icon
        const cornerR = width * 0.22;
        const qx = Math.max(Math.abs(x - cx) - (cx - cornerR), 0);
        const qy = Math.max(Math.abs(y - cy) - (cy - cornerR), 0);
        const cornerDist = Math.sqrt(qx * qx + qy * qy);
        if (cornerDist > cornerR) {
          a = 0;
        }
      }

      if (a > 0) {
        // Draw Book & Golden Soundwave glyph in center
        // Center book base
        const bookW = width * 0.46;
        const bookH = height * 0.38;
        const bx = Math.abs(x - cx);
        const by = y - cy;

        // Book pages
        if (by > -bookH * 0.35 && by < bookH * 0.55 && bx < bookW * 0.52) {
          const spineDist = Math.abs(bx);
          if (spineDist > width * 0.02) {
            // Book page body (warm cream white/gold)
            r = 250;
            g = 248;
            b = 240;
            // Shading
            if (by > bookH * 0.45) {
              r = 217; g = 119; b = 6; // Amber accent spine base
            }
          } else {
            // Spine division
            r = 180; g = 83; b = 9;
          }
        }

        // Golden soundwaves / translation AI sparkle above book
        if (by < -bookH * 0.25 && by > -height * 0.42) {
          const arcDist = Math.sqrt(dx * dx + (dy + height * 0.05) * (dy + height * 0.05));
          const arcR1 = width * 0.16;
          const arcR2 = width * 0.26;
          if (Math.abs(arcDist - arcR1) < width * 0.025 || Math.abs(arcDist - arcR2) < width * 0.025) {
            if (dy < -height * 0.05) {
              r = 245; g = 158; b = 11; // Amber gold
            }
          }
        }
      }

      rawData[pxOffset] = r;
      rawData[pxOffset + 1] = g;
      rawData[pxOffset + 2] = b;
      rawData[pxOffset + 3] = a;
    }
  }

  const compressed = zlib.deflateSync(rawData, { level: 9 });
  const idatChunk = makeChunk('IDAT', compressed);
  const iendChunk = makeChunk('IEND', Buffer.alloc(0));

  return Buffer.concat([signature, ihdrChunk, idatChunk, iendChunk]);
}

const outDir = path.resolve('public');
if (!fs.existsSync(outDir)) {
  fs.mkdirSync(outDir, { recursive: true });
}

fs.writeFileSync(path.join(outDir, 'pwa-192x192.png'), createPng(192, 192, false));
fs.writeFileSync(path.join(outDir, 'pwa-512x512.png'), createPng(512, 512, false));
fs.writeFileSync(path.join(outDir, 'pwa-maskable-512x512.png'), createPng(512, 512, true));
fs.writeFileSync(path.join(outDir, 'apple-touch-icon.png'), createPng(180, 180, false));
fs.writeFileSync(path.join(outDir, 'favicon.ico'), createPng(64, 64, false));

// High-fidelity SVG icon for browser tabs & vector scaling
const svgContent = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#1e1b4b" />
      <stop offset="50%" stop-color="#312e81" />
      <stop offset="100%" stop-color="#4338ca" />
    </linearGradient>
    <linearGradient id="gold" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#fbbf24" />
      <stop offset="100%" stop-color="#d97706" />
    </linearGradient>
  </defs>
  <rect width="512" height="512" rx="128" fill="url(#bg)" />
  <g transform="translate(100, 110)">
    <!-- Sound Waves / Translation Sparkle -->
    <path d="M 156 30 C 120 30 90 60 90 90" stroke="url(#gold)" stroke-width="16" stroke-linecap="round" fill="none" />
    <path d="M 156 0 C 100 0 55 45 55 100" stroke="url(#gold)" stroke-width="16" stroke-linecap="round" fill="none" opacity="0.6" />
    <path d="M 156 30 C 192 30 222 60 222 90" stroke="url(#gold)" stroke-width="16" stroke-linecap="round" fill="none" />
    <path d="M 156 0 C 212 0 257 45 257 100" stroke="url(#gold)" stroke-width="16" stroke-linecap="round" fill="none" opacity="0.6" />
    <!-- Book Left Page -->
    <path d="M 156 140 C 100 130 40 145 20 155 L 20 270 C 40 260 100 245 156 255 Z" fill="#f8fafc" />
    <!-- Book Right Page -->
    <path d="M 156 140 C 212 130 272 145 292 155 L 292 270 C 272 260 212 245 156 255 Z" fill="#e2e8f0" />
    <!-- Center Spine Accent -->
    <path d="M 156 140 L 156 255" stroke="url(#gold)" stroke-width="8" stroke-linecap="round" />
    <!-- Voice Wave Dots -->
    <circle cx="156" cy="90" r="14" fill="#fbbf24" />
    <rect x="50" y="190" width="70" height="8" rx="4" fill="#94a3b8" />
    <rect x="50" y="210" width="55" height="8" rx="4" fill="#94a3b8" />
    <rect x="185" y="190" width="75" height="8" rx="4" fill="#64748b" />
    <rect x="185" y="210" width="60" height="8" rx="4" fill="#64748b" />
  </g>
</svg>`;

fs.writeFileSync(path.join(outDir, 'icon.svg'), svgContent);
console.log('Successfully generated all PWA icons in /public!');
