import { Controller, Get, Post, Body, Patch, Param, Delete, ParseIntPipe, UseGuards, Query } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { MantencionService } from './mantencion.service';
import { CreateMantencionDto } from './dto/create-mantencion.dto';
import { UpdateMantencionDto } from './dto/update-mantencion.dto';
import { EstadoMantencion, TipoMantencion } from '../common/enums/estados.enum';

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('mantenciones')
export class MantencionController {
  constructor(private readonly service: MantencionService) {}

  @Roles('administrador', 'mecanico', 'capitan')
  @Post()
  create(@Body() dto: CreateMantencionDto) { return this.service.create(dto); }

  /** GET /mantenciones?id_vehiculo=3&estado=en_proceso&tipo=correctiva */
  @Roles('administrador', 'mecanico', 'capitan')
  @Get()
  findAll(
    @Query('id_vehiculo') id_vehiculo?: string,
    @Query('estado') estado?: EstadoMantencion,
    @Query('tipo') tipo?: TipoMantencion,
  ) {
    return this.service.findAll({ id_vehiculo: id_vehiculo ? +id_vehiculo : undefined, estado, tipo });
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) { return this.service.findOne(id); }

  @Roles('administrador', 'mecanico', 'capitan')
  @Patch(':id')
  update(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateMantencionDto) { return this.service.update(id, dto); }

  @Roles('administrador')
  @Delete(':id')
  remove(@Param('id', ParseIntPipe) id: number) { return this.service.remove(id); }
}
