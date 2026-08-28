import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';

// Nota para el equipo: a medida que se definan los módulos de dominio
// (Vehículos, Mantenciones, Usuarios/Auth, etc.) se importan aquí.
// Ejemplo futuro: imports: [ConfigModule.forRoot(), VehiculosModule, AuthModule, PrismaModule]

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
