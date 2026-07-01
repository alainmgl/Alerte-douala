import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      injectRegister: 'auto',
      includeAssets: [
        'favicon.svg',
        'icon.svg',
        'icon-maskable.svg',
        'icon-192.png',
        'icon-512.png',
        'icon-maskable-192.png',
        'icon-maskable-512.png',
      ],
      manifest: {
        name: 'Alerte Douala',
        short_name: 'Alerte Douala',
        description:
          "Veille citoyenne des catastrophes naturelles à Douala — signalez, suivez, protégez.",
        lang: 'fr',
        dir: 'ltr',
        start_url: '/',
        scope: '/',
        display: 'standalone',
        orientation: 'portrait',
        background_color: '#FBF8F3',
        theme_color: '#2F5D4A',
        categories: ['utilities', 'news', 'social'],
        icons: [
          // PNG en premier : exigence Chrome desktop pour montrer le bouton "Installer".
          {
            src: '/icon-192.png',
            sizes: '192x192',
            type: 'image/png',
            purpose: 'any',
          },
          {
            src: '/icon-512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any',
          },
          {
            src: '/icon-maskable-192.png',
            sizes: '192x192',
            type: 'image/png',
            purpose: 'maskable',
          },
          {
            src: '/icon-maskable-512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'maskable',
          },
          // SVG en complément (scalable pour iOS/Safari).
          {
            src: '/icon.svg',
            sizes: 'any',
            type: 'image/svg+xml',
            purpose: 'any',
          },
          {
            src: '/icon-maskable.svg',
            sizes: 'any',
            type: 'image/svg+xml',
            purpose: 'maskable',
          },
        ],
        shortcuts: [
          {
            name: 'Signaler une catastrophe',
            short_name: 'Signaler',
            url: '/signaler',
            description: 'Envoyer un nouveau signalement à la communauté.',
          },
          {
            name: 'Voir les alertes',
            short_name: 'Alertes',
            url: '/alertes',
            description: 'Consulter les alertes validées en temps réel.',
          },
          {
            name: 'Carte des risques',
            short_name: 'Carte',
            url: '/carte',
            description: 'Visualiser les zones à risque de Douala.',
          },
        ],
      },
      workbox: {
        // Précache de l'app shell (CSS/JS/HTML générés par le build).
        globPatterns: ['**/*.{js,css,html,svg,png,ico,webp,woff2}'],
        // Greffe nos handlers Web Push dans le service worker généré.
        importScripts: ['/sw-push.js'],
        // Stratégies runtime pour les ressources externes et l'API.
        runtimeCaching: [
          {
            // API : network-first avec fallback cache si offline.
            urlPattern: ({ url }) => url.pathname.startsWith('/api/'),
            handler: 'NetworkFirst',
            options: {
              cacheName: 'api-cache',
              networkTimeoutSeconds: 5,
              expiration: {
                maxEntries: 100,
                maxAgeSeconds: 60 * 60 * 24, // 24 h
              },
              cacheableResponse: { statuses: [0, 200] },
            },
          },
          {
            // Tuiles OpenStreetMap : cache-first (les tuiles ne changent pas).
            urlPattern: /^https:\/\/[abc]\.tile\.openstreetmap\.org\/.*$/,
            handler: 'CacheFirst',
            options: {
              cacheName: 'osm-tiles',
              expiration: {
                maxEntries: 500,
                maxAgeSeconds: 60 * 60 * 24 * 30, // 30 j
              },
              cacheableResponse: { statuses: [0, 200] },
            },
          },
          {
            // Fonts Google : cache-first.
            urlPattern: /^https:\/\/fonts\.(googleapis|gstatic)\.com\/.*$/,
            handler: 'CacheFirst',
            options: {
              cacheName: 'google-fonts',
              expiration: {
                maxEntries: 30,
                maxAgeSeconds: 60 * 60 * 24 * 365, // 1 an
              },
              cacheableResponse: { statuses: [0, 200] },
            },
          },
        ],
        // Navigation fallback : sert index.html en offline pour les routes SPA.
        navigateFallback: '/index.html',
        navigateFallbackDenylist: [/^\/api\//],
      },
      devOptions: {
        // Activé pour que la PWA soit installable depuis `npm run dev` (port 5173).
        // Note : si vous voyez des assets cachés bizarres pendant le développement,
        // ouvrez les DevTools → Application → Service Workers → Unregister, puis recharger.
        enabled: true,
        type: 'module',
        navigateFallback: 'index.html',
      },
    }),
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  css: {
    modules: {
      localsConvention: 'camelCase',
    },
  },
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:4000',
        changeOrigin: true,
      },
    },
  },
  preview: {
    proxy: {
      '/api': {
        target: 'http://localhost:4000',
        changeOrigin: true,
      },
    },
  },
});
