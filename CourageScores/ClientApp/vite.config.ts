import {defineConfig} from 'vite';
import react from '@vitejs/plugin-react';
import viteTsconfigPaths from 'vite-tsconfig-paths';
import mkcert from 'vite-plugin-mkcert';
import eslint from 'vite-plugin-eslint';
import legacy from '@vitejs/plugin-legacy';
import circleDependency from 'vite-plugin-circular-dependency';

/* istanbul ignore file */

export default defineConfig({
    base: '',
    plugins: [
        react(),
        viteTsconfigPaths(),
        mkcert(),
        eslint({
            failOnWarning: true
        }),
        legacy({}),
        circleDependency({
            circleImportThrowErr: false,
        })
    ],
    server: {
        open: true,
        port: 44426,
        host: true,
    },
    build: {
        chunkSizeWarningLimit: 1000,
        assetsDir: 'static',
    }
});
