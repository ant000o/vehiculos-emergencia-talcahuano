/**
 * Script de seed — puebla TODAS las tablas con datos de prueba realistas.
 *
 * Ejecutar con:
 *   npx ts-node -r tsconfig-paths/register src/seed.ts
 *
 * ⚠️ TRUNCA y REINICIA todas las tablas antes de insertar.
 *    NO usar contra datos reales.
 *
 * Orden de inserción respeta las dependencias (FK):
 *   rol → compania → categoria_articulo
 *   → usuario → vehiculo → grifo → articulo_inventario
 *   → registro_operatividad
 *   → movimiento_inventario (entradas de stock)
 *   → mantencion → detalle_articulo_mantencion
 *     (el trigger de BD genera las salidas de stock automáticamente)
 *   → despacho_emergencia → despacho_personal
 */
import { DataSource } from 'typeorm';
import * as bcrypt from 'bcrypt';
import * as dotenv from 'dotenv';

dotenv.config();

import { Rol } from './rol/entities/rol.entity';
import { Compania } from './compania/entities/compania.entity';
import { CategoriaArticulo } from './categoria_articulo/entities/categoria_articulo.entity';
import { Usuario } from './usuario/entities/usuario.entity';
import { Vehiculo } from './vehiculo/entities/vehiculo.entity';
import { Grifo } from './grifo/entities/grifo.entity';
import { ArticuloInventario } from './articulo_inventario/entities/articulo_inventario.entity';
import { RegistroOperatividad } from './registro_operatividad/entities/registro_operatividad.entity';
import { Mantencion } from './mantencion/entities/mantencion.entity';
import { DetalleArticuloMantencion } from './detalle_articulo_mantencion/entities/detalle_articulo_mantencion.entity';
import { MovimientoInventario } from './movimiento_inventario/entities/movimiento_inventario.entity';
import { DespachoEmergencia } from './despacho_emergencia/entities/despacho_emergencia.entity';
import { DespachoPersonal } from './despacho_personal/entities/despacho_personal.entity';
import {
  EstadoVehiculo,
  EstadoGrifo,
  EstadoMantencion,
  EstadoEmergencia,
  TipoMovimiento,
  TipoMantencion,
  RolEnDespacho,
} from './common/enums/estados.enum';

const AppDataSource = new DataSource({
  type: 'postgres',
  url: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
  entities: [__dirname + '/**/*.entity{.ts,.js}'],
  synchronize: false,
});

