import { Controller, Get, Post, Body, Param, ParseIntPipe, Query, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { MovimientoInventarioService } from './movimiento_inventario.service';
import { CreateMovimientoInventarioDto } from './dto/create-movimiento_inventario.dto';

// Sin PATCH/DELETE a propósito: el kardex es un historial append-only.
@UseGuards(JwtAuthGuard)
@Controller('movimientos-inventario')
export class MovimientoInventarioController {
  constructor(private readonly service: MovimientoInventarioService) {}

  @Post()
  create(@Body() dto: CreateMovimientoInventarioDto) {
    return this.service.create(dto);
  }

  @Get()
  findAll(@Query('id_articulo') id_articulo?: string) {
    if (id_articulo) return this.service.findByArticulo(Number(id_articulo));
    return this.service.findAll();
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.service.findOne(id);
  }
}
