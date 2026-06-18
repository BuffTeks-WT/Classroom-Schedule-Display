const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '.env') });
const express = require('express');
const app = express();

const PORT = 3000;
const HOST = '0.0.0.0'; // Bind to all interfaces so LAN devices can connect

// Security: do not leak backend URL in logs or to arbitrary clients.
const BACKEND_API = process.env.API_BASE_URL || '';

// Serve static files from the current directory (Frontend)
app.use(express.static(__dirname));

// Parse JSON bodies for proxy POSTs
app.use(express.json());

// Lightweight proxy endpoints so the frontend never needs to know the real backend URL.
// This also prevents accidental exposure of internal hostnames/IPs in the browser console or repo.
app.get('/proxy/reservations', async (req, res) => {
    if (!BACKEND_API) return res.status(503).json({ error: 'Backend API not configured' });
    try {
        const target = new URL('/reservations', BACKEND_API);
        // forward query string
        target.search = req.url.split('?')[1] || '';
        const resp = await fetch(target.toString(), {
            headers: { 'Accept': 'application/json' }
        });
        const data = await resp.text();
        res.type(resp.headers.get('content-type') || 'application/json');
        res.status(resp.status).send(data);
    } catch (err) {
        res.status(502).json({ error: 'Proxy error', details: err.message });
    }
});

app.post('/proxy/reservations', async (req, res) => {
    if (!BACKEND_API) return res.status(503).json({ error: 'Backend API not configured' });
    try {
        const target = new URL('/reservations', BACKEND_API);
        const resp = await fetch(target.toString(), {
            method: 'POST',
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(req.body)
        });
        const data = await resp.text();
        res.type(resp.headers.get('content-type') || 'application/json');
        res.status(resp.status).send(data);
    } catch (err) {
        res.status(502).json({ error: 'Proxy error', details: err.message });
    }
});

// Proxy PUT to update a reservation
app.put('/proxy/reservations/:id', async (req, res) => {
    if (!BACKEND_API) return res.status(503).json({ error: 'Backend API not configured' });
    // Security: Validate numeric ID explicitly to mitigate path traversal / SSRF parameter injection
    if (!/^\d+$/.test(req.params.id)) {
        return res.status(400).json({ error: 'Invalid reservation ID. Must be numeric.' });
    }
    try {
        const target = new URL(`/reservations/${req.params.id}`, BACKEND_API);
        const resp = await fetch(target.toString(), {
            method: 'PUT',
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(req.body)
        });
        const data = await resp.text();
        res.type(resp.headers.get('content-type') || 'application/json');
        res.status(resp.status).send(data);
    } catch (err) {
        res.status(502).json({ error: 'Proxy error', details: err.message });
    }
});

// Proxy DELETE to remove a reservation
app.delete('/proxy/reservations/:id', async (req, res) => {
    if (!BACKEND_API) return res.status(503).json({ error: 'Backend API not configured' });
    // Security: Validate numeric ID explicitly to mitigate path traversal / SSRF parameter injection
    if (!/^\d+$/.test(req.params.id)) {
        return res.status(400).json({ error: 'Invalid reservation ID. Must be numeric.' });
    }
    try {
        const target = new URL(`/reservations/${req.params.id}`, BACKEND_API);
        const resp = await fetch(target.toString(), {
            method: 'DELETE'
        });
        res.status(resp.status).send();
    } catch (err) {
        res.status(502).json({ error: 'Proxy error', details: err.message });
    }
});

// Small non-sensitive health/config endpoint (no secrets returned)
app.get('/env-config', (req, res) => {
    res.json({ configured: !!BACKEND_API });
});

// Start the development server
app.listen(PORT, HOST, () => {
    console.log(`Frontend Development Server running at http://localhost:${PORT}`);
    console.log(`Also reachable on your LAN at http://<your-LAN-IP>:${PORT}`);
    console.log(`Backend proxy ${BACKEND_API ? 'enabled' : 'disabled'}`);
});
