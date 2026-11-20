import { test, expect } from '@playwright/test';
import * as fs from 'fs';
import * as path from 'path';
import * as crypto from 'crypto';

function generarJwtPrueba(payload: Record<string, unknown>): string {
  const envPath = path.resolve(__dirname, '../../backend/.env');
  const envContent = fs.readFileSync(envPath, 'utf-8');
  const match = envContent.match(/^JWT_SECRET=(.+)$/m);
  const secret = match ? match[1].trim().replace(/^["']|["']$/g, '') : 'secret';

  const header = Buffer.from(JSON.stringify({ alg: 'HS256', typ: 'JWT' })).toString('base64url');
  const now = Math.floor(Date.now() / 1000);
  const body = Buffer.from(JSON.stringify({ ...payload, iat: now, exp: now + 3600 })).toString('base64url');
  const sig = crypto.createHmac('sha256', secret).update(`${header}.${body}`).digest('base64url');
  return `${header}.${body}.${sig}`;
}

test.describe('QA E2E Navegador Real (Playwright) - Vehículos de Emergencia Talcahuano', () => {
  test('QA-E2E-01: Validación de formulario y rechazo de credenciales inválidas en /login', async ({ page }) => {
    await page.goto('/login');
    await expect(page.locator('h1')).toContainText('TALCAHUANO');

    // Submit vacío muestra mensajes de validación cliente
    await page.locator('button[type="submit"]').click();
    await expect(page.getByText('Ingresa tu correo institucional.')).toBeVisible();
    await expect(page.getByText('Ingresa tu contraseña.')).toBeVisible();

    // Credenciales inválidas contra backend real
    await page.fill('input[type="email"]', 'usuario.inexistente@bomberos-talcahuano.cl');
    await page.fill('input[type="password"]', 'ClaveIncorrecta123');
    await page.locator('button[type="submit"]').click();

    await page.waitForTimeout(1000);
    await page.screenshot({ path: '../../docs/evidencias/01_login_validacion.png', fullPage: true });
    expect(page.url()).toContain('/login');
  });

  test('QA-E2E-02: Sesión Administrador carga Dashboard KPI, Vehículos, Despachos y Mantenciones sin errores de consola', async ({ page }) => {
    const erroresConsola: string[] = [];
    page.on('pageerror', (err) => erroresConsola.push(err.message));

    const tokenAdmin = generarJwtPrueba({
      sub: 12,
      email: 'admin@bomberos-talcahuano.cl',
      id_rol: 7,
      nombre_rol: 'Administrador',
      id_compania: 11,
    });

    await page.addInitScript((tok) => {
      window.localStorage.setItem('accessToken', tok);
    }, tokenAdmin);

    // 1. Inicio / Dashboard
    await page.goto('/dashboard');
    await page.waitForLoadState('networkidle');
    await page.screenshot({ path: '../../docs/evidencias/02_dashboard_admin.png', fullPage: true });

    // 2. Flota de Vehículos
    await page.goto('/vehiculos');
    await page.waitForLoadState('networkidle');
    await page.screenshot({ path: '../../docs/evidencias/03_vehiculos_flota.png', fullPage: true });

    // 3. Despachos de Emergencia
    await page.goto('/despachos');
    await page.waitForLoadState('networkidle');
    await page.screenshot({ path: '../../docs/evidencias/04_despachos_emergencia.png', fullPage: true });

    // 4. Mantenciones
    await page.goto('/mantenciones');
    await page.waitForLoadState('networkidle');
    await page.screenshot({ path: '../../docs/evidencias/05_mantenciones.png', fullPage: true });

    expect(erroresConsola).toEqual([]);
  });

  test('QA-E2E-03: Rol Bombero (sin permiso administrativo) es redirigido si intenta entrar por URL a /usuarios o /permisos', async ({ page }) => {
    const tokenBombero = generarJwtPrueba({
      sub: 19,
      email: 'bombero@bomberos-talcahuano.cl',
      id_rol: 5,
      nombre_rol: 'Bombero',
      id_compania: 11,
    });

    await page.addInitScript((tok) => {
      window.localStorage.setItem('accessToken', tok);
    }, tokenBombero);

    await page.goto('/permisos');
    await page.waitForLoadState('networkidle');
    await page.screenshot({ path: '../../docs/evidencias/06_bombero_bloqueo_permisos.png', fullPage: true });
    expect(page.url()).not.toContain('/permisos');
  });
});
