const HistorialClinico = require('../schemas/HistorialClinico');

async function tiempoPromedioEntreConsultas() {
    return await HistorialClinico.aggregate([
        // Etapa 1: Ordenar por paciente y fecha de forma ascendente
        { $sort: { paciente_id: 1, fecha_consulta: 1 } },

        // Etapa 2: Agrupar todas las fechas de consulta por paciente
        {
            $group: {
                _id: '$paciente_id',
                nombre_paciente: { $first: '$nombre_paciente' },
                fechas: { $push: '$fecha_consulta' },
                total_consultas: { $sum: 1 }
            }
        },

        // Etapa 3: Filtrar solo pacientes con más de 1 consulta
        { $match: { total_consultas: { $gt: 1 } } },

        // Etapa 4: Calcular la diferencia en días entre consultas consecutivas
        {
            $addFields: {
                intervalos_dias: {
                    $map: {
                        input: { $range: [1, { $size: '$fechas' }] },
                        as: 'i',
                        in: {
                            $divide: [
                                {
                                    $subtract: [
                                        { $arrayElemAt: ['$fechas', '$$i'] },
                                        { $arrayElemAt: ['$fechas', { $subtract: ['$$i', 1] }] }
                                    ]
                                },
                                1000 * 60 * 60 * 24 // Convertir milisegundos a días
                            ]
                        }
                    }
                }
            }
        },

        // Etapa 5: Calcular el promedio final de los intervalos
        {
            $project: {
                paciente_id: '$_id',
                _id: 0,
                nombre_paciente: 1,
                total_consultas: 1,
                promedio_dias_entre_consultas: { $round: [{ $avg: '$intervalos_dias' }, 1] }
            }
        },
        { $sort: { promedio_dias_entre_consultas: -1 } }
    ]);
}

module.exports = { tiempoPromedioEntreConsultas };