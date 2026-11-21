import { Controller, Get, Post, Body, Patch, Param, Delete, ParseIntPipe, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { RequirePermission } from '../auth/decorators/permissions.decorator';
import { CompaniaService } from './compania.service';
import { CreateCompaniaDto } from './dto/create-compania.dto';
import { UpdateCompaniaDto } from './dto/update-compania.dto';

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('companias')
export class CompaniaController {
  constructor(private readonly companiaService: CompaniaService) {}

  @RequirePermission('companias', 'create')
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

  @RequirePermission('companias', 'update')
  @Patch(':id')
  update(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateCompaniaDto) {
    return this.companiaService.update(id, dto);
  }

  @RequirePermission('companias', 'delete')
  @Delete(':id')
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.companiaService.remove(id);
  }
}
