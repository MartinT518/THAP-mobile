import { jsxLocPlugin } from "@builder.io/vite-plugin-jsx-loc";
import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import path from "path";
import { defineConfig, loadEnv, type Plugin } from "vite";

const rootDir = path.resolve(import.meta.dirname);

/** Vite only replaces %VITE_*% in HTML when the var exists; leftover placeholders break relative URLs (e.g. under /product/:id). */
function htmlEnvFallbacks(mode: string): Plugin {
  return {
    name: "html-env-fallbacks",
    enforce: "post",
    transformIndexHtml(html) {
      const env = loadEnv(mode, rootDir, "");
      let out = html;

      const logo = env.VITE_APP_LOGO?.trim() || "/icon-192.png";
      const title = env.VITE_APP_TITLE?.trim() || "Thap";
      out = out.replaceAll("%VITE_APP_LOGO%", logo);
      out = out.replaceAll("%VITE_APP_TITLE%", title);

      if (!env.VITE_ANALYTICS_ENDPOINT?.trim()) {
        out = out.replace(
          /\s*<script[^>]*src="%VITE_ANALYTICS_ENDPOINT%[^"]*"[^>]*><\/script>\s*/i,
          "\n",
        );
      }

      return out;
    },
  };
}

export default defineConfig(({ mode }) => ({
  plugins: [
    react(),
    tailwindcss(),
    jsxLocPlugin(),
    htmlEnvFallbacks(mode),
  ],
  resolve: {
    alias: {
      "@": path.resolve(import.meta.dirname, "client", "src"),
      "@shared": path.resolve(import.meta.dirname, "shared"),
      "@assets": path.resolve(import.meta.dirname, "attached_assets"),
    },
  },
  envDir: rootDir,
  root: path.resolve(import.meta.dirname, "client"),
  publicDir: path.resolve(import.meta.dirname, "client", "public"),
  build: {
    outDir: path.resolve(import.meta.dirname, "dist/public"),
    emptyOutDir: true,
  },
  server: {
    host: true,
    allowedHosts: ["localhost", "127.0.0.1"],
    fs: {
      strict: true,
      deny: ["**/.*"],
    },
  },
}));
