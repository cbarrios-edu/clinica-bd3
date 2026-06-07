-- Vistas de la clinica medica

-- Vista normal: agenda del dia actual
-- Se usa como vista normal porque recepcion necesita ver cambios en tiempo real
CREATE OR REPLACE VIEW v_agenda_diaria AS
SELECT
    c.id                                        AS cita_id,
    c.fecha_hora,
    c.duracion_min,
    c.estado,
    (p.nombres || ' ' || p.apellidos)           AS paciente,
    p.telefono                                  AS telefono_paciente,
    (m.nombres || ' ' || m.apellidos)           AS medico,
    e.nombre                                    AS especialidad,
    (c.fecha_hora + (c.duracion_min || ' minutes')::INTERVAL)
                                                AS hora_fin_estimada
FROM citas c
JOIN medicos   m ON m.id = c.medico_id
JOIN pacientes p ON p.id = c.paciente_id
JOIN especialidades e ON e.id = m.especialidad_id
WHERE DATE(c.fecha_hora) = CURRENT_DATE
ORDER BY c.fecha_hora;

-- Vista normal: facturas con saldo pendiente
-- Tiempo real porque el estado cambia con cada pago
CREATE OR REPLACE VIEW v_facturas_pendientes AS
SELECT
    f.id                                            AS factura_id,
    f.emitida_en,
    f.total,
    COALESCE(SUM(pg.monto), 0)                      AS total_pagado,
    (f.total - COALESCE(SUM(pg.monto), 0))          AS saldo_pendiente,
    f.estado,
    (p.nombres || ' ' || p.apellidos)               AS paciente,
    p.telefono,
    DATE_PART('day', NOW() - f.emitida_en)::INT     AS dias_antiguedad
FROM facturas f
JOIN pacientes p ON p.id = f.paciente_id
LEFT JOIN pagos pg ON pg.factura_id = f.id
WHERE f.estado IN ('pendiente', 'pagada_parcial')
GROUP BY f.id, p.id
ORDER BY f.emitida_en ASC;

-- Vista materializada: facturacion mensual por especialidad
-- Materializada porque es reporte gerencial, no necesita tiempo real
-- Refresh: diario a las 02:00 AM con REFRESH CONCURRENTLY
CREATE MATERIALIZED VIEW vm_facturacion_mensual AS
SELECT
    DATE_TRUNC('month', f.emitida_en)              AS mes,
    e.nombre                                        AS especialidad,
    COUNT(f.id)                                     AS total_facturas,
    SUM(f.total)                                    AS total_facturado,
    COALESCE(SUM(pg.total_pagado), 0)               AS total_cobrado,
    SUM(f.total) - COALESCE(SUM(pg.total_pagado),0) AS saldo_pendiente
FROM facturas f
JOIN citas     c  ON c.id = f.cita_id
JOIN medicos   m  ON m.id = c.medico_id
JOIN especialidades e ON e.id = m.especialidad_id
LEFT JOIN (
    SELECT factura_id, SUM(monto) AS total_pagado
    FROM pagos
    GROUP BY factura_id
) pg ON pg.factura_id = f.id
WHERE f.estado <> 'anulada'
GROUP BY DATE_TRUNC('month', f.emitida_en), e.nombre
ORDER BY mes DESC, total_facturado DESC
WITH NO DATA;

-- Necesita indice unico para poder usar REFRESH CONCURRENTLY sin bloquear lecturas
CREATE UNIQUE INDEX idx_vm_facturacion_mes_esp
    ON vm_facturacion_mensual (mes, especialidad);

REFRESH MATERIALIZED VIEW vm_facturacion_mensual;

-- Vista materializada: ranking de medicos del trimestre
-- Refresh: cada domingo a las 03:00 AM
CREATE MATERIALIZED VIEW vm_ranking_medicos_trimestre AS
SELECT
    m.id                                            AS medico_id,
    (m.nombres || ' ' || m.apellidos)               AS medico,
    e.nombre                                        AS especialidad,
    COUNT(c.id)                                     AS citas_atendidas,
    COALESCE(SUM(f.total), 0)                       AS monto_facturado,
    RANK() OVER (ORDER BY COUNT(c.id) DESC)         AS ranking_citas,
    RANK() OVER (ORDER BY SUM(f.total) DESC)        AS ranking_facturacion
FROM medicos m
JOIN especialidades e ON e.id = m.especialidad_id
LEFT JOIN citas c    ON c.medico_id = m.id
    AND c.estado = 'atendida'
    AND c.fecha_hora >= DATE_TRUNC('quarter', NOW())
LEFT JOIN facturas f ON f.cita_id = c.id
    AND f.estado <> 'anulada'
GROUP BY m.id, e.nombre
ORDER BY citas_atendidas DESC
WITH NO DATA;

CREATE UNIQUE INDEX idx_vm_ranking_medico
    ON vm_ranking_medicos_trimestre (medico_id);

REFRESH MATERIALIZED VIEW vm_ranking_medicos_trimestre;