import { defineConfig, type Plugin } from "vite";
import solid from "vite-plugin-solid";
import tailwindcss from "@tailwindcss/vite";
import { networkInterfaces } from "os";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

function qrcodePlugin(): Plugin {
  return {
    name: "qrcode",
    apply: "serve",
    configureServer(server) {
      // Print QR code after Vite prints its own URLs
      const origPrintUrls = server.printUrls.bind(server);
      server.printUrls = () => {
        origPrintUrls();

        const lanIp = Object.values(networkInterfaces())
          .flat()
          .find((i) => i && i.family === "IPv4" && !i.internal)?.address;

        if (lanIp) {
          const addr = server.httpServer?.address();
          const port = addr && typeof addr !== "string" ? addr.port : 5173;
          const network = `http://${lanIp}:${port}`;

          import("qrcode-terminal").then((mod) => {
            const qr = mod.default ?? mod;
            console.log("\n  Scan to open on your phone:\n");
            qr.generate(network, { small: true });
            console.log();
          });
        }
      };
    },
  };
}

export default defineConfig({
  plugins: [solid(), tailwindcss(), qrcodePlugin()],
  resolve: {
    alias: {
      "~": path.resolve(__dirname, "src"),
    },
  },
  server: {
    host: true,
  },
  build: {
    // Top-level await (e.g. game analytics init) requires ES2022+
    target: "es2022",
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes("node_modules/gsap/")) return "gsap";
          if (id.includes("node_modules/howler/")) return "audio";
          if (id.includes("node_modules/earcut/")) return "vendor";
          if (id.includes("node_modules/eventemitter3/")) return "vendor";
          if (id.includes("node_modules/tiny-lru/")) return "vendor";
          if (id.includes("node_modules/parse-svg-path/")) return "vendor";
          if (id.includes("node_modules/@pixi/colord/")) return "vendor";
        },
      },
    },
  },
});
