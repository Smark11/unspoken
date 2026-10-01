import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  base: process.env.BASE_PATH ?? '/',
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      // Kokoro loads on demand only when the toggle is on; keep it out of the precache.
      workbox: { globIgnores: ['**/kokoro-*.js', '**/kokoro.worker-*.js', '**/transformers*.js', '**/*.wasm', '**/ort-*.js', '**/*.mjs'] },
      includeAssets: ['icon.svg', 'icon-512.png', 'apple-touch-icon.png'],
      manifest: {
        name: 'Unspoken',
        short_name: 'Unspoken',
        description: 'Words you know. Learn to say them.',
        theme_color: '#f3f4f9',
        background_color: '#f3f4f9',
        display: 'standalone',
        start_url: '.',
        scope: '.',
        icons: [
          { src: 'icon.svg', sizes: 'any', type: 'image/svg+xml', purpose: 'any' },
          { src: 'icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'any maskable' },
        ],
      },
    }),
  ],
  optimizeDeps: { exclude: ['kokoro-js', '@huggingface/transformers'] },
  build: { chunkSizeWarningLimit: 1500 },
  test: { environment: 'node', include: ['src/**/*.test.ts'] },
})
