import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react-swc'
import tsconfigPaths from 'vite-tsconfig-paths';
import tsNameof from 'vite-plugin-ts-nameof';
import { buildSync } from "esbuild";
import { join } from 'node:path';

// https://vitejs.dev/config/
export default defineConfig({
    plugins:
        [
            tsconfigPaths(),
            tsNameof(),
            react(),
            {
                name: 'build-pwa',
                apply: "build",
                enforce: "post",
                transformIndexHtml() {
                    // Build and minify service worker
                    buildSync({
                        minify: true,
                        bundle: true,
                        entryPoints: [join(process.cwd(), "/src/sw.js")],
                        outfile: join(process.cwd(), "dist", "sw.js"),
                    });
                },
            }
        ],
    build: {
        rollupOptions: {
            output: {
                // Ensure manifest.json is copied to dist
                assetFileNames: (assetInfo) => {
                    if (assetInfo.name === 'manifest.json') {
                        return 'manifest.json';
                    }
                    return 'assets/[name]-[hash][extname]';
                }
            }
        }
    }
})
