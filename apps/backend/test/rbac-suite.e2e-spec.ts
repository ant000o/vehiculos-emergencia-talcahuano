import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { JwtService } from '@nestjs/jwt';
import { AppModule } from '../src/app.module';

describe('RBAC & Scope Authorization Suite (e2e)', () => {
  let app: INestApplication;
  let jwtService: JwtService;

  // Tokens para cada rol
  let tokenAdmin: string;
  let tokenComandante: string;
  let tokenDirectorC1: string;
  let tokenDirectorC2: string;
  let tokenCapitanC1: string;
  let tokenMecanicoC1: string;
  let tokenBomberoParticipante: string;
  let tokenBomberoNoParticipante: string;
  let tokenCentral: string;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
    await app.init();

    jwtService = moduleFixture.get<JwtService>(JwtService);

    // Generar tokens firmados válidos
    tokenAdmin = jwtService.sign({
      sub: 12,
      email: 'admin@bomberos-talcahuano.cl',
      id_rol: 7,
      nombre_rol: 'Administrador',
      id_compania: 11,
    });

    tokenComandante = jwtService.sign({
      sub: 14,
      email: 'comandante@bomberos-talcahuano.cl',
      id_rol: 2,
      nombre_rol: 'Comandante',
      id_compania: 11,
    });

    tokenDirectorC1 = jwtService.sign({
      sub: 15,
      email: 'ignacio.rojas.c1.dir@bomberos-talcahuano.cl',
      id_rol: 3,
      nombre_rol: 'Director',
      id_compania: 11,
    });

    tokenDirectorC2 = jwtService.sign({
      sub: 24,
      email: 'cristobal.rodriguez.c2.dir@bomberos-talcahuano.cl',
      id_rol: 3,
      nombre_rol: 'Director',
      id_compania: 12,
    });

    tokenCapitanC1 = jwtService.sign({
      sub: 16,
      email: 'cristobal.soto.c1.cap@bomberos-talcahuano.cl',
      id_rol: 4,
      nombre_rol: 'Capitán',
      id_compania: 11,
    });

    tokenMecanicoC1 = jwtService.sign({
      sub: 17,
      email: 'nicolas.diaz.c1.mec1@bomberos-talcahuano.cl',
      id_rol: 6,
      nombre_rol: 'Mecánico',
      id_compania: 11,
    });

    // Bombero 19 (participa en despacho 1)
    tokenBomberoParticipante = jwtService.sign({
      sub: 19,
      email: 'catalina.sepulveda.c1.bom1@bomberos-talcahuano.cl',
      id_rol: 5,
      nombre_rol: 'Bombero',
      id_compania: 11,
    });

    // Bombero 21 (NO participa en despacho 1)
    tokenBomberoNoParticipante = jwtService.sign({
      sub: 21,
      email: 'matias.rojas.c1.bom3@bomberos-talcahuano.cl',
      id_rol: 5,
      nombre_rol: 'Bombero',
      id_compania: 11,
    });

    tokenCentral = jwtService.sign({
      sub: 13,
      email: 'central@bomberos-talcahuano.cl',
      id_rol: 1,
      nombre_rol: 'Central',
      id_compania: 11,
    });
  }, 30000);

  afterAll(async () => {
    await app.close();
  });

  // ==========================================
  // 1. ADMINISTRADOR (Superadmin GLOBAL)
  // ==========================================
  describe('Rol: Administrador (Superadmin)', () => {
    it('Acceso total GLOBAL a todos los módulos y visualización de RUT', async () => {
      const resUsuarios = await request(app.getHttpServer())
        .get('/usuarios')
        .set('Authorization', `Bearer ${tokenAdmin}`)
        .expect(200);

      expect(Array.isArray(resUsuarios.body)).toBe(true);
      // Solo el Administrador puede ver el RUT
      const userConRut = resUsuarios.body.find((u: any) => u.rut !== undefined);
      expect(userConRut).toBeDefined();

      // Vehículos de todas las compañías (GLOBAL)
      const resVehiculos = await request(app.getHttpServer())
        .get('/vehiculos')
        .set('Authorization', `Bearer ${tokenAdmin}`)
        .expect(200);

      expect(resVehiculos.body.data.length).toBeGreaterThan(0);
      const c11 = resVehiculos.body.data.some((v: any) => v.id_compania === 11);
      const c12 = resVehiculos.body.data.some((v: any) => v.id_compania === 12);
      expect(c11 && c12).toBe(true);

      // Dashboard GLOBAL
      await request(app.getHttpServer())
        .get('/estadisticas/dashboard')
        .set('Authorization', `Bearer ${tokenAdmin}`)
        .expect(200);
    });
  });

  // ==========================================
  // 2. COMANDANTE (GLOBAL)
  // ==========================================
  describe('Rol: Comandante', () => {
    it('Acceso GLOBAL a módulos pero con RUT oculto en usuarios', async () => {
      const resUsuarios = await request(app.getHttpServer())
        .get('/usuarios')
        .set('Authorization', `Bearer ${tokenComandante}`)
        .expect(200);

      // El Comandante NO debe ver el RUT
      const algunRut = resUsuarios.body.some((u: any) => u.rut !== undefined);
      expect(algunRut).toBe(false);

      // Ve vehículos de todas las compañías
      const resVeh = await request(app.getHttpServer())
        .get('/vehiculos')
        .set('Authorization', `Bearer ${tokenComandante}`)
        .expect(200);

      const c11 = resVeh.body.data.some((v: any) => v.id_compania === 11);
      const c12 = resVeh.body.data.some((v: any) => v.id_compania === 12);
      expect(c11 && c12).toBe(true);
    });
  });

  // ==========================================
  // 3. AISLAMIENTO POR COMPAÑÍA: DIRECTOR
  // ==========================================
  describe('Rol: Director (Alcance COMPANY e intentos de cruce)', () => {
    it('Director Cía 11 solo ve vehículos de su compañía y es rechazado al acceder a Cía 12', async () => {
      const res = await request(app.getHttpServer())
        .get('/vehiculos')
        .set('Authorization', `Bearer ${tokenDirectorC1}`)
        .expect(200);

      // Todos los vehículos listados deben ser de Cía 11
      const soloC11 = res.body.data.every((v: any) => v.id_compania === 11);
      expect(soloC11).toBe(true);

      // Intento de acceso directo a vehículo 3 (pertenece a Cía 12) -> DEBE SER 403 FORBIDDEN
      await request(app.getHttpServer())
        .get('/vehiculos/3')
        .set('Authorization', `Bearer ${tokenDirectorC1}`)
        .expect(403);

      // Intento de modificar vehículo 3 de Cía 12 -> DEBE SER 403 FORBIDDEN
      await request(app.getHttpServer())
        .patch('/vehiculos/3')
        .send({ modelo: 'Hacked Model' })
        .set('Authorization', `Bearer ${tokenDirectorC1}`)
        .expect(403);

      // El Director de Cía 12 SÍ puede acceder al vehículo 3
      await request(app.getHttpServer())
        .get('/vehiculos/3')
        .set('Authorization', `Bearer ${tokenDirectorC2}`)
        .expect(200);
    });

    it('Director Cía 11 es rechazado si intenta acceder a usuarios de Cía 12', async () => {
      // Usuario 24 pertenece a Cía 12
      await request(app.getHttpServer())
        .get('/usuarios/24')
        .set('Authorization', `Bearer ${tokenDirectorC1}`)
        .expect(403);
    });
  });

  // ==========================================
  // 4. CAPITÁN (COMPANY en Operatividad/Mantenciones, NONE en Dashboard)
  // ==========================================
  describe('Rol: Capitán', () => {
    it('Capitán no tiene acceso a Dashboard KPI (alcance NONE -> 403)', async () => {
      await request(app.getHttpServer())
        .get('/estadisticas/dashboard')
        .set('Authorization', `Bearer ${tokenCapitanC1}`)
        .expect(403);
    });

    it('Capitán no puede crear mantenciones en vehículos de otra compañía', async () => {
      // Vehículo 3 es de Cía 12
      await request(app.getHttpServer())
        .post('/mantenciones')
        .send({
          tipo_mantencion: 'preventiva',
          id_vehiculo: 3,
          taller_externo: 'Taller Central',
        })
        .set('Authorization', `Bearer ${tokenCapitanC1}`)
        .expect(403);
    });
  });

  // ==========================================
  // 5. BOMBERO (PARTICIPATION en Despachos, NONE en Módulos Restringidos)
  // ==========================================
  describe('Rol: Bombero (Alcance PARTICIPATION)', () => {
    it('Bombero solo accede a despachos donde participó en la tripulación', async () => {
      // Bombero 19 SÍ participó en Despacho 1
      await request(app.getHttpServer())
        .get('/despachos-emergencia/1')
        .set('Authorization', `Bearer ${tokenBomberoParticipante}`)
        .expect(200);

      // Bombero 21 NO participó en Despacho 1 -> 403 FORBIDDEN
      await request(app.getHttpServer())
        .get('/despachos-emergencia/1')
        .set('Authorization', `Bearer ${tokenBomberoNoParticipante}`)
        .expect(403);
    });

    it('Bombero es rechazado al intentar acceder a módulos sin permiso (usuarios, inventario, mantenciones)', async () => {
      // Usuarios: NONE -> 403
      await request(app.getHttpServer())
        .get('/usuarios')
        .set('Authorization', `Bearer ${tokenBomberoParticipante}`)
        .expect(403);

      // Inventario: NONE -> 403
      await request(app.getHttpServer())
        .get('/articulos-inventario')
        .set('Authorization', `Bearer ${tokenBomberoParticipante}`)
        .expect(403);

      // Mantenciones: NONE -> 403
      await request(app.getHttpServer())
        .get('/mantenciones')
        .set('Authorization', `Bearer ${tokenBomberoParticipante}`)
        .expect(403);
    });
  });

  // ==========================================
  // 6. MECÁNICO (Sin acceso a Despachos ni Usuarios)
  // ==========================================
  describe('Rol: Mecánico', () => {
    it('Mecánico no puede consultar despachos ni usuarios (403)', async () => {
      await request(app.getHttpServer())
        .get('/despachos-emergencia')
        .set('Authorization', `Bearer ${tokenMecanicoC1}`)
        .expect(403);

      await request(app.getHttpServer())
        .get('/usuarios')
        .set('Authorization', `Bearer ${tokenMecanicoC1}`)
        .expect(403);
    });

    it('Mecánico sí puede consultar mantenciones de su compañía', async () => {
      await request(app.getHttpServer())
        .get('/mantenciones')
        .set('Authorization', `Bearer ${tokenMecanicoC1}`)
        .expect(200);
    });
  });

  // ==========================================
  // 7. CENTRAL (Despachos y Mapa GLOBAL, Bloqueado en Mantenciones e Inventario)
  // ==========================================
  describe('Rol: Central', () => {
    it('Central accede a despachos pero es bloqueado en inventario y mantenciones', async () => {
      // Despachos: GLOBAL -> 200
      await request(app.getHttpServer())
        .get('/despachos-emergencia')
        .set('Authorization', `Bearer ${tokenCentral}`)
        .expect(200);

      // Mantenciones: NONE -> 403
      await request(app.getHttpServer())
        .get('/mantenciones')
        .set('Authorization', `Bearer ${tokenCentral}`)
        .expect(403);

      // Inventario: NONE -> 403
      await request(app.getHttpServer())
        .get('/articulos-inventario')
        .set('Authorization', `Bearer ${tokenCentral}`)
        .expect(403);
    });
  });
});
