import * as esbuild from 'esbuild';
import { copyFile, mkdir, cp, readFile, writeFile } from 'fs/promises';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const rootDir = resolve(__dirname, '..');
const distDir = resolve(rootDir, 'dist');

async function build() {
  // Clean dist directory
  console.log('Building Chrome Extension...');
  
  // Build entry points
  await esbuild.build({
    entryPoints: {
      contentScript: resolve(rootDir, 'src/content/contentScript.ts'),
      background: resolve(rootDir, 'src/background/background.ts'),
      options: resolve(rootDir, 'src/options/options.ts'),
    },
    bundle: true,
    outdir: distDir,
    format: 'iife',
    sourcemap: true,
    target: ['chrome91'],
    minify: false,
    tsconfig: resolve(rootDir, 'tsconfig.json'),
    define: {
      'process.env.NODE_ENV': '"production"',
    },
    // Ensure chrome API is accessible
    platform: 'browser',
    globalName: 'ChromeExtension',
  });
  
  console.log('✓ Built JavaScript files');
  
  // Copy static files
  await copyFile(
    resolve(rootDir, 'public/manifest.json'),
    resolve(distDir, 'manifest.json')
  );
  
  await copyFile(
    resolve(rootDir, 'src/options/options.html'),
    resolve(distDir, 'options.html')
  );
  
  // Copy assets
  await cp(
    resolve(rootDir, 'public/assets'),
    resolve(distDir, 'assets'),
    { recursive: true }
  );

  // Optional portable pack; default avatar mapping stays on the original SVGs.
  const states = ['idle', 'idle2', 'idle3', 'thinking', 'happy', 'sad', 'excited', 'confused', 'angry', 'surprised', 'worried', 'neutral'];
  const images = Object.fromEntries(await Promise.all(states.map(async (state) => [
    state,
    `data:image/png;base64,${(await readFile(resolve(rootDir, `public/assets/avatar/anya/${state}.png`))).toString('base64')}`,
  ])));
  await mkdir(resolve(distDir, 'packs'), { recursive: true });
  await writeFile(resolve(distDir, 'packs/anya.avatar-pack.json'), JSON.stringify({
    format: 'ai-avatar-pack', version: 1, name: '間諜家家酒 安妮雅', images,
  }));
  
  console.log('✓ Copied static files');
  console.log('✅ Build complete!');
}

build().catch((error) => {
  console.error('Build failed:', error);
  process.exit(1);
});
