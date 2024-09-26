import {defineConfig} from 'vite';
import react from '@vitejs/plugin-react';
import viteTsconfigPaths from 'vite-tsconfig-paths';
import mkcert from 'vite-plugin-mkcert';
import legacy from '@vitejs/plugin-legacy';
import circleDependency from 'vite-plugin-circular-dependency';
import eslint from 'vite-plugin-eslint2';

/* istanbul ignore file */

export default defineConfig({
    base: '',
    plugins: [
        react(),
        viteTsconfigPaths(),
        mkcert(),
        eslint({
            emitWarningAsError: true,

        }),
        legacy({}),
        circleDependency({
            circleImportThrowErr: true,
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
