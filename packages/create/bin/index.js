#!/usr/bin/env node
import fs from 'fs';
import path from 'path';
import { execSync, spawnSync } from 'child_process';
import prompts from 'prompts';
import { cyan, green, red, yellow } from 'kolorist';
import stripJsonComments from 'strip-json-comments';

function detectPackageManager() {
  const ua = process.env.npm_config_user_agent || '';
  if (/pnpm/.test(ua)) return 'pnpm';
  if (/yarn/.test(ua)) return 'yarn';
  if (/npm/.test(ua)) return 'npm';
  const execPath = process.env.npm_execpath || '';
  if (execPath.includes('pnpm')) return 'pnpm';
  if (execPath.includes('yarn')) return 'yarn';
  return 'npm';
}

function writeFile(filePath, content) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, content, 'utf8');
}

function generateViteConfig({ language, generator, renderer }) {
  const lines = [];
  lines.push("import { defineConfig } from 'vite';");
  lines.push("import velund from 'velund';");
  lines.push('');

  if (generator === 'php')
    lines.push("import phpGenerator from '@zebrains/velund-php';");
  if (generator === 'python')
    lines.push("import pythonGenerator from '@zebrains/velund-python';");

  if (renderer === 'twig')
    lines.push("import twigRenderer from '@zebrains/velund-twig';");
  if (renderer === 'jinja')
    lines.push("import jinjaRenderer from '@zebrains/velund-jinja';");

  lines.push('');

  lines.push('export default defineConfig({');
  lines.push('  plugins: [velund({');
  lines.push(`    renderer: "${renderer}",`);
  lines.push(`    generator: "${generator}",`);

  lines.push('    renderers: [');
  if (renderer === 'twig') lines.push('      twigRenderer(),');
  if (renderer === 'jinja') lines.push('      jinjaRenderer(),');
  if (renderer === 'html')
    lines.push(
      '      // html renderer is built-in, no external package required'
    );
  lines.push('    ],');

  lines.push('    generators: [');
  if (generator === 'php') lines.push('      phpGenerator(),');
  if (generator === 'python') lines.push('      pythonGenerator(),');
  if (generator === 'node') lines.push('      // node generator is built-in');
  lines.push('    ]');

  lines.push('  })],');
  lines.push('});');

  return lines.join('\n');
}

function runCreateVite(pkgManager, projectName, templateName) {
  let cmd, args;

  if (pkgManager === 'pnpm') {
    cmd = 'pnpm';
    args = [
      'dlx',
      'create-vite@latest',
      projectName,
      '--template',
      templateName,
    ];
  } else if (pkgManager === 'yarn') {
    cmd = 'yarn';
    args = ['create', 'vite', projectName, '--template', templateName];
  } else {
    cmd = 'npx';
    args = ['create-vite@latest', projectName, '--template', templateName];
  }

  console.log(cyan('\nRunning create-vite to scaffold a vanilla project...'));
  const res = spawnSync(cmd, args, { stdio: 'inherit', shell: true });
  if (res.error) {
    throw res.error;
  }
  if (res.status !== 0) {
    process.exit(res.status);
  }
}

