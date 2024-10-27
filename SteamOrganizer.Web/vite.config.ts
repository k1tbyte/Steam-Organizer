import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react-swc'
import tsconfigPaths from 'vite-tsconfig-paths';
import tsNameof from 'vite-plugin-ts-nameof';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [tsconfigPaths(),tsNameof(), react()]
})
