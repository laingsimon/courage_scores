import {defineConfig} from 'vite';
import react from '@vitejs/plugin-react';
import viteTsconfigPaths from 'vite-tsconfig-paths';
import circleDependency from 'vite-plugin-circular-dependency';
import basicSsl from "@vitejs/plugin-basic-ssl";

/* istanbul ignore file */

export default defineConfig({
    base: '',
    plugins: [
        react(),
        viteTsconfigPaths(),
        basicSsl({
            /*
            Creates a self-signed certificate, but this is NOT automatically trusted by the OS.
            Install the certificate manually into the OS by running:
            - [Windows (bash prompt)] - openssl x509 -outform der -in "./ClientApp/.devCert/_cert.pem" -out "./ClientApp/.devCert/_cert.crt"; certutil.exe -enterprise -unicode -addstore root "./ClientApp/.devCert/_cert.crt"
            - [Unix   ] - TBC
            */
            name: 'CourageScores',
            domains: [
                'localhost:7247',
                'localhost:44426'
            ],
            certDir: './.devCert/',
        }),
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