import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { fileURLToPath, URL } from 'node:url'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  server: {
    host: '0.0.0.0',
    port: 5173,
    allowedHosts: process.env.VITE_ALLOWED_HOST ? [process.env.VITE_ALLOWED_HOST] : [],
    proxy: {
      '/api': {
        target: 'http://localhost:3000',
        changeOrigin: true,
        secure: false,
      },
      '/socket.io': {
        target: 'http://localhost:3000',
        changeOrigin: true,
        ws: true,
        configure: (proxy) => {
          const origOn = proxy.on.bind(proxy);
          proxy.on = (event: string, listener: any) => {
            if (event === 'error') {
              return origOn('error', (err: any, req: any, res: any) => {
                if (['ECONNABORTED', 'ECONNRESET', 'ECONNREFUSED', 'EPIPE'].includes(err?.code)) {
                  return;
                }
                listener(err, req, res);
              });
            }
            if (event === 'proxyReqWs') {
              return origOn('proxyReqWs', (proxyReq: any, req: any, socket: any, options: any) => {
                const origSocketOn = socket.on.bind(socket);
                socket.on = (sEvent: string, sListener: any) => {
                  if (sEvent === 'error') {
                    return origSocketOn('error', (err: any) => {
                      if (['ECONNABORTED', 'ECONNRESET', 'ECONNREFUSED', 'EPIPE'].includes(err?.code)) {
                        return;
                      }
                      sListener(err);
                    });
                  }
                  return origSocketOn(sEvent, sListener);
                };
                listener(proxyReq, req, socket, options);
              });
            }
            return origOn(event, listener);
          };
        },
      },
      // Proxy cho R2 public URL — bypass CORS khi canvas drawImage frame
      '/r2-proxy': {
        target: 'https://pub-4eb303709ef24609a3b420990203812a.r2.dev',
        changeOrigin: true,
        secure: true,
        rewrite: (path) => path.replace(/^\/r2-proxy/, ''),
      },
    },
  },
})
