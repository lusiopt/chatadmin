import { readdir, readFile } from "fs/promises";
import { join } from "path";
import sharp from "sharp";

const iconsDir = "./public/icons";
const outputDir = "./public/icons";

console.log("Convertendo SVGs para PNG...\n");

const files = await readdir(iconsDir);
const svgFiles = files.filter(f => f.endsWith(".svg"));

let count = 0;
for (const file of svgFiles) {
  const pngFile = file.replace(".svg", ".png");
  const svgPath = join(iconsDir, file);
  const pngPath = join(outputDir, pngFile);
  
  try {
    const svgBuffer = await readFile(svgPath);
    await sharp(svgBuffer)
      .resize(256, 256)
      .png()
      .toFile(pngPath);
    
    console.log(`✓ ${file} → ${pngFile}`);
    count++;
  } catch (error) {
    console.error(`✗ Erro ao converter ${file}:`, error.message);
  }
}

console.log(`\n✓ ${count}/${svgFiles.length} ícones convertidos para PNG`);
