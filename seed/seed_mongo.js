const mongoose = require('mongoose');
require('dotenv').config();
const { faker } = require('@faker-js/faker');

const HistorialClinico = require('../db/mongodb/schemas/HistorialClinico');
const AuditoriaEvento = require('../db/mongodb/schemas/AuditoriaEvento');
const { procesarHistorial } = require('../db/mongodb/utils/procesarHistorial');

// IDs simulados de PostgreSQL (Coordina con tu compañero para usar los reales)
const CITA_IDS = Array.from({ length: 150 }, (_, i) => i + 1);
const PACIENTE_IDS = Array.from({ length: 30 }, (_, i) => i + 1);
const MEDICO_IDS = Array.from({ length: 10 }, (_, i) => i + 1);
const ESPECIALIDADES = ['cardiologia', 'pediatria', 'dermatologia', 'ginecologia', 'medicina general'];

function datosEspecialidad(esp) {
    const map = {
        'cardiologia': {
            electrocardiograma: faker.helpers.arrayElement(['ritmo sinusal normal', 'taquicardia', 'bradicardia']),
            fraccion_eyeccion: faker.number.int({ min: 40, max: 75 })
        },
        'pediatria': {
            vacunas_aplicadas: [faker.helpers.arrayElement(['MMR', 'DPT', 'Hepatitis B'])],
            percentil_talla: faker.number.int({ min: 10, max: 97 }),
            percentil_peso: faker.number.int({ min: 10, max: 97 })
        },
        'dermatologia': {
            tipo_lesion: faker.helpers.arrayElement(['macula', 'papula', 'vesicula', 'placa']),
            localizacion: faker.helpers.arrayElement(['cara', 'tronco', 'extremidades', 'cuero cabelludo']),
            fototipo: faker.number.int({ min: 1, max: 6 })
        },
        'ginecologia': {
            ultima_menstruacion: faker.date.recent({ days: 90 }),
            gestas: faker.number.int({ min: 0, max: 5 }),
            partos: faker.number.int({ min: 0, max: 4 })
        },
        'medicina general': {
            motivo_principal: faker.helpers.arrayElement(['control', 'urgencia', 'seguimiento'])
        }
    };
    return map[esp] || {};
}

async function seedMongoDB() {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('Conectado a MongoDB');

        // Limpiar colecciones
        await HistorialClinico.deleteMany({});
        await AuditoriaEvento.deleteMany({});
        console.log('Colecciones limpiadas');

        // Generar 150 historiales
        const historiales = [];
        for (let i = 0; i < 150; i++) {
            const especialidad = faker.helpers.arrayElement(ESPECIALIDADES);
            const datos = {
                cita_id: CITA_IDS[i],
                paciente_id: faker.helpers.arrayElement(PACIENTE_IDS),
                medico_id: faker.helpers.arrayElement(MEDICO_IDS),
                especialidad,
                nombre_paciente: faker.person.fullName(),
                nombre_medico: 'Dr. ' + faker.person.fullName(),
                fecha_consulta: faker.date.recent({ days: 180 }),
                motivo_consulta: faker.helpers.arrayElement(['control rutinario', 'dolor abdominal', 'fiebre', 'seguimiento']),
                signos_vitales: {
                    presion_arterial: `${faker.number.int({ min: 110, max: 140 })}/${faker.number.int({ min: 70, max: 90 })}`,
                    frecuencia_cardiaca: faker.number.int({ min: 60, max: 100 }),
                    temperatura: parseFloat(faker.number.float({ min: 36.0, max: 38.5, fractionDigits: 1 })),
                    peso: faker.number.int({ min: 20, max: 120 }),
                    talla: faker.number.int({ min: 100, max: 195 })
                },
                diagnosticos: [{
                    codigo_cie: faker.helpers.arrayElement(['J00', 'K29', 'I10', 'E11', 'J06']),
                    descripcion: faker.helpers.arrayElement(['hipertension arterial', 'diabetes', 'resfriado', 'gastritis']),
                    tipo: 'principal'
                }],
                medicamentos: [{
                    nombre: faker.helpers.arrayElement(['amoxicilina', 'metformina', 'losartan', 'omeprazol']),
                    dosis: faker.helpers.arrayElement(['500mg', '850mg', '50mg', '20mg']),
                    frecuencia: faker.helpers.arrayElement(['cada 8 horas', 'cada 12 horas', 'una vez al dia']),
                    duracion: faker.helpers.arrayElement(['7 dias', '14 dias', '30 dias'])
                }],
                examenes: faker.datatype.boolean() ? [{
                    tipo: faker.helpers.arrayElement(['hemograma', 'glucosa', 'orina', 'radiografia']),
                    descripcion: 'examen de control',
                    urgente: false
                }] : [],
                notas: faker.datatype.boolean() ? faker.lorem.sentence() : '',
                datos_especialidad: datosEspecialidad(especialidad),
                edad_paciente: faker.number.int({ min: 5, max: 85 }) // Campo extra para simular edad
            };
            historiales.push(procesarHistorial(datos));
        }
        await HistorialClinico.insertMany(historiales);
        console.log('150 historiales insertados');

        // Generar 500 eventos de auditoría
        const acciones = ['CITA_AGENDADA', 'CITA_CANCELADA', 'PAGO_REGISTRADO', 'HISTORIAL_REGISTRADO', 'FACTURA_EMITIDA'];
        const eventos = Array.from({ length: 500 }, () => ({
            entidad: faker.helpers.arrayElement(['citas', 'pagos', 'facturas', 'historiales']),
            entidad_id: faker.number.int({ min: 1, max: 200 }),
            accion: faker.helpers.arrayElement(acciones),
            usuario_id: faker.number.int({ min: 1, max: 5 }),
            datos: { detalle: faker.lorem.sentence() },
            ip_origen: faker.internet.ipv4(),
            creado_en: faker.date.recent({ days: 180 })
        }));
        await AuditoriaEvento.insertMany(eventos);
        console.log('500 eventos de auditoría insertados');

    } catch (error) {
        console.error('Error ejecutando seed:', error);
    } finally {
        await mongoose.disconnect();
        console.log('Seed completado y desconectado.');
    }
}

seedMongoDB();