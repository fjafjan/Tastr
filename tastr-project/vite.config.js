import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { createHtmlPlugin } from 'vite-plugin-html';

// Vite does not use the webpack.DefinePlugin directly,
// but you can define environment variables in Vite config or `.env` files.

export default defineConfig(({ mode }) => {
  const isDevelopment = mode === 'development';

  return {
    root: './', // Ensure the root is set correctly for Vite to find the entry point
    plugins: [
      react({
        // Use React plugin in all *.jsx and *.tsx files
        include: '**/*.{jsx,tsx}',
      }),      createHtmlPlugin({
        template: 'index.html',
      }),
    ],
    resolve: {
      alias: {
        'react-native': path.resolve(__dirname, 'node_modules/react-native-web'),
      },
      extensions: ['.web.js', '.js', '.jsx', '.json'],
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
    define: {
      __DEV__: JSON.stringify(process.env.NODE_ENV !== 'production'),
    },
  };
});
