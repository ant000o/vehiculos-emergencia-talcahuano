import { Controller, Get, Post, Body, Patch, Param, Delete, ParseIntPipe, UseGuards, Query } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import type { JwtPayload } from '../auth/types/jwt-payload.type';
import { RegistroOperatividadService } from './registro_operatividad.service';
import { CreateRegistroOperatividadDto } from './dto/create-registro_operatividad.dto';
import { UpdateRegistroOperatividadDto } from './dto/update-registro_operatividad.dto';

@UseGuards(JwtAuthGuard)
@Controller('registros-operatividad')
export class RegistroOperatividadController {
  constructor(private readonly service: RegistroOperatividadService) {}

  @Post()
  create(
    @Body() dto: CreateRegistroOperatividadDto,
    @CurrentUser() user: JwtPayload,
  ) {
    // S5: Asignar id_usuario de forma segura desde el JWT validado
    dto.id_usuario = user.sub;
    return this.service.create(dto);
  }

  /** GET /registros-operatividad?id_vehiculo=2 */
  @Get()
  findAll(@Query('id_vehiculo') id_vehiculo?: string) {
    return this.service.findAll(id_vehiculo ? +id_vehiculo : undefined);
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) { return this.service.findOne(id); }

  @Patch(':id')
  update(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateRegistroOperatividadDto) { return this.service.update(id, dto); }

  @Delete(':id')
  remove(@Param('id', ParseIntPipe) id: number) { return this.service.remove(id); }
}
