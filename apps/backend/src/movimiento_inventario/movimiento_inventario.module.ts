import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MovimientoInventario } from './entities/movimiento_inventario.entity';
import { MovimientoInventarioService } from './movimiento_inventario.service';
import { MovimientoInventarioController } from './movimiento_inventario.controller';

@Module({
  imports: [TypeOrmModule.forFeature([MovimientoInventario])],
  controllers: [MovimientoInventarioController],
  providers: [MovimientoInventarioService],
  exports: [MovimientoInventarioService],
})
export class MovimientoInventarioModule {}
