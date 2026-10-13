/**
 * EduPulse AI - Enterprise Frontend Server (Node.js Express)
 * Architected to 15-Year Senior Technical Standards
 * Serves static assets & reverse-proxies API requests to Python FastAPI with API Key injection
 */

const express = require('express');
const path = require('path');
const http = require('http');

const app = express();
const PORT = process.env.PORT || 3000;
const FASTAPI_BACKEND_URL = process.env.FASTAPI_BACKEND_URL || 'http://127.0.0.1:8000';
const API_KEY = process.env.EDUPULSE_API_KEY || 'kpmg-edupulse-enterprise-api-key-2026';

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static assets from /static
app.use('/static', express.static(path.join(__dirname, 'static')));

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'UP',
    server: 'Node.js Express Frontend Gateway',
    fastapi_backend: FASTAPI_BACKEND_URL,
    timestamp: new Date().toISOString()
  });
});
       


// Proxy API requests to Python FastAPI Backend
app.all('/api/*', (req, res) => {
    const targetUrl = new URL(req.originalUrl, FASTAPI_BACKEND_URL);
    
    const options = {
        hostname: targetUrl.hostname,
        port: targetUrl.port || 8000,
        path: targetUrl.pathname + targetUrl.search,
        method: req.method,
        headers: {
            ...req.headers,
            'host': `${targetUrl.hostname}:${targetUrl.port || 8000}`,
            'X-API-Key': API_KEY // Injects enterprise FastAPI Key
        }
    };

    const proxyReq = http.request(options, (proxyRes) => {
        res.writeHead(proxyRes.statusCode, proxyRes.headers);
        proxyRes.pipe(res, { end: true });
    });

    proxyReq.on('error', (err) => {
        console.error(`[Node.js Proxy Error]: ${err.message}`);
        res.status(502).json({
            error: 'FastAPI Backend Unavailable',
            detail: 'Please ensure Python FastAPI is running on port 8000 (run.bat or python app.py).',
            timestamp: new Date().toISOString()
        });
    });

    if (req.body && Object.keys(req.body).length > 0) {
        const bodyData = JSON.stringify(req.body);
        proxyReq.setHeader('Content-Type', 'application/json');
        proxyReq.setHeader('Content-Length', Buffer.byteLength(bodyData));
        proxyReq.write(bodyData);
    }

    req.pipe(proxyReq, { end: true });
});

// Health check endpoint
app.get('/health', (req, res) => {
    res.json({
        status: 'UP',
        server: 'Node.js Express Frontend Gateway',
        fastapi_backend: FASTAPI_BACKEND_URL,
        timestamp: new Date().toISOString()
    });
});

// Start Server
if (require.main === module) {
    app.listen(PORT, () => {
        console.log(`================================================================`);
        console.log(`EduPulse AI - Node.js Express Frontend Gateway Active`);
        console.log(`Listening on http://localhost:${PORT}`);
        console.log(`Forwarding /api requests to FastAPI at ${FASTAPI_BACKEND_URL}`);
        console.log(`================================================================`);
    });
}

module.exports = app;
