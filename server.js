/**
 * EduPulse AI - Node.js Express Frontend Server
 */

const express = require('express');
const path = require('path');
const http = require('http');

const app = express();
const PORT = process.env.PORT || 3000;

const FASTAPI_BACKEND_URL =
    process.env.FASTAPI_BACKEND_URL || 'http://127.0.0.1:8000';

const API_KEY = process.env.EDUPULSE_API_KEY || '';

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static files
app.use('/static', express.static(path.join(__dirname, 'static')));

// Main dashboard page
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'), (err) => {
        if (err) {
            console.error('Could not load index.html:', err.message);
            if (!res.headersSent) {
                res.status(500).send(
                    'Dashboard file not found. Check that index.html exists.'
                );
            }
        }
    });
});

// Health check for the Node.js server
app.get('/health', (req, res) => {
    res.status(200).json({
        status: 'UP',
        server: 'EduPulse AI Node.js Gateway',
        timestamp: new Date().toISOString()
    });
});

// Proxy API requests to FastAPI
app.all('/api/*', (req, res) => {
    let targetUrl;

    try {
        const apiPath = req.originalUrl.replace(/^\/api/, '');
        targetUrl = new URL(apiPath || '/', FASTAPI_BACKEND_URL);
    } catch (err) {
        return res.status(500).json({
            error: 'Invalid FASTAPI_BACKEND_URL'
        });
    }

    const headers = { ...req.headers };
    delete headers.host;
    delete headers.connection;

    headers.host = targetUrl.host;

    if (API_KEY) {
        headers['X-API-Key'] = API_KEY;
    }

    const options = {
        hostname: targetUrl.hostname,
        port: targetUrl.port || 80,
        path: targetUrl.pathname + targetUrl.search,
        method: req.method,
        headers
    };

    const proxyReq = http.request(options, (proxyRes) => {
        res.writeHead(proxyRes.statusCode, proxyRes.headers);
        proxyRes.pipe(res);
    });

    proxyReq.on('error', (err) => {
        console.error('FastAPI proxy error:', err.message);

        if (!res.headersSent) {
            res.status(502).json({
                error: 'FastAPI backend unavailable',
                detail: 'Check FASTAPI_BACKEND_URL and ensure the backend is running.'
            });
        }
    });

    req.pipe(proxyReq);
});

// Start server
if (require.main === module) {
    app.listen(PORT, '0.0.0.0', () => {
        console.log('EduPulse AI server is running');
        console.log(`Port: ${PORT}`);
        console.log(`FastAPI backend: ${FASTAPI_BACKEND_URL}`);
    });
}

module.exports = app;
