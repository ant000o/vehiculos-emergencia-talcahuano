import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { io, Socket } from 'socket.io-client';
import * as SecureStore from 'expo-secure-store';
import { useAuth } from './AuthContext';
import { esMecanico } from '../utils/roles';

// Misma clave con la que AuthContext guarda el token de sesión.
const TOKEN_KEY = 'sigev_access_token';

type Evento = 'nuevo_despacho' | 'alerta_falla_grave' | 'alerta_mantencion';

interface AlertaEntrante {
  id: number;
  emoji: string;
  titulo: string;
  detalle: string;
}

interface RealtimeValue {
  conectado: boolean;
  suscribir: (evento: Evento, fn: (payload: any) => void) => () => void;
}

const RealtimeContext = createContext<RealtimeValue>({
  conectado: false,
  suscribir: () => () => {},
});

export const useRealtime = () => useContext(RealtimeContext);

export function RealtimeProvider({ children }: { children: React.ReactNode }) {
  const { usuario } = useAuth();
  const insets = useSafeAreaInsets();
  const [conectado, setConectado] = useState(false);
  const [alerta, setAlerta] = useState<AlertaEntrante | null>(null);
  const oyentes = useRef<Record<string, Set<(p: any) => void>>>({});
  const temporizador = useRef<ReturnType<typeof setTimeout> | null>(null);
  const rol = usuario?.rol;

  const mostrar = useCallback((a: Omit<AlertaEntrante, 'id'>) => {
    setAlerta({ ...a, id: Date.now() });
    if (temporizador.current) clearTimeout(temporizador.current);
    temporizador.current = setTimeout(() => setAlerta(null), 8000);
  }, []);

  const suscribir = useCallback((evento: Evento, fn: (p: any) => void) => {
    if (!oyentes.current[evento]) oyentes.current[evento] = new Set();
    oyentes.current[evento].add(fn);
    return () => {
      oyentes.current[evento].delete(fn);
    };
  }, []);

  useEffect(() => {
    if (!usuario) {
      setConectado(false);
      return;
    }

    let socket: Socket | null = null;
    let cancelado = false;

    function avisar(evento: Evento, payload: any) {
      oyentes.current[evento]?.forEach((fn) => fn(payload));
    }

    (async () => {
      let token: string | null = null;
      try {
        token = await SecureStore.getItemAsync(TOKEN_KEY);
      } catch {
        token = null;
      }
      if (cancelado) return;

      socket = io(process.env.EXPO_PUBLIC_API_URL as string, {
        transports: ['websocket'],
        // Hoy el backend no valida el token; se envía para cuando el equipo
        // proteja el gateway (handshake.auth.token).
        auth: { token },
        reconnection: true,
      });

      socket.on('connect', () => setConectado(true));
      socket.on('disconnect', () => setConectado(false));
      socket.on('connect_error', () => setConectado(false));

      socket.on('nuevo_despacho', (d: any) => {
        avisar('nuevo_despacho', d);
        // Los mecánicos no ven despachos.
        if (!esMecanico(rol)) {
          mostrar({
            emoji: '🚨',
            titulo: 'Nuevo despacho',
            detalle: `${d?.tipo_emergencia ?? 'Emergencia'}${
              d?.vehiculo?.patente ? ` · ${d.vehiculo.patente}` : ''
            }`,
          });
        }
      });

      socket.on('alerta_falla_grave', (p: any) => {
        avisar('alerta_falla_grave', p);
        mostrar({
          emoji: '⚠️',
          titulo: 'Falla grave',
          detalle: p?.observaciones ?? 'Vehículo reportado fuera de servicio',
        });
      });

      socket.on('alerta_mantencion', (p: any) => {
        avisar('alerta_mantencion', p);
        mostrar({
          emoji: '🔧',
          titulo: 'Mantención próxima',
          detalle: p?.mensaje ?? 'Un vehículo requiere mantención',
        });
      });
    })();

    return () => {
      cancelado = true;
      socket?.disconnect();
      setConectado(false);
    };
  }, [usuario?.id_usuario, rol, mostrar]);

  return (
    <RealtimeContext.Provider value={{ conectado, suscribir }}>
      {children}
      {alerta && (
        <TouchableOpacity
          activeOpacity={0.9}
          style={[styles.banner, { top: insets.top + 8 }]}
          onPress={() => setAlerta(null)}
        >
          <Text style={styles.bannerEmoji}>{alerta.emoji}</Text>
          <View style={styles.bannerTextos}>
            <Text style={styles.bannerTitulo}>{alerta.titulo}</Text>
            <Text style={styles.bannerDetalle} numberOfLines={2}>
              {alerta.detalle}
            </Text>
          </View>
        </TouchableOpacity>
      )}
    </RealtimeContext.Provider>
  );
}

const styles = StyleSheet.create({
  banner: {
    position: 'absolute',
    left: 12,
    right: 12,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#B91C1C',
    borderRadius: 14,
    padding: 14,
    shadowColor: '#000',
    shadowOpacity: 0.25,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 3 },
    elevation: 8,
  },
  bannerEmoji: { fontSize: 26, marginRight: 12 },
  bannerTextos: { flex: 1 },
  bannerTitulo: { color: '#fff', fontWeight: '800', fontSize: 15 },
  bannerDetalle: { color: '#FEE2E2', fontSize: 13, marginTop: 2 },
});
