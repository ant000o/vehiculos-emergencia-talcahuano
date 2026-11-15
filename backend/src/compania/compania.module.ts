import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Compania } from './entities/compania.entity';
import { CompaniaService } from './compania.service';
import { CompaniaController } from './compania.controller';

@Module({
  imports: [TypeOrmModule.forFeature([Compania])],
  controllers: [CompaniaController],
  providers: [CompaniaService],
  exports: [CompaniaService],
})
export class CompaniaModule {}
