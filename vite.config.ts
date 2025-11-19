import { defineConfig, Plugin } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";

// https://vitejs.dev/config/
export default defineConfig(({ mode, command }) => {
  // Only import server in development serve mode (not during build)
  let expressPlugin: Plugin | null = null;
  
  if (mode === 'development' && command === 'serve') {
    // Use dynamic import to avoid bundling server code in production builds
    expressPlugin = {
      name: "express-plugin",
      apply: "serve", // Only apply during development (serve mode)
      async configureServer(server) {
        // Dynamic import only when actually needed (dev server)
        const { createServer } = await import("./server/index");
        const app = createServer();
        // Add Express app as middleware to Vite dev server
        server.middlewares.use(app);
      },
    };
  }

  return {
    root: '.',
    publicDir: 'public',
    define: {
      'process.env.NODE_ENV': JSON.stringify(mode)
    },
    server: {
      host: "::",
      port: 8080,
      open: true, // Automatically open browser
      fs: {
        allow: [
          // Allow access to the entire project directory
          ".",
          "./client", 
          "./shared", 
          "./public",
          "./node_modules"
        ],
        deny: [".env", ".env.*", "*.{crt,pem}", "**/.git/**"],
      },
    },
    build: {
      outDir: "dist/spa",
      rollupOptions: {
        // Exclude server directories and node-only modules from client build
        input: {
          main: path.resolve(__dirname, 'index.html')
        },
        output: {
          manualChunks: {
            vendor: ['react', 'react-dom'],
            ui: ['@radix-ui/react-dialog', '@radix-ui/react-dropdown-menu'],
            three: ['three', '@react-three/fiber', '@react-three/drei'],
            charts: ['recharts']
          }
        }
      },
      chunkSizeWarningLimit: 1000,
      sourcemap: false,
      minify: 'terser',
      terserOptions: {
        compress: {
          drop_console: mode === 'production',
          drop_debugger: mode === 'production'
        }
      },
      // Exclude server files from build
      commonjsOptions: {
        exclude: [/server/, /node_modules\/sqlite3/]
      }
    },
    plugins: [
      react(),
      ...(expressPlugin ? [expressPlugin] : [])
    ],
    resolve: {
      alias: {
        "@": path.resolve(__dirname, "./client"),
        "@shared": path.resolve(__dirname, "./shared"),
      },
    },
    optimizeDeps: {
      include: ['react', 'react-dom', 'three'],
      exclude: ['sqlite3', 'express', 'serverless-http', 'cors', 'dotenv']
    },
    // Exclude server files from dependency pre-bundling
    ssr: {
      noExternal: [],
      external: ['sqlite3', 'express', 'serverless-http']
    }
  };
});
