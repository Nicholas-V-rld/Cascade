import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { Resvg } from "@resvg/resvg-js";
import sharp from "sharp";
import pngToIco from "png-to-ico";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, "..");
const publicDir = join(root, "public");
const iconsDir = join(publicDir, "icons");
const iconSvg = join(publicDir, "icon.svg");

const TEAL = "#0D9488";

function renderSvg(size) {
  const svg = readFile(iconSvg, "utf8").then((content) => {
    const resvg = new Resvg(content, {
      fitTo: { mode: "width", value: size },
    });
    return resvg.render().asPng();
  });
  return svg;
}

async function main() {
  await mkdir(iconsDir, { recursive: true });

  const png192 = await renderSvg(192);
  const png512 = await renderSvg(512);
  const png180 = await renderSvg(180);
  const png410 = await renderSvg(410);

  await writeFile(join(iconsDir, "icon-192.png"), png192);
  await writeFile(join(iconsDir, "icon-512.png"), png512);
  await writeFile(join(publicDir, "apple-touch-icon.png"), png180);

  const maskable = await sharp({
    create: {
      width: 512,
      height: 512,
      channels: 4,
      background: TEAL,
    },
  })
    .composite([{ input: png410, gravity: "center" }])
    .png()
    .toBuffer();

  await writeFile(join(iconsDir, "maskable-512.png"), maskable);

  const favicon16 = await sharp(png512).resize(16, 16).png().toBuffer();
  const favicon32 = await sharp(png512).resize(32, 32).png().toBuffer();
  const favicon48 = await sharp(png512).resize(48, 48).png().toBuffer();

  const ico = await pngToIco([favicon16, favicon32, favicon48]);
  await writeFile(join(publicDir, "favicon.ico"), ico);

  console.log("Icons generated in public/icons/");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
