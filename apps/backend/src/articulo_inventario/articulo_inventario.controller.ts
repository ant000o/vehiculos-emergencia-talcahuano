import { Controller, Get, Post, Body, Patch, Param, Delete, ParseIntPipe, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { ArticuloInventarioService } from './articulo_inventario.service';
import { CreateArticuloInventarioDto } from './dto/create-articulo_inventario.dto';
import { UpdateArticuloInventarioDto } from './dto/update-articulo_inventario.dto';

@UseGuards(JwtAuthGuard)
@Controller('articulos-inventario')
export class ArticuloInventarioController {
  constructor(private readonly service: ArticuloInventarioService) {}

  @Post()
  create(@Body() dto: CreateArticuloInventarioDto) {
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
  update(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateArticuloInventarioDto) {
    return this.service.update(id, dto);
  }

  @Delete(':id')
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.service.remove(id);
  }
}
