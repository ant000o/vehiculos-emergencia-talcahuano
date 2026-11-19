import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CategoriaArticulo } from './entities/categoria_articulo.entity';
import { CategoriaArticuloService } from './categoria_articulo.service';
import { CategoriaArticuloController } from './categoria_articulo.controller';

@Module({
  imports: [TypeOrmModule.forFeature([CategoriaArticulo])],
  controllers: [CategoriaArticuloController],
  providers: [CategoriaArticuloService],
  exports: [CategoriaArticuloService],
})
export class CategoriaArticuloModule {}
