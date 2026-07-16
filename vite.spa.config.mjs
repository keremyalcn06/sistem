// Dedicated SPA vite config for the Capacitor/Android build.
// Outputs a plain client-side bundle into android-webroot/ (Capacitor webDir).
// Kept separate from vite.config.ts so the web app's TanStack Start SSR
// pipeline is untouched.
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tsconfigPaths from "vite-tsconfig-paths";
import tailwindcss from "@tailwindcss/vite";
import { tanstackRouter } from "@tanstack/router-plugin/vite";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  plugins: [
    tanstackRouter({
      target: "react",
      autoCodeSplitting: true,
      routesDirectory: path.resolve(root, "src/routes"),
      generatedRouteTree: path.resolve(root, "src/routeTree.gen.ts"),
    }),
    react(),
    tailwindcss(),
    tsconfigPaths(),
  ],
  resolve: {
    alias: { "@": path.resolve(root, "src") },
    dedupe: ["react", "react-dom", "@tanstack/react-router", "@tanstack/react-query"],
  },
  publicDir: path.resolve(root, "public"),
  build: {
    outDir: path.resolve(root, "android-webroot"),
    emptyOutDir: true,
    rollupOptions: {
      input: path.resolve(root, "src/spa/index.html"),
    },
  },
});
