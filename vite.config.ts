import { UserConfig } from "vite";

export default {
  server: {
    host: "localhost",
    port: 5173,
    strictPort: true,
  },
  build: {
    chunkSizeWarningLimit: 2000,
    outDir: "dist",
    emptyOutDir: true,
    minify: "terser",
    terserOptions: {
      compress: true,
      mangle: {
        keep_classnames: true,
      },
      format: {
        comments: false,
      },
    },
    rollupOptions: {
      input: {
        main: "index.html",
        dashboard: "dashboard.html",
      },
    },
  },
} satisfies UserConfig;
