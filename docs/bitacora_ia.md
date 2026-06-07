# Bitacora de Uso de IA
Proyecto Final — Bases de Datos III — Clinica Medica Privada
Integrante: Jose Alejandro Vasquez Godinez — 202308082

---

## Uso de IA en el proyecto

Se utilizo asistencia de IA principalmente para:

### Configuracion del entorno
Consulte como configurar PostgreSQL en Fedora 44 y resolver
el problema de autenticacion en pg_hba.conf.

### Revision de sintaxis
Use IA para verificar sintaxis de PL/pgSQL en funciones y
stored procedures, especialmente el uso de FOR UPDATE y
el manejo de excepciones con BEGIN/EXCEPTION.

### Seed data
Consulte ejemplos de Faker.js para generar datos coherentes
con el dominio medico.

### Depuracion
Use IA para interpretar mensajes de error de PostgreSQL
durante la ejecucion de los scripts.

---

## Partes escritas y modificadas manualmente

- Todas las tablas, constraints y relaciones del modelo ER
- La logica de los stored procedures y sus validaciones
- Las vistas normales y materializadas
- Las funciones PL/pgSQL
- Los indices y su justificacion
- El script de seed adaptado al dominio de la clinica
- Los endpoints de la API y su conexion a los objetos de BD

---

## Errores encontrados y corregidos

- MongoDB 8.0 era incompatible con el kernel de Fedora 44.
  Se cambio a MongoDB 7.0 en Docker.

- El script de restauracion requeria ajuste de permisos sudo
  especifico para Fedora.

- Las vistas materializadas necesitaban indice UNIQUE para
  poder usar REFRESH CONCURRENTLY sin bloquear lecturas.
