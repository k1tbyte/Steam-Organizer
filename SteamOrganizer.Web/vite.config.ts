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
                name: 'minify-sw',
                apply: "build",
                enforce: "post",
                transformIndexHtml() {
                    buildSync({
                        minify: true,
                        bundle: true,
                        entryPoints: [join(process.cwd(), "/public/sw.js")],
                        outfile: join(process.cwd(), "dist", "sw.js"),
                    });
                },
            }
        ]
})
