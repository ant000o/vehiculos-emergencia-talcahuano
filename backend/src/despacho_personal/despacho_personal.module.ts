import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DespachoPersonal } from './entities/despacho_personal.entity';
import { DespachoPersonalService } from './despacho_personal.service';
import { DespachoPersonalController } from './despacho_personal.controller';

@Module({
  imports: [TypeOrmModule.forFeature([DespachoPersonal])],
  controllers: [DespachoPersonalController],
  providers: [DespachoPersonalService],
  exports: [DespachoPersonalService],
})
export class DespachoPersonalModule {}
