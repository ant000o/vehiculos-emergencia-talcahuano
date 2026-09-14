import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Grifo } from './entities/grifo.entity';
import { GrifoService } from './grifo.service';
import { GrifoController } from './grifo.controller';

@Module({
  imports: [TypeOrmModule.forFeature([Grifo])],
  controllers: [GrifoController],
  providers: [GrifoService],
  exports: [GrifoService],
})
export class GrifoModule {}
