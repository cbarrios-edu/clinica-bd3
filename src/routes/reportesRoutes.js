const express = require('express');
const router  = express.Router();
const pool    = require('../config/db');

// GET /api/reportes/agenda-diaria — vista normal v_agenda_diaria
router.get('/reportes/agenda-diaria', async (req, res) => {
  try {
    const result = await pool.query(`SELECT * FROM v_agenda_diaria`);
    res.json({ ok: true, data: result.rows });
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message });
  }
});

// GET /api/reportes/facturas-pendientes — vista normal v_facturas_pendientes
router.get('/reportes/facturas-pendientes', async (req, res) => {
  try {
    const result = await pool.query(`SELECT * FROM v_facturas_pendientes`);
    res.json({ ok: true, data: result.rows });
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message });
  }
});

// GET /api/reportes/facturacion-mensual — vista materializada
router.get('/reportes/facturacion-mensual', async (req, res) => {
  try {
    const result = await pool.query(`SELECT * FROM vm_facturacion_mensual`);
    res.json({ ok: true, data: result.rows });
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message });
  }
});

// GET /api/reportes/ranking-medicos — vista materializada
router.get('/reportes/ranking-medicos', async (req, res) => {
  try {
    const result = await pool.query(`SELECT * FROM vm_ranking_medicos_trimestre`);
    res.json({ ok: true, data: result.rows });
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message });
  }
});

module.exports = router;
