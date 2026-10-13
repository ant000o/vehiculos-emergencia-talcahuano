import { Controller, Get, Post, Body, Patch, Param, Delete, ParseIntPipe, UseGuards, Query } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { VehiculoService } from './vehiculo.service';
import { CreateVehiculoDto } from './dto/create-vehiculo.dto';
import { UpdateVehiculoDto } from './dto/update-vehiculo.dto';
import { EstadoVehiculo } from '../common/enums/estados.enum';

@UseGuards(JwtAuthGuard)
@Controller('vehiculos')
export class VehiculoController {
  constructor(private readonly service: VehiculoService) {}

  @Post()
  @UseGuards(RolesGuard)
  @Roles('administrador')
  create(@Body() dto: CreateVehiculoDto) { return this.service.create(dto); }

  /** GET /vehiculos?estado=operativo&q=Mercedes&page=1&limit=20 */
  @Get()
  findAll(
    @Query('estado') estado?: EstadoVehiculo,
    @Query('q') q?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.service.findAll({ estado, q, page: page ? +page : 1, limit: limit ? +limit : 50 });
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) { return this.service.findOne(id); }

  /** GET /vehiculos/:id/registros */
  @Get(':id/registros')
  findRegistros(@Param('id', ParseIntPipe) id: number) { return this.service.findRegistros(id); }

  /** GET /vehiculos/:id/mantenciones */
  @Get(':id/mantenciones')
  findMantenciones(@Param('id', ParseIntPipe) id: number) { return this.service.findMantenciones(id); }

  @Patch(':id')
  @UseGuards(RolesGuard)
  @Roles('administrador')
  update(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateVehiculoDto) { return this.service.update(id, dto); }

  @Delete(':id')
  @UseGuards(RolesGuard)
  @Roles('administrador')
  remove(@Param('id', ParseIntPipe) id: number) { return this.service.remove(id); }
}
