const express = require('express');
const pool    = require('./config/db');
require('dotenv').config();

const app  = express();
app.use(express.json());

// ── Rutas ──────────────────────────────────────────────
app.use('/api', require('./routes/citasRoutes'));
app.use('/api', require('./routes/pagosRoutes'));
app.use('/api', require('./routes/reportesRoutes'));

// ── Health check ───────────────────────────────────────
app.get('/health', (req, res) => {
  res.json({ status: 'ok', motor: 'PostgreSQL', timestamp: new Date() });
});

// ── Iniciar servidor ───────────────────────────────────
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`API corriendo en http://localhost:${PORT}`);
});
