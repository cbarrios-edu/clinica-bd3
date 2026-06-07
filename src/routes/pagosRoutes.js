const express = require('express');
const router  = express.Router();
const pool    = require('../config/db');

// POST /api/pagos — registrar pago (sp_registrar_pago)
router.post('/pagos', async (req, res) => {
  const { factura_id, monto, metodo_pago, usuario_id } = req.body;
  try {
    await pool.query(
      `CALL sp_registrar_pago($1, $2, $3, $4)`,
      [factura_id, monto, metodo_pago, usuario_id || 1]
    );
    res.status(201).json({ ok: true, mensaje: 'Pago registrado correctamente' });
  } catch (err) {
    res.status(400).json({ ok: false, error: err.message });
  }
});

// GET /api/pacientes/:id/saldo — fn_saldo_paciente
router.get('/pacientes/:id/saldo', async (req, res) => {
  const { id } = req.params;
  try {
    const result = await pool.query(
      `SELECT fn_saldo_paciente($1) AS saldo`, [id]
    );
    res.json({ ok: true, paciente_id: id, saldo: result.rows[0].saldo });
  } catch (err) {
    res.status(400).json({ ok: false, error: err.message });
  }
});

module.exports = router;
