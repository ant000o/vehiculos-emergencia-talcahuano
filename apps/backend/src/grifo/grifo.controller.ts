import { Controller, Get, Post, Body, Patch, Param, Delete, ParseIntPipe, UseGuards, Query } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { GrifoService } from './grifo.service';
import { CreateGrifoDto } from './dto/create-grifo.dto';
import { UpdateGrifoDto } from './dto/update-grifo.dto';
import { EstadoGrifo } from '../common/enums/estados.enum';

@UseGuards(JwtAuthGuard)
@Controller('grifos')
export class GrifoController {
  constructor(private readonly service: GrifoService) {}

  @Post()
  create(@Body() dto: CreateGrifoDto) { return this.service.create(dto); }

  /** GET /grifos?estado=operativo */
  @Get()
  findAll(@Query('estado') estado?: EstadoGrifo) { return this.service.findAll(estado); }

  /**
   * GET /grifos/cercanos?lat=-36.72&lng=-73.11&radio=1000&solo_operativos=true
   * Devuelve grifos ordenados por distancia ascendente.
   * Debe ir ANTES de :id para que NestJS no lo interprete como id='cercanos'.
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

  @Patch(':id')
  update(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateGrifoDto) { return this.service.update(id, dto); }

  @Delete(':id')
  remove(@Param('id', ParseIntPipe) id: number) { return this.service.remove(id); }
}
