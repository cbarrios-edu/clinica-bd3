const { faker } = require('@faker-js/faker/locale/es');
require('dotenv').config();
const pool = require('../src/config/db');

// ── Helpers ──────────────────────────────────────────────
const aleatorio = (arr) => arr[Math.floor(Math.random() * arr.length)];
const num = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;

async function seed() {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    console.log('Iniciando seed PostgreSQL...\n');

    // ── 1. USUARIOS ──────────────────────────────────────
    console.log('Insertando usuarios...');
    const usuarios = [
      ['Recepcion Uno',   'recepcion1@clinica.com', 'recepcion'],
      ['Recepcion Dos',   'recepcion2@clinica.com', 'recepcion'],
      ['Admin Sistema',   'admin@clinica.com',      'admin'],
    ];
    const usuarioIds = [];
    for (const [nombre, email, rol] of usuarios) {
      const r = await client.query(
        `INSERT INTO usuarios (nombre, email, rol)
         VALUES ($1, $2, $3) RETURNING id`, [nombre, email, rol]
      );
      usuarioIds.push(r.rows[0].id);
    }
    console.log(`  ${usuarioIds.length} usuarios insertados`);

    // ── 2. ESPECIALIDADES ────────────────────────────────
    console.log('Insertando especialidades...');
    const especialidadesData = [
      ['Cardiología',      'Diagnóstico y tratamiento de enfermedades del corazón'],
      ['Pediatría',        'Atención médica de niños y adolescentes'],
      ['Dermatología',     'Diagnóstico y tratamiento de enfermedades de la piel'],
      ['Ginecología',      'Salud del sistema reproductor femenino'],
      ['Medicina General', 'Atención primaria y consulta general'],
    ];
    const espIds = [];
    for (const [nombre, desc] of especialidadesData) {
      const r = await client.query(
        `INSERT INTO especialidades (nombre, descripcion)
         VALUES ($1, $2) RETURNING id`, [nombre, desc]
      );
      espIds.push(r.rows[0].id);
    }
    console.log(`  ${espIds.length} especialidades insertadas`);

    // ── 3. MÉDICOS (10, al menos 2 por especialidad) ─────
    console.log('Insertando médicos...');
    const medicosData = [
      ['Carlos',   'Méndez',    espIds[0], '1234'],  // Cardiología
      ['Ana',      'López',     espIds[0], '1235'],  // Cardiología
      ['Roberto',  'García',    espIds[1], '1236'],  // Pediatría
      ['María',    'Rodríguez', espIds[1], '1237'],  // Pediatría
      ['Jorge',    'Martínez',  espIds[2], '1238'],  // Dermatología
      ['Lucía',    'Hernández', espIds[2], '1239'],  // Dermatología
      ['Patricia', 'Díaz',      espIds[3], '1240'],  // Ginecología
      ['Sandra',   'Torres',    espIds[3], '1241'],  // Ginecología
      ['Miguel',   'Flores',    espIds[4], '1242'],  // Medicina General
      ['Elena',    'Vásquez',   espIds[4], '1243'],  // Medicina General
    ];
    const medicoIds = [];
    for (const [nombres, apellidos, espId, colegiado] of medicosData) {
      const r = await client.query(
        `INSERT INTO medicos (nombres, apellidos, especialidad_id, colegiado, email)
         VALUES ($1, $2, $3, $4, $5) RETURNING id`,
        [nombres, apellidos, espId, colegiado,
         `${nombres.toLowerCase()}.${apellidos.toLowerCase()}@clinica.com`]
      );
      medicoIds.push(r.rows[0].id);
    }
    console.log(`  ${medicoIds.length} médicos insertados`);

    // ── 4. HORARIOS (lunes a viernes, 8am-5pm) ───────────
    console.log('Insertando horarios...');
    let horariosCount = 0;
    for (const medicoId of medicoIds) {
      for (let dia = 1; dia <= 5; dia++) { // 1=Lunes ... 5=Viernes
        await client.query(
          `INSERT INTO horarios_medico (medico_id, dia_semana, hora_inicio, hora_fin)
           VALUES ($1, $2, $3, $4)`,
          [medicoId, dia, '08:00', '17:00']
        );
        horariosCount++;
      }
    }
    console.log(`  ${horariosCount} horarios insertados`);

    // ── 5. PACIENTES (30 con edades variadas) ────────────
    console.log('Insertando pacientes...');
    const pacienteIds = [];
    const edades = [
      5,8,12,15,17,          // 0-17 (niños/adolescentes)
      20,25,28,32,35,38,     // 18-39
      41,45,48,52,55,58,     // 40-59
      62,65,68,72,75,78,82,  // 60+
      22,30,44,55,67,71      // variados
    ];
    for (let i = 0; i < 30; i++) {
      const fechaNac = new Date();
      fechaNac.setFullYear(fechaNac.getFullYear() - edades[i]);
      const r = await client.query(
        `INSERT INTO pacientes (nombres, apellidos, fecha_nacimiento, dpi, telefono, email, direccion)
         VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING id`,
        [
          faker.person.firstName(),
          faker.person.lastName(),
          fechaNac.toISOString().split('T')[0],
          faker.string.numeric(13),
          faker.phone.number(),
          faker.internet.email(),
          faker.location.streetAddress()
        ]
      );
      pacienteIds.push(r.rows[0].id);
    }
    console.log(`  ${pacienteIds.length} pacientes insertados`);

    // ── 6. SERVICIOS ─────────────────────────────────────
    console.log('Insertando servicios...');
    const serviciosData = [
      ['Consulta General',        'consulta',      150.00],
      ['Consulta Especialista',   'consulta',      250.00],
      ['Consulta Cardiología',    'consulta',      300.00],
      ['Consulta Pediatría',      'consulta',      200.00],
      ['Consulta Dermatología',   'consulta',      250.00],
      ['Consulta Ginecología',    'consulta',      280.00],
      ['Electrocardiograma',      'examen',        150.00],
      ['Hemograma Completo',      'examen',         80.00],
      ['Glucosa en Sangre',       'examen',         50.00],
      ['Radiografía de Tórax',    'examen',        120.00],
      ['Ultrasonido Abdominal',   'examen',        200.00],
      ['Biopsia de Piel',         'procedimiento', 350.00],
      ['Infiltración',            'procedimiento', 180.00],
      ['Curación Simple',         'procedimiento',  80.00],
      ['Papanicolaou',            'procedimiento',  90.00],
    ];
    const servicioIds = [];
    for (const [nombre, tipo, precio] of serviciosData) {
      const r = await client.query(
        `INSERT INTO servicios (nombre, tipo, precio)
         VALUES ($1, $2, $3) RETURNING id`, [nombre, tipo, precio]
      );
      servicioIds.push(r.rows[0].id);
    }
    console.log(`  ${servicioIds.length} servicios insertados`);

    // ── 7. CITAS (200 en últimos 6 meses) ────────────────
    console.log('Insertando citas...');
    const estados = ['programada','confirmada','atendida','atendida','atendida','cancelada','no_asistio'];
    const citaIds = [];
    const citasAtendidas = [];
    let citasCount = 0;

    // Generar fechas distribuidas en los últimos 6 meses
    const hoy = new Date();
    for (let i = 0; i < 200; i++) {
      const diasAtras = num(0, 180);
      const fecha = new Date(hoy);
      fecha.setDate(fecha.getDate() - diasAtras);

      // Solo días laborables
      while (fecha.getDay() === 0 || fecha.getDay() === 6) {
        fecha.setDate(fecha.getDate() + 1);
      }

      // Hora entre 8am y 4pm en bloques de 30 min
      const horas  = num(8, 15);
      const minutos = aleatorio([0, 30]);
      fecha.setHours(horas, minutos, 0, 0);

      const medicoId   = aleatorio(medicoIds);
      const pacienteId = aleatorio(pacienteIds);
      const estado     = aleatorio(estados);
      const motivo     = estado === 'cancelada'
        ? aleatorio(['Paciente no pudo asistir','Médico no disponible','Emergencia personal'])
        : null;

      try {
        const r = await client.query(
          `INSERT INTO citas
             (medico_id, paciente_id, fecha_hora, duracion_min, estado,
              motivo_cancelacion, agendado_por)
           VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING id`,
          [medicoId, pacienteId, fecha.toISOString(),
           30, estado, motivo, aleatorio(usuarioIds)]
        );
        citaIds.push(r.rows[0].id);
        if (estado === 'atendida') citasAtendidas.push(r.rows[0].id);
        citasCount++;
      } catch (e) {
        // Ignorar duplicados de horario
      }
    }
    console.log(`  ${citasCount} citas insertadas (${citasAtendidas.length} atendidas)`);

    // ── 8. FACTURAS (100) ────────────────────────────────
    console.log('Insertando facturas y detalles...');
    const facturaIds = [];
    const citasParaFacturar = citasAtendidas.slice(0, 100);

    for (const citaId of citasParaFacturar) {
      // Obtener paciente de la cita
      const citaRes = await client.query(
        'SELECT paciente_id FROM citas WHERE id = $1', [citaId]
      );
      const pacienteId = citaRes.rows[0].paciente_id;

      // 1 o 2 servicios por factura
      const numServicios = aleatorio([1, 1, 2]);
      const serviciosSelec = [];
      for (let s = 0; s < numServicios; s++) {
        serviciosSelec.push(aleatorio(servicioIds));
      }

      // Calcular total
      let total = 0;
      const detalles = [];
      for (const svcId of serviciosSelec) {
        const svcRes = await client.query(
          'SELECT precio FROM servicios WHERE id = $1', [svcId]
        );
        const precio = parseFloat(svcRes.rows[0].precio);
        total += precio;
        detalles.push({ svcId, precio });
      }

      // Insertar factura
      const fRes = await client.query(
        `INSERT INTO facturas (cita_id, paciente_id, total, estado)
         VALUES ($1, $2, $3, 'pendiente') RETURNING id`,
        [citaId, pacienteId, total.toFixed(2)]
      );
      const facturaId = fRes.rows[0].id;
      facturaIds.push(facturaId);

      // Insertar detalle
      for (const { svcId, precio } of detalles) {
        await client.query(
          `INSERT INTO factura_detalle (factura_id, servicio_id, cantidad, precio_unitario)
           VALUES ($1, $2, 1, $3)`,
          [facturaId, svcId, precio]
        );
      }
    }
    console.log(`  ${facturaIds.length} facturas insertadas`);

    // ── 9. PAGOS (80) ────────────────────────────────────
    console.log('Insertando pagos...');
    const metodos = ['efectivo','tarjeta','transferencia'];
    let pagosCount = 0;
    const facturasPagar = facturaIds.slice(0, 80);

    for (const facturaId of facturasPagar) {
      const fRes = await client.query(
        'SELECT total FROM facturas WHERE id = $1', [facturaId]
      );
      const total = parseFloat(fRes.rows[0].total);
      const tipoPago = aleatorio(['completo','completo','parcial']);

      if (tipoPago === 'completo') {
        await client.query(
          `INSERT INTO pagos (factura_id, monto, metodo_pago, registrado_por)
           VALUES ($1, $2, $3, $4)`,
          [facturaId, total, aleatorio(metodos), aleatorio(usuarioIds)]
        );
        await client.query(
          `UPDATE facturas SET estado = 'pagada' WHERE id = $1`, [facturaId]
        );
        pagosCount++;
      } else {
        // Pago parcial: 50% del total
        const parcial = parseFloat((total * 0.5).toFixed(2));
        await client.query(
          `INSERT INTO pagos (factura_id, monto, metodo_pago, registrado_por)
           VALUES ($1, $2, $3, $4)`,
          [facturaId, parcial, aleatorio(metodos), aleatorio(usuarioIds)]
        );
        await client.query(
          `UPDATE facturas SET estado = 'pagada_parcial' WHERE id = $1`, [facturaId]
        );
        pagosCount++;
      }
    }
    console.log(`  ${pagosCount} pagos insertados`);

    // ── 10. AUDITORÍA (500+) ─────────────────────────────
    console.log('Insertando log de auditoría...');
    const acciones = [
      'CITA_AGENDADA','CITA_CANCELADA','PAGO_REGISTRADO',
      'FACTURA_EMITIDA','HISTORIAL_REGISTRADO'
    ];
    let auditoriaCount = 0;
    for (let i = 0; i < 500; i++) {
      await client.query(
        `INSERT INTO auditoria_log (entidad, entidad_id, accion, usuario_id, datos_nuevos)
         VALUES ($1, $2, $3, $4, $5)`,
        [
          aleatorio(['citas','pagos','facturas']),
          num(1, 200),
          aleatorio(acciones),
          aleatorio(usuarioIds),
          JSON.stringify({ detalle: faker.lorem.sentence() })
        ]
      );
      auditoriaCount++;
    }
    console.log(`  ${auditoriaCount} entradas de auditoría insertadas`);

    await client.query('COMMIT');

    console.log('\n====================================');
    console.log('SEED COMPLETADO EXITOSAMENTE');
    console.log('====================================');
    console.log(`Especialidades : 5`);
    console.log(`Médicos        : ${medicoIds.length}`);
    console.log(`Pacientes      : ${pacienteIds.length}`);
    console.log(`Citas          : ${citasCount}`);
    console.log(`Citas atendidas: ${citasAtendidas.length}`);
    console.log(`Facturas       : ${facturaIds.length}`);
    console.log(`Pagos          : ${pagosCount}`);
    console.log(`Auditoría      : ${auditoriaCount}`);
    console.log('\nIDs de citas atendidas (para seed MongoDB):');
    console.log(citasAtendidas.slice(0, 10).join(', ') + '...');

  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Error en seed, ROLLBACK ejecutado:', err.message);
    throw err;
  } finally {
    client.release();
    await pool.end();
  }
}

seed().catch(console.error);
