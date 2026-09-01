import sharp from "sharp";

async function processDecal(input, output) {
  const img = sharp(input);
  const { data, info } = await img
    .raw()
    .ensureAlpha()
    .toBuffer({ resolveWithObject: true });
  const { width, height, channels } = info;
  const out = Buffer.alloc(width * height * 4);
  const [tr, tg, tb] = [0xc8, 0x10, 0x2e]; // --color-brand-red

  for (let i = 0; i < width * height; i++) {
    const idx = i * channels;
    const r = data[idx];
    const g = data[idx + 1];
    const b = data[idx + 2];
    const redness = r - Math.max(g, b);
    let alpha = ((redness - 15) / (150 - 15)) * 255;
    alpha = Math.max(0, Math.min(255, alpha));

    const oi = i * 4;
    out[oi] = tr;
    out[oi + 1] = tg;
    out[oi + 2] = tb;
    out[oi + 3] = Math.round(alpha);
  }

  await sharp(out, { raw: { width, height, channels: 4 } })
    .png()
    .trim()
    .toFile(output);

  console.log(`${input} -> ${output} ok`);
}

await Promise.all([
  processDecal(
    "public/imagens/decalque01.jpg",
    "public/imagens/decal-locs-01.png",
  ),
  processDecal(
    "public/imagens/decalque02.jpg",
    "public/imagens/decal-locs-02.png",
  ),
]);
