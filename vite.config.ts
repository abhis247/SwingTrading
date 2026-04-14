import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vite';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  plugins: [
    sveltekit(),

    VitePWA({
      registerType: 'autoUpdate',
      injectRegister: 'auto',

      devOptions: {
        enabled: true
      },

      workbox: {
        navigateFallback: '/page/home', // 🔥 important for SPA
        runtimeCaching: [
          {
            urlPattern: ({ request }) => request.destination === 'image',
            handler: 'CacheFirst',
            options: {
              cacheName: 'images',
              expiration: {
                maxEntries: 100,
                maxAgeSeconds: 60 * 60 * 24 * 30 // 30 days
              }
            }
          }
        ]
      },

      manifest: {
        id: '/',
        name: 'Swing trading',
        short_name: 'Swing trading',
        description: 'My PWA App',

        start_url: '/', // 🔥 FIXED
        scope: '/',              // 🔥 REQUIRED

        display: 'standalone',
        display_override: ['window-controls-overlay', 'standalone'],

        theme_color: '#d4a017',
        background_color: '#0a0800',

        categories: ['finance', 'education'],

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
          },
            {
            src: '/icon-512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'maskable any' // 🔥 important
  }
        ]
      }
    })

  ]
});

















// import { sveltekit } from '@sveltejs/kit/vite';
// import { defineConfig } from 'vite';
// import { VitePWA } from 'vite-plugin-pwa';

// export default defineConfig({
//   plugins: [
//     sveltekit(),

//     VitePWA({
//       registerType: 'autoUpdate',

//       injectRegister: 'auto',   // 🔥 REQUIRED

//       devOptions: {
//         enabled: true           // 🔥 REQUIRED FOR DEV
//       },

//       manifest: {
//         name: 'Swing trading',
//         short_name: 'Swing trading',
//         description: 'My PWA App',
//         theme_color: '#d4a017',       // 🟡 GOLD (status bar)
//         background_color: '#0a0800',  // ⚫ DARK (no white flash)
//         display: 'standalone',
//         start_url: '/',

//         icons: [
//           {
//             src: '/icon-192.png',
//             sizes: '192x192',
//             type: 'image/png'
//           },
//           {
//             src: '/icon-512.png',
//             sizes: '512x512',
//             type: 'image/png'
//           }
//         ]
//       }
//     })

//   ]
// });