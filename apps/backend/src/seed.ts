/**
 * Script de seed para poblar datos de prueba y validar en Postman.
 *
 * Ejecutar con:
 *   npx ts-node -r tsconfig-paths/register src/seed.ts
 *
 * Requiere que DATABASE_URL esté configurado en tu .env (mismo que usa la app).
 * Es seguro correrlo varias veces: limpia las tablas de prueba antes de insertar
 * (con TRUNCATE ... CASCADE), así que NO lo corras contra datos reales.
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
import { EstadoVehiculo, EstadoGrifo } from './common/enums/estados.enum';

const AppDataSource = new DataSource({
  type: 'postgres',
  url: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
  entities: [__dirname + '/**/*.entity{.ts,.js}'],
  synchronize: false,
});

async function seed() {
  const ds = await AppDataSource.initialize();
  console.log('Conectado a la base de datos.');

  // Limpieza de tablas de prueba (orden inverso a las dependencias)
  await ds.query(`
    TRUNCATE TABLE
      despacho_personal, despacho_emergencia, movimiento_inventario,
      detalle_articulo_mantencion, mantencion, registro_operatividad,
      articulo_inventario, grifo, vehiculo, usuario,
      categoria_articulo, compania, rol
    RESTART IDENTITY CASCADE
  `);
  console.log('Tablas limpiadas.');

  // --- rol ---
  const rolRepo = ds.getRepository(Rol);
  const [rolAdmin, rolBombero, rolCapitan] = await rolRepo.save([
    rolRepo.create({ nombre_rol: 'administrador', descripcion: 'Acceso total al sistema' }),
    rolRepo.create({ nombre_rol: 'bombero', descripcion: 'Personal operativo' }),
    rolRepo.create({ nombre_rol: 'capitan', descripcion: 'Jefe de compañía' }),
  ]);

  // --- compania ---
  const companiaRepo = ds.getRepository(Compania);
  const [compania1, compania2] = await companiaRepo.save([
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
  ]);

  // --- categoria_articulo ---
  const categoriaRepo = ds.getRepository(CategoriaArticulo);
  const [catRepuestos, catInsumos] = await categoriaRepo.save([
    categoriaRepo.create({ nombre_categoria: 'Repuestos mecánicos' }),
    categoriaRepo.create({ nombre_categoria: 'Insumos de emergencia' }),
  ]);

  // --- usuario ---
  // Contraseña de prueba para todos: "Password123" (ya hasheada con bcrypt)
  const passwordHash = await bcrypt.hash('Password123', 10);
  const usuarioRepo = ds.getRepository(Usuario);
  const [admin, mecanico, bombero1] = await usuarioRepo.save([
    usuarioRepo.create({
      rut: '11111111-1',
      nombre: 'Ana',
      apellidos: 'Soto',
      email: 'admin@bomberos-talcahuano.cl',
      password_hash: passwordHash,
      id_rol: rolAdmin.id_rol,
      id_compania: compania1.id_compania,
    }),
    usuarioRepo.create({
      rut: '22222222-2',
      nombre: 'Pedro',
      apellidos: 'Rojas',
      email: 'mecanico@bomberos-talcahuano.cl',
      password_hash: passwordHash,
      id_rol: rolCapitan.id_rol,
      id_compania: compania1.id_compania,
    }),
    usuarioRepo.create({
      rut: '33333333-3',
      nombre: 'Luis',
      apellidos: 'Fuentes',
      email: 'bombero1@bomberos-talcahuano.cl',
      password_hash: passwordHash,
      id_rol: rolBombero.id_rol,
      id_compania: compania1.id_compania,
    }),
  ]);

  // --- vehiculo ---
  const vehiculoRepo = ds.getRepository(Vehiculo);
  const [carroBomba, ambulancia] = await vehiculoRepo.save([
    vehiculoRepo.create({
      patente: 'BBBB11',
      marca: 'Mercedes-Benz',
      modelo: 'Atego 1725',
      anio: 2018,
      kilometraje: 45000,
      estado_operativo: EstadoVehiculo.OPERATIVO,
      id_compania: compania1.id_compania,
    }),
    vehiculoRepo.create({
      patente: 'CCCC22',
      marca: 'Volkswagen',
      modelo: 'Crafter',
      anio: 2020,
      kilometraje: 22000,
      estado_operativo: EstadoVehiculo.EN_MANTENCION,
      id_compania: compania2.id_compania,
    }),
  ]);

  // --- grifo ---
  const grifoRepo = ds.getRepository(Grifo);
  await grifoRepo.save([
    grifoRepo.create({
      coordenadas: { type: 'Point', coordinates: [-73.115, -36.72] },
      direccion: 'Av. Colón 1200, Talcahuano',
      estado_operativo: EstadoGrifo.OPERATIVO,
      id_compania: compania1.id_compania,
    }),
    grifoRepo.create({
      coordenadas: { type: 'Point', coordinates: [-73.112, -36.723] },
      direccion: 'Calle Anibal Pinto 450, Talcahuano',
      estado_operativo: EstadoGrifo.FUERA_DE_SERVICIO,
      id_compania: compania2.id_compania,
    }),
  ]);

  // --- articulo_inventario ---
  const articuloRepo = ds.getRepository(ArticuloInventario);
  await articuloRepo.save([
    articuloRepo.create({
      nombre_articulo: 'Filtro de aceite',
      stock_actual: 10,
      costo_unitario_actual: 8500,
      id_categoria: catRepuestos.id_categoria,
    }),
    articuloRepo.create({
      nombre_articulo: 'Manguera contra incendio 2.5"',
      stock_actual: 5,
      costo_unitario_actual: 65000,
      id_categoria: catInsumos.id_categoria,
    }),
  ]);

  console.log('Seed completado con éxito ✅');
  console.log('Usuarios de prueba (password para todos: Password123):');
  console.log('  - admin@bomberos-talcahuano.cl (administrador)');
  console.log('  - mecanico@bomberos-talcahuano.cl (capitan)');
  console.log('  - bombero1@bomberos-talcahuano.cl (bombero)');

  await ds.destroy();
}

seed().catch((err) => {
  console.error('Error en el seed:', err);
  process.exit(1);
});
