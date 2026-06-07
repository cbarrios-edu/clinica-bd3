-- SP para agendar citas - Clinica Medica

-- Valida RN-01, RN-02 y RN-03

CREATE OR REPLACE PROCEDURE sp_agendar_cita(
    p_medico_id     INT,
    p_paciente_id   INT,
    p_fecha_hora    TIMESTAMP,
    p_duracion_min  SMALLINT,
    p_agendado_por  INT,
    OUT p_cita_id   INT
)
LANGUAGE plpgsql
AS $$
DECLARE
    v_dia_semana    SMALLINT;
    v_hora          TIME;
    v_en_horario    BOOLEAN := FALSE;
    v_conflicto     INT;
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM medicos WHERE id = p_medico_id AND activo = TRUE
    ) THEN
        RAISE EXCEPTION 'Medico % no existe o esta inactivo', p_medico_id
            USING ERRCODE = 'P0020';
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pacientes WHERE id = p_paciente_id
    ) THEN
        RAISE EXCEPTION 'Paciente % no existe', p_paciente_id
            USING ERRCODE = 'P0021';
    END IF;

    IF p_fecha_hora <= NOW() THEN
        RAISE EXCEPTION 'La fecha de la cita debe ser futura'
            USING ERRCODE = 'P0022';
    END IF;

    -- RN-02: verifico que la cita caiga dentro del horario del medico
    v_dia_semana := EXTRACT(DOW FROM p_fecha_hora)::SMALLINT;
    v_hora       := p_fecha_hora::TIME;

    SELECT COUNT(*) > 0
    INTO v_en_horario
    FROM horarios_medico
    WHERE medico_id  = p_medico_id
      AND dia_semana = v_dia_semana
      AND hora_inicio <= v_hora
      AND hora_fin    >= (v_hora + (p_duracion_min || ' minutes')::INTERVAL)::TIME;

    IF NOT v_en_horario THEN
        RAISE EXCEPTION 'La hora % esta fuera del horario de atencion del medico', v_hora
            USING ERRCODE = 'P0023';
    END IF;

    -- RN-01: busco solapamiento con FOR UPDATE para manejar concurrencia
    SELECT COUNT(*)
    INTO v_conflicto
    FROM citas
    WHERE medico_id = p_medico_id
      AND estado NOT IN ('cancelada', 'no_asistio')
      AND (
          (p_fecha_hora >= fecha_hora AND
           p_fecha_hora < fecha_hora + (duracion_min || ' minutes')::INTERVAL)
          OR
          (fecha_hora >= p_fecha_hora AND
           fecha_hora < p_fecha_hora + (p_duracion_min || ' minutes')::INTERVAL)
      )
    FOR UPDATE;

    IF v_conflicto > 0 THEN
        RAISE EXCEPTION 'El medico ya tiene una cita en ese horario'
            USING ERRCODE = 'P0024';
    END IF;

    -- RN-03: un paciente no puede tener dos citas con el mismo medico el mismo dia
    SELECT COUNT(*)
    INTO v_conflicto
    FROM citas
    WHERE paciente_id = p_paciente_id
      AND medico_id   = p_medico_id
      AND DATE(fecha_hora) = DATE(p_fecha_hora)
      AND estado NOT IN ('cancelada', 'no_asistio');

    IF v_conflicto > 0 THEN
        RAISE EXCEPTION 'El paciente ya tiene una cita con este medico hoy'
            USING ERRCODE = 'P0025';
    END IF;

    INSERT INTO citas (
        medico_id, paciente_id, fecha_hora,
        duracion_min, estado, agendado_por
    )
    VALUES (
        p_medico_id, p_paciente_id, p_fecha_hora,
        p_duracion_min, 'programada', p_agendado_por
    )
    RETURNING id INTO p_cita_id;

    INSERT INTO auditoria_log (entidad, entidad_id, accion, usuario_id, datos_nuevos)
    VALUES (
        'citas',
        p_cita_id,
        'CITA_AGENDADA',
        p_agendado_por,
        jsonb_build_object(
            'medico_id',   p_medico_id,
            'paciente_id', p_paciente_id,
            'fecha_hora',  p_fecha_hora
        )
    );

EXCEPTION
    WHEN OTHERS THEN
        RAISE;
END;
$$;