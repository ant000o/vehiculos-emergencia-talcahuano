import { Controller, Post, Body, HttpCode, HttpStatus } from '@nestjs/common';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('login')
  @HttpCode(HttpStatus.OK) // por defecto POST devuelve 201; login es más semántico como 200
  login(@Body() dto: LoginDto) {
    return this.authService.login(dto);
  }
}
