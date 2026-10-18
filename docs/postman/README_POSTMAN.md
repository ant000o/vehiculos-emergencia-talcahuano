# Guía de Pruebas Postman — SIGEV Bomberos Talcahuano

Este directorio contiene la **Colección Oficial de Postman** y los **Entornos (Environments)** para demostrar la cobertura completa de pruebas CRUD sobre las **13 tablas de la base de datos** del sistema SIGEV, además de la autenticación JWT y los módulos de Dashboard y Estadísticas requeridos para la entrega de **Sprint 2**.

---

## 📁 Archivos Incluidos

1. **`SIGEV_Bomberos_Talcahuano.postman_collection.json`**
   - Colección completa en formato Postman v2.1.
   - Contiene **más de 45 peticiones** organizadas en carpetas temáticas para cada una de las 13 tablas de la base de datos.
   - Incluye scripts de prueba automáticos (`pm.test`) que validan códigos de estado HTTP (200 OK, 201 Created), tipos de respuesta JSON y encadenamiento automático de IDs generados.

2. **`SIGEV_Render_Prod.postman_environment.json`**
   - Entorno configurado para el backend en la nube (Render): `https://api-backend-bomberos.onrender.com`
   - Credenciales del usuario administrador cargadas por defecto.

3. **`SIGEV_Local.postman_environment.json`**
   - Entorno configurado para desarrollo en máquina local: `http://localhost:3000`

---

## 🚀 Pasos para Importar y Ejecutar en Postman

### Paso 1: Importar en Postman
1. Abre **Postman**.
2. Haz clic en el botón **Import** (esquina superior izquierda).
3. Arrastra o selecciona los 3 archivos JSON:
   - `SIGEV_Bomberos_Talcahuano.postman_collection.json`
   - `SIGEV_Render_Prod.postman_environment.json`
   - `SIGEV_Local.postman_environment.json`
4. Postman confirmará la importación de 1 colección y 2 entornos.

### Paso 2: Seleccionar el Entorno Activo
1. En la esquina superior derecha de Postman, abre el selector de entornos (dropdown).
2. Selecciona **`SIGEV - Render Producción`** (o `SIGEV - Localhost` si estás corriendo el backend en tu máquina).

### Paso 3: Obtener el Token JWT
1. En la barra lateral izquierda, abre la carpeta **`00. Autenticación`**.
2. Selecciona el request **`Login Administrador (Obtener JWT)`**.
3. Haz clic en **Send**.
4. ¡Listo! El script de prueba guardará automáticamente el `access_token` en la variable de entorno `{{token}}`. Ya no necesitas copiar y pegar el token manualmente.

### Paso 4: Ejecución Masiva Automatizada (Collection Runner)
Para mostrarle al profesor que todas las pruebas pasan de forma automática:
1. Haz clic derecho sobre la colección **`SIGEV - Bomberos Talcahuano (Pruebas CRUD 13 Tablas)`**.
2. Selecciona **Run collection**.
3. Asegúrate de que el entorno activo sea **`SIGEV - Render Producción`**.
4. Haz clic en el botón azul **Run SIGEV - Bomberos Talcahuano...**.
5. Postman ejecutará secuencialmente todas las solicitudes y mostrará el informe con todos los tests en **verde (Pass)**.

---

## 📋 Cobertura de Tablas del Sistema (13 Tablas)

| # | Módulo / Carpeta | Métodos Incluidos | Descripción |
|---|------------------|-------------------|-------------|
| 0 | `00. Autenticación` | POST | Login con JWT Bearer Token |
| 1 | `01. Roles` | GET, POST, GET/:id, PATCH, DELETE | Gestión de roles de usuario |
| 2 | `02. Compañías` | GET, POST, GET/:id, PATCH, DELETE | Cuarteles con geometría Point (PostGIS) |
| 3 | `03. Usuarios` | GET, POST, GET/:id, PATCH, DELETE | Personal y credenciales cifradas |
| 4 | `04. Vehículos` | GET, POST, GET/:id, PATCH, DELETE, Filtro | Flota de emergencia y filtros (HU-12, HU-13) |
| 5 | `05. Grifos` | GET, POST, GET/:id, PATCH, DELETE, Cercanos | Red de agua y búsqueda geoespacial (HU-14) |
| 6 | `06. Categorías de Artículo` | GET, POST, GET/:id, PATCH, DELETE | Categorización de insumos y repuestos |
| 7 | `07. Artículos de Inventario` | GET, POST, GET/:id, PATCH, DELETE | Inventario con stock y costo histórico |
| 8 | `08. Mantenciones` | GET, POST, GET/:id, PATCH, DELETE | Órdenes de trabajo preventivas y correctivas |
| 9 | `09. Despachos de Emergencia` | GET, POST, GET/:id, PATCH, DELETE | Salidas operativas a siniestros |
| 10 | `10. Despacho Personal` | GET, POST, GET/:id, PATCH, DELETE | Dotación asignada por clave compuesta |
| 11 | `11. Registros de Operatividad` | GET, POST, GET/:id, PATCH, DELETE | Bitácora de chequeo diario de móviles |
| 12 | `12. Movimientos de Inventario` | GET, POST Entrada, POST Salida, GET/:id | Kardex append-only inmutable de auditoría |
| 13 | `13. Detalles de Mantención` | GET, POST, GET/:id, PATCH, DELETE | Consumo de repuestos por orden de taller |
| 14 | `14. Estadísticas y Dashboard` | GET Dashboard, Mantenciones/Mes, Top Gastos, Tiempos Taller (HU-24), Alertas (HU-15) | Métricas y KPIs de soporte para Sprint 2 y 3 |
