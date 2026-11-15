import { IsString, IsNotEmpty, IsEmail, MaxLength, MinLength, IsInt, IsBoolean, IsOptional } from 'class-validator';

export class CreateUsuarioDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(12)
  rut: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  nombre: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  apellidos: string;

  @IsEmail()
  @MaxLength(150)
  email: string;

  // Contraseña en texto plano recibida desde el cliente.
  // El hash (bcrypt) se genera en el servicio, NUNCA se guarda tal cual.
  @IsString()
  @MinLength(8)
  password: string;

  @IsInt()
  id_rol: number;

  @IsInt()
  id_compania: number;

  @IsBoolean()
  @IsOptional()
  estado_activo?: boolean;
}
