import express from 'express';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 5173;
const DB_FILE = process.env.DB_PATH || path.join(__dirname, 'db.json');

// Parse JSON request bodies
app.use(express.json({ limit: '50mb' }));

// Allow CORS
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Cache-Control, Pragma');
  res.header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  next();
});

// API - DB GET
app.get('/api/db', (req, res) => {
  res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
  res.setHeader('Pragma', 'no-cache');
  res.setHeader('Expires', '0');
  if (fs.existsSync(DB_FILE)) {
    const data = fs.readFileSync(DB_FILE, 'utf-8');
    res.setHeader('Content-Type', 'application/json');
    res.end(data);
  } else {
    res.json({});
  }
});

// API - DB POST
app.post('/api/db', (req, res) => {
  try {
    const bodyStr = JSON.stringify(req.body);
    fs.writeFileSync(DB_FILE, bodyStr, 'utf-8');
    res.setHeader('Content-Type', 'application/json');
    res.send(bodyStr);
  } catch (err) {
    res.status(500).json({ error: 'Failed to write DB' });
  }
});

// API - Log POST
app.post('/api/log', (req, res) => {
  try {
    const logStr = typeof req.body === 'string' ? req.body : JSON.stringify(req.body);
    fs.appendFileSync(path.join(__dirname, 'client_errors.log'), logStr + '\n', 'utf-8');
    res.send('Logged');
  } catch (err) {
    res.status(500).send('Error logging');
  }
});

// Serve built static files
app.use(express.static(path.join(__dirname, 'dist')));

// Fallback all other GET routes to index.html for SPA client-side routing
app.get(/.*/, (req, res) => {
  res.sendFile(path.join(__dirname, 'dist', 'index.html'));
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
