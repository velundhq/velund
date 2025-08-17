import fs from 'fs';
import path from 'path';

export default function buildPlugin({
  templatesDir,
  distDir,
}: iTwigPluginConfig) {
  return {
    buildStart() {
      console.log('Building twig components...');
      // Можно тут собирать PHP классы, копировать twig и ассеты
      const twigFiles = fs
        .readdirSync(templatesDir)
        .filter((f) => f.endsWith('.twig'));
      const outputDir = path.resolve(distDir, 'templates');
      if (!fs.existsSync(outputDir))
        fs.mkdirSync(outputDir, { recursive: true });

      for (const file of twigFiles) {
        const src = path.join(templatesDir, file);
        const dest = path.join(outputDir, file);
        fs.copyFileSync(src, dest);
      }
    },
  };
}
