import path from 'path';
import fs from 'fs';
import { ResolvedConfig } from 'vite';

interface BuildPaths {
  rollupInput: string;
  outDir: string;
  assetsDir: string;
}

export function resolveRollupPaths(config: ResolvedConfig | any): BuildPaths {
  let input: string | undefined;

  const rollupInputOption = config?.build?.rollupOptions?.input;

  if (!rollupInputOption || rollupInputOption === 'index.html') {
    // если явно не указано — проверяем main.ts / main.js
    const tsEntry = path.resolve(process.cwd(), 'src/main.ts');
    const jsEntry = path.resolve(process.cwd(), 'src/main.js');

    if (fs.existsSync(tsEntry)) {
      input = tsEntry;
    } else if (fs.existsSync(jsEntry)) {
      input = jsEntry;
    } else {
      // fallback если оба отсутствуют
      input = path.resolve(process.cwd(), 'src/main.ts');
    }
  } else {
    input = path.resolve(rollupInputOption.toString());
  }

  const rollupInput = input.replace(/\\/g, '/');
  const outDir = path.resolve(config.build?.outDir ?? 'dist');
  const assetsDir = path.resolve(
    config.build?.assetsDir ? config.build.assetsDir : 'assets'
  );

  return { rollupInput, outDir, assetsDir };
}
