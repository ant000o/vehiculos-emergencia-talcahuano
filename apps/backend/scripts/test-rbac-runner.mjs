import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

// Load environment variables from the backend .env file (project root does not contain it)
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
// .env is one level up from the scripts folder (apps/backend/.env)
dotenv.config({ path: path.resolve(__dirname, '../.env') });

import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from '../dist/app.module.js';
import { JwtService } from '@nestjs/jwt';
import { DataSource } from 'typeorm';

async function runTestSuite() {
  console.log('🚀 Iniciando suite de pruebas RBAC & Alcances (Etapa 2)...');
  
  const app = await NestFactory.create(AppModule);
  app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
  const port = 3456;
  await app.listen(port);
  console.log(`Backend de prueba escuchando en http://localhost:${port}`);

  const jwtService = app.get(JwtService);

  // Tokens firmados para cada rol
  const tokenAdmin = jwtService.sign({
    sub: 12,
    email: 'admin@bomberos-talcahuano.cl',
    id_rol: 7,
    nombre_rol: 'Administrador',
    id_compania: 11,
  });

  const tokenComandante = jwtService.sign({
    sub: 14,
    email: 'comandante@bomberos-talcahuano.cl',
    id_rol: 2,
    nombre_rol: 'Comandante',
    id_compania: 11,
  });

  const tokenDirectorC1 = jwtService.sign({
    sub: 15,
    email: 'ignacio.rojas.c1.dir@bomberos-talcahuano.cl',
    id_rol: 3,
    nombre_rol: 'Director',
    id_compania: 11,
  });

  const tokenDirectorC2 = jwtService.sign({
    sub: 24,
    email: 'cristobal.rodriguez.c2.dir@bomberos-talcahuano.cl',
    id_rol: 3,
    nombre_rol: 'Director',
    id_compania: 12,
  });

  const tokenCapitanC1 = jwtService.sign({
    sub: 16,
    email: 'cristobal.soto.c1.cap@bomberos-talcahuano.cl',
    id_rol: 4,
    nombre_rol: 'Capitán',
    id_compania: 11,
  });

  const tokenMecanicoC1 = jwtService.sign({
    sub: 17,
    email: 'nicolas.diaz.c1.mec1@bomberos-talcahuano.cl',
    id_rol: 6,
    nombre_rol: 'Mecánico',
    id_compania: 11,
  });

  const tokenBomberoParticipante = jwtService.sign({
    sub: 19,
    email: 'catalina.sepulveda.c1.bom1@bomberos-talcahuano.cl',
    id_rol: 5,
    nombre_rol: 'Bombero',
    id_compania: 11,
  });

  const tokenBomberoNoParticipante = jwtService.sign({
    sub: 21,
    email: 'matias.rojas.c1.bom3@bomberos-talcahuano.cl',
    id_rol: 5,
    nombre_rol: 'Bombero',
    id_compania: 11,
  });

  const tokenCentral = jwtService.sign({
    sub: 13,
    email: 'central@bomberos-talcahuano.cl',
    id_rol: 1,
    nombre_rol: 'Central',
    id_compania: 11,
  });

  const baseUrl = `http://localhost:${port}`;
  let passed = 0;
  let failed = 0;

  async function testCase(nombre, fn) {
    try {
      await fn();
      console.log(`  ✅ PASS: ${nombre}`);
      passed++;
    } catch (err) {
      console.error(`  ❌ FAIL: ${nombre}`);
      console.error(`     Motivo: ${err.message}`);
      failed++;
    }
  }

  async function apiGet(path, token) {
    const res = await fetch(`${baseUrl}${path}`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    const body = await res.json().catch(() => null);
    return { status: res.status, body };
  }

  async function apiPost(path, data, token) {
    const res = await fetch(`${baseUrl}${path}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify(data)
    });
    const body = await res.json().catch(() => null);
    return { status: res.status, body };
  }

  async function apiPatch(path, data, token) {
    const res = await fetch(`${baseUrl}${path}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify(data)
    });
    const body = await res.json().catch(() => null);
    return { status: res.status, body };
  }

  console.log('\n--- 1. Pruebas Administrador (Superadmin) ---');
  await testCase('Admin accede a /usuarios y puede ver el RUT', async () => {
    const { status, body } = await apiGet('/usuarios', tokenAdmin);
    if (status !== 200) throw new Error(`Status esperado 200, recibido ${status}`);
    const conRut = body.some(u => u.rut !== undefined);
    if (!conRut) throw new Error('Administrador debe visualizar RUT');
  });

  await testCase('Admin ve vehículos de todas las compañías (GLOBAL)', async () => {
    const { status, body } = await apiGet('/vehiculos', tokenAdmin);
    if (status !== 200) throw new Error(`Status esperado 200, recibido ${status}`);
    const c11 = body.data.some(v => v.id_compania === 11);
    const c12 = body.data.some(v => v.id_compania === 12);
    if (!c11 || !c12) throw new Error('Admin debe ver vehículos de Cía 11 y Cía 12');
  });

  await testCase('Admin accede a Dashboard KPI', async () => {
    const { status } = await apiGet('/estadisticas/dashboard', tokenAdmin);
    if (status !== 200) throw new Error(`Status esperado 200, recibido ${status}`);
  });

  console.log('\n--- 2. Pruebas Comandante (GLOBAL sin RUT) ---');
  await testCase('Comandante ve usuarios pero con RUT oculto', async () => {
    const { status, body } = await apiGet('/usuarios', tokenComandante);
    if (status !== 200) throw new Error(`Status 200, recibido ${status}`);
    const conRut = body.some(u => u.rut !== undefined);
    if (conRut) throw new Error('Comandante NO debe ver el campo RUT');
  });

  await testCase('Comandante ve vehículos de todas las compañías', async () => {
    const { status, body } = await apiGet('/vehiculos', tokenComandante);
    if (status !== 200) throw new Error(`Status 200, recibido ${status}`);
    const c11 = body.data.some(v => v.id_compania === 11);
    const c12 = body.data.some(v => v.id_compania === 12);
    if (!c11 || !c12) throw new Error('Comandante debe tener alcance GLOBAL en vehículos');
  });

  console.log('\n--- 3. Pruebas Director (COMPANY y Bloqueo Cross-Company) ---');
  await testCase('Director Cía 11 solo ve vehículos de Cía 11', async () => {
    const { status, body } = await apiGet('/vehiculos', tokenDirectorC1);
    if (status !== 200) throw new Error(`Status 200, recibido ${status}`);
    const ajenos = body.data.filter(v => v.id_compania !== 11);
    if (ajenos.length > 0) throw new Error('Director Cía 11 no puede ver vehículos ajenos');
  });

  await testCase('Director Cía 11 bloqueado con 403 al intentar acceder a vehículo de Cía 12', async () => {
    // Vehículo 3 es de Cía 12
    const { status } = await apiGet('/vehiculos/3', tokenDirectorC1);
    if (status !== 403) throw new Error(`Status esperado 403, recibido ${status}`);
  });

  await testCase('Director Cía 11 bloqueado con 403 al intentar modificar vehículo de Cía 12', async () => {
    const { status } = await apiPatch('/vehiculos/3', { modelo: 'Hack' }, tokenDirectorC1);
    if (status !== 403) throw new Error(`Status esperado 403, recibido ${status}`);
  });

  await testCase('Director Cía 12 sí accede a su vehículo 3', async () => {
    const { status } = await apiGet('/vehiculos/3', tokenDirectorC2);
    if (status !== 200) throw new Error(`Status esperado 200, recibido ${status}`);
  });

  await testCase('Director Cía 11 bloqueado con 403 al consultar usuario de Cía 12', async () => {
    // Usuario 24 es de Cía 12
    const { status } = await apiGet('/usuarios/24', tokenDirectorC1);
    if (status !== 403) throw new Error(`Status esperado 403, recibido ${status}`);
  });

  console.log('\n--- 4. Pruebas Capitán (COMPANY y Restricciones) ---');
  await testCase('Capitán Cía 11 bloqueado en Dashboard (alcance NONE -> 403)', async () => {
    const { status } = await apiGet('/estadisticas/dashboard', tokenCapitanC1);
    if (status !== 403) throw new Error(`Status esperado 403, recibido ${status}`);
  });

  await testCase('Capitán Cía 11 bloqueado al crear mantención en vehículo de Cía 12', async () => {
    const { status } = await apiPost('/mantenciones', {
      tipo_mantencion: 'preventiva',
      id_vehiculo: 3,
      taller_externo: 'Taller X'
    }, tokenCapitanC1);
    if (status !== 403) throw new Error(`Status esperado 403, recibido ${status}`);
  });

  console.log('\n--- 5. Pruebas Bombero (PARTICIPATION y Módulos Prohibidos) ---');
  await testCase('Bombero 19 accede a Despacho 1 (participante)', async () => {
    const { status } = await apiGet('/despachos-emergencia/1', tokenBomberoParticipante);
    if (status !== 200) throw new Error(`Status esperado 200, recibido ${status}`);
  });

  await testCase('Bombero 21 bloqueado con 403 en Despacho 1 (no participó)', async () => {
    const { status } = await apiGet('/despachos-emergencia/1', tokenBomberoNoParticipante);
    if (status !== 403) throw new Error(`Status esperado 403, recibido ${status}`);
  });

  await testCase('Bombero bloqueado en Usuarios (NONE -> 403)', async () => {
    const { status } = await apiGet('/usuarios', tokenBomberoParticipante);
    if (status !== 403) throw new Error(`Status esperado 403, recibido ${status}`);
  });

  await testCase('Bombero bloqueado en Inventario (NONE -> 403)', async () => {
    const { status } = await apiGet('/articulos-inventario', tokenBomberoParticipante);
    if (status !== 403) throw new Error(`Status esperado 403, recibido ${status}`);
  });

  await testCase('Bombero bloqueado en Mantenciones (NONE -> 403)', async () => {
    const { status } = await apiGet('/mantenciones', tokenBomberoParticipante);
    if (status !== 403) throw new Error(`Status esperado 403, recibido ${status}`);
  });

  console.log('\n--- 6. Pruebas Mecánico (Mantenciones habilitado, Despachos prohibido) ---');
  await testCase('Mecánico bloqueado en Despachos (NONE -> 403)', async () => {
    const { status } = await apiGet('/despachos-emergencia', tokenMecanicoC1);
    if (status !== 403) throw new Error(`Status esperado 403, recibido ${status}`);
  });

  await testCase('Mecánico bloqueado en Usuarios (NONE -> 403)', async () => {
    const { status } = await apiGet('/usuarios', tokenMecanicoC1);
    if (status !== 403) throw new Error(`Status esperado 403, recibido ${status}`);
  });

  await testCase('Mecánico accede a Mantenciones de su compañía (200)', async () => {
    const { status } = await apiGet('/mantenciones', tokenMecanicoC1);
    if (status !== 200) throw new Error(`Status esperado 200, recibido ${status}`);
  });

  console.log('\n--- 7. Pruebas Central (Despachos GLOBAL, Mantenciones prohibido) ---');
  await testCase('Central accede a Despachos (GLOBAL -> 200)', async () => {
    const { status } = await apiGet('/despachos-emergencia', tokenCentral);
    if (status !== 200) throw new Error(`Status esperado 200, recibido ${status}`);
  });

  await testCase('Central bloqueada en Mantenciones (NONE -> 403)', async () => {
    const { status } = await apiGet('/mantenciones', tokenCentral);
    if (status !== 403) throw new Error(`Status esperado 403, recibido ${status}`);
  });

  await testCase('Central bloqueada en Inventario (NONE -> 403)', async () => {
    const { status } = await apiGet('/articulos-inventario', tokenCentral);
    if (status !== 403) throw new Error(`Status esperado 403, recibido ${status}`);
  });

  console.log('\n--- 8. Actualización Inmediata de Permisos (Caché Invalidation) ---');
  await testCase('Modificar permiso y verificar efecto inmediato en siguiente petición', async () => {
    // 1. Verificar que inicialmente Central está bloqueada en /mantenciones
    const pre = await apiGet('/mantenciones', tokenCentral);
    if (pre.status !== 403) throw new Error('Central debió estar bloqueada inicialmente');

    // 2. Administrador otorga permiso de visualización de mantenciones a Central (id_rol: 1)
    // Permiso mantenciones.view (id_permiso: 46 aprox)
    const dataSource = app.get(DataSource);
    const resPermiso = await dataSource.query(`SELECT id_permiso FROM permiso WHERE codigo = 'mantenciones.view'`);
    const idPermiso = resPermiso[0].id_permiso;

    const toggleRes = await apiPost('/roles-permisos/toggle', {
      id_rol: 1,
      id_permiso: idPermiso,
      alcance: 'GLOBAL'
    }, tokenAdmin);
    if (toggleRes.status !== 201 && toggleRes.status !== 200) {
      throw new Error(`Toggle falló con status ${toggleRes.status}`);
    }

    // 3. Inmediatamente la siguiente petición de Central debe dar 200 OK sin reloguearse
    const post = await apiGet('/mantenciones', tokenCentral);
    if (post.status !== 200) {
      throw new Error(`Se esperaba 200 inmediato tras cambio de permisos, pero se recibió ${post.status}`);
    }

    // 4. Restaurar: quitar nuevamente el permiso a Central
    await apiPost('/roles-permisos/toggle', {
      id_rol: 1,
      id_permiso: idPermiso,
      alcance: 'GLOBAL'
    }, tokenAdmin);

    const revert = await apiGet('/mantenciones', tokenCentral);
    if (revert.status !== 403) {
      throw new Error(`Reversión falló, se esperaba 403 y se recibió ${revert.status}`);
    }
  });

  console.log(`\n========================================`);
  console.log(`RESULTADOS: ${passed} PASADAS, ${failed} FALLIDAS`);
  console.log(`========================================\n`);

  await app.close();
  process.exit(failed > 0 ? 1 : 0);
}

runTestSuite().catch(err => {
  console.error('Error fatal al ejecutar suite:', err);
  process.exit(1);
});
