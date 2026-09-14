import { Controller, Get, Post, Body, Patch, Param, Delete, ParseIntPipe, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { DetalleArticuloMantencionService } from './detalle_articulo_mantencion.service';
import { CreateDetalleArticuloMantencionDto } from './dto/create-detalle_articulo_mantencion.dto';
import { UpdateDetalleArticuloMantencionDto } from './dto/update-detalle_articulo_mantencion.dto';

@UseGuards(JwtAuthGuard)
@Controller('detalles-articulo-mantencion')
export class DetalleArticuloMantencionController {
  constructor(private readonly service: DetalleArticuloMantencionService) {}

  @Post()
  create(@Body() dto: CreateDetalleArticuloMantencionDto) {
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
  update(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateDetalleArticuloMantencionDto) {
    return this.service.update(id, dto);
  }

  @Delete(':id')
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.service.remove(id);
  }
}
