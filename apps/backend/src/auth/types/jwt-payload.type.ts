// Forma del payload que se firma dentro del JWT.
export interface JwtPayload {
  sub: number; // id_usuario
  email: string;
  id_rol: number;
  nombre_rol: string;
  id_compania: number;
}
