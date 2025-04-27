import sharp from 'sharp';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const sizes = [16, 32, 48, 128];
const inputFile = join(__dirname, '../public/icon.svg');
const outputDir = join(__dirname, '../public/img');

async function generateIcons() {
  for (const size of sizes) {
    const outputFile = join(outputDir, `icon-${size}.png`);
    await sharp(inputFile)
      .resize(size, size)
      .png()
      .toFile(outputFile);
    console.log(`Generated ${size}x${size} icon`);
  }
}

generateIcons().catch(console.error); 