(async () => {
  console.log(cyan('\n✨ create-velund — Velund project scaffolder\n'));

  const base = await prompts([
    {
      type: 'text',
      name: 'projectName',
      message: 'Project directory / package name:',
      initial: 'my-velund-app',
    },
    {
      type: 'text',
      name: 'version',
      message: 'Version',
      initial: '0.0.1',
    },
    {
      type: 'select',
      name: 'language',
      message: 'Language',
      choices: [
        { title: 'TypeScript', value: 'ts' },
        { title: 'JavaScript', value: 'js' },
      ],
      initial: 0,
    },
    {
      type: 'select',
      name: 'generator',
      message: 'Generator',
      choices: [
        { title: 'node', value: 'node' },
        { title: 'php', value: 'php' },
        { title: 'python', value: 'python' },
      ],
      initial: 0,
    },
  ]);

  if (!base.projectName) {
    console.log(red('Aborted — no project name.'));
    process.exit(1);
  }

  const availableRenderers = [{ title: 'html', value: 'html' }];
  if (['node', 'php'].includes(base.generator))
    availableRenderers.push({ title: 'twig', value: 'twig' });
  if (['node', 'php', 'python'].includes(base.generator))
    availableRenderers.push({ title: 'jinja', value: 'jinja' });

  const rendererResp = await prompts({
    type: 'select',
    name: 'renderer',
    message: 'Template engine (renderer)',
    choices: availableRenderers,
  });

  const opts = { ...base, renderer: rendererResp.renderer };
  const pkgManager = detectPackageManager();
  const targetDir = path.resolve(process.cwd(), opts.projectName);

  console.log(yellow(`\nDetected package manager: ${pkgManager}`));
  console.log(yellow(`Creating project in: ${targetDir}`));

  const templateName = opts.language === 'ts' ? 'vanilla-ts' : 'vanilla';
  try {
    runCreateVite(pkgManager, opts.projectName, templateName);
  } catch (err) {
    console.error(red('\nFailed to run create-vite: '), err.message || err);
    process.exit(1);
  }

  process.chdir(targetDir);
  try {
    const idx = path.join(targetDir, 'index.html');
    if (fs.existsSync(idx)) fs.unlinkSync(idx);

    const pub = path.join(targetDir, 'public');
    if (fs.existsSync(pub)) fs.rmSync(pub, { recursive: true, force: true });
  } catch (e) {}

  const deps = ['velund'];
  if (opts.generator === 'php') deps.push('@zebrains/velund-php');
  if (opts.generator === 'python') deps.push('@zebrains/velund-python');
  if (opts.renderer === 'twig') deps.push('@zebrains/velund-twig');
  if (opts.renderer === 'jinja') deps.push('@zebrains/velund-jinja');

  try {
    if (deps.length) {
      console.log(cyan('\nInstalling velund and selected add-ons...'));
      if (pkgManager === 'pnpm')
        execSync(`pnpm add -D ${deps.join(' ')}`, { stdio: 'inherit' });
      else if (pkgManager === 'yarn')
        execSync(`yarn add -D ${deps.join(' ')}`, { stdio: 'inherit' });
      else
        execSync(`npm install --save-dev ${deps.join(' ')}`, {
          stdio: 'inherit',
        });
    }
  } catch (err) {
    console.error(red('Failed to install dependencies:'), err.message || err);
    process.exit(1);
  }

  const viteConfig = generateViteConfig({
    language: opts.language,
    generator: opts.generator,
    renderer: opts.renderer,
  });
  const viteFileName = `vite.config.${opts.language === 'ts' ? 'ts' : 'js'}`;
  writeFile(path.join(targetDir, viteFileName), viteConfig);

  try {
    const srcDir = path.join(targetDir, 'src');
    if (fs.existsSync(srcDir)) {
      fs.rmSync(srcDir, { recursive: true, force: true });
    }
    const mainFile = path.join(targetDir, 'src', `main.${opts.language}`);
    const mainContent = `import { defineVelundApp } from 'velund/common';\nimport components from 'virtual:velund/components';\n\nexport default defineVelundApp(components, [{path: '/', component: 'Home'}]);\n`;
    writeFile(mainFile, mainContent);

    const routeDir = path.join(targetDir, 'src', 'routes', 'home');
    fs.mkdirSync(routeDir, { recursive: true });

    const templateExt =
      opts.renderer === 'html'
        ? 'html'
        : opts.renderer === 'twig'
          ? 'twig'
          : 'j2';
    const templateFile = path.join(routeDir, `template.${templateExt}`);

    const assetsDir = path.join(targetDir, 'src', 'assets');
    fs.mkdirSync(assetsDir, { recursive: true });

    const mainCssFile = path.join(assetsDir, 'main.css');
    const mainCssContent = `/* Dark modern background */
html, body {
  margin: 0;
  padding: 0;
  height: 100dvh;
  width: 100dvw;
  background: linear-gradient(135deg, #1e1e1e, #2c2c2c);
  color: #f5f5f5;
  display: flex;
  justify-content: center;
  align-items: center;
  font-family: 'Segoe UI', Roboto, sans-serif;
  overflow: hidden;
}

/* container */
.app {
  text-align: center;
  animation: fadeIn 1s ease forwards;
}

/* Pulsing logo */
.app svg {
  width: 200px;
  height: auto;
  animation: pulse 2.5s infinite;
  filter: drop-shadow(0 0 10px rgba(189, 52, 254, 0.5));
}

h1 {
  margin-top: 1.5rem;
  font-size: 2rem;
  font-weight: 600;
  letter-spacing: 1px;
  background: linear-gradient(90deg, #41d1ff, #bd34fe, #f21818);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
}

/* animations */
@keyframes pulse {
  0%, 100% { transform: scale(1); opacity: 1; }
  50% { transform: scale(1.08); opacity: 0.9; }
}

@keyframes fadeIn {
  from { opacity: 0; transform: translateY(20px); }
  to   { opacity: 1; transform: translateY(0); }
}`;
    writeFile(mainCssFile, mainCssContent);

    const templateContent = `<link rel="stylesheet" href="@/assets/main.css">
<div class="app">
  <!-- Velund Logo -->
  <svg width="339" height="305" viewBox="0 0 339 305" fill="none" xmlns="http://www.w3.org/2000/svg">
    <g filter="url(#filter0_d_77_55)">
      <path d="M121.391 190.175C121.072 189.623 120.35 189.029 120.7 188.469C121.05 187.909 121.913 188.126 122.589 188.094C131.825 188.088 141.057 188.147 150.307 188.091C150.89 188.042 151.473 188.176 151.977 188.474C152.48 188.772 152.879 189.218 153.118 189.752L168.788 216.897C169.901 218.823 169.91 218.839 171.056 216.85C177.9 204.982 184.738 193.103 191.57 181.214C197.86 170.234 204.258 159.149 210.707 148.225C211.229 147.519 211.514 146.666 211.521 145.788C211.529 144.91 211.258 144.052 210.748 143.338L187.858 103.686C186.408 101.176 186.408 101.176 189.201 101.163C198.306 101.149 207.398 101.183 216.523 101.094C217.044 101.049 217.566 101.166 218.019 101.428C218.471 101.691 218.832 102.085 219.053 102.56L243.055 144.137C243.397 144.619 243.58 145.195 243.577 145.786C243.575 146.377 243.387 146.952 243.041 147.43C238.796 154.661 234.793 161.983 230.428 169.115C226.226 175.983 222.514 183.116 218.44 190.059C211.257 202.228 204.195 214.496 197.139 226.739C188.595 241.569 183.97 249.616 175.475 264.458C175.436 264.529 175.331 264.713 175.177 264.983C172.842 269.077 166.986 269.085 164.63 265.003L121.391 190.175Z" fill="url(#paint0_linear_77_55)"/>
      <path d="M127.539 29.242L116.366 48.5365C115.094 50.7448 113.754 52.9082 112.575 55.1681C112.371 55.6497 112.016 56.0517 111.563 56.3132C111.11 56.5747 110.584 56.6815 110.065 56.6174C99.8382 56.5852 89.6071 56.6186 79.3668 56.6361L78.5821 56.626C76.1742 56.6478 76.1742 56.6478 77.3593 58.7007L117.469 128.181C117.728 128.737 118.152 129.201 118.684 129.508C119.215 129.815 119.828 129.951 120.439 129.898C136.17 129.826 151.884 129.799 167.582 129.817C169.958 129.813 169.974 129.804 168.767 131.869C164.175 139.848 159.496 147.75 154.984 155.83C154.743 156.359 154.343 156.801 153.839 157.092C153.335 157.383 152.753 157.509 152.174 157.452C136.135 157.379 120.102 157.365 104.076 157.411C103.169 157.408 102.455 157.337 101.908 156.389C91.9523 138.95 81.9721 121.552 71.9673 104.197L33.7969 38.0766C31.5305 34.1506 34.3688 29.2442 38.9016 29.2525C43.6287 29.2611 48.4989 29.2694 49.8535 29.27L84.7211 29.2684L126.415 29.1542C126.791 29.1646 127.166 29.1939 127.539 29.242Z" fill="url(#paint1_linear_77_55)"/>
      <path d="M145.124 87.3048L138.396 75.6511C138.003 75.1176 137.788 74.473 137.783 73.8098C137.779 73.1467 137.984 72.4992 138.371 71.9604C143.603 63.0858 148.752 54.1755 153.901 45.2651C156.512 40.7465 159.196 36.2071 161.601 31.66C161.984 30.7938 162.632 30.0718 163.452 29.5983C164.273 29.1248 165.222 28.9243 166.163 29.0257C177.248 29.1944 188.347 29.207 199.438 29.2038C213.956 29.2429 228.459 29.2202 242.947 29.1358C255.216 29.0702 267.512 29.0655 279.837 29.1217C286.183 29.1176 293.238 29.2318 300.076 29.3117C304.798 29.3669 307.753 34.4996 305.401 38.5959C291.412 62.9577 277.087 88.2445 263.263 112.236C262.812 113.022 262.53 114.322 261.651 114.366C260.772 114.411 260.297 113.042 259.833 112.237L247.07 90.1297C246.531 89.3837 246.238 88.4883 246.231 87.5679C246.224 86.6476 246.503 85.7479 247.031 84.9939C252.244 76.1941 257.261 67.2753 262.406 58.4306C263.22 57.0339 263.089 56.6251 261.376 56.6462C254.106 56.6327 246.868 56.601 239.599 56.5875C220.235 56.5884 200.883 56.6458 181.517 56.606C180.737 56.5145 179.949 56.677 179.269 57.0695C178.589 57.462 178.054 58.0635 177.744 58.7845C173.953 65.5631 170.036 72.2676 166.222 78.9332C162.409 85.5988 158.353 92.573 154.408 99.3771C153.43 101.037 153.249 101.015 152.283 99.3412L145.124 87.3048Z" fill="url(#paint2_linear_77_55)"/>
    </g>
    <defs>
      <filter id="filter0_d_77_55" x="0.5" y="0.5" width="338.227" height="304.059" filterUnits="userSpaceOnUse" color-interpolation-filters="sRGB">
        <feFlood flood-opacity="0" result="BackgroundImageFix"/>
        <feColorMatrix in="SourceAlpha" type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0" result="hardAlpha"/>
        <feOffset dy="4"/>
        <feGaussianBlur stdDeviation="16.25"/>
        <feComposite in2="hardAlpha" operator="out"/>
        <feColorMatrix type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0.28 0"/>
        <feBlend mode="plus-darker" in2="BackgroundImageFix" result="effect1_dropShadow_77_55"/>
        <feBlend mode="normal" in="SourceGraphic" in2="effect1_dropShadow_77_55" result="shape"/>
      </filter>
      <linearGradient id="paint0_linear_77_55" x1="33.011" y1="35.4645" x2="168.313" y2="268.061" gradientUnits="userSpaceOnUse">
        <stop stop-color="#41D1FF"/>
        <stop offset="1" stop-color="#BD34FE"/>
      </linearGradient>
      <linearGradient id="paint1_linear_77_55" x1="33.011" y1="35.4645" x2="168.313" y2="268.061" gradientUnits="userSpaceOnUse">
        <stop stop-color="#41D1FF"/>
        <stop offset="1" stop-color="#BD34FE"/>
      </linearGradient>
      <linearGradient id="paint2_linear_77_55" x1="152.051" y1="98.2524" x2="264.006" y2="48.5124" gradientUnits="userSpaceOnUse">
        <stop stop-color="#F3DE3D"/>
        <stop offset="0.278846" stop-color="#F5B62D"/>
        <stop offset="1" stop-color="#F21818"/>
      </linearGradient>
    </defs>
  </svg>

  <h1>Welcome to Velund</h1>
</div>\n`;
    writeFile(templateFile, templateContent);

    const homeFile = path.join(routeDir, `home.vel.${opts.language}`);
    const importTemplatePath = `./template.${templateExt}`;
    const homeContent = `import { defineComponent } from 'velund/common';\nimport template from '${importTemplatePath}';\n\nexport default defineComponent({\n  name: 'Home',\n  template,\n});\n`;
    writeFile(homeFile, homeContent);
  } catch (err) {
    console.error(red('Failed to write src files:'), err.message || err);
    process.exit(1);
  }

  if (opts.language === 'ts') {
    const tsconfigPath = path.join(targetDir, 'tsconfig.json');
    let tsconfig = null;
    if (fs.existsSync(tsconfigPath)) {
      try {
        tsconfig = JSON.parse(
          stripJsonComments(fs.readFileSync(tsconfigPath, 'utf8'))
        );
      } catch (e) {
        tsconfig = null;
      }
    }
    if (!tsconfig) {
      tsconfig = {
        compilerOptions: {
          target: 'ESNext',
          module: 'ESNext',
          moduleResolution: 'Node',
          strict: true,
          esModuleInterop: true,
          skipLibCheck: true,
          types: ['velund/env'],
        },
      };
    } else {
      tsconfig.compilerOptions = tsconfig.compilerOptions || {};
      tsconfig.compilerOptions.types = tsconfig.compilerOptions.types || [];
      if (!tsconfig.compilerOptions.types.includes('velund/env')) {
        tsconfig.compilerOptions.types.push('velund/env');
      }
    }
    fs.writeFileSync(tsconfigPath, JSON.stringify(tsconfig, null, 2), 'utf8');
  }

  console.log(green('\n✔ Project scaffolded successfully!'));
  console.log('\nNext steps:');
  console.log(`  cd ${opts.projectName}`);
  if (pkgManager === 'pnpm') console.log('  pnpm install');
  else if (pkgManager === 'yarn') console.log('  yarn');
  else console.log('  npm install');
  console.log('  pnpm dev   # or npm run dev / yarn dev');

  console.log('\nHappy hacking! 🧩');
})();
