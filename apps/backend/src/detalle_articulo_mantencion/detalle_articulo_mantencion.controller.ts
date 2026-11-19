import { Controller, Get, Post, Body, Patch, Param, Delete, ParseIntPipe, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { RequirePermission } from '../auth/decorators/permissions.decorator';
import { DetalleArticuloMantencionService } from './detalle_articulo_mantencion.service';
import { CreateDetalleArticuloMantencionDto } from './dto/create-detalle_articulo_mantencion.dto';
import { UpdateDetalleArticuloMantencionDto } from './dto/update-detalle_articulo_mantencion.dto';

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('detalles-articulo-mantencion')
export class DetalleArticuloMantencionController {
  constructor(private readonly service: DetalleArticuloMantencionService) {}

  @RequirePermission('mantenciones', 'create')
  @Post()
  create(@Body() dto: CreateDetalleArticuloMantencionDto) {
    return this.service.create(dto);
  }

  @RequirePermission('mantenciones', 'view')
  @Get()
  findAll() {
    return this.service.findAll();
  }

  @RequirePermission('mantenciones', 'view')
  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.service.findOne(id);
  }

  @RequirePermission('mantenciones', 'update')
  @Patch(':id')
  update(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateDetalleArticuloMantencionDto) {
    return this.service.update(id, dto);
  }

  @RequirePermission('mantenciones', 'delete')
  @Delete(':id')
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.service.remove(id);
  }
}
