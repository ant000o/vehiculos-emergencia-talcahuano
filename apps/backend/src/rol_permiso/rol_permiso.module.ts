import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { RolPermiso } from './entities/rol_permiso.entity';
import { RolPermisoService } from './rol_permiso.service';
import { RolPermisoController } from './rol_permiso.controller';

@Module({
  imports: [TypeOrmModule.forFeature([RolPermiso])],
  controllers: [RolPermisoController],
  providers: [RolPermisoService],
  exports: [RolPermisoService],
})
export class RolPermisoModule {}
