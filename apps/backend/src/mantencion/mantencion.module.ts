import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Mantencion } from './entities/mantencion.entity';
import { MantencionService } from './mantencion.service';
import { MantencionController } from './mantencion.controller';

@Module({
  imports: [TypeOrmModule.forFeature([Mantencion])],
  controllers: [MantencionController],
  providers: [MantencionService],
  exports: [MantencionService],
})
export class MantencionModule {}
