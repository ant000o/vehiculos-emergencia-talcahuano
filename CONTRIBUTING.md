# Guía de trabajo colaborativo

## 🌿 Estrategia de ramas

Se utiliza un flujo simplificado, adecuado para un equipo de 3 personas y un semestre académico:

- **`main`** — Rama protegida. Siempre debe estar en un estado funcional. Nadie hace `push` directo a `main`; solo se actualiza vía Pull Request aprobado.
- **`feature/<frente>-<descripcion-corta>`** — Una rama por tarea/historia de usuario. Ejemplos:
  - `feature/backend-auth-jwt`
  - `feature/backend-modelo-vehiculos`
  - `feature/web-listado-vehiculos`
  - `feature/mobile-login`
- **`fix/<descripcion-corta>`** — Para corrección de errores puntuales.

No se usa rama `develop` intermedia: dado el tamaño del equipo y la duración del proyecto, agregar una capa adicional de integración generaría más costo de sincronización que beneficio. `main` cumple ese rol, protegida por revisión obligatoria.

### Flujo de trabajo

1. Actualizar `main` localmente: `git pull origin main`
2. Crear la rama: `git checkout -b feature/backend-modelo-vehiculos`
3. Trabajar y commitear en commits pequeños y descriptivos (ver convención abajo).
4. Subir la rama: `git push origin feature/backend-modelo-vehiculos`
5. Abrir un Pull Request hacia `main` usando la plantilla del repositorio.
6. **Al menos un integrante distinto al autor debe revisar y aprobar** antes de mergear (acordado en el Working Agreement del equipo).
7. Mergear con **squash merge** para mantener el historial de `main` limpio, y eliminar la rama tras el merge.

## 📝 Convención de commits

Se usa [Conventional Commits](https://www.conventionalcommits.org/es/v1.0.0/):

```
<tipo>(<alcance opcional>): <descripción breve en minúsculas>
```

Tipos más usados:

| Tipo | Uso |
| --- | --- |
| `feat` | Nueva funcionalidad |
| `fix` | Corrección de errores |
| `docs` | Cambios solo en documentación |
| `refactor` | Cambio de código que no agrega funcionalidad ni corrige errores |
| `test` | Agregar o corregir pruebas |
| `chore` | Tareas de configuración, dependencias, build, etc. |

Ejemplos:

```
feat(backend): agregar endpoint de creación de vehículos
fix(web): corregir validación de formulario de mantención
docs: actualizar README con instrucciones de Docker
chore(backend): configurar Prisma y variables de entorno
```

## ✅ Antes de abrir un Pull Request

- [ ] El código compila y corre localmente sin errores.
- [ ] Se probó manualmente el flujo afectado.
- [ ] No se subieron archivos `.env` ni credenciales.
- [ ] Si se modificó el modelo de datos (`schema.prisma`), se avisó al equipo **antes** de mergear (afecta directamente a Backend y a los tipos usados en Web/Mobile).
- [ ] Si se modificó o agregó un endpoint, se actualizó la documentación Swagger correspondiente.

## 🔒 Cambios que siempre requieren aviso previo al equipo

- Cambios en el modelo de datos / migraciones de Prisma.
- Cambios en la forma (request/response) de un endpoint ya consumido por Web o Mobile.
- Cambios en variables de entorno compartidas o en `docker-compose.yml`.

Esto evita que alguien construya sobre una base que cambia sin previo aviso — el mismo principio que ya definieron en su Working Agreement de revisión de cambios.
