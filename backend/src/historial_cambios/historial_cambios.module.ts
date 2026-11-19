import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { HistorialCambios } from './entities/historial_cambios.entity';
import { HistorialCambiosService } from './historial_cambios.service';
import { HistorialCambiosController } from './historial_cambios.controller';

@Module({
  imports: [TypeOrmModule.forFeature([HistorialCambios])],
  controllers: [HistorialCambiosController],
  providers: [HistorialCambiosService],
  exports: [HistorialCambiosService],
})
export class HistorialCambiosModule {}
