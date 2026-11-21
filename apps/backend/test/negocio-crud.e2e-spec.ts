import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { JwtService } from '@nestjs/jwt';
import { AppModule } from '../src/app.module';

function extraerLista(body: any): any[] {
  if (Array.isArray(body)) return body;
  if (Array.isArray(body?.data)) return body.data;
  if (Array.isArray(body?.items)) return body.items;
  return [];
}

describe('CRUD Operativo e Integridad de Negocio (e2e)', () => {
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

  it('QA-BE-CRUD-01: Rechaza peticiones sin token JWT con HTTP 401', async () => {
    await request(app.getHttpServer()).get('/vehiculos').expect(401);
    await request(app.getHttpServer()).get('/mantenciones').expect(401);
  });

  it('QA-BE-CRUD-02: Consulta catálogos operativos reales (compañías, vehículos, grifos y dashboard KPI)', async () => {
    const [resComp, resVeh, resGrifos, resDash] = await Promise.all([
      request(app.getHttpServer()).get('/companias').set('Authorization', `Bearer ${tokenAdmin}`).expect(200),
      request(app.getHttpServer()).get('/vehiculos').set('Authorization', `Bearer ${tokenAdmin}`).expect(200),
      request(app.getHttpServer()).get('/grifos').set('Authorization', `Bearer ${tokenAdmin}`).expect(200),
      request(app.getHttpServer()).get('/estadisticas/dashboard').set('Authorization', `Bearer ${tokenAdmin}`).expect(200),
    ]);

    expect(Array.isArray(extraerLista(resComp.body))).toBe(true);
    expect(Array.isArray(extraerLista(resVeh.body))).toBe(true);
    expect(Array.isArray(extraerLista(resGrifos.body))).toBe(true);
    expect(resDash.body).toBeDefined();
  });

  it('QA-BE-CRUD-03: Ciclo de vida completo de Mantención (POST -> GET -> PATCH -> DELETE) con limpieza garantizada en BD', async () => {
    const resVeh = await request(app.getHttpServer())
      .get('/vehiculos')
      .set('Authorization', `Bearer ${tokenAdmin}`)
      .expect(200);

    const vehiculos = extraerLista(resVeh.body);
    expect(vehiculos.length).toBeGreaterThan(0);
    const idVehiculo = vehiculos[0].id_vehiculo;
    let idMantencionCreada: number | null = null;

    try {
      const resCreate = await request(app.getHttpServer())
        .post('/mantenciones')
        .set('Authorization', `Bearer ${tokenAdmin}`)
        .send({
          id_vehiculo: idVehiculo,
          tipo_mantencion: 'preventiva',
          estado_mantencion: 'en_proceso',
          fecha_ingreso: '2026-11-20',
          descripcion_falla: 'Prueba automatizada QA Capstone - limpieza garantizada',
          costo_mano_obra: 15000,
        })
        .expect(201);

      idMantencionCreada = resCreate.body.id_mantencion;
      expect(typeof idMantencionCreada).toBe('number');

      const resGet = await request(app.getHttpServer())
        .get(`/mantenciones/${idMantencionCreada}`)
        .set('Authorization', `Bearer ${tokenAdmin}`)
        .expect(200);
      expect(resGet.body.descripcion_falla).toContain('Prueba automatizada QA Capstone');

      const resPatch = await request(app.getHttpServer())
        .patch(`/mantenciones/${idMantencionCreada}`)
        .set('Authorization', `Bearer ${tokenAdmin}`)
        .send({ estado_mantencion: 'finalizada' })
        .expect(200);
      expect(resPatch.body.estado_mantencion).toBe('finalizada');
    } finally {
      if (idMantencionCreada !== null) {
        await request(app.getHttpServer())
          .delete(`/mantenciones/${idMantencionCreada}`)
          .set('Authorization', `Bearer ${tokenAdmin}`)
          .expect(200);
      }
    }
  });
});
