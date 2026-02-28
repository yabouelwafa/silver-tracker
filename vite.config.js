import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      manifest: {
        name: 'Silver Tracker',
        short_name: 'Silver',
        description: 'Track your silver holdings and spot prices',
        start_url: '/',
        display: 'standalone',
        background_color: '#f5f5f7',
        theme_color: '#007AFF',
        icons: [
          { src: '/icons/icon-192.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
          { src: '/icons/icon-180.png', sizes: '180x180', type: 'image/png', purpose: 'apple-touch-icon' },
          { src: '/icons/icon-192.png', sizes: '192x192', type: 'image/png', purpose: 'maskable' }
        ]
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg,woff2}'],
        maximumFileSizeToCacheInBytes: 5 * 1024 * 1024,
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/www\.alphavantage\.co\/query.*/i,
            handler: 'NetworkFirst',
            options: {
              cacheName: 'alphavantage-api',
              networkTimeoutSeconds: 10,
              expiration: { maxEntries: 10, maxAgeSeconds: 300 }
            }
          }
        ]
      }
    })
  ]
})
