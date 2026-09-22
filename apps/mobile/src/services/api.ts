import axios from 'axios';
import * as SecureStore from 'expo-secure-store';

const TOKEN_KEY = 'sigev_access_token';

export const api = axios.create({
  baseURL: process.env.EXPO_PUBLIC_API_URL,
  timeout: 10000,
});

// Agrega el token guardado a cada request saliente, si existe.
api.interceptors.request.use(async (config) => {
  const token = await SecureStore.getItemAsync(TOKEN_KEY);
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Helpers para guardar/leer/borrar el token en el almacenamiento seguro del dispositivo.
export async function saveToken(token: string) {
  await SecureStore.setItemAsync(TOKEN_KEY, token);
}

export async function getToken() {
  return SecureStore.getItemAsync(TOKEN_KEY);
}

export async function clearToken() {
  await SecureStore.deleteItemAsync(TOKEN_KEY);
}

// Si el backend responde 401, el token ya no es válido (venció o fue revocado).
// Lo limpiamos acá para que la próxima pantalla sepa que debe pedir login de nuevo.
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      await clearToken();
    }
    return Promise.reject(error);
  },
);