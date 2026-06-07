const HistorialClinico = require('../schemas/HistorialClinico');

async function signosVitalesPorGrupoEtario() {
    return await HistorialClinico.aggregate([
        // Calcular la edad basada en una fecha de nacimiento (o asumiendo un campo edad_paciente)
        {
            $addFields: {
                grupo_etario: {
                    $switch: {
                        branches: [
                            { case: { $lt: ['$edad_paciente', 18] }, then: '0-17 años' },
                            { case: { $lt: ['$edad_paciente', 40] }, then: '18-39 años' },
                            { case: { $lt: ['$edad_paciente', 60] }, then: '40-59 años' }
                        ],
                        default: '60+ años'
                    }
                }
            }
        },
        {
            $group: {
                _id: '$grupo_etario',
                avg_frec_cardiaca: { $avg: '$signos_vitales.frecuencia_cardiaca' },
                avg_temperatura: { $avg: '$signos_vitales.temperatura' },
                total_consultas: { $sum: 1 }
            }
        },
        {
            $project: {
                grupo_etario: '$_id',
                _id: 0,
                avg_frec_cardiaca: { $round: ['$avg_frec_cardiaca', 1] },
                avg_temperatura: { $round: ['$avg_temperatura', 1] },
                total_consultas: 1
            }
        },
        { $sort: { grupo_etario: 1 } }
    ]);
}
module.exports = { signosVitalesPorGrupoEtario };