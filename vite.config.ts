import { UserConfig } from "vite";
import { resolve } from "path";

export default {
  publicDir: "resources",
  server: {
    host: "localhost",
    strictPort: true,
  },
  build: {
    rollupOptions: {
      input: {
        main: resolve(__dirname, "index.html"),
        dashboard: resolve(__dirname, "public/dashboard.html"),
      },
    },
  },
} satisfies UserConfig;
