-- Funciones PL/pgSQL - Clinica Medica

-- Funcion escalar: retorna el saldo total que debe un paciente
CREATE OR REPLACE FUNCTION fn_saldo_paciente(p_paciente_id INT)
RETURNS NUMERIC(10,2)
LANGUAGE plpgsql
STABLE
AS $$
DECLARE
    v_saldo NUMERIC(10,2);
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pacientes WHERE id = p_paciente_id) THEN
        RAISE EXCEPTION 'Paciente % no existe', p_paciente_id;
    END IF;

    SELECT COALESCE(
        SUM(f.total) - COALESCE(SUM(pg.monto), 0),
        0
    )
    INTO v_saldo
    FROM facturas f
    LEFT JOIN pagos pg ON pg.factura_id = f.id
    WHERE f.paciente_id = p_paciente_id
      AND f.estado IN ('pendiente', 'pagada_parcial')
    GROUP BY f.paciente_id;

    RETURN COALESCE(v_saldo, 0);
END;
$$;

-- Funcion que retorna TABLE: horarios libres de un medico en una fecha
CREATE OR REPLACE FUNCTION fn_disponibilidad_medico(
    p_medico_id INT,
    p_fecha     DATE
)
RETURNS TABLE (
    hora_inicio      TIME,
    hora_fin         TIME,
    duracion_minutos INT
)
LANGUAGE plpgsql
STABLE
AS $$
DECLARE
    v_dia_semana    SMALLINT;
    v_horario       RECORD;
    v_cursor        TIMESTAMP;
    v_bloque_inicio TIME;
    v_bloque_fin    TIME;
    v_duracion_cita SMALLINT := 30;
BEGIN
    IF NOT EXISTS (SELECT 1 FROM medicos WHERE id = p_medico_id AND activo = TRUE) THEN
        RAISE EXCEPTION 'Medico % no existe o esta inactivo', p_medico_id;
    END IF;

    v_dia_semana := EXTRACT(DOW FROM p_fecha)::SMALLINT;

    FOR v_horario IN
        SELECT h.hora_inicio, h.hora_fin
        FROM horarios_medico h
        WHERE h.medico_id = p_medico_id
          AND h.dia_semana = v_dia_semana
        ORDER BY h.hora_inicio
    LOOP
        v_cursor := (p_fecha + v_horario.hora_inicio)::TIMESTAMP;

        WHILE v_cursor + (v_duracion_cita || ' minutes')::INTERVAL
              <= (p_fecha + v_horario.hora_fin)::TIMESTAMP
        LOOP
            v_bloque_inicio := v_cursor::TIME;
            v_bloque_fin    := (v_cursor + (v_duracion_cita || ' minutes')::INTERVAL)::TIME;

            -- verifico si ese bloque ya tiene una cita
            IF NOT EXISTS (
                SELECT 1 FROM citas
                WHERE medico_id = p_medico_id
                  AND estado NOT IN ('cancelada', 'no_asistio')
                  AND fecha_hora = v_cursor
            ) THEN
                hora_inicio      := v_bloque_inicio;
                hora_fin         := v_bloque_fin;
                duracion_minutos := v_duracion_cita;
                RETURN NEXT;
            END IF;

            v_cursor := v_cursor + (v_duracion_cita || ' minutes')::INTERVAL;
        END LOOP;
    END LOOP;

    RETURN;
END;
$$;

-- Funcion auxiliar usada por sp_registrar_pago
-- determina el estado de la factura segun los pagos recibidos
CREATE OR REPLACE FUNCTION fn_calcular_estado_factura(p_factura_id INT)
RETURNS VARCHAR(20)
LANGUAGE plpgsql
STABLE
AS $$
DECLARE
    v_total        NUMERIC(10,2);
    v_total_pagado NUMERIC(10,2);
BEGIN
    SELECT f.total,
           COALESCE(SUM(pg.monto), 0)
    INTO v_total, v_total_pagado
    FROM facturas f
    LEFT JOIN pagos pg ON pg.factura_id = f.id
    WHERE f.id = p_factura_id
    GROUP BY f.total;

    IF v_total_pagado = 0 THEN
        RETURN 'pendiente';
    ELSIF v_total_pagado < v_total THEN
        RETURN 'pagada_parcial';
    ELSE
        RETURN 'pagada';
    END IF;
END;
$$;