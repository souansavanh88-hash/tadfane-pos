import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import os from 'os'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import { spawn } from 'child_process'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

let tunnelProcess = null;

function startCloudflaredTunnel(port) {
  if (tunnelProcess) return;

  console.log(`[cloudflare-tunnel] Starting secure tunnel on port ${port}...`);
  
  // Use npx -y to avoid interactive prompts
  tunnelProcess = spawn('npx', ['-y', 'cloudflared', 'tunnel', '--url', `http://localhost:${port}`]);

  const handleData = (data) => {
    const output = data.toString();
    console.log('[cloudflare-tunnel-log]', output.trim());
    
    // Match any Cloudflare Quick Tunnel URL (e.g. https://xxx.trycloudflare.com)
    const match = output.match(/https:\/\/[a-z0-9-]+\.trycloudflare\.com/);
    if (match) {
      const tunnelUrl = match[0];
      console.log(`\n================================================================`);
      console.log(`[cloudflare-tunnel] SECURE PUBLIC URL CREATED SUCCESSFULLY:`);
      console.log(`🔗 ${tunnelUrl}`);
      console.log(`================================================================\n`);

      const publicDir = path.resolve(__dirname, 'public');
      if (!fs.existsSync(publicDir)) {
        fs.mkdirSync(publicDir, { recursive: true });
      }

      const filePath = path.resolve(publicDir, 'host-ip.json');
      fs.writeFileSync(filePath, JSON.stringify({ hostIp: tunnelUrl }, null, 2));
    }
  };

  tunnelProcess.stdout.on('data', handleData);
  tunnelProcess.stderr.on('data', handleData);

  tunnelProcess.on('close', (code) => {
    console.log(`[cloudflare-tunnel] Tunnel process exited with code ${code}`);
    tunnelProcess = null;
  });

  // Keep process clean and prevent leaking child processes
  const killTunnel = () => {
    if (tunnelProcess) {
      console.log('[cloudflare-tunnel] Killing tunnel child process...');
      tunnelProcess.kill('SIGINT');
      tunnelProcess = null;
    }
  };

  process.on('exit', killTunnel);
  process.on('SIGINT', () => { killTunnel(); process.exit(); });
  process.on('SIGTERM', () => { killTunnel(); process.exit(); });
  process.on('uncaughtException', (err) => {
    console.error('[cloudflare-tunnel] Uncaught exception:', err);
    killTunnel();
  });
}

const cloudflareTunnelPlugin = () => {
  return {
    name: 'cloudflare-tunnel',
    configureServer(server) {
      // Start tunnel for dev server
      server.httpServer?.once('listening', () => {
        const port = server.config.server.port || 5173;
        startCloudflaredTunnel(port);
      });
    },
    configurePreviewServer(server) {
      // Start tunnel for preview server
      server.httpServer?.once('listening', () => {
        const port = server.config.preview.port || 4173;
        startCloudflaredTunnel(port);
      });
    }
  }
}

const DB_FILE = path.resolve(process.cwd(), 'db.json');

const dbSyncPlugin = () => ({
  name: 'db-sync-plugin',
  configureServer(server) {
    server.middlewares.use((req, res, next) => {
      const pathUrl = req.url.split('?')[0];
      if (pathUrl === '/api/db') {
        if (req.method === 'GET') {
          res.setHeader('Content-Type', 'application/json');
          if (fs.existsSync(DB_FILE)) {
            const data = fs.readFileSync(DB_FILE, 'utf-8');
            res.end(data);
          } else {
            res.end(JSON.stringify({}));
          }
          return;
        }

        if (req.method === 'POST') {
          let body = '';
          req.on('data', chunk => {
            body += chunk;
          });
          req.on('end', () => {
            try {
              JSON.parse(body);
              fs.writeFileSync(DB_FILE, body, 'utf-8');
              res.setHeader('Content-Type', 'application/json');
              res.end(body);
            } catch (e) {
              res.statusCode = 400;
              res.end(JSON.stringify({ error: 'Invalid JSON' }));
            }
          });
          return;
        }
      }

      if (req.url === '/api/log' && req.method === 'POST') {
        let body = '';
        req.on('data', chunk => {
          body += chunk;
        });
        req.on('end', () => {
          try {
            fs.appendFileSync(path.resolve(process.cwd(), 'client_errors.log'), body + '\n', 'utf-8');
            res.end('Logged');
          } catch (e) {
            res.statusCode = 500;
            res.end('Error logging');
          }
        });
        return;
      }

      next();
    });
  }
});

export default defineConfig({
  plugins: [react(), cloudflareTunnelPlugin(), dbSyncPlugin()],
  build: {
    chunkSizeWarningLimit: 1000
  },
  server: {
    allowedHosts: true
  }
})