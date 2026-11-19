import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TipoVehiculo } from './entities/tipo_vehiculo.entity';
import { TipoVehiculoService } from './tipo_vehiculo.service';
import { TipoVehiculoController } from './tipo_vehiculo.controller';

@Module({
  imports: [TypeOrmModule.forFeature([TipoVehiculo])],
  controllers: [TipoVehiculoController],
  providers: [TipoVehiculoService],
  exports: [TipoVehiculoService],
})
export class TipoVehiculoModule {}
