import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { VitePWA } from "vite-plugin-pwa";
export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: "autoUpdate",
      includeAssets: ["icon.svg", "icon-192.png", "icon-512.png"],
      manifest: {
        name: "漫游搭子 · Roamio",
        short_name: "漫游搭子",
        description: "把世界变成你的旅行回忆",
        theme_color: "#147d65",
        background_color: "#f8f9f5",
        display: "standalone",
        icons: [
          {
            src: "/icon-192.png",
            sizes: "192x192",
            type: "image/png",
            purpose: "any",
          },
          {
            src: "/icon-512.png",
            sizes: "512x512",
            type: "image/png",
            purpose: "any maskable",
          },
          {
            src: "/icon.svg",
            sizes: "any",
            type: "image/svg+xml",
            purpose: "any",
          },
        ],
      },
      workbox: {
        maximumFileSizeToCacheInBytes: 4000000,
        globPatterns: ["**/*.{js,css,html,svg,png}"],
        navigateFallback: "index.html",
      },
    }),
  ],
  build: { chunkSizeWarningLimit: 1700 },
});
