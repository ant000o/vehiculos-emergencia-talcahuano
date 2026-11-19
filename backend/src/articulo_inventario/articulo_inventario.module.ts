import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ArticuloInventario } from './entities/articulo_inventario.entity';
import { ArticuloInventarioService } from './articulo_inventario.service';
import { ArticuloInventarioController } from './articulo_inventario.controller';

@Module({
  imports: [TypeOrmModule.forFeature([ArticuloInventario])],
  controllers: [ArticuloInventarioController],
  providers: [ArticuloInventarioService],
  exports: [ArticuloInventarioService],
})
export class ArticuloInventarioModule {}
