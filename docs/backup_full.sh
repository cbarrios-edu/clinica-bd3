#!/bin/bash
# ============================================================
# BACKUP FULL — Clínica Médica BD3
# Usa pg_dump para respaldo lógico completo
# ============================================================

FECHA=$(date +%Y%m%d_%H%M%S)
DIRECTORIO_BACKUP="$HOME/backups/clinica"
ARCHIVO="$DIRECTORIO_BACKUP/backup_full_$FECHA.sql"
DB_NAME="clinica_db"
DB_USER="clinica_user"
DB_HOST="localhost"

# Crear directorio si no existe
mkdir -p "$DIRECTORIO_BACKUP"

echo "Iniciando backup full: $ARCHIVO"

PGPASSWORD=clinica2024 pg_dump \
  -U "$DB_USER" \
  -h "$DB_HOST" \
  -d "$DB_NAME" \
  --verbose \
  --no-password \
  -f "$ARCHIVO"

if [ $? -eq 0 ]; then
  echo "Backup completado exitosamente: $ARCHIVO"
  echo "Tamaño: $(du -sh $ARCHIVO | cut -f1)"
else
  echo "ERROR: El backup falló"
  exit 1
fi

# ── Política de retención ──────────────────────────────────
# Eliminar backups diarios con más de 7 días
find "$DIRECTORIO_BACKUP" -name "backup_full_*.sql" -mtime +7 -delete
echo "Backups antiguos eliminados (retención: 7 días)"
