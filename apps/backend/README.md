# Backend — API REST

NestJS + Prisma + PostgreSQL/PostGIS + JWT.

## Instalación local

> Este proyecto es parte de un monorepo con npm workspaces: la instalación de dependencias (`npm install`) se hace **una sola vez desde la raíz del repositorio**, no dentro de esta carpeta. Ver el `README.md` raíz.

```bash
cp .env.example .env
npx prisma migrate dev --schema=prisma/schema.prisma
npm run start:dev
```

- API: `http://localhost:3000`
- Swagger: `http://localhost:3000/api`

## Estructura sugerida por módulo de dominio

A medida que se implementen las Épicas/HU, se recomienda un módulo NestJS por dominio, por ejemplo:

```
src/
├── auth/            # Login, JWT, refresh tokens
├── usuarios/
├── vehiculos/
├── mantenciones/
├── prisma/          # PrismaService + PrismaModule (conexión compartida)
└── common/          # Guards, decoradores, pipes, filtros compartidos
```

Generar un módulo nuevo con Nest CLI:

```bash
npx nest g module vehiculos
npx nest g controller vehiculos
npx nest g service vehiculos
```

## Prisma

- El schema vive en `prisma/schema.prisma`. **Está pendiente de completar** hasta que el equipo cierre el ERD (Fase 0).
- Cualquier cambio de schema requiere avisar al equipo antes de mergear a `main` (afecta a quienes ya consumen esos tipos/endpoints).
- Comandos útiles:
  ```bash
  npx prisma migrate dev --name <nombre-descriptivo>
  npx prisma studio
  npx prisma generate
  ```

## Autenticación

JWT + refresh tokens vía `@nestjs/jwt` y `passport-jwt`. Los secretos y tiempos de expiración se configuran en `.env` (ver `.env.example`).
