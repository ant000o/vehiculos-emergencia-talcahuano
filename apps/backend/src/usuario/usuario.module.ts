import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UsuarioService } from './usuario.service';
import { UsuarioController } from './usuario.controller';
import { Usuario } from './entities/usuario.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Usuario])], // Registra la entidad aqui
  controllers: [UsuarioController],
  providers: [UsuarioService],
  exports: [UsuarioService], // lo exportamos para usarlo en el modulo de auth mas adelante
})

export class UsuarioModule {}
