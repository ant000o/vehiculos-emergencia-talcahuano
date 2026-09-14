import { Controller, Get, Post, Body, Patch, Param, Delete, ParseIntPipe, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CategoriaArticuloService } from './categoria_articulo.service';
import { CreateCategoriaArticuloDto } from './dto/create-categoria_articulo.dto';
import { UpdateCategoriaArticuloDto } from './dto/update-categoria_articulo.dto';

@UseGuards(JwtAuthGuard)
@Controller('categorias-articulo')
export class CategoriaArticuloController {
  constructor(private readonly service: CategoriaArticuloService) {}

  @Post()
  create(@Body() dto: CreateCategoriaArticuloDto) {
    return this.service.create(dto);
  }

  @Get()
  findAll() {
    return this.service.findAll();
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.service.findOne(id);
  }

  @Patch(':id')
  update(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateCategoriaArticuloDto) {
    return this.service.update(id, dto);
  }

  @Delete(':id')
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.service.remove(id);
  }
}
