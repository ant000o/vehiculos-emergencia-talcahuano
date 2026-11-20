import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { esMecanico, puedeVerMantenciones } from '../utils/roles';

interface Props {
  rol: string | undefined | null;
  rutaActual: string | undefined;
  onSeleccionar: (ruta: string) => void;
}

interface Pestana {
  ruta: string;
  icono: string;
  etiqueta: string;
  visible: boolean;
}

// Pantallas "raíz" donde se muestra la barra. En detalles y formularios se oculta.
export const RUTAS_CON_BARRA = [
  'Home',
  'DespachosList',
  'VehiculosList',
  'MantencionesList',
  'GrifosList',
  'UsuariosList',
];

export default function BarraInferior({ rol, rutaActual, onSeleccionar }: Props) {
  const insets = useSafeAreaInsets();
  const mecanico = esMecanico(rol);

  const pestanas: Pestana[] = [
    { ruta: 'Home', icono: '🏠', etiqueta: 'Inicio', visible: true },
    { ruta: 'DespachosList', icono: '🚨', etiqueta: 'Despachos', visible: !mecanico },
    { ruta: 'VehiculosList', icono: '🚒', etiqueta: 'Vehículos', visible: true },
    { ruta: 'MantencionesList', icono: '🔧', etiqueta: 'Mantención', visible: puedeVerMantenciones(rol) },
    { ruta: 'GrifosList', icono: '💧', etiqueta: 'Grifos', visible: !mecanico },
  ].filter((p) => p.visible);

  return (
    <View style={[styles.barra, { paddingBottom: insets.bottom + 6 }]}>
      {pestanas.map((p) => {
        const activa = rutaActual === p.ruta;
        return (
          <TouchableOpacity
            key={p.ruta}
            style={styles.pestana}
            onPress={() => onSeleccionar(p.ruta)}
            activeOpacity={0.7}
          >
            <View style={[styles.iconoCaja, activa && styles.iconoCajaActiva]}>
              <Text style={styles.icono}>{p.icono}</Text>
            </View>
            <Text style={[styles.etiqueta, activa && styles.etiquetaActiva]} numberOfLines={1}>
              {p.etiqueta}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  barra: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    paddingTop: 8,
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: -2 },
    elevation: 12,
  },
  pestana: { flex: 1, alignItems: 'center' },
  iconoCaja: {
    width: 52,
    height: 30,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconoCajaActiva: { backgroundColor: '#FEE2E2' },
  icono: { fontSize: 20 },
  etiqueta: { fontSize: 11, fontWeight: '600', color: '#6B7280', marginTop: 2 },
  etiquetaActiva: { color: '#B91C1C', fontWeight: '800' },
});
