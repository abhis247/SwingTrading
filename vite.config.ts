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
        name: 'My App',
        short_name: 'App',
        description: 'My PWA App',
        theme_color: '#000000',
        background_color: '#ffffff',
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