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

describe('P1-FUNC y P2-SEG: Seguridad JWT, Alcance/IDOR, Robustez de Entrada y Validaciones (e2e)', () => {
  let app: INestApplication;
  let jwtService: JwtService;
  let tokenAdminCia11: string;
  let tokenDirectorCia11: string;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
    await app.init();

    jwtService = moduleFixture.get<JwtService>(JwtService);

    tokenAdminCia11 = jwtService.sign({
      sub: 12,
      email: 'admin@bomberos-talcahuano.cl',
      id_rol: 7,
      nombre_rol: 'Administrador',
      id_compania: 11,
    });

    tokenDirectorCia11 = jwtService.sign({
      sub: 9901,
      email: 'director11@bomberos-talcahuano.cl',
      id_rol: 3,
      nombre_rol: 'Director',
      id_compania: 11,
    });
  });

  afterAll(async () => {
    await app?.close();
  });

  it('P2-SEG-01: Rechaza token malformado, token con firma inválida y token expirado con HTTP 401', async () => {
    const tokenExpirado = jwtService.sign(
      {
        sub: 12,
        email: 'admin@bomberos-talcahuano.cl',
        id_rol: 7,
        nombre_rol: 'Administrador',
        id_compania: 11,
      },
      { expiresIn: -5 },
    );

    const tokenFirmaInvalida =
      'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOjEyLCJub21icmVfcm9sIjoiQWRtaW5pc3RyYWRvciJ9.firma_alterada_invalida';

    await request(app.getHttpServer())
      .get('/vehiculos')
      .set('Authorization', 'Bearer token_no_jwt_valido')
      .expect(401);

    await request(app.getHttpServer())
      .get('/vehiculos')
      .set('Authorization', `Bearer ${tokenFirmaInvalida}`)
      .expect(401);

    await request(app.getHttpServer())
      .get('/vehiculos')
      .set('Authorization', `Bearer ${tokenExpirado}`)
      .expect(401);
  });

  it('P2-SEG-02: Verifica aislamiento por compañía (COMPANY) ante consulta e intento de mutación de vehículo ajeno', async () => {
    const resTodos = await request(app.getHttpServer())
      .get('/vehiculos')
      .set('Authorization', `Bearer ${tokenAdminCia11}`)
      .expect(200);

    const vehiculos = extraerLista(resTodos.body);
    const vehiculoOtraCia = vehiculos.find(
      (v: any) => Number(v.id_compania) && Number(v.id_compania) !== 11,
    );

    if (vehiculoOtraCia) {
      await request(app.getHttpServer())
        .get(`/vehiculos/${vehiculoOtraCia.id_vehiculo}`)
        .set('Authorization', `Bearer ${tokenDirectorCia11}`)
        .expect((res) => {
          expect([403, 404]).toContain(res.status);
        });

      await request(app.getHttpServer())
        .patch(`/vehiculos/${vehiculoOtraCia.id_vehiculo}`)
        .set('Authorization', `Bearer ${tokenDirectorCia11}`)
        .send({ observaciones: 'Intento no autorizado QA' })
        .expect((res) => {
          expect([403, 404]).toContain(res.status);
        });
    } else {
      // Si en el dataset actual no existe vehículo con id_compania != 11, verificamos que /vehiculos con alcance COMPANY no exponga otra compañía
      const resDir = await request(app.getHttpServer())
        .get('/vehiculos')
        .set('Authorization', `Bearer ${tokenDirectorCia11}`)
        .expect(200);
      const listaDir = extraerLista(resDir.body);
      for (const v of listaDir) {
        expect(Number(v.id_compania)).toBe(11);
      }
    }
  });

  it('P1-FUNC-01: Rechaza payload inválido en POST /mantenciones con HTTP 400 y maneja ID inexistente sin error 500', async () => {
    await request(app.getHttpServer())
      .post('/mantenciones')
      .set('Authorization', `Bearer ${tokenAdminCia11}`)
      .send({
        tipo_mantencion: 'tipo_inexistente_qa',
        id_vehiculo: 'no-es-numero',
      })
      .expect(400);

    await request(app.getHttpServer())
      .get('/mantenciones/999999')
      .set('Authorization', `Bearer ${tokenAdminCia11}`)
      .expect((res) => {
        expect([400, 404]).toContain(res.status);
      });
  });

  it('P2-SEG-03: Maneja payloads con caracteres especiales / inyección en filtros sin provocar HTTP 500', async () => {
    const payloadEspecial = "' OR 1=1 -- <script>alert(1)</script>";

    const resVeh = await request(app.getHttpServer())
      .get('/vehiculos')
      .query({ q: payloadEspecial })
      .set('Authorization', `Bearer ${tokenAdminCia11}`);

    expect(resVeh.status).not.toBe(500);
    expect([200, 400]).toContain(resVeh.status);
  });
});
