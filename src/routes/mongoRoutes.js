const express = require('express');
const router = express.Router();
const HistorialClinico = require('../../db/mongodb/schemas/HistorialClinico');
const { procesarHistorial } = require('../../db/mongodb/utils/procesarHistorial');

// Importar los pipelines
const { top5DiagnosticosPorEspecialidad } = require('../../db/mongodb/pipelines/rc07_diagnosticos');
const { medicamentosPorEspecialidad } = require('../../db/mongodb/pipelines/rc08_medicamentos');
const { signosVitalesPorGrupoEtario } = require('../../db/mongodb/pipelines/rc09_signos_vitales');
const { tiempoPromedioEntreConsultas } = require('../../db/mongodb/pipelines/rc10_tiempo_consultas');

// POST: Insertar historial usando la función JS de normalización
router.post('/historiales', async (req, res) => {
    try {
        const datosNormalizados = procesarHistorial(req.body);
        const historial = await HistorialClinico.create(datosNormalizados);
        res.status(201).json({ ok: true, id: historial._id });
    } catch (err) {
        res.status(400).json({ ok: false, error: err.message });
    }
});

// GET: Reportes
router.get('/reportes/diagnosticos', async (req, res) => {
    try {
        const data = await top5DiagnosticosPorEspecialidad();
        res.json({ ok: true, data });
    } catch (err) {
        res.status(500).json({ ok: false, error: err.message });
    }
});

router.get('/reportes/medicamentos', async (req, res) => {
    try {
        const data = await medicamentosPorEspecialidad();
        res.json({ ok: true, data });
    } catch (err) {
        res.status(500).json({ ok: false, error: err.message });
    }
});

router.get('/reportes/signos-vitales', async (req, res) => {
    try {
        const data = await signosVitalesPorGrupoEtario();
        res.json({ ok: true, data });
    } catch (err) {
        res.status(500).json({ ok: false, error: err.message });
    }
});

router.get('/reportes/tiempo-consultas', async (req, res) => {
    try {
        const data = await tiempoPromedioEntreConsultas();
        res.json({ ok: true, data });
    } catch (err) {
        res.status(500).json({ ok: false, error: err.message });
    }
});

module.exports = router;