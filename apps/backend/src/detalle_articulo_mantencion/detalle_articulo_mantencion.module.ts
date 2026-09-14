import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DetalleArticuloMantencion } from './entities/detalle_articulo_mantencion.entity';
import { ArticuloInventario } from '../articulo_inventario/entities/articulo_inventario.entity';
import { DetalleArticuloMantencionService } from './detalle_articulo_mantencion.service';
import { DetalleArticuloMantencionController } from './detalle_articulo_mantencion.controller';

@Module({
  imports: [TypeOrmModule.forFeature([DetalleArticuloMantencion, ArticuloInventario])],
  controllers: [DetalleArticuloMantencionController],
  providers: [DetalleArticuloMantencionService],
  exports: [DetalleArticuloMantencionService],
})
export class DetalleArticuloMantencionModule {}
