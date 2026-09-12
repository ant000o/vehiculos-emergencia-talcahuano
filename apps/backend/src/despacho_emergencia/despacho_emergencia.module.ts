import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DespachoEmergencia } from './entities/despacho_emergencia.entity';
import { DespachoEmergenciaService } from './despacho_emergencia.service';
import { DespachoEmergenciaController } from './despacho_emergencia.controller';

@Module({
  imports: [TypeOrmModule.forFeature([DespachoEmergencia])],
  controllers: [DespachoEmergenciaController],
  providers: [DespachoEmergenciaService],
  exports: [DespachoEmergenciaService],
})
export class DespachoEmergenciaModule {}
