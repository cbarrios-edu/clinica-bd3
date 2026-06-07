const mongoose = require('mongoose');

const auditoriaEventoSchema = new mongoose.Schema({
    entidad: { type: String, required: true }, // 'citas', 'pagos', 'historiales'
    entidad_id: { type: Number },
    accion: { type: String, required: true }, // 'CITA_AGENDADA', 'PAGO_REGISTRADO'
    usuario_id: { type: Number },
    datos: { type: mongoose.Schema.Types.Mixed }, // Payload variable
    ip_origen: { type: String },
    creado_en: { type: Date, default: Date.now }
}, { collection: 'auditoria_eventos', versionKey: false });

// Índices
auditoriaEventoSchema.index({ creado_en: -1 });
auditoriaEventoSchema.index({ entidad: 1, accion: 1 });
auditoriaEventoSchema.index({ usuario_id: 1 });

module.exports = mongoose.model('AuditoriaEvento', auditoriaEventoSchema);