import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { JwtService } from '@nestjs/jwt';
import { performance } from 'node:perf_hooks';
import { AppModule } from '../src/app.module';

function extraerLista(body: any): any[] {
  if (Array.isArray(body)) return body;
  if (Array.isArray(body?.data)) return body.data;
  if (Array.isArray(body?.items)) return body.items;
  return [];
}

describe('P3-INT: Integración Relacional y Medición Real de Rendimiento/Concurrencia (e2e)', () => {
  let app: INestApplication;
  let jwtService: JwtService;
  let tokenAdmin: string;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
    await app.init();

    jwtService = moduleFixture.get<JwtService>(JwtService);
    tokenAdmin = jwtService.sign({
      sub: 12,
      email: 'admin@bomberos-talcahuano.cl',
      id_rol: 7,
      nombre_rol: 'Administrador',
      id_compania: 11,
    });
  });

  afterAll(async () => {
    await app?.close();
  });

  it('P3-INT-01: Verifica subrecursos relacionales de vehículo y rechaza referencia a vehículo inexistente sin 500', async () => {
    const resVeh = await request(app.getHttpServer())
      .get('/vehiculos')
      .set('Authorization', `Bearer ${tokenAdmin}`)
      .expect(200);

    const vehiculos = extraerLista(resVeh.body);
    expect(vehiculos.length).toBeGreaterThan(0);
    const idVehiculo = vehiculos[0].id_vehiculo;

    const [resReg, resMant] = await Promise.all([
      request(app.getHttpServer())
        .get(`/vehiculos/${idVehiculo}/registros`)
        .set('Authorization', `Bearer ${tokenAdmin}`)
        .expect(200),
      request(app.getHttpServer())
        .get(`/vehiculos/${idVehiculo}/mantenciones`)
        .set('Authorization', `Bearer ${tokenAdmin}`)
        .expect(200),
    ]);

    expect(Array.isArray(extraerLista(resReg.body))).toBe(true);
    expect(Array.isArray(extraerLista(resMant.body))).toBe(true);

    // Intento de crear mantención con id_vehiculo inexistente (999999)
    const resHuerfana = await request(app.getHttpServer())
      .post('/mantenciones')
      .set('Authorization', `Bearer ${tokenAdmin}`)
      .send({
        id_vehiculo: 999999,
        tipo_mantencion: 'preventiva',
        estado_mantencion: 'pendiente',
        fecha_ingreso: '2026-11-20',
        descripcion_falla: 'Prueba integridad referencial vehículo inexistente',
      });

    expect([400, 404, 409]).toContain(resHuerfana.status);
    expect(resHuerfana.status).not.toBe(500);
  });

  it('P3-INT-02: Mide latencia real y concurrencia (15 peticiones simultáneas) en endpoints operativos', async () => {
    const endpoints = ['/vehiculos', '/grifos', '/estadisticas/dashboard'];
    const totalPeticiones = 15;

    const tInicioRafaga = performance.now();
    const mediciones = await Promise.all(
      Array.from({ length: totalPeticiones }, async (_, idx) => {
        const ruta = endpoints[idx % endpoints.length];
        const t0 = performance.now();
        const res = await request(app.getHttpServer())
          .get(ruta)
          .set('Authorization', `Bearer ${tokenAdmin}`);
        const duracionMs = performance.now() - t0;
        return { ruta, status: res.status, duracionMs };
      }),
    );
    const tiempoTotalMs = performance.now() - tInicioRafaga;

    const fallidas = mediciones.filter((m) => m.status !== 200);
    expect(fallidas.length).toBe(0);

    const tiempos = mediciones.map((m) => m.duracionMs);
    const promedioMs = tiempos.reduce((acc, v) => acc + v, 0) / tiempos.length;
    const maxMs = Math.max(...tiempos);
    const minMs = Math.min(...tiempos);

    console.log(
      `[METRICA REAL P3-INT-02] Peticiones=${totalPeticiones} | TotalRafaga=${tiempoTotalMs.toFixed(1)}ms | Min=${minMs.toFixed(1)}ms | Promedio=${promedioMs.toFixed(1)}ms | Max=${maxMs.toFixed(1)}ms`,
    );

    expect(promedioMs).toBeGreaterThan(0);
    expect(maxMs).toBeGreaterThanOrEqual(promedioMs);
  });
});
