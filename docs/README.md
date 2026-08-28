# Documentación del proyecto

## Diagramas

- [Diagrama de arquitectura cliente-servidor](./architecture/diagrama-arquitectura.png)

## Fase 1 — Definición del proyecto

Coloca aquí (`docs/fase-1/`) los documentos ya finalizados de Fase 1, o mantenlos en la plataforma institucional y deja este índice como referencia:

| N° | Documento | Estado |
| --- | --- | --- |
| 01 | Squad y Responsabilidades | ⏳ Pendiente confirmación docente |
| 02 | Análisis del Caso | ⏳ Pendiente confirmación docente |
| 03 | Mapa de Actores | ✅ Finalizado |
| 04 | Mapa Mental | ✅ Finalizado |
| 05 | Visión del Proyecto + 4 Pilares | ✅ Finalizado |
| 06 | Impact Mapping | ✅ Finalizado |
| 07 | Épicas | ✅ Finalizado |
| 08 | Historias de Usuario | ✅ Finalizado |
| 09 | User Story Mapping | ✅ Finalizado |
| 10 | Product Backlog Priorizado | 🔲 No iniciado |

## Puntos abiertos con el docente

- Discrepancia **"grifos" vs "vehículos"** en Sprints 1 y 2 (Propuesta n°2 oficial vs. documentos desarrollados). El diagrama de arquitectura actual vuelve a mencionar "grifos" en la app móvil y en el modelo de BD — hay que resolver esto antes de cerrar el ERD.
- Confirmar si Squad y Responsabilidades / Análisis del Caso requieren documento propio o quedan cubiertos por la Guía Fase 1.

## Decisiones técnicas (ADR resumido)

| Decisión | Elegido | Motivo breve |
| --- | --- | --- |
| Estructura de repositorio | Monorepo (npm workspaces) | Un solo backend sirve a web y móvil; simplifica revisión y CI para equipo de 3 personas |
| ORM | Prisma | Migraciones versionadas, evita dumps SQL manuales |
| Imagen de BD | `postgis/postgis:16-3.4` | Requerido por columnas `geometry` (georreferenciación, Sprint 3) |
| App móvil | Expo (managed workflow) | Evita configuración nativa temprana; cubre geolocalización sin módulos nativos custom |
| Autenticación | JWT + refresh tokens | Estándar para separar sesiones cortas de acceso vs. renovación |
