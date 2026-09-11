import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { CompañiaService } from './compañia.service';
import { CreateCompañiaDto } from './dto/create-compañia.dto';
import { UpdateCompañiaDto } from './dto/update-compañia.dto';

@Controller('compañia')
export class CompañiaController {
  constructor(private readonly compañiaService: CompañiaService) {}

  @Post()
  create(@Body() createCompañiaDto: CreateCompañiaDto) {
    return this.compañiaService.create(createCompañiaDto);
  }

  @Get()
  findAll() {
    return this.compañiaService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.compañiaService.findOne(+id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateCompañiaDto: UpdateCompañiaDto) {
    return this.compañiaService.update(+id, updateCompañiaDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.compañiaService.remove(+id);
  }
}
