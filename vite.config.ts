import { defineConfig } from 'vite';
import { resolve } from 'path';
import { viteStaticCopy } from 'vite-plugin-static-copy';

export default defineConfig({
  build: {
    outDir: 'dist',
    rollupOptions: {
      input: {
        contentScript: resolve(__dirname, 'src/content/contentScript.ts'),
        background: resolve(__dirname, 'src/background/background.ts'),
        options: resolve(__dirname, 'src/options/options.ts'),
      },
      output: {
        format: 'es',
        entryFileNames: '[name].js',
        chunkFileNames: 'chunks/[name].js',
        assetFileNames: (assetInfo) => {
          if (assetInfo.name === 'options.html') {
            return '[name].[ext]';
          }
          return 'assets/[name].[ext]';
        },
      },
    },
    minify: false, // Easier to debug, can enable for production
    sourcemap: true,
  },
  plugins: [
    viteStaticCopy({
      targets: [
        {
          src: 'public/manifest.json',
          dest: '.',
        },
        {
          src: 'public/assets/**/*',
          dest: 'assets',
        },
        {
          src: 'src/options/options.html',
          dest: '.',
        },
      ],
    }),
  ],
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src'),
    },
  },
});
