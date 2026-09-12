import { Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

// Aplica la estrategia 'jwt' registrada arriba a cualquier controller/ruta
// donde se use @UseGuards(JwtAuthGuard).
@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {}
