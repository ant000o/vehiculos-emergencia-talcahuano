import { Controller, Get, Post, Body, Patch, Param, Delete, ParseIntPipe, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { DespachoEmergenciaService } from './despacho_emergencia.service';
import { CreateDespachoEmergenciaDto } from './dto/create-despacho_emergencia.dto';
import { UpdateDespachoEmergenciaDto } from './dto/update-despacho_emergencia.dto';

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller(['despachos-emergencia', 'despacho-emergencia'])
export class DespachoEmergenciaController {
  constructor(private readonly service: DespachoEmergenciaService) {}

  @Roles('administrador', 'capitan')
  @Post()
  create(@Body() dto: CreateDespachoEmergenciaDto) {
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

  @Roles('administrador', 'capitan')
  @Patch(':id')
  update(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateDespachoEmergenciaDto) {
    return this.service.update(id, dto);
  }

  @Roles('administrador')
  @Delete(':id')
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.service.remove(id);
  }
}
