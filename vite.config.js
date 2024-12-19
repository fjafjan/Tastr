import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";
import { createHtmlPlugin } from "vite-plugin-html";

export default defineConfig(({ mode }) => {
  const isDevelopment = mode === "development";
  const env = loadEnv(mode, process.cwd(), "");

  return {
    root: "./",
    plugins: [react()],
    define: {
      global: "window",
      __DEV__: JSON.stringify(isDevelopment),
      DEV: JSON.stringify(isDevelopment),
      "process.env.NODE_ENV": JSON.stringify(process.env.NODE_ENV),
      "process.env.VITE_SERVER_URL": JSON.stringify(process.env.SERVER_URL),
      "process.env.VITE_SERVER_PORT": JSON.stringify(process.env.SERVER_PORT),
      __APP_ENV__: JSON.stringify(env.APP_ENV),
    },
    resolve: {
      alias: {
        "react-native": "react-native-web",
      },
      extensions: [
        ".web.tsx",
        ".tsx",
        ".web.ts",
        ".ts",
        ".web.jsx",
        ".jsx",
        ".web.js",
        ".js",
        ".css",
        ".json",
        ".mjs",
      ],
    },
    build: {
      outDir: "dist",
      sourcemap: isDevelopment,
      rollupOptions: {
        output: {
          entryFileNames: "bundle.js",
        },
      },
    },
    server: {
      host: true,
      port: 9000,
      open: true,
      strictPort: true,
    },
    optimizeDeps: {
      esbuildOptions: {
        resolveExtensions: [
          ".web.tsx",
          ".tsx",
          ".web.ts",
          ".ts",
          ".web.jsx",
          ".jsx",
          ".web.js",
          ".js",
          ".css",
          ".json",
          ".mjs",
        ],
        jsx: "automatic",
        loader: { ".js": "jsx" },
      },
    },
  };
});
