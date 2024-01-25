import  { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import viteTsconfigPaths from 'vite-tsconfig-paths';
import mkcert from 'vite-plugin-mkcert';

/* istanbul ignore file */

export default defineConfig({
   base: '',
   plugins: [react(), viteTsconfigPaths(), mkcert() ],
   server: {
       open: true,
       port: 44426,
   },
});