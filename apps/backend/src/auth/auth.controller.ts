import { Controller, Post, Body, Get, HttpCode, HttpStatus, UseGuards, Req } from '@nestjs/common';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('login')
  @HttpCode(HttpStatus.OK)
  login(@Body() dto: LoginDto) { return this.authService.login(dto); }

  /**
   * GET /auth/me
   * Devuelve los datos del usuario autenticado (útil para mobile al arrancar).
   * El guard inyecta req.user desde el JWT.
   */
  @Get('me')
  @UseGuards(JwtAuthGuard)
  me(@Req() req: any) { return req.user; }
}
