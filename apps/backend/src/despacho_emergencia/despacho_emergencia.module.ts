import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DespachoEmergencia } from './entities/despacho_emergencia.entity';
import { DespachoEmergenciaService } from './despacho_emergencia.service';
import { DespachoEmergenciaController } from './despacho_emergencia.controller';
import { DespachoPersonal } from '../despacho_personal/entities/despacho_personal.entity';

@Module({
  imports: [TypeOrmModule.forFeature([DespachoEmergencia, DespachoPersonal])],
  controllers: [DespachoEmergenciaController],
  providers: [DespachoEmergenciaService],
  exports: [DespachoEmergenciaService],
})
export class DespachoEmergenciaModule {}
