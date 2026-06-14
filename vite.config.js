import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import fs from 'fs'
import path from 'path'

const DB_FILE = path.resolve(process.cwd(), 'db.json')

// A simple Vite plugin to serve/save database for multi-device sync on local network
const dbSyncPlugin = () => ({
  name: 'db-sync-plugin',
  configureServer(server) {
    server.middlewares.use((req, res, next) => {
      if (req.url === '/api/db') {
        if (req.method === 'GET') {
          res.setHeader('Content-Type', 'application/json')
          if (fs.existsSync(DB_FILE)) {
            const data = fs.readFileSync(DB_FILE, 'utf-8')
            res.end(data)
          } else {
            res.end(JSON.stringify({}))
          }
          return
        }

        if (req.method === 'POST') {
          let body = ''
          req.on('data', chunk => {
            body += chunk
          })
          req.on('end', () => {
            try {
              // Validate JSON
              JSON.parse(body)
              fs.writeFileSync(DB_FILE, body, 'utf-8')
              res.setHeader('Content-Type', 'application/json')
              res.end(body)
            } catch (e) {
              res.statusCode = 400
              res.end(JSON.stringify({ error: 'Invalid JSON' }))
            }
          })
          return
        }
      }

      if (req.url === '/api/log' && req.method === 'POST') {
        let body = ''
        req.on('data', chunk => {
          body += chunk
        })
        req.on('end', () => {
          try {
            fs.appendFileSync(path.resolve(process.cwd(), 'client_errors.log'), body + '\n', 'utf-8')
            res.end('Logged')
          } catch (e) {
            res.statusCode = 500
            res.end('Error logging')
          }
        })
        return
      }

      next()
    })
  }
})

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), dbSyncPlugin()],
  server: {
    allowedHosts: true
  }
})
