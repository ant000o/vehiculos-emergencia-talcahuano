import React, { useCallback, useEffect, useState } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { obtenerMantencion } from '../services/mantencion.service';
import { Mantencion, TipoMantencion, EstadoMantencion } from '../types/mantencion';
import { Vehiculo } from '../types/vehiculo';

const TIPO_LABEL: Record<TipoMantencion, string> = {
  [TipoMantencion.PREVENTIVA]: 'Preventiva',
  [TipoMantencion.CORRECTIVA]: 'Correctiva (reactiva)',
  [TipoMantencion.REVISION]: 'Revisión',
};

const ESTADO_LABEL: Record<EstadoMantencion, string> = {
  [EstadoMantencion.PENDIENTE]: 'Pendiente',
  [EstadoMantencion.EN_PROCESO]: 'En proceso',
  [EstadoMantencion.FINALIZADA]: 'Finalizada',
  [EstadoMantencion.CANCELADA]: 'Cancelada',
};

export default function MantencionDetalleScreen({ route, navigation }: any) {
  const vehiculo: Vehiculo = route.params.vehiculo;
  const mantencionInicial: Mantencion = route.params.mantencion;

  const [mantencion, setMantencion] = useState<Mantencion>(mantencionInicial);
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    navigation.setOptions({
      title: TIPO_LABEL[mantencion.tipo_mantencion],
      headerRight: () => (
        <TouchableOpacity
          style={styles.headerBoton}
          onPress={() => navigation.navigate('RepuestoForm', { mantencion })}
        >
          <Text style={styles.headerBotonTexto}>+ Repuesto</Text>
        </TouchableOpacity>
      ),
    });
  }, [mantencion]);

  // Recarga la mantención completa (con sus repuestos) cada vez que la pantalla
  // recibe foco -- importante al volver desde RepuestoForm tras agregar uno.
  useFocusEffect(
    useCallback(() => {
      let activo = true;
      setCargando(true);
      obtenerMantencion(mantencionInicial.id_mantencion)
        .then((data) => {
          if (activo) {
            setMantencion(data);
            setError(null);
          }
        })
        .catch(() => {
          if (activo) setError('No se pudo actualizar el detalle de la mantención.');
        })
        .finally(() => {
          if (activo) setCargando(false);
        });
      return () => {
        activo = false;
      };
    }, [mantencionInicial.id_mantencion]),
  );

  const costoRepuestos = (mantencion.detalles_articulos ?? []).reduce(
    (total, d) => total + d.cantidad * Number(d.costo_unitario_historico),
    0,
  );
  const costoTotal = costoRepuestos + Number(mantencion.costo_mano_obra ?? 0);

  return (
    <SafeAreaView style={styles.safeArea} edges={['bottom']}>
      <View style={styles.header}>
        <Text style={styles.estado}>{ESTADO_LABEL[mantencion.estado_mantencion]}</Text>
        <Text style={styles.fecha}>
          Ingreso: {new Date(mantencion.fecha_ingreso).toLocaleDateString('es-CL')}
        </Text>
        {mantencion.descripcion_falla ? (
          <Text style={styles.descripcion}>{mantencion.descripcion_falla}</Text>
        ) : null}
        {mantencion.usuarioMecanico ? (
          <Text style={styles.mecanico}>
            Mecánico: {mantencion.usuarioMecanico.nombre} {mantencion.usuarioMecanico.apellidos}
          </Text>
        ) : mantencion.taller_externo ? (
          <Text style={styles.mecanico}>Taller externo: {mantencion.taller_externo}</Text>
        ) : null}
      </View>

      {error && <Text style={styles.error}>{error}</Text>}

      <Text style={styles.seccionTitulo}>Repuestos utilizados</Text>

      <FlatList
        data={mantencion.detalles_articulos ?? []}
        keyExtractor={(item) => String(item.id_detalle)}
        contentContainerStyle={
          (mantencion.detalles_articulos ?? []).length === 0 && styles.listaVacia
        }
        ListEmptyComponent={
          cargando ? (
            <ActivityIndicator color="#B91C1C" style={{ marginTop: 12 }} />
          ) : (
            <Text style={styles.vacioTexto}>Aún no se han registrado repuestos.</Text>
          )
        }
        renderItem={({ item }) => (
          <View style={styles.repuestoCard}>
            <View style={styles.repuestoInfo}>
              <Text style={styles.repuestoNombre}>{item.articulo.nombre_articulo}</Text>
              <Text style={styles.repuestoDetalle}>
                {item.cantidad} × ${Number(item.costo_unitario_historico).toLocaleString('es-CL')}
              </Text>
            </View>
            <Text style={styles.repuestoSubtotal}>
              ${(item.cantidad * Number(item.costo_unitario_historico)).toLocaleString('es-CL')}
            </Text>
          </View>
        )}
      />

      <View style={styles.footer}>
        <Text style={styles.footerLabel}>Costo total (mano de obra + repuestos)</Text>
        <Text style={styles.footerTotal}>${costoTotal.toLocaleString('es-CL')}</Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#fff' },
  header: { padding: 20, borderBottomWidth: 1, borderBottomColor: '#eee' },
  estado: { fontSize: 13, fontWeight: '700', color: '#B91C1C' },
  fecha: { fontSize: 13, color: '#666', marginTop: 4 },
  descripcion: { fontSize: 14, color: '#333', marginTop: 8 },
  mecanico: { fontSize: 13, color: '#666', marginTop: 6 },
  error: { color: '#B91C1C', textAlign: 'center', padding: 12 },
  seccionTitulo: { fontSize: 14, fontWeight: '700', paddingHorizontal: 20, paddingTop: 16, paddingBottom: 8 },
  listaVacia: { flex: 1, justifyContent: 'center' },
  vacioTexto: { textAlign: 'center', color: '#666' },
  repuestoCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  repuestoInfo: { flex: 1 },
  repuestoNombre: { fontSize: 14, fontWeight: '600' },
  repuestoDetalle: { fontSize: 12, color: '#666', marginTop: 2 },
  repuestoSubtotal: { fontSize: 14, fontWeight: '700' },
  footer: {
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: '#eee',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  footerLabel: { fontSize: 13, color: '#666', flex: 1 },
  footerTotal: { fontSize: 18, fontWeight: '800' },
  headerBoton: {
    backgroundColor: '#B91C1C',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    marginRight: 4,
  },
  headerBotonTexto: { color: '#fff', fontWeight: '600', fontSize: 14 },
});
