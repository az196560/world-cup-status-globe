import path from "node:path";
import { fileURLToPath } from "node:url";
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

const dirname = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  root: path.resolve(dirname, "github-pages"),
  base: "/world-cup-status-globe/",
  publicDir: path.resolve(dirname, "public"),
  plugins: [react()],
  resolve: {
    alias: {
      "@": dirname,
    },
  },
  build: {
    outDir: path.resolve(dirname, "dist-pages"),
    emptyOutDir: true,
  },
});
