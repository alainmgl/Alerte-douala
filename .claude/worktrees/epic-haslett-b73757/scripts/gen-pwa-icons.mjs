// Génère les PNG PWA depuis les SVG sources.
// Lancement : node scripts/gen-pwa-icons.mjs
// (Re)génère public/icon-192.png, icon-512.png, icon-maskable-192.png, icon-maskable-512.png

import { readFile, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import sharp from 'sharp';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PUBLIC = path.resolve(__dirname, '../public');

const TARGETS = [
  { from: 'icon.svg', to: 'icon-192.png', size: 192 },
  { from: 'icon.svg', to: 'icon-512.png', size: 512 },
  { from: 'icon-maskable.svg', to: 'icon-maskable-192.png', size: 192 },
  { from: 'icon-maskable.svg', to: 'icon-maskable-512.png', size: 512 },
];

for (const { from, to, size } of TARGETS) {
  const svg = await readFile(path.join(PUBLIC, from));
  const png = await sharp(svg, { density: 384 })
    .resize(size, size, { fit: 'contain', background: { r: 250, g: 246, b: 240, alpha: 1 } })
    .png()
    .toBuffer();
  await writeFile(path.join(PUBLIC, to), png);
  console.log(`✓ ${to} (${size}×${size}, ${(png.length / 1024).toFixed(1)} KB)`);
}
