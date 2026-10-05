import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ActivityIndicator, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { actualizarEstadoGrifo } from '../services/grifo.service';
import { Grifo, EstadoGrifo } from '../types/grifo';

const OPCIONES_ESTADO: { valor: EstadoGrifo; label: string }[] = [
  { valor: EstadoGrifo.OPERATIVO, label: 'Operativo' },
  { valor: EstadoGrifo.EN_MANTENCION, label: 'En mantención' },
  { valor: EstadoGrifo.FUERA_DE_SERVICIO, label: 'Fuera de servicio' },
];

export default function GrifoDetalleScreen({ route, navigation }: any) {
  const grifoInicial: Grifo = route.params.grifo;

  const [grifo, setGrifo] = useState<Grifo>(grifoInicial);
  const [estadoSeleccionado, setEstadoSeleccionado] = useState<EstadoGrifo>(grifoInicial.estado_operativo);
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [exito, setExito] = useState(false);

  useEffect(() => {
    navigation.setOptions({ title: grifo.direccion ?? `Grifo #${grifo.id_grifo}` });
  }, [grifo]);

  const huboCambio = estadoSeleccionado !== grifo.estado_operativo;

  async function handleActualizar() {
    setError(null);
    setExito(false);
    setGuardando(true);
    try {
      const hoy = new Date().toISOString().slice(0, 10); // YYYY-MM-DD
      const actualizado = await actualizarEstadoGrifo(grifo.id_grifo, {
        estado_operativo: estadoSeleccionado,
        ultima_revision: hoy,
      });
      setGrifo(actualizado);
      setExito(true);
    } catch (err: any) {
      const mensaje = err?.response?.data?.message ?? 'No se pudo actualizar el estado del grifo.';
      setError(Array.isArray(mensaje) ? mensaje.join('\n') : mensaje);
    } finally {
      setGuardando(false);
    }
  }

  return (
    <SafeAreaView style={styles.safeArea} edges={['bottom']}>
      <ScrollView style={styles.container} contentContainerStyle={styles.contenido}>
        <View style={styles.card}>
          <Text style={styles.cardTitulo}>{grifo.direccion ?? `Grifo #${grifo.id_grifo}`}</Text>
          <Text style={styles.compania}>{grifo.compania.nombre}</Text>
          <Text style={styles.revision}>
            {grifo.ultima_revision
              ? `Última revisión: ${new Date(grifo.ultima_revision).toLocaleDateString('es-CL')}`
              : 'Sin revisiones registradas todavía.'}
          </Text>
        </View>

        {error && <Text style={styles.error}>{error}</Text>}
        {exito && <Text style={styles.exito}>Estado actualizado correctamente.</Text>}

        <View style={styles.card}>
          <Text style={styles.cardTitulo}>Estado del grifo</Text>
          <View style={styles.opciones}>
            {OPCIONES_ESTADO.map((op) => {
              const seleccionado = estadoSeleccionado === op.valor;
              return (
                <TouchableOpacity
                  key={op.valor}
                  style={[styles.opcionCard, seleccionado && styles.opcionCardSeleccionada]}
                  onPress={() => {
                    setEstadoSeleccionado(op.valor);
                    setExito(false);
                  }}
                >
                  <Text style={[styles.opcionLabel, seleccionado && styles.opcionLabelSeleccionado]}>
                    {op.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        <TouchableOpacity
          style={[
            styles.boton,
            (!huboCambio || guardando) && styles.botonDeshabilitado,
          ]}
          onPress={handleActualizar}
          disabled={!huboCambio || guardando}
        >
          {guardando ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.botonTexto}>Actualizar estado</Text>
          )}
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#fff' },
  container: { flex: 1, backgroundColor: '#F3F4F6' },
  contenido: { padding: 16, paddingBottom: 40 },
  card: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 18,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  cardTitulo: { fontSize: 16, fontWeight: '700', color: '#111827' },
  compania: { fontSize: 13, color: '#6B7280', marginTop: 4 },
  revision: { fontSize: 13, color: '#6B7280', marginTop: 8 },
  error: { color: '#B91C1C', marginBottom: 12, textAlign: 'center' },
  exito: { color: '#166534', marginBottom: 12, textAlign: 'center', fontWeight: '600' },
  opciones: { gap: 10, marginTop: 4 },
  opcionCard: {
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 10,
    padding: 14,
  },
  opcionCardSeleccionada: { borderColor: '#B91C1C', backgroundColor: '#FEF2F2' },
  opcionLabel: { fontSize: 15, fontWeight: '600', color: '#333' },
  opcionLabelSeleccionado: { color: '#B91C1C' },
  boton: {
    backgroundColor: '#B91C1C',
    borderRadius: 12,
    padding: 15,
    alignItems: 'center',
    marginTop: 4,
  },
  botonDeshabilitado: { opacity: 0.5 },
  botonTexto: { color: '#fff', fontSize: 16, fontWeight: '700' },
});
