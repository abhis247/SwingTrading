import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vite';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  plugins: [
    sveltekit(),

    VitePWA({
      registerType: 'autoUpdate',

      injectRegister: 'auto',   // 🔥 REQUIRED

      devOptions: {
        enabled: true           // 🔥 REQUIRED FOR DEV
      },

      manifest: {
        name: 'Swing trading',
        short_name: 'Swing trading',
        description: 'My PWA App',
        theme_color: '#d4a017',       // 🟡 GOLD (status bar)
        background_color: '#0a0800',  // ⚫ DARK (no white flash)
        display: 'standalone',
        start_url: '/',

        icons: [
          {
            src: '/icon-192.png',
            sizes: '192x192',
            type: 'image/png'
          },
          {
            src: '/icon-512.png',
            sizes: '512x512',
            type: 'image/png'
          }
        ]
      }
    })

  ]
});