async function seed() {
  const ds = await AppDataSource.initialize();
  console.log('✅ Conectado a la base de datos.');

  // ─── LIMPIEZA ────────────────────────────────────────────────────────────
  await ds.query(`
    TRUNCATE TABLE
      despacho_personal, despacho_emergencia, movimiento_inventario,
      detalle_articulo_mantencion, mantencion, registro_operatividad,
      articulo_inventario, grifo, vehiculo, usuario,
      categoria_articulo, compania, rol
    RESTART IDENTITY CASCADE
  `);
  console.log('🗑️  Tablas limpiadas y secuencias reiniciadas.');

  // ─── ROL ─────────────────────────────────────────────────────────────────
  const rolRepo = ds.getRepository(Rol);
  const [rolAdmin, rolCapitan, rolBombero, rolMecanico] = await rolRepo.save([
    rolRepo.create({ nombre_rol: 'administrador', descripcion: 'Acceso total al sistema' }),
    rolRepo.create({ nombre_rol: 'capitan',       descripcion: 'Jefe de compañía, gestiona despachos y mantenciones' }),
    rolRepo.create({ nombre_rol: 'bombero',        descripcion: 'Personal operativo en terreno' }),
    rolRepo.create({ nombre_rol: 'mecanico',       descripcion: 'Realiza y supervisa mantenciones de vehículos' }),
  ]);
  console.log('✅ Roles creados.');

  // ─── COMPANIA ─────────────────────────────────────────────────────────────
  const companiaRepo = ds.getRepository(Compania);
  const [comp1, comp2, comp3] = await companiaRepo.save([
    companiaRepo.create({
      numero_compania: 1,
      nombre: 'Primera Compañía de Bomberos de Talcahuano',
      ubicacion_geo: { type: 'Point', coordinates: [-73.1168, -36.7196] },
    }),
    companiaRepo.create({
      numero_compania: 2,
      nombre: 'Segunda Compañía de Bomberos de Talcahuano',
      ubicacion_geo: { type: 'Point', coordinates: [-73.1105, -36.7245] },
    }),
    companiaRepo.create({
      numero_compania: 3,
      nombre: 'Tercera Compañía de Bomberos de Talcahuano',
      ubicacion_geo: { type: 'Point', coordinates: [-73.1220, -36.7180] },
    }),
  ]);
  console.log('✅ Compañías creadas.');

  // ─── CATEGORIA ARTICULO ───────────────────────────────────────────────────
  const catRepo = ds.getRepository(CategoriaArticulo);
  const [catRepuestos, catInsumos, catHerramientas, catEPP] = await catRepo.save([
    catRepo.create({ nombre_categoria: 'Repuestos mecánicos' }),
    catRepo.create({ nombre_categoria: 'Insumos de emergencia' }),
    catRepo.create({ nombre_categoria: 'Herramientas' }),
    catRepo.create({ nombre_categoria: 'Equipos de protección personal' }),
  ]);
  console.log('✅ Categorías de artículos creadas.');

  // ─── USUARIO ──────────────────────────────────────────────────────────────
  // Contraseña para todos: Password123
  const hash = await bcrypt.hash('Password123', 10);
  const usuarioRepo = ds.getRepository(Usuario);
  const [admin, capitan1, mecanico1, bombero1, bombero2, bombero3] = await usuarioRepo.save([
    usuarioRepo.create({
      rut: '11111111-1', nombre: 'Ana', apellidos: 'Soto Pérez',
      email: 'admin@bomberos-talcahuano.cl',
      password_hash: hash, id_rol: rolAdmin.id_rol, id_compania: comp1.id_compania,
    }),
    usuarioRepo.create({
      rut: '22222222-2', nombre: 'Carlos', apellidos: 'Muñoz Rojas',
      email: 'capitan1@bomberos-talcahuano.cl',
      password_hash: hash, id_rol: rolCapitan.id_rol, id_compania: comp1.id_compania,
    }),
    usuarioRepo.create({
      rut: '33333333-3', nombre: 'Pedro', apellidos: 'Fuentes Lagos',
      email: 'mecanico1@bomberos-talcahuano.cl',
      password_hash: hash, id_rol: rolMecanico.id_rol, id_compania: comp1.id_compania,
    }),
    usuarioRepo.create({
      rut: '44444444-4', nombre: 'Luis', apellidos: 'Vargas Silva',
      email: 'bombero1@bomberos-talcahuano.cl',
      password_hash: hash, id_rol: rolBombero.id_rol, id_compania: comp1.id_compania,
    }),
    usuarioRepo.create({
      rut: '55555555-5', nombre: 'María', apellidos: 'González Torres',
      email: 'bombero2@bomberos-talcahuano.cl',
      password_hash: hash, id_rol: rolBombero.id_rol, id_compania: comp1.id_compania,
    }),
    usuarioRepo.create({
      rut: '66666666-6', nombre: 'Jorge', apellidos: 'Hernández Castro',
      email: 'bombero3@bomberos-talcahuano.cl',
      password_hash: hash, id_rol: rolBombero.id_rol, id_compania: comp2.id_compania,
      estado_activo: false, // usuario inactivo para probar el guard de auth
    }),
  ]);
  console.log('✅ Usuarios creados.');

  // ─── VEHICULO ─────────────────────────────────────────────────────────────
  const vehiculoRepo = ds.getRepository(Vehiculo);
  const [carro1, carro2, ambulancia, rescate] = await vehiculoRepo.save([
    vehiculoRepo.create({
      patente: 'BBBB11', marca: 'Mercedes-Benz', modelo: 'Atego 1725',
      anio: 2018, kilometraje: 45000,
      estado_operativo: EstadoVehiculo.OPERATIVO,
      id_compania: comp1.id_compania,
    }),
    vehiculoRepo.create({
      patente: 'CCCC22', marca: 'Scania', modelo: 'P 320',
      anio: 2015, kilometraje: 112000,
      estado_operativo: EstadoVehiculo.EN_MANTENCION,
      id_compania: comp1.id_compania,
    }),
    vehiculoRepo.create({
      patente: 'DDDD33', marca: 'Volkswagen', modelo: 'Crafter',
      anio: 2021, kilometraje: 18500,
      estado_operativo: EstadoVehiculo.OPERATIVO,
      id_compania: comp2.id_compania,
    }),
    vehiculoRepo.create({
      patente: 'EEEE44', marca: 'Ford', modelo: 'F-550',
      anio: 2019, kilometraje: 67000,
      estado_operativo: EstadoVehiculo.FUERA_DE_SERVICIO,
      id_compania: comp3.id_compania,
    }),
  ]);
  console.log('✅ Vehículos creados.');

  // ─── GRIFO ────────────────────────────────────────────────────────────────
  const grifoRepo = ds.getRepository(Grifo);
  const [grifo1, grifo2, grifo3, grifo4] = await grifoRepo.save([
    grifoRepo.create({
      coordenadas: { type: 'Point', coordinates: [-73.1150, -36.7200] },
      direccion: 'Av. Colón 1200, Talcahuano',
      estado_operativo: EstadoGrifo.OPERATIVO,
      ultima_revision: '2024-11-15',
      id_compania: comp1.id_compania,
    }),
    grifoRepo.create({
      coordenadas: { type: 'Point', coordinates: [-73.1120, -36.7230] },
      direccion: 'Calle Anibal Pinto 450, Talcahuano',
      estado_operativo: EstadoGrifo.FUERA_DE_SERVICIO,
      ultima_revision: '2024-08-20',
      id_compania: comp1.id_compania,
    }),
    grifoRepo.create({
      coordenadas: { type: 'Point', coordinates: [-73.1090, -36.7260] },
      direccion: 'Av. O\'Higgins 800, Talcahuano',
      estado_operativo: EstadoGrifo.OPERATIVO,
      ultima_revision: '2025-01-10',
      id_compania: comp2.id_compania,
    }),
    grifoRepo.create({
      coordenadas: { type: 'Point', coordinates: [-73.1200, -36.7180] },
      direccion: 'Calle Serrano 340, Talcahuano',
      estado_operativo: EstadoGrifo.EN_MANTENCION,
      ultima_revision: '2024-06-05',
      id_compania: comp3.id_compania,
    }),
  ]);
  console.log('✅ Grifos creados.');

  // ─── ARTICULO INVENTARIO ──────────────────────────────────────────────────
  const articuloRepo = ds.getRepository(ArticuloInventario);
  const [filtroAceite, bujias, manguera, guantes, llaveGrifos, aceiteMotor] = await articuloRepo.save([
    articuloRepo.create({
      nombre_articulo: 'Filtro de aceite', stock_actual: 0,
      costo_unitario_actual: 8500, id_categoria: catRepuestos.id_categoria,
    }),
    articuloRepo.create({
      nombre_articulo: 'Juego de bujías', stock_actual: 0,
      costo_unitario_actual: 12000, id_categoria: catRepuestos.id_categoria,
    }),
    articuloRepo.create({
      nombre_articulo: 'Manguera contra incendio 2.5"', stock_actual: 0,
      costo_unitario_actual: 65000, id_categoria: catInsumos.id_categoria,
    }),
    articuloRepo.create({
      nombre_articulo: 'Guantes de protección térmica', stock_actual: 0,
      costo_unitario_actual: 9800, id_categoria: catEPP.id_categoria,
    }),
    articuloRepo.create({
      nombre_articulo: 'Llave para grifos', stock_actual: 0,
      costo_unitario_actual: 15500, id_categoria: catHerramientas.id_categoria,
    }),
    articuloRepo.create({
      nombre_articulo: 'Aceite motor 15W-40 (litro)', stock_actual: 0,
      costo_unitario_actual: 3200, id_categoria: catRepuestos.id_categoria,
    }),
  ]);
  console.log('✅ Artículos de inventario creados (stock en 0, se actualizará con entradas).');

  // ─── MOVIMIENTO INVENTARIO — ENTRADAS (stock inicial) ─────────────────────
  // El trigger aplicar_movimiento_inventario actualiza stock_actual automáticamente.
  const movRepo = ds.getRepository(MovimientoInventario);
  await movRepo.save([
    movRepo.create({ tipo_movimiento: TipoMovimiento.ENTRADA, cantidad: 20, fecha_movimiento: new Date(), id_articulo: filtroAceite.id_articulo, observacion: 'Compra inicial — OC #001' }),
    movRepo.create({ tipo_movimiento: TipoMovimiento.ENTRADA, cantidad: 15, fecha_movimiento: new Date(), id_articulo: bujias.id_articulo,      observacion: 'Compra inicial — OC #001' }),
    movRepo.create({ tipo_movimiento: TipoMovimiento.ENTRADA, cantidad: 8,  fecha_movimiento: new Date(), id_articulo: manguera.id_articulo,    observacion: 'Compra inicial — OC #002' }),
    movRepo.create({ tipo_movimiento: TipoMovimiento.ENTRADA, cantidad: 30, fecha_movimiento: new Date(), id_articulo: guantes.id_articulo,     observacion: 'Compra inicial — OC #002' }),
    movRepo.create({ tipo_movimiento: TipoMovimiento.ENTRADA, cantidad: 5,  fecha_movimiento: new Date(), id_articulo: llaveGrifos.id_articulo, observacion: 'Compra inicial — OC #003' }),
    movRepo.create({ tipo_movimiento: TipoMovimiento.ENTRADA, cantidad: 40, fecha_movimiento: new Date(), id_articulo: aceiteMotor.id_articulo, observacion: 'Compra inicial — OC #003' }),
    movRepo.create({ tipo_movimiento: TipoMovimiento.ENTRADA, cantidad: 10, fecha_movimiento: new Date(), id_articulo: filtroAceite.id_articulo, observacion: 'Reposición — OC #008' }),
    movRepo.create({ tipo_movimiento: TipoMovimiento.ENTRADA, cantidad: 20, fecha_movimiento: new Date(), id_articulo: aceiteMotor.id_articulo,  observacion: 'Reposición — OC #008' }),
  ]);
  console.log('✅ Movimientos de entrada creados (stock actualizado por trigger).');

  // ─── REGISTRO OPERATIVIDAD ────────────────────────────────────────────────
  const registroRepo = ds.getRepository(RegistroOperatividad);
  await registroRepo.save([
    registroRepo.create({
      fecha_hora_registro: new Date('2025-09-01T08:00:00'),
      nivel_combustible: 85.5, nivel_agua: 100, nivel_aceite: 90,
      observaciones: 'Revisión diaria OK. Vehículo en perfectas condiciones.',
      id_usuario: bombero1.id_usuario, id_vehiculo: carro1.id_vehiculo,
    }),
    registroRepo.create({
      fecha_hora_registro: new Date('2025-09-02T07:45:00'),
      nivel_combustible: 72.0, nivel_agua: 100, nivel_aceite: 85,
      observaciones: 'Nivel de combustible bajo, se solicita abastecimiento.',
      id_usuario: bombero2.id_usuario, id_vehiculo: carro1.id_vehiculo,
    }),
    registroRepo.create({
      fecha_hora_registro: new Date('2025-09-03T08:15:00'),
      nivel_combustible: 60.0, nivel_agua: 95, nivel_aceite: 80,
      observaciones: 'Ruido leve en motor al encender. Se reporta al mecánico.',
      id_usuario: bombero1.id_usuario, id_vehiculo: carro2.id_vehiculo,
    }),
    registroRepo.create({
      fecha_hora_registro: new Date('2025-09-05T09:00:00'),
      nivel_combustible: 90.0, nivel_agua: 100, nivel_aceite: 95,
      observaciones: 'Sin novedad.',
      id_usuario: bombero2.id_usuario, id_vehiculo: ambulancia.id_vehiculo,
    }),
  ]);
  console.log('✅ Registros de operatividad creados.');

  // ─── MANTENCION ───────────────────────────────────────────────────────────
  const mantencionRepo = ds.getRepository(Mantencion);
  const [mant1, mant2, mant3] = await mantencionRepo.save([
    // Mantención finalizada (mecánico interno)
    mantencionRepo.create({
      tipo_mantencion: TipoMantencion.PREVENTIVA,
      fecha_ingreso: new Date('2025-08-10T09:00:00'),
      fecha_salida:  new Date('2025-08-12T17:00:00'),
      descripcion_falla: 'Mantención preventiva de rutina: cambio de aceite y filtros.',
      costo_mano_obra: 35000,
      estado_mantencion: EstadoMantencion.FINALIZADA,
      id_vehiculo: carro1.id_vehiculo,
      id_usuario_mecanico: mecanico1.id_usuario,
    }),
    // Mantención en proceso (mecánico interno, vehículo EN_MANTENCION)
    mantencionRepo.create({
      tipo_mantencion: TipoMantencion.CORRECTIVA,
      fecha_ingreso: new Date('2025-09-03T10:30:00'),
      descripcion_falla: 'Ruido en motor, posible falla en sistema de encendido.',
      costo_mano_obra: 75000,
      estado_mantencion: EstadoMantencion.EN_PROCESO,
      id_vehiculo: carro2.id_vehiculo,
      id_usuario_mecanico: mecanico1.id_usuario,
    }),
    // Mantención pendiente (taller externo)
    mantencionRepo.create({
      tipo_mantencion: TipoMantencion.REVISION,
      fecha_ingreso: new Date('2025-09-08T08:00:00'),
      descripcion_falla: 'Revisión técnica obligatoria anual.',
      costo_mano_obra: 50000,
      estado_mantencion: EstadoMantencion.PENDIENTE,
      id_vehiculo: rescate.id_vehiculo,
      taller_externo: 'Taller Automotriz Concepción Ltda.',
    }),
  ]);
  console.log('✅ Mantenciones creadas.');

  // ─── DETALLE ARTICULO MANTENCION ──────────────────────────────────────────
  // El trigger generar_salida_por_mantencion crea las salidas de stock
  // automáticamente en movimiento_inventario. NO insertar salidas manualmente.
  const detalleRepo = ds.getRepository(DetalleArticuloMantencion);
  await detalleRepo.save([
    // Detalles de mantención 1 (preventiva finalizada)
    detalleRepo.create({
      cantidad: 2, costo_unitario_historico: 8500,
      id_mantencion: mant1.id_mantencion, id_articulo: filtroAceite.id_articulo,
    }),
    detalleRepo.create({
      cantidad: 6, costo_unitario_historico: 3200,
      id_mantencion: mant1.id_mantencion, id_articulo: aceiteMotor.id_articulo,
    }),
    // Detalles de mantención 2 (correctiva en proceso)
    detalleRepo.create({
      cantidad: 1, costo_unitario_historico: 12000,
      id_mantencion: mant2.id_mantencion, id_articulo: bujias.id_articulo,
    }),
    detalleRepo.create({
      cantidad: 1, costo_unitario_historico: 8500,
      id_mantencion: mant2.id_mantencion, id_articulo: filtroAceite.id_articulo,
    }),
  ]);
  console.log('✅ Detalles de mantención creados (salidas de stock generadas por trigger).');

  // ─── DESPACHO EMERGENCIA ──────────────────────────────────────────────────
  const despachoRepo = ds.getRepository(DespachoEmergencia);
  const [despacho1, despacho2, despacho3] = await despachoRepo.save([
    // Despacho finalizado con grifo asociado
    despachoRepo.create({
      fecha_hora_despacho: new Date('2025-09-01T14:30:00'),
      coordenada_destino: { type: 'Point', coordinates: [-73.1135, -36.7215] },
      tipo_emergencia: 'Incendio estructural',
      estado_emergencia: EstadoEmergencia.FINALIZADA,
      id_vehiculo: carro1.id_vehiculo,
      id_grifo: grifo1.id_grifo,
      id_compania: comp1.id_compania,
    }),
    // Despacho en curso sin grifo
    despachoRepo.create({
      fecha_hora_despacho: new Date('2025-09-12T16:00:00'),
      coordenada_destino: { type: 'Point', coordinates: [-73.1098, -36.7250] },
      tipo_emergencia: 'Accidente vehicular',
      estado_emergencia: EstadoEmergencia.EN_CURSO,
      id_vehiculo: ambulancia.id_vehiculo,
      id_compania: comp2.id_compania,
    }),
    // Despacho controlado
    despachoRepo.create({
      fecha_hora_despacho: new Date('2025-09-10T22:15:00'),
      coordenada_destino: { type: 'Point', coordinates: [-73.1175, -36.7190] },
      tipo_emergencia: 'Incendio forestal',
      estado_emergencia: EstadoEmergencia.CONTROLADA,
      id_vehiculo: carro1.id_vehiculo,
      id_grifo: grifo3.id_grifo,
      id_compania: comp1.id_compania,
    }),
  ]);
  console.log('✅ Despachos de emergencia creados.');

  // ─── DESPACHO PERSONAL (tripulación) ─────────────────────────────────────
  const dpRepo = ds.getRepository(DespachoPersonal);
  await dpRepo.save([
    // Tripulación despacho 1
    dpRepo.create({ id_despacho: despacho1.id_despacho, id_usuario: capitan1.id_usuario, rol_en_despacho: RolEnDespacho.JEFE_DESPACHO }),
    dpRepo.create({ id_despacho: despacho1.id_despacho, id_usuario: bombero1.id_usuario, rol_en_despacho: RolEnDespacho.CONDUCTOR }),
    dpRepo.create({ id_despacho: despacho1.id_despacho, id_usuario: bombero2.id_usuario, rol_en_despacho: RolEnDespacho.BRIGADISTA }),
    // Tripulación despacho 2
    dpRepo.create({ id_despacho: despacho2.id_despacho, id_usuario: bombero2.id_usuario, rol_en_despacho: RolEnDespacho.CONDUCTOR }),
    // Tripulación despacho 3
    dpRepo.create({ id_despacho: despacho3.id_despacho, id_usuario: capitan1.id_usuario, rol_en_despacho: RolEnDespacho.JEFE_DESPACHO }),
    dpRepo.create({ id_despacho: despacho3.id_despacho, id_usuario: bombero1.id_usuario, rol_en_despacho: RolEnDespacho.BRIGADISTA }),
  ]);
  console.log('✅ Tripulación de despachos creada.');

  // ─── RESUMEN ──────────────────────────────────────────────────────────────
  console.log('\n🎉 Seed completado con éxito.');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('Usuarios de prueba (password para todos: Password123)');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('  admin@bomberos-talcahuano.cl     → administrador');
  console.log('  capitan1@bomberos-talcahuano.cl  → capitan');
  console.log('  mecanico1@bomberos-talcahuano.cl → mecanico');
  console.log('  bombero1@bomberos-talcahuano.cl  → bombero');
  console.log('  bombero2@bomberos-talcahuano.cl  → bombero');
  console.log('  bombero3@bomberos-talcahuano.cl  → bombero (inactivo ❌)');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

  await ds.destroy();
}

seed().catch((err) => {
  console.error('❌ Error en el seed:', err);
  process.exit(1);
});

