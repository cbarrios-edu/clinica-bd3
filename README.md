# Clinica Medica Privada — BD III
Sistema de gestion para clinica medica con PostgreSQL + MongoDB + Node.js

## Integrantes
- Jose Alejandro Vasquez Godinez — 202308082 (PostgreSQL)
- Companero — Carne: ______________ (MongoDB)

## Stack tecnologico
- PostgreSQL 18.3
- MongoDB 7.0 (Docker)
- Node.js 22.x
- Express 4.x
- pg (node-postgres)
- Mongoose

## Requisitos previos
- PostgreSQL instalado y corriendo
- MongoDB corriendo en Docker
- Node.js v18 o superior
- Git

## 1. Clonar el repositorio
git clone URL_DEL_REPOSITORIO
cd clinica-bd3

## 2. Instalar dependencias
npm install

## 3. Configurar variables de entorno
Crea el archivo .env con este contenido:
DB_HOST=localhost
DB_PORT=5432
DB_NAME=clinica_db
DB_USER=clinica_user
DB_PASSWORD=clinica2024
MONGODB_URI=mongodb://localhost:27017/clinica_db
PORT=3000

## 4. Crear base de datos PostgreSQL
sudo -u postgres psql
CREATE USER clinica_user WITH PASSWORD 'clinica2024';
CREATE DATABASE clinica_db OWNER clinica_user;
GRANT ALL PRIVILEGES ON DATABASE clinica_db TO clinica_user;

## 5. Ejecutar scripts SQL en orden
psql -U clinica_user -d clinica_db -h localhost -f db/postgres/01_schema.sql
psql -U clinica_user -d clinica_db -h localhost -f db/postgres/02_indexes.sql
psql -U clinica_user -d clinica_db -h localhost -f db/postgres/03_views.sql
psql -U clinica_user -d clinica_db -h localhost -f db/postgres/04_functions.sql
psql -U clinica_user -d clinica_db -h localhost -f db/postgres/05_stored_procedures.sql
psql -U clinica_user -d clinica_db -h localhost -f db/postgres/06_sp_agendar_cita.sql

## 6. Levantar MongoDB en Docker
sudo docker run -d --name mongodb --restart unless-stopped -p 27017:27017 -v mongodb_data:/data/db --privileged mongo:7.0

## 7. Cargar datos de prueba
node seed/seed_postgres.js
node seed/seed_mongo.js

## 8. Iniciar la API
node src/index.js
API disponible en http://localhost:3000

## Endpoints principales
POST /api/citas — Agendar cita
POST /api/citas/:id/cancelar — Cancelar cita
POST /api/pagos — Registrar pago
POST /api/historiales — Insertar historial clinico
GET /api/reportes/agenda-diaria
GET /api/reportes/facturas-pendientes
GET /api/reportes/facturacion-mensual
GET /api/reportes/ranking-medicos
GET /api/reportes/diagnosticos
GET /api/reportes/medicamentos
GET /api/medicos/:id/disponibilidad?fecha=YYYY-MM-DD
GET /api/pacientes/:id/saldo

## Backup y restauracion
Crear backup: ./docs/backup_full.sh
Restaurar: ./docs/restore.sh ARCHIVO_BACKUP.sql
