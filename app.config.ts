import { defineConfig } from "@solidjs/start/config";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig({
  ssr: false, // Client-side only SPA
  vite: {
    plugins: [tailwindcss()],
    build: {
      rollupOptions: {
        output: {
          manualChunks(id) {
            if (id.includes('node_modules/gsap/')) return 'gsap';
            if (id.includes('node_modules/howler/')) return 'audio';
            if (id.includes('node_modules/earcut/')) return 'vendor';
            if (id.includes('node_modules/eventemitter3/')) return 'vendor';
            if (id.includes('node_modules/tiny-lru/')) return 'vendor';
            if (id.includes('node_modules/parse-svg-path/')) return 'vendor';
            if (id.includes('node_modules/@pixi/colord/')) return 'vendor';
          }
        }
      }
    }
  }
});
