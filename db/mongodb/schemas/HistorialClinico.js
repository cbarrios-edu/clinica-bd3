const mongoose = require('mongoose');

// Schema para signos vitales (campos comunes a todas las especialidades)
const signosVitalesSchema = new mongoose.Schema({
    presion_arterial: { type: String }, // ej: 120/80
    frecuencia_cardiaca: { type: Number },
    temperatura: { type: Number },
    peso: { type: Number },
    talla: { type: Number },
    saturacion_oxigeno: { type: Number }
}, { _id: false });

// Schema principal del historial
const historialClinicoSchema = new mongoose.Schema({
    // Referencias a PostgreSQL (solo guardamos el ID numérico)
    cita_id: { type: Number, required: true, unique: true },
    paciente_id: { type: Number, required: true },
    medico_id: { type: Number, required: true },

    // Denormalizado para facilitar queries sin hacer JOIN a Postgres
    especialidad: { type: String, required: true },
    nombre_paciente: { type: String },
    nombre_medico: { type: String },
    fecha_consulta: { type: Date, required: true },
    motivo_consulta: { type: String, required: true },

    signos_vitales: signosVitalesSchema,

    // Arrays de subdocumentos
    diagnosticos: [{
        codigo_cie: { type: String }, // código CIE-10
        descripcion: { type: String, required: true },
        tipo: { type: String, default: 'principal' }
    }],
    medicamentos: [{
        nombre: { type: String, required: true },
        dosis: { type: String },
        frecuencia: { type: String },
        duracion: { type: String }
    }],
    examenes: [{
        tipo: { type: String, required: true },
        descripcion: { type: String },
        urgente: { type: Boolean, default: false }
    }],
    notas: { type: String },

    // CLAVE: Objeto libre por especialidad (Esquema Flexible)
    datos_especialidad: { type: mongoose.Schema.Types.Mixed }
}, { timestamps: true, collection: 'historiales_clinicos' });

// Índices para mejorar el rendimiento de las consultas frecuentes
historialClinicoSchema.index({ paciente_id: 1, fecha_consulta: -1 });
historialClinicoSchema.index({ medico_id: 1, especialidad: 1 });
historialClinicoSchema.index({ 'diagnosticos.codigo_cie': 1 });
historialClinicoSchema.index({ 'medicamentos.nombre': 1 });

module.exports = mongoose.model('HistorialClinico', historialClinicoSchema);