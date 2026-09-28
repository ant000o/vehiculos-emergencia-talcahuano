import React, { useCallback, useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { Vehiculo, EstadoVehiculo } from '../types/vehiculo';
import { RegistroOperatividad } from '../types/registroOperatividad';
import { obtenerUltimoRegistroDeVehiculo } from '../services/registroOperatividad.service';

const ESTADO_LABEL: Record<EstadoVehiculo, string> = {
  [EstadoVehiculo.OPERATIVO]: 'Operativo',
  [EstadoVehiculo.EN_MANTENCION]: 'En mantención',
  [EstadoVehiculo.FUERA_DE_SERVICIO]: 'Fuera de servicio',
};

const ESTADO_COLOR: Record<EstadoVehiculo, { bg: string; texto: string }> = {
  [EstadoVehiculo.OPERATIVO]: { bg: '#DCFCE7', texto: '#166534' },
  [EstadoVehiculo.EN_MANTENCION]: { bg: '#FEF9C3', texto: '#854D0E' },
  [EstadoVehiculo.FUERA_DE_SERVICIO]: { bg: '#FEE2E2', texto: '#991B1B' },
};

// Barra simple de nivel (0-100), sin librerías externas.
function BarraNivel({ label, valor }: { label: string; valor: number | null }) {
  const porcentaje = valor ?? 0;
  const color = porcentaje < 20 ? '#DC2626' : porcentaje < 50 ? '#D97706' : '#16A34A';

  return (
    <View style={styles.nivelFila}>
      <View style={styles.nivelHeader}>
        <Text style={styles.nivelLabel}>{label}</Text>
        <Text style={styles.nivelValor}>{valor === null ? 'Sin datos' : `${valor}%`}</Text>
      </View>
      <View style={styles.nivelTrack}>
        <View style={[styles.nivelFill, { width: `${porcentaje}%`, backgroundColor: color }]} />
      </View>
    </View>
  );
}

export default function VehiculoDetalleScreen({ route, navigation }: any) {
  const vehiculo: Vehiculo = route.params.vehiculo;

  const [ultimoRegistro, setUltimoRegistro] = useState<RegistroOperatividad | null>(null);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState<string | null>(null);

  React.useEffect(() => {
    navigation.setOptions({ title: vehiculo.patente });
  }, []);

  useFocusEffect(
    useCallback(() => {
      let activo = true;
      setCargando(true);
      obtenerUltimoRegistroDeVehiculo(vehiculo.id_vehiculo)
        .then((registro) => {
          if (activo) {
            setUltimoRegistro(registro);
            setError(null);
          }
        })
        .catch(() => {
          if (activo) setError('No se pudo cargar el último registro de operatividad.');
        })
        .finally(() => {
          if (activo) setCargando(false);
        });
      return () => {
        activo = false;
      };
    }, [vehiculo.id_vehiculo]),
  );

  const colores = ESTADO_COLOR[vehiculo.estado_operativo];

  return (
    <SafeAreaView style={styles.safeArea} edges={['bottom']}>
      <ScrollView style={styles.container} contentContainerStyle={styles.contenido}>
        <Text style={styles.patente}>{vehiculo.patente}</Text>
        <Text style={styles.subtitulo}>
          {vehiculo.marca} {vehiculo.modelo} — {vehiculo.anio}
        </Text>

        <View style={[styles.badge, { backgroundColor: colores.bg }]}>
          <Text style={[styles.badgeTexto, { color: colores.texto }]}>
            {ESTADO_LABEL[vehiculo.estado_operativo]}
          </Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitulo}>Información resumida del vehículo</Text>
          <Text style={styles.cardSubtitulo}>
            {ultimoRegistro
              ? `Último registro: ${new Date(ultimoRegistro.fecha_hora_registro).toLocaleString('es-CL')}`
              : 'Aún no hay registros de operatividad para este vehículo.'}
          </Text>

          {cargando ? (
            <ActivityIndicator color="#B91C1C" style={{ marginVertical: 12 }} />
          ) : error ? (
            <Text style={styles.error}>{error}</Text>
          ) : (
            <>
              <BarraNivel label="Combustible" valor={ultimoRegistro?.nivel_combustible ?? null} />
              <BarraNivel label="Agua" valor={ultimoRegistro?.nivel_agua ?? null} />
              <BarraNivel label="Aceite" valor={ultimoRegistro?.nivel_aceite ?? null} />

              {ultimoRegistro?.observaciones ? (
                <View style={styles.observacionesBox}>
                  <Text style={styles.observacionesLabel}>Observaciones</Text>
                  <Text style={styles.observacionesTexto}>{ultimoRegistro.observaciones}</Text>
                </View>
              ) : null}
            </>
          )}
        </View>

        <TouchableOpacity
          style={styles.botonSecundario}
          onPress={() => navigation.navigate('MantencionesList', { vehiculo })}
        >
          <Text style={styles.botonSecundarioTexto}>Ver historial de mantenciones</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.boton}
          onPress={() => navigation.navigate('RegistroOperatividadForm', { vehiculo })}
        >
          <Text style={styles.botonTexto}>Registrar revisión</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#fff' },
  container: { flex: 1 },
  contenido: { padding: 20, paddingBottom: 40 },
  patente: { fontSize: 28, fontWeight: '800' },
  subtitulo: { fontSize: 14, color: '#666', marginTop: 2, marginBottom: 12 },
  badge: { alignSelf: 'flex-start', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 14, marginBottom: 20 },
  badgeTexto: { fontSize: 13, fontWeight: '700' },
  card: { backgroundColor: '#F3F4F6', borderRadius: 12, padding: 16, marginBottom: 20 },
  cardTitulo: { fontSize: 15, fontWeight: '700', marginBottom: 2 },
  cardSubtitulo: { fontSize: 12, color: '#666', marginBottom: 12 },
  error: { color: '#B91C1C', textAlign: 'center', marginVertical: 8 },
  nivelFila: { marginBottom: 14 },
  nivelHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 },
  nivelLabel: { fontSize: 13, fontWeight: '600', color: '#333' },
  nivelValor: { fontSize: 13, color: '#666' },
  nivelTrack: { height: 8, backgroundColor: '#E5E7EB', borderRadius: 4, overflow: 'hidden' },
  nivelFill: { height: '100%', borderRadius: 4 },
  observacionesBox: { marginTop: 8, paddingTop: 12, borderTopWidth: 1, borderTopColor: '#E5E7EB' },
  observacionesLabel: { fontSize: 12, fontWeight: '600', color: '#333', marginBottom: 4 },
  observacionesTexto: { fontSize: 13, color: '#444' },
  boton: { backgroundColor: '#B91C1C', borderRadius: 8, padding: 14, alignItems: 'center' },
  botonTexto: { color: '#fff', fontSize: 16, fontWeight: '600' },
  botonSecundario: {
    borderWidth: 1,
    borderColor: '#B91C1C',
    borderRadius: 8,
    padding: 14,
    alignItems: 'center',
    marginBottom: 12,
  },
  botonSecundarioTexto: { color: '#B91C1C', fontSize: 15, fontWeight: '600' },
});
