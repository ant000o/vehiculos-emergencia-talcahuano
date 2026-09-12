import { NestFactory, Reflector } from '@nestjs/core';
import { ClassSerializerInterceptor, ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // whitelist: descarta campos no declarados en los DTO (evita mass-assignment)
  // transform: convierte automáticamente tipos (ej. strings de query params a number)
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  // Activa @Exclude() en todas las entidades de TypeORM.
  // Necesario para que password_hash no viaje en ninguna respuesta,
  // incluyendo cuando Usuario aparece como relación anidada.
  app.useGlobalInterceptors(new ClassSerializerInterceptor(app.get(Reflector)));

  // En producción, leer el origen desde la variable CORS_ORIGIN (coma-separado).
  // En desarrollo, si no está definida, se acepta cualquier origen.
  const corsOrigin = process.env.CORS_ORIGIN;
  app.enableCors({
    origin: corsOrigin ? corsOrigin.split(',') : '*',
    methods: ['GET', 'POST', 'PATCH', 'DELETE', 'OPTIONS'],
    credentials: true,
  });

  await app.listen(process.env.PORT ?? 3000);
}
bootstrap();

