# Documento de Decisiones de Diseno
Proyecto Final — Bases de Datos III — Clinica Medica Privada

## Integrantes
- Jose Alejandro Vasquez Godinez — 202308082
- Companero — Carne: ______________

---

## 1. Entidades elegidas y justificacion

Se identificaron 11 entidades para PostgreSQL y 2 colecciones para MongoDB.

### Entidades PostgreSQL
- usuarios: personal que opera el sistema (recepcion, admin)
- especialidades: catalogo de especialidades medicas
- medicos: datos profesionales vinculados a una especialidad
- horarios_medico: bloques semanales de atencion por medico
- pacientes: datos personales y de contacto
- citas: nucleo del sistema — une medico, paciente y fecha/hora
- servicios: catalogo de consultas, procedimientos y examenes con precio
- facturas: encabezado de factura por cita atendida
- factura_detalle: lineas de servicios con snapshot de precio
- pagos: pagos parciales o totales sobre una factura
- auditoria_log: registro de operaciones criticas con JSONB

### Colecciones MongoDB
- historiales_clinicos: informacion clinica variable por especialidad
- auditoria_eventos: log de alto volumen para analisis flexible

---

## 2. Division PostgreSQL vs MongoDB

### Por que PostgreSQL para datos financieros
Las facturas y pagos requieren ACID estricto. Registrar un pago es una
operacion atomica de 5 pasos: si falla cualquier paso, ningun cambio
debe persistir. PostgreSQL garantiza esto con BEGIN/EXCEPTION/ROLLBACK.
Un fallo a mitad de la transaccion en MongoDB podria dejar la factura
en estado inconsistente.

### Por que MongoDB para historiales clinicos
La informacion clinica varia sustancialmente entre especialidades.
Un cardiologo registra electrocardiograma y fraccion de eyeccion.
Un pediatra registra vacunas, percentil de talla y percentil de peso.
Un dermatologo registra tipo de lesion, localizacion y fototipo.
Modelar esto en SQL requeriria docenas de columnas con valores NULL
o una tabla EAV que es dificil de consultar. MongoDB permite el campo
datos_especialidad como objeto libre que se adapta a cada especialidad
sin modificar el schema.

### Por que MongoDB para auditoria de alto volumen
El log de auditoria puede crecer a miles de entradas diarias. El payload
de cada entrada varia segun la operacion (un pago tiene datos distintos
a una cancelacion). MongoDB maneja bien este patron de escritura intensiva
con estructura variable.

---

## 3. Reglas de negocio: schema vs stored procedure

### Implementadas a nivel de schema (DDL)
- RN-07 cancelacion requiere motivo: CHECK constraint en tabla citas
- Integridad referencial: FOREIGN KEY en todas las relaciones
- Unicidad medico+horario: UNIQUE(medico_id, fecha_hora) en citas
- Precio positivo: CHECK(precio >= 0) en servicios y facturas
- Fecha nacimiento no futura: CHECK(fecha_nacimiento <= CURRENT_DATE)

### Implementadas a nivel de stored procedure
- RN-01 sin solapamiento de citas: FOR UPDATE en sp_agendar_cita
- RN-02 cita dentro de horario: consulta a horarios_medico en sp_agendar_cita
- RN-03 un paciente/medico/dia: COUNT en sp_agendar_cita
- RN-04 pagos no exceden total: SUM(pagos) en sp_registrar_pago
- RN-05 no pagar factura anulada: validacion de estado en sp_registrar_pago
- RN-06 estado factura automatico: fn_calcular_estado_factura en sp_registrar_pago

La razon de esta division es que los constraints del DDL son inmediatos
y no requieren logica adicional. Las reglas que involucran multiples
tablas o calculos se implementan en stored procedures donde se puede
usar FOR UPDATE para manejar concurrencia.

---

## 4. Decisiones de MongoDB

### Embebido vs referencias
Los diagnosticos, medicamentos y examenes se guardan EMBEBIDOS dentro
del documento del historial clinico. La justificacion es que siempre
se consultan juntos con el historial — nunca se necesita un diagnostico
sin su historial. Embeber evita joins entre colecciones.

### Denormalizacion
Los campos especialidad, nombre_paciente y nombre_medico se guardan
denormalizados en el historial. La justificacion es que los pipelines
de aggregation no pueden hacer JOIN con PostgreSQL, entonces
denormalizar estos campos permite queries eficientes sin salir de MongoDB.

### Campo datos_especialidad
Se usa Schema.Types.Mixed para permitir estructura libre por especialidad.
Esto es exactamente el caso de uso para el que MongoDB fue disenado:
datos con estructura variable que no se conoce completamente al momento
de disenar el schema.

---

## 5. Normalizacion

El modelo relacional esta normalizado hasta la 3a Forma Normal.

La unica desnormalizacion es factura_detalle.subtotal como columna
generada (GENERATED ALWAYS AS cantidad * precio_unitario STORED).
Esta desnormalizacion esta justificada porque:
1. El subtotal depende directamente de atributos de la misma fila
   por lo que no viola la 3FN tecnicamente
2. Evita recalcular en cada consulta
3. El valor es siempre consistente porque lo calcula PostgreSQL
