// Dedicated SPA vite config for the Capacitor/Android build.
// The web app keeps using TanStack Start SSR via vite.config.ts; on Android
// we ship a pure client-side bundle because the WebView has no server.
// Output: android-webroot/ (Capacitor webDir).
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tsconfigPaths from "vite-tsconfig-paths";
import tailwindcss from "@tailwindcss/vite";
import { tanstackRouter } from "@tanstack/router-plugin/vite";
import path from "node:path";
import { fileURLToPath } from "node:url";

const projectRoot = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  root: path.resolve(projectRoot, "src/spa"),
  plugins: [
    tanstackRouter({
      target: "react",
      autoCodeSplitting: true,
      routesDirectory: path.resolve(projectRoot, "src/routes"),
      generatedRouteTree: path.resolve(projectRoot, "src/routeTree.gen.ts"),
    }),
    react(),
    tailwindcss(),
    tsconfigPaths({ projects: [path.resolve(projectRoot, "tsconfig.json")] }),
  ],
  resolve: {
    alias: { "@": path.resolve(projectRoot, "src") },
    dedupe: ["react", "react-dom", "@tanstack/react-router", "@tanstack/react-query"],
  },
  publicDir: path.resolve(projectRoot, "public"),
  base: "./",
  build: {
    outDir: path.resolve(projectRoot, "android-webroot"),
    emptyOutDir: true,
  },
});
