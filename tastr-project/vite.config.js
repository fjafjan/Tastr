import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { createHtmlPlugin } from 'vite-plugin-html';

// Vite does not use the webpack.DefinePlugin directly,
// but you can define environment variables in Vite config or `.env` files.

export default defineConfig(({ mode }) => {
  const isDevelopment = mode === 'development';

  const extensions = [
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
  ];

  const development = process.env.NODE_ENV === "development";

  return {
    root: './', // Ensure the root is set correctly for Vite to find the entry point
    plugins: [
      react(),
    ],
    define: {
      // https://github.com/bevacqua/dragula/issues/602#issuecomment-1296313369
      global: "window",
      __DEV__: JSON.stringify(development),
      // https://tamagui.dev/docs/intro/installation
      DEV: JSON.stringify(development),
      "process.env.NODE_ENV": JSON.stringify(process.env.NODE_ENV),
    },
    resolve: {
      alias: {
        'react-native': 'react-native-web',
      },
      extensions: extensions,
    },
    build: {
      outDir: 'dist',
      sourcemap: isDevelopment,
      rollupOptions: {
        output: {
          entryFileNames: 'bundle.js',
        },
      },
    },
    server: {
      host: true,
      port: 9000,
      open: true,
      strictPort: true,
      proxy: {
        // Proxy example if needed
        // '/api': {
        //   target: 'http://localhost:5000',
        //   changeOrigin: true,
        //   rewrite: (path) => path.replace(/^\/api/, ''),
        // },
      },
    },
    optimizeDeps: {
      esbuildOptions: {
        resolveExtensions: extensions,
        // https://github.com/vitejs/vite-plugin-react/issues/192#issuecomment-1627384670
        jsx: "automatic",
        // need either this or the plugin below
        loader: { ".js": "jsx" },

      },
    },
  };
});
