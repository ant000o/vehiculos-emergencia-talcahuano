import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { RegistroOperatividad } from './entities/registro_operatividad.entity';
import { RegistroOperatividadService } from './registro_operatividad.service';
import { RegistroOperatividadController } from './registro_operatividad.controller';

@Module({
  imports: [TypeOrmModule.forFeature([RegistroOperatividad])],
  controllers: [RegistroOperatividadController],
  providers: [RegistroOperatividadService],
  exports: [RegistroOperatividadService],
})
export class RegistroOperatividadModule {}
