import { UserConfig } from "vite";

export default {
  publicDir: "resources",
  server: {
    host: "localhost",
    strictPort: true,
  },
  plugins: [],
} satisfies UserConfig;
