import {defineConfig} from 'vite';
import react from '@vitejs/plugin-react';
import viteTsconfigPaths from 'vite-tsconfig-paths';
import mkcert from 'vite-plugin-mkcert';
import eslint from 'vite-plugin-eslint';

/* istanbul ignore file */

export default defineConfig({
    base: '',
    plugins: [react(), viteTsconfigPaths(), mkcert(), eslint()],
    server: {
        open: true,
        port: 44426,
    },
    build: {
        chunkSizeWarningLimit: 1000,
        assetsDir: 'static',
    }
});