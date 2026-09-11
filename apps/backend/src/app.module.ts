import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModule } from './auth/auth.module';
import { UsuarioModule } from './usuario/usuario.module';
import { RolModule } from './rol/rol.module';
import { CompañiaModule } from './compañia/compañia.module';

@Module({
  imports: [
    // 1. Habilita la lectura del archivo .env en todo el proyecto
    ConfigModule.forRoot({
      isGlobal: true, 
    }),
    
    // 2. Configura la conexión a Supabase
    TypeOrmModule.forRoot({
      type: 'postgres',
      url: process.env.DATABASE_URL,
      ssl: { 
        rejectUnauthorized: false // Obligatorio para conexiones seguras a la nube de Supabase
      }, 
      autoLoadEntities: true, // Carga automáticamente las tablas que vayamos creando en código
      synchronize: false, // ¡CRÍTICO! Debe estar en false porque ya creamos la BD perfecta en 3NF con el script SQL. Si está en true, TypeORM podría intentar borrar o alterar tus tablas de PostGIS.
    }),
    
    AuthModule,
    
    UsuarioModule,
    
    RolModule,
    
    CompañiaModule,
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}