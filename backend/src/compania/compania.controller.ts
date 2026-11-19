import { Controller, Get, Post, Body, Patch, Param, Delete, ParseIntPipe, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CompaniaService } from './compania.service';
import { CreateCompaniaDto } from './dto/create-compania.dto';
import { UpdateCompaniaDto } from './dto/update-compania.dto';

@UseGuards(JwtAuthGuard)
@Controller('companias')
export class CompaniaController {
  constructor(private readonly companiaService: CompaniaService) {}

  @Post()
  create(@Body() dto: CreateCompaniaDto) {
    return this.companiaService.create(dto);
  }

  @Get()
  findAll() {
    return this.companiaService.findAll();
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.companiaService.findOne(id);
  }

  @Patch(':id')
  update(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateCompaniaDto) {
    return this.companiaService.update(id, dto);
  }

  @Delete(':id')
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.companiaService.remove(id);
  }
}
