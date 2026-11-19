// full-audit.mjs – Comprehensive audit of RBAC (backend + minimal UI)
// Usage: ensure .env is loaded, then run with node (it will start the backend and a headless browser).

import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
// Load backend .env (one level up)
dotenv.config({ path: path.resolve(__dirname, '../.env') });

import { NestFactory } from '@nestjs/core';
import { AppModule } from '../dist/app.module.js';
import { JwtService } from '@nestjs/jwt';
import fetch from 'node-fetch';

// Helper to create JWT for a given role description (matching test suite data)
function makeToken({ sub, email, id_rol, nombre_rol, id_compania }) {
  const jwt = new JwtService({ secret: process.env.JWT_SECRET });
  return jwt.sign({ sub, email, id_rol, nombre_rol, id_compania });
}

// List of modules with CRUD actions to test (the ten core modules)
const modules = [
  { name: 'usuarios', path: '/usuarios' },
  { name: 'vehiculos', path: '/vehiculos' },
  { name: 'grifos', path: '/grifos' },
  { name: 'inventario', path: '/articulos-inventario' },
  { name: 'mantenciones', path: '/mantenciones' },
  { name: 'despachos', path: '/despacho-personal' }, // participation based
  { name: 'dashboard', path: '/estadisticas/dashboard' },
  { name: 'permisos', path: '/permisos' },
  { name: 'roles', path: '/roles' },
  { name: 'historial_cambios', path: '/historial-cambios' },
];

// Role definitions (mirroring test-rbac-runner)
const roles = [
  {
    name: 'Administrador',
    token: makeToken({ sub: 12, email: 'admin@bomberos-talcahuano.cl', id_rol: 7, nombre_rol: 'Administrador', id_compania: 11 }),
  },
  {
    name: 'Comandante',
    token: makeToken({ sub: 14, email: 'comandante@bomberos-talcahuano.cl', id_rol: 2, nombre_rol: 'Comandante', id_compania: 11 }),
  },
  {
    name: 'Director',
    token: makeToken({ sub: 15, email: 'ignacio.rojas.c1.dir@bomberos-talcahuano.cl', id_rol: 3, nombre_rol: 'Director', id_compania: 11 }),
  },
  {
    name: 'Capitán',
    token: makeToken({ sub: 16, email: 'cristobal.soto.c1.cap@bomberos-talcahuano.cl', id_rol: 4, nombre_rol: 'Capitán', id_compania: 11 }),
  },
  {
    name: 'Bombero',
    token: makeToken({ sub: 19, email: 'catalina.sepulveda.c1.bom1@bomberos-talcahuano.cl', id_rol: 5, nombre_rol: 'Bombero', id_compania: 11 }),
  },
  {
    name: 'Mecánico',
    token: makeToken({ sub: 17, email: 'nicolas.diaz.c1.mec1@bomberos-talcahuano.cl', id_rol: 6, nombre_rol: 'Mecánico', id_compania: 11 }),
  },
  {
    name: 'Central',
    token: makeToken({ sub: 13, email: 'central@bomberos-talcahuano.cl', id_rol: 1, nombre_rol: 'Central', id_compania: 11 }),
  },
];

async function startBackend() {
  const app = await NestFactory.create(AppModule);
  const port = 3457; // different from test suite to avoid conflict
  await app.listen(port);
  console.log(`Backend audit listening on http://localhost:${port}`);
  return { app, baseUrl: `http://localhost:${port}` };
}

async function apiRequest(method, url, token, body = null) {
  const opts = {
    method,
    headers: { Authorization: `Bearer ${token}` },
  };
  if (body) {
    opts.headers['Content-Type'] = 'application/json';
    opts.body = JSON.stringify(body);
  }
  const res = await fetch(url, opts);
  const json = await res.json().catch(() => null);
  return { status: res.status, json };
}

async function backendTests(baseUrl) {
  const results = [];
  for (const role of roles) {
    for (const mod of modules) {
      // VIEW
      const view = await apiRequest('GET', `${baseUrl}${mod.path}`, role.token);
      results.push({ role: role.name, module: mod.name, action: 'view', expected: 200, status: view.status, pass: view.status === 200 });
      // CREATE (POST) – using minimal payload if allowed
      const payload = { dummy: true };
      const create = await apiRequest('POST', `${baseUrl}${mod.path}`, role.token, payload);
      const expectedCreate = ['Administrador', 'Comandante', 'Director', 'Capitán', 'Mecánico', 'Central'].includes(role.name) ? 201 : 403;
      results.push({ role: role.name, module: mod.name, action: 'create', expected: expectedCreate, status: create.status, pass: create.status === expectedCreate });
      // UPDATE (PATCH) – attempt on id 1
      const update = await apiRequest('PATCH', `${baseUrl}${mod.path}/1`, role.token, payload);
      const expectedUpdate = ['Administrador', 'Director', 'Capitán', 'Mecánico', 'Central', 'Comandante'].includes(role.name) ? 200 : 403;
      results.push({ role: role.name, module: mod.name, action: 'update', expected: expectedUpdate, status: update.status, pass: update.status === expectedUpdate });
      // DELETE – attempt on id 1
      const del = await apiRequest('DELETE', `${baseUrl}${mod.path}/1`, role.token);
      const expectedDelete = role.name === 'Administrador' ? 200 : 403;
      results.push({ role: role.name, module: mod.name, action: 'delete', expected: expectedDelete, status: del.status, pass: del.status === expectedDelete });
    }
  }
  return results;
}

async function uiTests() {
  const { chromium } = await import('playwright');
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  const uiResults = [];
  // Assuming dev server already running on http://localhost:3000 (user must start it manually)
  const base = 'http://localhost:3000';
  for (const role of roles) {
    // login UI (the login page expects email and password 'test')
    await page.goto(`${base}/login`);
    await page.fill('input[name="email"]', role.token ? '' : ''); // placeholder – we cannot actually log in without proper UI; skip UI tests if not running.
    // For audit we will just record that UI test requires dev server.
    uiResults.push({ role: role.name, note: 'UI test placeholder – requires running dev server and valid credentials' });
  }
  await browser.close();
  return uiResults;
}

(async () => {
  const { app, baseUrl } = await startBackend();
  const backend = await backendTests(baseUrl);
  console.log('\n=== Backend RBAC audit results ===');
  backend.forEach(r => console.log(`${r.role} | ${r.module} | ${r.action} => ${r.status} (expected ${r.expected}) ${r.pass ? 'PASS' : 'FAIL'}`));

  // UI part – optional, placeholder for real UI tests.
  // const ui = await uiTests();

  await app.close();
})();
