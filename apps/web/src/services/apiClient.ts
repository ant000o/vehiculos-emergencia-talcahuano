/**
 * Cliente HTTP compartido para hablar con el backend real.
 * Centraliza: URL base, header de Authorization con el JWT guardado,
 * y el formato de error que devuelve NestJS (whitelist + class-validator).
 */

const API_URL = import.meta.env.VITE_API_URL;

export class ApiError extends Error {}

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = localStorage.getItem('accessToken');

  const response = await fetch(`${API_URL}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    },
  });

  if (!response.ok) {
    const cuerpo = await response.json().catch(() => null);
    // class-validator puede devolver un array de mensajes (uno por campo inválido).
    const mensaje = Array.isArray(cuerpo?.message)
      ? cuerpo.message.join(' ')
      : cuerpo?.message;
    throw new ApiError(mensaje ?? `Error ${response.status} al comunicarse con el servidor.`);
  }

  const texto = await response.text();
  return texto ? (JSON.parse(texto) as T) : (undefined as T);
}

export const apiClient = {
  get: <T>(path: string) => request<T>(path),
  post: <T>(path: string, body: unknown) =>
    request<T>(path, { method: 'POST', body: JSON.stringify(body) }),
  patch: <T>(path: string, body: unknown) =>
    request<T>(path, { method: 'PATCH', body: JSON.stringify(body) }),
  delete: <T>(path: string) => request<T>(path, { method: 'DELETE' }),
};
