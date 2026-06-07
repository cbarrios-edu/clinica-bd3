const HistorialClinico = require('../schemas/HistorialClinico');

async function medicamentosPorEspecialidad() {
    return await HistorialClinico.aggregate([
        { $unwind: '$medicamentos' },
        {
            // $facet permite bifurcar la consulta para generar dos reportes en uno solo
            $facet: {
                'por_especialidad': [
                    {
                        $group: {
                            _id: { especialidad: '$especialidad', medicamento: '$medicamentos.nombre' },
                            prescripciones: { $sum: 1 }
                        }
                    },
                    { $sort: { '_id.especialidad': 1, prescripciones: -1 } },
                    {
                        $group: {
                            _id: '$_id.especialidad',
                            medicamentos: { $push: { nombre: '$_id.medicamento', total: '$prescripciones' } }
                        }
                    },
                    {
                        $project: {
                            especialidad: '$_id',
                            _id: 0,
                            top5: { $slice: ['$medicamentos', 5] }
                        }
                    }
                ],
                'totales_globales': [
                    {
                        $group: {
                            _id: '$medicamentos.nombre',
                            total: { $sum: 1 }
                        }
                    },
                    { $sort: { total: -1 } },
                    { $limit: 10 }
                ]
            }
        }
    ]);
}
module.exports = { medicamentosPorEspecialidad };