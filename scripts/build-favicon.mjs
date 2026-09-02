import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";

const scriptDirectory = dirname(fileURLToPath(import.meta.url));
const repositoryRoot = resolve(scriptDirectory, "..");
const sourcePath = resolve(
  repositoryRoot,
  process.argv[2] || "assets/source/luminary-bulb-favicon-master.png",
);
const outputDirectory = resolve(repositoryRoot, "public/favicons");
const sizes = [16, 32, 48, 180, 512];

function createIco(images) {
  const headerSize = 6;
  const entrySize = 16;
  const dataOffset = headerSize + entrySize * images.length;
  const header = Buffer.alloc(headerSize);
  header.writeUInt16LE(0, 0);
  header.writeUInt16LE(1, 2);
  header.writeUInt16LE(images.length, 4);

  let offset = dataOffset;
  const entries = images.map(({ size, buffer }) => {
    const entry = Buffer.alloc(entrySize);
    entry.writeUInt8(size >= 256 ? 0 : size, 0);
    entry.writeUInt8(size >= 256 ? 0 : size, 1);
    entry.writeUInt8(0, 2);
    entry.writeUInt8(0, 3);
    entry.writeUInt16LE(1, 4);
    entry.writeUInt16LE(32, 6);
    entry.writeUInt32LE(buffer.length, 8);
    entry.writeUInt32LE(offset, 12);
    offset += buffer.length;
    return entry;
  });

  return Buffer.concat([
    header,
    ...entries,
    ...images.map(({ buffer }) => buffer),
  ]);
}

const source = await readFile(sourcePath);
const metadata = await sharp(source).metadata();

if (!metadata.width || !metadata.height) {
  throw new Error("The favicon source has no readable dimensions.");
}

await mkdir(outputDirectory, { recursive: true });

const generated = [];
for (const size of sizes) {
  const buffer = await sharp(source)
    .resize(size, size, {
      fit: "contain",
      background: { r: 0, g: 0, b: 0, alpha: 1 },
      kernel: sharp.kernel.lanczos3,
    })
    .png({ compressionLevel: 9, palette: false })
    .toBuffer();

  const outputPath = resolve(outputDirectory, `luminary-bulb-${size}.png`);
  await writeFile(outputPath, buffer);
  generated.push({ size, buffer, outputPath });
}

const icoImages = generated.filter(({ size }) => [16, 32, 48].includes(size));
const icoPath = resolve(repositoryRoot, "favicon.ico");
await writeFile(icoPath, createIco(icoImages));

console.log(`Source: ${sourcePath} (${metadata.width}x${metadata.height})`);
for (const { size, buffer, outputPath } of generated) {
  console.log(`PNG ${size}x${size}: ${outputPath} (${buffer.length} bytes)`);
}
console.log(`ICO 16/32/48: ${icoPath}`);
