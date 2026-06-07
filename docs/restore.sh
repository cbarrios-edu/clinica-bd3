#!/bin/bash
# ============================================================
# RESTAURACIÓN — Clínica Médica BD3
# Restaura desde un backup full sobre una base limpia
# ============================================================

ARCHIVO_BACKUP=$1
DB_NAME="clinica_db"
DB_USER="clinica_user"
DB_HOST="localhost"

if [ -z "$ARCHIVO_BACKUP" ]; then
  echo "Uso: ./restore.sh <archivo_backup.sql>"
  echo "Ejemplo: ./restore.sh ~/backups/clinica/backup_full_20260607_020000.sql"
  exit 1
fi

if [ ! -f "$ARCHIVO_BACKUP" ]; then
  echo "ERROR: El archivo $ARCHIVO_BACKUP no existe"
  exit 1
fi

echo "Restaurando desde: $ARCHIVO_BACKUP"

# Eliminar y recrear la base de datos limpia
sudo -u postgres psql -c "DROP DATABASE IF EXISTS clinica_db;"
sudo -u postgres psql -c "CREATE DATABASE clinica_db OWNER clinica_user;"

# Restaurar
PGPASSWORD=clinica2024 psql \
  -U "$DB_USER" \
  -h "$DB_HOST" \
  -d "$DB_NAME" \
  -f "$ARCHIVO_BACKUP"

if [ $? -eq 0 ]; then
  echo "Restauracion completada exitosamente"
  # Validar integridad
  PGPASSWORD=clinica2024 psql -U "$DB_USER" -h "$DB_HOST" -d "$DB_NAME" -c "
    SELECT 'especialidades' AS tabla, COUNT(*) FROM especialidades
    UNION ALL SELECT 'medicos',   COUNT(*) FROM medicos
    UNION ALL SELECT 'pacientes', COUNT(*) FROM pacientes
    UNION ALL SELECT 'citas',     COUNT(*) FROM citas
    UNION ALL SELECT 'facturas',  COUNT(*) FROM facturas
    UNION ALL SELECT 'pagos',     COUNT(*) FROM pagos;"
else
  echo "ERROR: La restauracion fallo"
  exit 1
fi
