import { Controller, Get, Param, ParseIntPipe, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { TipoVehiculoService } from './tipo_vehiculo.service';

@UseGuards(JwtAuthGuard)
@Controller('tipos-vehiculo')
export class TipoVehiculoController {
  constructor(private readonly service: TipoVehiculoService) {}

  @Get()
  findAll() {
    return this.service.findAll();
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.service.findOne(id);
  }
}
