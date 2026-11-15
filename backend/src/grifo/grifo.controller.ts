import { Controller, Get, Post, Body, Patch, Param, Delete, ParseIntPipe, UseGuards, Query } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { GrifoService } from './grifo.service';
import { CreateGrifoDto } from './dto/create-grifo.dto';
import { UpdateGrifoDto } from './dto/update-grifo.dto';
import { EstadoGrifo } from '../common/enums/estados.enum';

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('grifos')
export class GrifoController {
  constructor(private readonly service: GrifoService) {}

  @Roles('administrador', 'capitan')
  @Post()
  create(@Body() dto: CreateGrifoDto) { return this.service.create(dto); }

  /** GET /grifos?estado=operativo */
  @Get()
  findAll(@Query('estado') estado?: EstadoGrifo) { return this.service.findAll(estado); }

  /**
   * GET /grifos/cercanos?lat=-36.72&lng=-73.11&radio=1000&solo_operativos=true
   */
  @Get('cercanos')
  findCercanos(
    @Query('lat') lat: string,
    @Query('lng') lng: string,
    @Query('radio') radio?: string,
    @Query('solo_operativos') soloOperativos?: string,
  ) {
    return this.service.findCercanos(
      Number(lat),
      Number(lng),
      radio ? Number(radio) : 1000,
      soloOperativos !== 'false',
    );
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) { return this.service.findOne(id); }

  @Roles('administrador', 'capitan', 'mecanico')
  @Patch(':id')
  update(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateGrifoDto) { return this.service.update(id, dto); }

  @Roles('administrador')
  @Delete(':id')
  remove(@Param('id', ParseIntPipe) id: number) { return this.service.remove(id); }
}
