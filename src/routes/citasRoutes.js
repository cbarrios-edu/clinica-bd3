const express = require('express');
const router  = express.Router();
const pool    = require('../config/db');

// POST /api/citas — agendar cita (sp_agendar_cita)
router.post('/citas', async (req, res) => {
  const { medico_id, paciente_id, fecha_hora, duracion_min, agendado_por } = req.body;
  try {
    await pool.query(
      `CALL sp_agendar_cita($1, $2, $3, $4, $5, NULL)`,
      [medico_id, paciente_id, fecha_hora, duracion_min || 30, agendado_por || 1]
    );
    res.status(201).json({ ok: true, mensaje: 'Cita agendada correctamente' });
  } catch (err) {
    res.status(400).json({ ok: false, error: err.message });
  }
});

// POST /api/citas/:id/cancelar — cancelar cita (sp_cancelar_cita)
router.post('/citas/:id/cancelar', async (req, res) => {
  const { id } = req.params;
  const { motivo, usuario_id } = req.body;
  try {
    await pool.query(
      `CALL sp_cancelar_cita($1, $2, $3)`,
      [id, motivo, usuario_id || 1]
    );
    res.json({ ok: true, mensaje: 'Cita cancelada correctamente' });
  } catch (err) {
    res.status(400).json({ ok: false, error: err.message });
  }
});

// GET /api/medicos/:id/disponibilidad — fn_disponibilidad_medico
router.get('/medicos/:id/disponibilidad', async (req, res) => {
  const { id } = req.params;
  const { fecha } = req.query;
  try {
    const result = await pool.query(
      `SELECT * FROM fn_disponibilidad_medico($1, $2)`,
      [id, fecha]
    );
    res.json({ ok: true, data: result.rows });
  } catch (err) {
    res.status(400).json({ ok: false, error: err.message });
  }
});

module.exports = router;
