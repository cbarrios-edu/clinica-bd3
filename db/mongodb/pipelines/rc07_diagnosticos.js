const HistorialClinico = require('../schemas/HistorialClinico');

async function top5DiagnosticosPorEspecialidad() {
    return await HistorialClinico.aggregate([
        // Etapa 1: Descomponer el array de diagnósticos
        { $unwind: '$diagnosticos' },

        // Etapa 2: Agrupar para contar cada diagnóstico por especialidad
        {
            $group: {
                _id: { especialidad: '$especialidad', diagnostico: '$diagnosticos.descripcion' },
                total: { $sum: 1 }
            }
        },
        // Etapa 3: Ordenar de mayor a menor frecuencia
        { $sort: { '_id.especialidad': 1, total: -1 } },

        // Etapa 4: Reagrupar por especialidad manteniendo los top 5
        {
            $group: {
                _id: '$_id.especialidad',
                top_diagnosticos: {
                    $push: { diagnostico: '$_id.diagnostico', total: '$total' }
                }
            }
        },
        // Etapa 5: Cortar (slice) el array para dejar solo 5
        {
            $project: {
                especialidad: '$_id',
                _id: 0,
                top5: { $slice: ['$top_diagnosticos', 5] }
            }
        }
    ]);
}
module.exports = { top5DiagnosticosPorEspecialidad };