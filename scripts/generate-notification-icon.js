/**
 * Android zahteva za majhno ikono obvestil belo siluetno PNG s prosojnostjo (96x96).
 * Naredimo jo iz ospredja adaptivne ikone app-a (assets/adaptive-icon.png): ta je bel žebelj/pin
 * z oranžnim likom osebe znotraj. Obrežemo ga na vsebino, belino piksla spremenimo v neprosojnost
 * (bel pin ostane, oranžni lik postane izrez) in vstavimo na prosojno platno 96x96.
 *
 * Zagon: node scripts/generate-notification-icon.js
 */
const path = require('path');
const sharp = require('sharp');

const SIZE = 96;
const GLYPH = 76; // pin zavzame ~4/5 platna, ostalo je rob
const ALPHA_MIN = 128; // piksli pod to alfo štejejo za ozadje
const FIGURE_BLUE = 43; // modri kanal oranžnega lika (#C0562B) – manj modre = bolj "izrez"

(async () => {
  const source = path.join(__dirname, '..', 'assets', 'adaptive-icon.png');
  const target = path.join(__dirname, '..', 'assets', 'notification-icon.png');

  const { data, info } = await sharp(source).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  const { width, height } = info;

  let minX = width, minY = height, maxX = -1, maxY = -1;
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const i = (y * width + x) * 4;
      const alpha = data[i + 3];
      if (alpha >= ALPHA_MIN) {
        if (x < minX) minX = x;
        if (x > maxX) maxX = x;
        if (y < minY) minY = y;
        if (y > maxY) maxY = y;
      }
      // Belina (0 = oranžna, 1 = bela) določa neprosojnost: oranžen lik postane izrez v belem pinu.
      const whiteness = Math.min(1, Math.max(0, (data[i + 2] - FIGURE_BLUE) / (255 - FIGURE_BLUE)));
      data[i] = 255;
      data[i + 1] = 255;
      data[i + 2] = 255;
      data[i + 3] = Math.round(alpha * whiteness);
    }
  }
  if (maxX < 0) throw new Error('V adaptive-icon.png ni najti vsebine.');

  const glyph = await sharp(data, { raw: { width, height, channels: 4 } })
    .extract({ left: minX, top: minY, width: maxX - minX + 1, height: maxY - minY + 1 })
    .resize(GLYPH, GLYPH, { fit: 'inside' })
    .png()
    .toBuffer();

  await sharp({ create: { width: SIZE, height: SIZE, channels: 4, background: { r: 0, g: 0, b: 0, alpha: 0 } } })
    .composite([{ input: glyph, gravity: 'center' }])
    .png()
    .toFile(target);
  console.log('Zapisano', path.relative(process.cwd(), target));
})();
