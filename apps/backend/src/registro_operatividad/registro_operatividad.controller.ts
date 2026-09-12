import { Controller, Get, Post, Body, Patch, Param, Delete, ParseIntPipe, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RegistroOperatividadService } from './registro_operatividad.service';
import { CreateRegistroOperatividadDto } from './dto/create-registro_operatividad.dto';
import { UpdateRegistroOperatividadDto } from './dto/update-registro_operatividad.dto';

@UseGuards(JwtAuthGuard)
@Controller('registros-operatividad')
export class RegistroOperatividadController {
  constructor(private readonly service: RegistroOperatividadService) {}

  @Post()
  create(@Body() dto: CreateRegistroOperatividadDto) {
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
  update(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateRegistroOperatividadDto) {
    return this.service.update(id, dto);
  }

  @Delete(':id')
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.service.remove(id);
  }
}
