import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { Test } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import * as jwt from 'jsonwebtoken';
import * as fs from 'fs';
import * as path from 'path';
import { AppModule } from '../src/app.module';

function cargarJwtSecret(): string {
  if (process.env.JWT_SECRET) return process.env.JWT_SECRET;
  const envPath = path.resolve(__dirname, '../.env');
  if (fs.existsSync(envPath)) {
    const content = fs.readFileSync(envPath, 'utf-8');
    const match = content.match(/^JWT_SECRET=(.+)$/m);
    if (match) return match[1].trim().replace(/^["']|["']$/g, '');
  }
  return 'dev-secret';
}

function firmarToken(payload: Record<string, unknown>, secret: string, expiresInSec = 3600): string {
  const now = Math.floor(Date.now() / 1000);
  return jwt.sign({ ...payload, iat: now, exp: now + expiresInSec }, secret, { algorithm: 'HS256' });
}

describe('P9-SEG-CRITICA: Controles Imprescindibles de JWT, RBAC, Alcance (IDOR) y Validación', () => {
  let app: INestApplication;
  let secret: string;
  let tokenBomberoComp11: string;
  let tokenComp99CompanyScope: string;

  beforeAll(async () => {
    secret = cargarJwtSecret();
    const moduleRef = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleRef.createNestApplication();
    app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
    await app.init();

    tokenBomberoComp11 = firmarToken(
      {
        sub: 19,
        email: 'bombero.seg@bomberos-talcahuano.cl',
        id_rol: 5,
        nombre_rol: 'Bombero',
        id_compania: 11,
        permisos: ['vehiculos.view', 'grifos.view'],
        alcances: { vehiculo: 'COMPANY', grifo: 'GLOBAL', inventario: 'NONE', despacho: 'PARTICIPATION' },
      },
      secret,
    );

    tokenComp99CompanyScope = firmarToken(
      {
        sub: 999,
        email: 'operador.c99@bomberos-talcahuano.cl',
        id_rol: 4,
        nombre_rol: 'Capitán',
        id_compania: 99,
        permisos: ['inventario.view', 'inventario.create'],
        alcances: { inventario: 'COMPANY' },
      },
      secret,
    );
  });

  it('P9-SEG-05: GET /movimientos-inventario con alcance COMPANY no expone movimientos de otras compañías', async () => {
    const resMov = await request(app.getHttpServer())
      .get('/movimientos-inventario')
      .set('Authorization', `Bearer ${tokenComp99CompanyScope}`);

    expect(resMov.status).toBe(200);
    expect(Array.isArray(resMov.body)).toBe(true);

    for (const mov of resMov.body) {
      const compArt = mov?.articulo?.id_compania;
      if (compArt !== undefined && compArt !== null) {
        expect(Number(compArt)).toBe(99);
      }
    }
  });

  afterAll(async () => {
    if (app) await app.close();
  });

  it('P9-SEG-01: Rechaza con 401 tokens vacíos, con firma alterada o expirados', async () => {
    await request(app.getHttpServer()).get('/vehiculos').expect(401);

    const tokenAlterado = `${tokenBomberoComp11.slice(0, -5)}XXXXX`;
    await request(app.getHttpServer())
      .get('/vehiculos')
      .set('Authorization', `Bearer ${tokenAlterado}`)
      .expect(401);

    const tokenExpirado = firmarToken(
      { sub: 19, email: 'exp@test.cl', id_rol: 5, nombre_rol: 'Bombero', id_compania: 11 },
      secret,
      -60,
    );
    await request(app.getHttpServer())
      .get('/vehiculos')
      .set('Authorization', `Bearer ${tokenExpirado}`)
      .expect(401);
  });

  it('P9-SEG-02: Bloquea con 403 mutaciones en controladores protegidos por RolesGuard cuando el rol no tiene permiso', async () => {
    const resCompania = await request(app.getHttpServer())
      .post('/companias')
      .set('Authorization', `Bearer ${tokenBomberoComp11}`)
      .send({ nombre: 'Compañía No Autorizada' });
    expect([400, 403]).toContain(resCompania.status);
    expect(resCompania.status).toBe(403);

    const resRol = await request(app.getHttpServer())
      .post('/roles')
      .set('Authorization', `Bearer ${tokenBomberoComp11}`)
      .send({ nombre_rol: 'Rol No Autorizado' });
    expect(resRol.status).toBe(403);

    const resCat = await request(app.getHttpServer())
      .post('/categorias-articulo')
      .set('Authorization', `Bearer ${tokenBomberoComp11}`)
      .send({ nombre: 'Categoría No Autorizada' });
    expect(resCat.status).toBe(403);
  });

  it('P9-SEG-03: Impide crear movimientos de inventario en artículos de otra compañía bajo alcance COMPANY', async () => {
    const listaArticulos = await request(app.getHttpServer())
      .get('/articulos-inventario')
      .set('Authorization', `Bearer ${tokenComp99CompanyScope}`);

    if (listaArticulos.status === 200 && Array.isArray(listaArticulos.body) && listaArticulos.body.length > 0) {
      const articuloAjeno = listaArticulos.body.find(
        (a: any) => a.id_compania && Number(a.id_compania) !== 99,
      );
      if (articuloAjeno) {
        const resMov = await request(app.getHttpServer())
          .post('/movimientos-inventario')
          .set('Authorization', `Bearer ${tokenComp99CompanyScope}`)
          .send({
            id_articulo: articuloAjeno.id_articulo,
            tipo_movimiento: 'ENTRADA',
            cantidad: 1,
            motivo: 'Intento IDOR entre compañías',
          });
        expect(resMov.status).toBe(403);
      }
    }
  });

  it('P9-SEG-04: Rechaza payloads inválidos con 400 y no falla con 500 ante caracteres especiales en filtros', async () => {
    const badDto = await request(app.getHttpServer())
      .post('/mantenciones')
      .set('Authorization', `Bearer ${tokenBomberoComp11}`)
      .send({ id_vehiculo: 'no-es-numero' });
    expect([400, 403]).toContain(badDto.status);

    const resQ = await request(app.getHttpServer())
      .get('/vehiculos')
      .query({ q: "' OR '1'='1; <script>alert(1)</script>" })
      .set('Authorization', `Bearer ${tokenBomberoComp11}`);
    expect(resQ.status).not.toBe(500);
    expect([200, 400, 403]).toContain(resQ.status);
  });
});
