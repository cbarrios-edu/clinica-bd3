/**
 * procesarHistorial: Normaliza y valida un historial clínico antes de insertar en MongoDB.
 * @param {Object} datos - Datos crudos recibidos del frontend/API.
 * @returns {Object} - Datos normalizados.
 */
function procesarHistorial(datos) {
    // 1. Validar campos obligatorios estrictos
    if (!datos.cita_id) throw new Error('cita_id es obligatorio');
    if (!datos.paciente_id) throw new Error('paciente_id es obligatorio');
    if (!datos.medico_id) throw new Error('medico_id es obligatorio');
    if (!datos.motivo_consulta) throw new Error('motivo_consulta es obligatorio');

    // Función auxiliar para sanitizar strings
    const normalizar = (str) => str ? str.trim().toLowerCase() : '';

    // 2. Normalizar arrays
    const diagnosticos = (datos.diagnosticos || []).map(d => ({
        codigo_cie: d.codigo_cie ? d.codigo_cie.toUpperCase().trim() : '',
        descripcion: normalizar(d.descripcion),
        tipo: normalizar(d.tipo) || 'principal'
    }));

    const medicamentos = (datos.medicamentos || []).map(m => ({
        nombre: normalizar(m.nombre),
        dosis: m.dosis ? m.dosis.trim() : '',
        frecuencia: m.frecuencia ? m.frecuencia.trim() : '',
        duracion: m.duracion ? m.duracion.trim() : ''
    }));

    const examenes = (datos.examenes || []).map(e => ({
        tipo: normalizar(e.tipo),
        descripcion: e.descripcion ? e.descripcion.trim() : '',
        urgente: Boolean(e.urgente)
    }));

    // 3. Retornar el objeto final limpio
    return {
        cita_id: Number(datos.cita_id),
        paciente_id: Number(datos.paciente_id),
        medico_id: Number(datos.medico_id),
        especialidad: normalizar(datos.especialidad),
        nombre_paciente: datos.nombre_paciente ? datos.nombre_paciente.trim() : '',
        nombre_medico: datos.nombre_medico ? datos.nombre_medico.trim() : '',
        fecha_consulta: new Date(datos.fecha_consulta),
        motivo_consulta: datos.motivo_consulta.trim(),
        signos_vitales: datos.signos_vitales || {},
        diagnosticos,
        medicamentos,
        examenes,
        notas: datos.notas ? datos.notas.trim() : '',
        datos_especialidad: datos.datos_especialidad || {},
        procesado_en: new Date()
    };
}

module.exports = { procesarHistorial };