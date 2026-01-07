import { UserConfig } from "vite";

export default {
  server: {
    host: "localhost",
    port: 5173,
    strictPort: true,
  },
  build: {
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
