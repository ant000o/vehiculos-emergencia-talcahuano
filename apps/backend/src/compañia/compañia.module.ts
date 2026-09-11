import { Module } from '@nestjs/common';
import { CompañiaService } from './compañia.service';
import { CompañiaController } from './compañia.controller';

@Module({
  controllers: [CompañiaController],
  providers: [CompañiaService],
})
export class CompañiaModule {}
