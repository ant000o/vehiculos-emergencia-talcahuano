# App móvil — Instrucciones de inicialización

Se recomienda **Expo** (managed workflow) en vez de React Native CLI puro, por tres razones concretas para este proyecto:

1. No requiere configurar Android Studio / Xcode para empezar a desarrollar — se prueba directo en el celular con la app **Expo Go**.
2. El módulo `expo-location` cubre la necesidad de georreferenciación (Sprint 3) sin configuración nativa adicional.
3. Si más adelante se necesita un módulo nativo que Expo no soporte, se puede migrar a "bare workflow" (`npx expo prebuild`) sin rehacer el proyecto desde cero.

> Si el equipo prefiere React Native CLI puro, avísenme y ajustamos esta carpeta — la decisión no es difícil de revertir ahora, sí lo es más adelante.

## Inicializar el proyecto (ejecutar una sola vez, quien lo inicialice comitea el resultado)

Desde la raíz del repositorio:

```bash
cd apps
npx create-expo-app@latest mobile --template expo-template-blank-typescript
cd mobile
npm install axios @react-navigation/native @react-navigation/native-stack
npx expo install react-native-screens react-native-safe-area-context expo-location
```

Esto reemplazará este `README.md` temporal por la estructura real del proyecto Expo (que trae su propio README) — vuelve a copiar las notas de esta sección a un `NOTES.md` si quieres conservarlas.

## Desarrollo diario

```bash
cd apps/mobile
npm install
npx expo start
```

Escanear el QR con la app **Expo Go** (Android/iOS) o correr en emulador con `npx expo start --android` / `--ios`.

## Variables de entorno

Crear `apps/mobile/.env` (no se sube al repo) basado en `.env.example`, con la URL del backend:

```
EXPO_PUBLIC_API_URL=http://localhost:3000
```

> Nota: si prueban en un celular físico conectado a Expo Go, `localhost` no apunta al computador — usar la IP local de la red (ej. `192.168.1.x`) o `ngrok`.
