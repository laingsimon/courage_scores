import {defineConfig} from 'vite';
import react from '@vitejs/plugin-react';
import viteTsconfigPaths from 'vite-tsconfig-paths';
import mkcert from 'vite-plugin-mkcert';
import eslint from 'vite-plugin-eslint';
import legacy from '@vitejs/plugin-legacy';

/* istanbul ignore file */

export default defineConfig({
    base: '',
    plugins: [
        react(),
        viteTsconfigPaths(),
        mkcert(),
        eslint(),
        legacy({}),
    ],
    server: {
        open: true,
        port: 44426,
    },
    build: {
        chunkSizeWarningLimit: 1000,
        assetsDir: 'static',
    }
});