import React, { useEffect, useRef, useState } from 'react';
import {
  Modal,
  View,
  Text,
  Pressable,
  TouchableOpacity,
  ScrollView,
  Animated,
  Easing,
  StyleSheet,
  useWindowDimensions,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { esMecanico, puedeGestionarMantenciones } from '../utils/roles';

interface Props {
  visible: boolean;
  onClose: () => void;
  onLogout: () => void;
  onNavigate: (ruta: string) => void;
  conectado: boolean;
  despachosEnCurso: number;
  usuario: {
    nombre: string;
    apellidos: string;
    email: string;
    rol: string;
    compania: string;
  } | null;
}

interface ItemMenu {
  icono: string;
  etiqueta: string;
  ruta: string;
  insignia?: number;
  visible: boolean;
}

function capitalizar(t: string) {
  return t ? t.charAt(0).toUpperCase() + t.slice(1) : t;
}

export default function MenuAjustes({
  visible,
  onClose,
  onLogout,
  onNavigate,
  conectado,
  despachosEnCurso,
  usuario,
}: Props) {
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const anchoPanel = Math.round(width * 0.78);

  // `montado` mantiene el Modal abierto mientras corre la animación de salida.
  const [montado, setMontado] = useState(visible);
  const deslizar = useRef(new Animated.Value(0)).current; // 0 = fuera, 1 = dentro

  useEffect(() => {
    if (visible) {
      setMontado(true);
      Animated.timing(deslizar, {
        toValue: 1,
        duration: 260,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }).start();
    } else if (montado) {
      Animated.timing(deslizar, {
        toValue: 0,
        duration: 200,
        easing: Easing.in(Easing.cubic),
        useNativeDriver: true,
      }).start(() => setMontado(false));
    }
  }, [visible]);

  const rol = usuario?.rol;
  const mecanico = esMecanico(rol);
  const iniciales = usuario
    ? `${usuario.nombre?.[0] ?? ''}${usuario.apellidos?.[0] ?? ''}`.toUpperCase()
    : '';

  const items: ItemMenu[] = [
    { icono: '🚨', etiqueta: 'Despachos', ruta: 'DespachosList', insignia: despachosEnCurso, visible: !mecanico },
    { icono: '🚒', etiqueta: 'Vehículos', ruta: 'VehiculosList', visible: true },
    { icono: '🔧', etiqueta: 'Mantenciones', ruta: 'MantencionesList', visible: puedeGestionarMantenciones(rol) },
    { icono: '💧', etiqueta: 'Grifos', ruta: 'GrifosList', visible: !mecanico },
    { icono: '👥', etiqueta: 'Personal', ruta: 'UsuariosList', visible: !mecanico },
  ].filter((i) => i.visible);


  function ir(ruta: string) {
    onClose();
    // Pequeña espera para que el panel empiece a cerrarse antes de navegar.
    setTimeout(() => onNavigate(ruta), 120);
  }

  const trasladar = deslizar.interpolate({ inputRange: [0, 1], outputRange: [anchoPanel, 0] });

  return (
    <Modal visible={montado} transparent animationType="none" onRequestClose={onClose} statusBarTranslucent>
      <View style={styles.raiz}>
        <Animated.View style={[styles.fondo, { opacity: deslizar }]}>
          <Pressable style={styles.cierreFondo} onPress={onClose} />
        </Animated.View>

        <Animated.View
          style={[
            styles.panel,
            {
              width: anchoPanel,
              paddingTop: insets.top + 12,
              paddingBottom: insets.bottom + 16,
              transform: [{ translateX: trasladar }],
            },
          ]}
        >
          <View style={styles.cabecera}>
            <View style={styles.avatar}>
              <Text style={styles.avatarTexto}>{iniciales || '?'}</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.nombre} numberOfLines={1}>
                {usuario?.nombre} {usuario?.apellidos}
              </Text>
              <Text style={styles.rol}>{capitalizar(rol ?? '')}</Text>
            </View>
            <TouchableOpacity onPress={onClose} hitSlop={14} style={styles.cerrar}>
              <Text style={styles.cerrarTexto}>✕</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.infoCompania}>
            <Text style={styles.infoCompaniaTexto} numberOfLines={2}>
              {usuario?.compania}
            </Text>
            <Text style={[styles.estadoConexion, { color: conectado ? '#166534' : '#6B7280' }]}>
              {conectado ? '● En línea' : '○ Sin conexión en vivo'}
            </Text>
          </View>

          <ScrollView style={{ flex: 1 }} showsVerticalScrollIndicator={false}>
            {items.map((item, idx) => (
              <TouchableOpacity
                key={item.ruta}
                style={[styles.item, idx < items.length - 1 && styles.itemSeparador]}
                onPress={() => ir(item.ruta)}
                activeOpacity={0.6}
              >
                <View style={styles.iconoCaja}>
                  <Text style={styles.icono}>{item.icono}</Text>
                </View>
                <Text style={styles.etiqueta}>{item.etiqueta}</Text>
                {item.insignia ? (
                  <View style={styles.insignia}>
                    <Text style={styles.insigniaTexto}>{item.insignia}</Text>
                  </View>
                ) : null}
              </TouchableOpacity>
            ))}
          </ScrollView>

          <TouchableOpacity style={styles.salir} onPress={onLogout} activeOpacity={0.7}>
            <View style={[styles.iconoCaja, styles.iconoCajaSalir]}>
              <Text style={styles.icono}>🚪</Text>
            </View>
            <Text style={styles.etiquetaSalir}>Cerrar sesión</Text>
          </TouchableOpacity>
        </Animated.View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  raiz: { flex: 1, flexDirection: 'row', justifyContent: 'flex-end' },
  fondo: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(17,24,39,0.5)' },
  cierreFondo: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 },
  panel: {
    backgroundColor: '#F9FAFB',
    borderTopLeftRadius: 28,
    borderBottomLeftRadius: 28,
    paddingHorizontal: 22,
    shadowColor: '#000',
    shadowOpacity: 0.25,
    shadowRadius: 14,
    elevation: 16,
  },
  cabecera: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  avatar: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: '#B91C1C',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarTexto: { color: '#fff', fontSize: 19, fontWeight: '800' },
  nombre: { fontSize: 16, fontWeight: '800', color: '#111827' },
  rol: { fontSize: 13, color: '#B91C1C', fontWeight: '700', marginTop: 1 },
  cerrar: { padding: 4 },
  cerrarTexto: { fontSize: 22, color: '#6B7280', fontWeight: '700' },
  infoCompania: {
    marginTop: 14,
    marginBottom: 10,
    paddingVertical: 10,
    paddingHorizontal: 12,
    backgroundColor: '#FEF2F2',
    borderRadius: 12,
  },
  infoCompaniaTexto: { fontSize: 13, fontWeight: '700', color: '#7F1D1D' },
  estadoConexion: { fontSize: 12, fontWeight: '700', marginTop: 4 },
  item: { flexDirection: 'row', alignItems: 'center', gap: 16, paddingVertical: 20 },
  itemSeparador: { borderBottomWidth: 1, borderBottomColor: '#E5E7EB' },
  iconoCaja: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: '#FEE2E2',
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconoCajaSalir: { backgroundColor: '#E5E7EB' },
  icono: { fontSize: 20 },
  etiqueta: { flex: 1, fontSize: 18, fontWeight: '800', color: '#B91C1C' },
  insignia: {
    minWidth: 26,
    height: 26,
    borderRadius: 13,
    paddingHorizontal: 7,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#B91C1C',
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 3,
  },
  insigniaTexto: { color: '#B91C1C', fontWeight: '800', fontSize: 13 },
  salir: { flexDirection: 'row', alignItems: 'center', gap: 16, paddingTop: 14 },
  etiquetaSalir: { fontSize: 18, fontWeight: '800', color: '#374151' },
});
