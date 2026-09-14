import { Controller, Get, Post, Body, Patch, Param, Delete, ParseIntPipe, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { GrifoService } from './grifo.service';
import { CreateGrifoDto } from './dto/create-grifo.dto';
import { UpdateGrifoDto } from './dto/update-grifo.dto';

@UseGuards(JwtAuthGuard)
@Controller('grifos')
export class GrifoController {
  constructor(private readonly service: GrifoService) {}

  @Post()
  create(@Body() dto: CreateGrifoDto) {
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
  update(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateGrifoDto) {
    return this.service.update(id, dto);
  }

  @Delete(':id')
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.service.remove(id);
  }
}
