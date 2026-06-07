-- Stored Procedures - Clinica Medica

-- SP para registrar un pago sobre una factura (OC-01)
-- Todo se ejecuta de forma atomica, si algo falla hace ROLLBACK
CREATE OR REPLACE PROCEDURE sp_registrar_pago(
    p_factura_id    INT,
    p_monto         NUMERIC(10,2),
    p_metodo_pago   VARCHAR(30),
    p_usuario_id    INT
)
LANGUAGE plpgsql
AS $$
DECLARE
    v_factura       RECORD;
    v_total_pagado  NUMERIC(10,2);
    v_saldo         NUMERIC(10,2);
    v_nuevo_estado  VARCHAR(20);
    v_pago_id       INT;
BEGIN
    -- bloqueo la factura para evitar que dos pagos entren al mismo tiempo
    SELECT id, total, estado, paciente_id
    INTO v_factura
    FROM facturas
    WHERE id = p_factura_id
    FOR UPDATE;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Factura % no encontrada', p_factura_id
            USING ERRCODE = 'P0002';
    END IF;

    IF v_factura.estado = 'anulada' THEN
        RAISE EXCEPTION 'No se puede pagar una factura anulada', p_factura_id
            USING ERRCODE = 'P0003';
    END IF;

    IF v_factura.estado = 'pagada' THEN
        RAISE EXCEPTION 'La factura % ya esta pagada', p_factura_id
            USING ERRCODE = 'P0004';
    END IF;

    IF p_monto <= 0 THEN
        RAISE EXCEPTION 'El monto debe ser mayor a cero'
            USING ERRCODE = 'P0005';
    END IF;

    SELECT COALESCE(SUM(monto), 0)
    INTO v_total_pagado
    FROM pagos
    WHERE factura_id = p_factura_id;

    v_saldo := v_factura.total - v_total_pagado;

    IF p_monto > v_saldo THEN
        RAISE EXCEPTION 'El monto % excede el saldo pendiente %', p_monto, v_saldo
            USING ERRCODE = 'P0006';
    END IF;

    INSERT INTO pagos (factura_id, monto, metodo_pago, registrado_por)
    VALUES (p_factura_id, p_monto, p_metodo_pago, p_usuario_id)
    RETURNING id INTO v_pago_id;

    -- actualizo el estado usando la funcion auxiliar
    v_nuevo_estado := fn_calcular_estado_factura(p_factura_id);

    UPDATE facturas
    SET estado = v_nuevo_estado
    WHERE id = p_factura_id;

    INSERT INTO auditoria_log (entidad, entidad_id, accion, usuario_id, datos_nuevos)
    VALUES (
        'pagos',
        v_pago_id,
        'PAGO_REGISTRADO',
        p_usuario_id,
        jsonb_build_object(
            'factura_id',   p_factura_id,
            'monto',        p_monto,
            'metodo_pago',  p_metodo_pago,
            'estado_nuevo', v_nuevo_estado
        )
    );

EXCEPTION
    WHEN OTHERS THEN
        RAISE;
END;
$$;

-- SP para cancelar una cita (OC-02)
CREATE OR REPLACE PROCEDURE sp_cancelar_cita(
    p_cita_id       INT,
    p_motivo        TEXT,
    p_usuario_id    INT
)
LANGUAGE plpgsql
AS $$
DECLARE
    v_cita  RECORD;
BEGIN
    IF p_motivo IS NULL OR TRIM(p_motivo) = '' THEN
        RAISE EXCEPTION 'El motivo de cancelacion es obligatorio'
            USING ERRCODE = 'P0010';
    END IF;

    SELECT id, estado, medico_id, paciente_id, fecha_hora
    INTO v_cita
    FROM citas
    WHERE id = p_cita_id
    FOR UPDATE;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Cita % no encontrada', p_cita_id
            USING ERRCODE = 'P0011';
    END IF;

    IF v_cita.estado = 'atendida' THEN
        RAISE EXCEPTION 'No se puede cancelar una cita ya atendida'
            USING ERRCODE = 'P0012';
    END IF;

    IF v_cita.estado = 'cancelada' THEN
        RAISE EXCEPTION 'La cita % ya esta cancelada', p_cita_id
            USING ERRCODE = 'P0013';
    END IF;

    UPDATE citas
    SET estado             = 'cancelada',
        motivo_cancelacion = TRIM(p_motivo)
    WHERE id = p_cita_id;

    INSERT INTO auditoria_log (entidad, entidad_id, accion, usuario_id, datos_anteriores, datos_nuevos)
    VALUES (
        'citas',
        p_cita_id,
        'CITA_CANCELADA',
        p_usuario_id,
        jsonb_build_object('estado_anterior', v_cita.estado),
        jsonb_build_object('estado_nuevo', 'cancelada', 'motivo', TRIM(p_motivo))
    );

EXCEPTION
    WHEN OTHERS THEN
        RAISE;
END;
$$;