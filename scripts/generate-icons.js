#!/usr/bin/env node
/**
 * Generira app ikone iz assets/icon-source.svg, z barvo iz src/theme/colors.ts
 * (colors.primary) namesto placeholder barve v izvornem SVG-ju.
 *
 * Poganjaj z: node scripts/generate-icons.js
 * Ustvari v assets/:
 *   - icon.png            1024x1024 – glavna app ikona (celoten SVG, z ozadjem)
 *   - adaptive-icon.png   1024x1024 – Android adaptive icon foreground (brez ozadja,
 *                         silhueta zmanjšana na ~66% in centrirana – "safe zone")
 *   - splash-icon.png     400x400   – manjša verzija za splash screen (brez ozadja)
 *   - favicon.png         48x48     – web favicon (celoten SVG, z ozadjem)
 */
const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

const ROOT = path.join(__dirname, '..');
const ASSETS_DIR = path.join(ROOT, 'assets');
const SOURCE_SVG_PATH = path.join(ASSETS_DIR, 'icon-source.svg');
const COLORS_FILE = path.join(ROOT, 'src', 'theme', 'colors.ts');

/** Prebere `primary` barvo neposredno iz src/theme/colors.ts (brez TS kompilacije). */
function getPrimaryColor() {
  const content = fs.readFileSync(COLORS_FILE, 'utf8');
  const match = content.match(/primary:\s*'(#[0-9a-fA-F]{6})'/);
  if (!match) {
    throw new Error('Ni bilo mogoče najti "primary" barve v src/theme/colors.ts');
  }
  return match[1];
}

/** Zamenja vse ne-bele hex barve v SVG-ju s primarno barvo iz teme (bela silhueta ostane bela). */
function applyPrimaryColor(svg, primaryColor) {
  return svg.replace(/#[0-9a-fA-F]{6}/g, (hex) => (hex.toUpperCase() === '#FFFFFF' ? hex : primaryColor));
}

/**
 * Odstrani ozadje (prvi <rect>) in preostale oblike zmanjša za `scale` ter jih
 * centrira znotraj istega viewBoxa – uporablja se za adaptive-icon/splash,
 * kjer ozadje ne sme biti del slike (transparentno + zmanjšana "safe zone").
 */
function foregroundOnlySvg(svg, scale) {
  const withoutBackground = svg.replace(/<rect[^>]*\/>/, '');
  const viewBoxMatch = svg.match(/viewBox="0 0 (\d+) (\d+)"/);
  const size = viewBoxMatch ? Number(viewBoxMatch[1]) : 200;
  const center = size / 2;
  return withoutBackground
    .replace(
      /(<svg[^>]*>)/,
      `$1<g transform="translate(${center} ${center}) scale(${scale}) translate(${-center} ${-center})">`,
    )
    .replace('</svg>', '</g></svg>');
}

async function renderPng(svg, size, outPath) {
  await sharp(Buffer.from(svg), { density: 384 })
    .resize(size, size)
    .png()
    .toFile(outPath);
  console.log(`✓ ${path.relative(ROOT, outPath)} (${size}x${size})`);
}

async function main() {
  const primaryColor = getPrimaryColor();
  console.log(`Primarna barva iz teme: ${primaryColor}`);

  const rawSvg = fs.readFileSync(SOURCE_SVG_PATH, 'utf8');
  const coloredSvg = applyPrimaryColor(rawSvg, primaryColor);
  const foregroundSvg66 = foregroundOnlySvg(coloredSvg, 0.66);
  const foregroundSvg80 = foregroundOnlySvg(coloredSvg, 0.8);

  fs.mkdirSync(ASSETS_DIR, { recursive: true });

  await renderPng(coloredSvg, 1024, path.join(ASSETS_DIR, 'icon.png'));
  await renderPng(foregroundSvg66, 1024, path.join(ASSETS_DIR, 'adaptive-icon.png'));
  await renderPng(foregroundSvg80, 400, path.join(ASSETS_DIR, 'splash-icon.png'));
  await renderPng(coloredSvg, 48, path.join(ASSETS_DIR, 'favicon.png'));

  console.log(`\nVse ikone ustvarjene v ${path.relative(ROOT, ASSETS_DIR)}/`);
}

main().catch((err) => {
  console.error('Napaka pri generiranju ikon:', err);
  process.exit(1);
});
