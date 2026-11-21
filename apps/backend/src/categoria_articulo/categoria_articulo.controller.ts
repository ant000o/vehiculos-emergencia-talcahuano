import { Controller, Get, Post, Body, Patch, Param, Delete, ParseIntPipe, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { RequirePermission } from '../auth/decorators/permissions.decorator';
import { CategoriaArticuloService } from './categoria_articulo.service';
import { CreateCategoriaArticuloDto } from './dto/create-categoria_articulo.dto';
import { UpdateCategoriaArticuloDto } from './dto/update-categoria_articulo.dto';

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('categorias-articulo')
export class CategoriaArticuloController {
  constructor(private readonly service: CategoriaArticuloService) {}

  @RequirePermission('inventario', 'create')
  @Post()
  create(@Body() dto: CreateCategoriaArticuloDto) {
    return this.service.create(dto);
  }

  @RequirePermission('inventario', 'view')
  @Get()
  findAll() {
    return this.service.findAll();
  }

  @RequirePermission('inventario', 'view')
  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.service.findOne(id);
  }

  @RequirePermission('inventario', 'update')
  @Patch(':id')
  update(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateCategoriaArticuloDto) {
    return this.service.update(id, dto);
  }

  @RequirePermission('inventario', 'delete')
  @Delete(':id')
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.service.remove(id);
  }
}
