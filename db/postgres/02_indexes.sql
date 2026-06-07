-- Indices para la clinica medica

-- Para buscar citas por medico y fecha (agenda diaria y validacion de solapamiento)
CREATE INDEX idx_citas_medico_fecha
    ON citas (medico_id, fecha_hora);

-- Para el historial del paciente ordenado por fecha
CREATE INDEX idx_citas_paciente_fecha
    ON citas (paciente_id, fecha_hora DESC);

-- Solo indexa citas activas, las canceladas no se consultan frecuentemente
CREATE INDEX idx_citas_estado
    ON citas (estado)
    WHERE estado IN ('programada', 'confirmada');

-- Facturas pendientes - indice parcial porque solo consultamos las no pagadas
CREATE INDEX idx_facturas_estado_pendiente
    ON facturas (estado, emitida_en)
    WHERE estado IN ('pendiente', 'pagada_parcial');

-- Para calcular el saldo del paciente
CREATE INDEX idx_facturas_paciente
    ON facturas (paciente_id, estado);

-- El SP de pagos necesita sumar los pagos de una factura rapidamente
CREATE INDEX idx_pagos_factura
    ON pagos (factura_id);

-- Consultas de auditoria por fecha
CREATE INDEX idx_auditoria_fecha_entidad
    ON auditoria_log (creado_en DESC, entidad);

-- Para buscar el horario del medico en un dia especifico
CREATE INDEX idx_horarios_medico_dia
    ON horarios_medico (medico_id, dia_semana);