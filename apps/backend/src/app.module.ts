import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AppController } from './app.controller';
import { AppService } from './app.service';

import { RolModule } from './rol/rol.module';
import { CompaniaModule } from './compania/compania.module';
import { CategoriaArticuloModule } from './categoria_articulo/categoria_articulo.module';
import { UsuarioModule } from './usuario/usuario.module';
import { VehiculoModule } from './vehiculo/vehiculo.module';
import { GrifoModule } from './grifo/grifo.module';
import { ArticuloInventarioModule } from './articulo_inventario/articulo_inventario.module';
import { RegistroOperatividadModule } from './registro_operatividad/registro_operatividad.module';
import { MantencionModule } from './mantencion/mantencion.module';
import { DetalleArticuloMantencionModule } from './detalle_articulo_mantencion/detalle_articulo_mantencion.module';
import { MovimientoInventarioModule } from './movimiento_inventario/movimiento_inventario.module';
import { DespachoEmergenciaModule } from './despacho_emergencia/despacho_emergencia.module';
import { DespachoPersonalModule } from './despacho_personal/despacho_personal.module';
import { AuthModule } from './auth/auth.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        type: 'postgres',
        url: config.get<string>('DATABASE_URL'),
        autoLoadEntities: true,
        // CRÍTICO: la base ya existe (creada con el script SQL a mano).
        // Si esto es true, TypeORM puede alterar/borrar tus enums, triggers
        // y constraints personalizados. Usa migraciones para cambios futuros.
        synchronize: false,
        ssl: { rejectUnauthorized: false }, // requerido por Supabase
      }),
    }),
    RolModule,
    CompaniaModule,
    CategoriaArticuloModule,
    UsuarioModule,
    VehiculoModule,
    GrifoModule,
    ArticuloInventarioModule,
    RegistroOperatividadModule,
    MantencionModule,
    DetalleArticuloMantencionModule,
    MovimientoInventarioModule,
    DespachoEmergenciaModule,
    DespachoPersonalModule,
    AuthModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
