CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Usuarios del sistema (recepcion y admin)
CREATE TABLE usuarios (
    id          SERIAL PRIMARY KEY,
    nombre      VARCHAR(100) NOT NULL,
    email       VARCHAR(150) NOT NULL,
    rol         VARCHAR(30)  NOT NULL CHECK (rol IN ('recepcion', 'medico', 'admin')),
    activo      BOOLEAN      NOT NULL DEFAULT TRUE,
    creado_en   TIMESTAMP    NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_usuarios_email UNIQUE (email)
);

-- Especialidades que maneja la clinica
CREATE TABLE especialidades (
    id          SERIAL PRIMARY KEY,
    nombre      VARCHAR(100) NOT NULL,
    descripcion TEXT,
    activo      BOOLEAN      NOT NULL DEFAULT TRUE,
    CONSTRAINT uq_especialidades_nombre UNIQUE (nombre)
);

-- Datos de los medicos
CREATE TABLE medicos (
    id              SERIAL PRIMARY KEY,
    usuario_id      INT          REFERENCES usuarios(id) ON DELETE SET NULL,
    especialidad_id INT          NOT NULL REFERENCES especialidades(id) ON DELETE RESTRICT,
    nombres         VARCHAR(100) NOT NULL,
    apellidos       VARCHAR(100) NOT NULL,
    colegiado       VARCHAR(30)  NOT NULL,
    telefono        VARCHAR(20),
    email           VARCHAR(150),
    activo          BOOLEAN      NOT NULL DEFAULT TRUE,
    creado_en       TIMESTAMP    NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_medicos_colegiado UNIQUE (colegiado),
    CONSTRAINT uq_medicos_email     UNIQUE (email)
);

-- Horarios de atencion semanal por medico
-- dia_semana: 0=Domingo, 1=Lunes ... 6=Sabado
CREATE TABLE horarios_medico (
    id          SERIAL PRIMARY KEY,
    medico_id   INT         NOT NULL REFERENCES medicos(id) ON DELETE CASCADE,
    dia_semana  SMALLINT    NOT NULL CHECK (dia_semana BETWEEN 0 AND 6),
    hora_inicio TIME        NOT NULL,
    hora_fin    TIME        NOT NULL,
    CONSTRAINT chk_horario_valido    CHECK (hora_fin > hora_inicio),
    CONSTRAINT uq_horario_medico_dia UNIQUE (medico_id, dia_semana, hora_inicio)
);

-- Pacientes registrados
CREATE TABLE pacientes (
    id               SERIAL PRIMARY KEY,
    nombres          VARCHAR(100) NOT NULL,
    apellidos        VARCHAR(100) NOT NULL,
    fecha_nacimiento DATE         NOT NULL,
    dpi              VARCHAR(20),
    telefono         VARCHAR(20),
    email            VARCHAR(150),
    direccion        TEXT,
    creado_en        TIMESTAMP    NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_pacientes_dpi UNIQUE (dpi),
    CONSTRAINT chk_fecha_nac    CHECK (fecha_nacimiento <= CURRENT_DATE)
);

-- Tabla principal de citas
-- RN-07: si se cancela debe tener motivo
CREATE TABLE citas (
    id                  SERIAL PRIMARY KEY,
    medico_id           INT          NOT NULL REFERENCES medicos(id)   ON DELETE RESTRICT,
    paciente_id         INT          NOT NULL REFERENCES pacientes(id) ON DELETE RESTRICT,
    fecha_hora          TIMESTAMP    NOT NULL,
    duracion_min        SMALLINT     NOT NULL DEFAULT 30 CHECK (duracion_min > 0),
    estado              VARCHAR(20)  NOT NULL DEFAULT 'programada'
                            CHECK (estado IN ('programada','confirmada','atendida','cancelada','no_asistio')),
    motivo_cancelacion  TEXT,
    agendado_por        INT          REFERENCES usuarios(id) ON DELETE SET NULL,
    creado_en           TIMESTAMP    NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_cita_medico_hora UNIQUE (medico_id, fecha_hora),
    CONSTRAINT chk_cancelacion_motivo
        CHECK (estado <> 'cancelada' OR motivo_cancelacion IS NOT NULL)
);

-- Servicios que se pueden facturar
CREATE TABLE servicios (
    id      SERIAL PRIMARY KEY,
    nombre  VARCHAR(150) NOT NULL,
    tipo    VARCHAR(30)  NOT NULL CHECK (tipo IN ('consulta','procedimiento','examen')),
    precio  NUMERIC(10,2) NOT NULL CHECK (precio >= 0),
    activo  BOOLEAN       NOT NULL DEFAULT TRUE,
    CONSTRAINT uq_servicios_nombre UNIQUE (nombre)
);

-- Encabezado de facturas
CREATE TABLE facturas (
    id          SERIAL PRIMARY KEY,
    cita_id     INT           NOT NULL REFERENCES citas(id)     ON DELETE RESTRICT,
    paciente_id INT           NOT NULL REFERENCES pacientes(id) ON DELETE RESTRICT,
    total       NUMERIC(10,2) NOT NULL CHECK (total >= 0),
    estado      VARCHAR(20)   NOT NULL DEFAULT 'pendiente'
                    CHECK (estado IN ('pendiente','pagada_parcial','pagada','anulada')),
    emitida_en  TIMESTAMP     NOT NULL DEFAULT NOW(),
    anulada_en  TIMESTAMP,
    CONSTRAINT uq_facturas_cita  UNIQUE (cita_id),
    CONSTRAINT chk_anulada_fecha CHECK (estado <> 'anulada' OR anulada_en IS NOT NULL)
);

-- Detalle de servicios por factura
-- precio_unitario se guarda como snapshot para no perder el precio historico
CREATE TABLE factura_detalle (
    id              SERIAL PRIMARY KEY,
    factura_id      INT           NOT NULL REFERENCES facturas(id)  ON DELETE CASCADE,
    servicio_id     INT           NOT NULL REFERENCES servicios(id) ON DELETE RESTRICT,
    cantidad        INT           NOT NULL DEFAULT 1 CHECK (cantidad > 0),
    precio_unitario NUMERIC(10,2) NOT NULL CHECK (precio_unitario >= 0),
    subtotal        NUMERIC(10,2) NOT NULL
                        GENERATED ALWAYS AS (cantidad * precio_unitario) STORED
);

-- Pagos sobre facturas, puede haber varios por factura
CREATE TABLE pagos (
    id              SERIAL PRIMARY KEY,
    factura_id      INT           NOT NULL REFERENCES facturas(id)  ON DELETE RESTRICT,
    monto           NUMERIC(10,2) NOT NULL CHECK (monto > 0),
    metodo_pago     VARCHAR(30)   NOT NULL CHECK (metodo_pago IN ('efectivo','tarjeta','transferencia','cheque')),
    pagado_en       TIMESTAMP     NOT NULL DEFAULT NOW(),
    registrado_por  INT           REFERENCES usuarios(id) ON DELETE SET NULL
);

-- Log de auditoria para operaciones importantes
CREATE TABLE auditoria_log (
    id               SERIAL PRIMARY KEY,
    entidad          VARCHAR(50)  NOT NULL,
    entidad_id       INT,
    accion           VARCHAR(50)  NOT NULL,
    usuario_id       INT          REFERENCES usuarios(id) ON DELETE SET NULL,
    datos_anteriores JSONB,
    datos_nuevos     JSONB,
    creado_en        TIMESTAMP    NOT NULL DEFAULT NOW()
);