import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import MapaEmergencia from './MapaEmergencia';
import { DespachoEmergencia, RolEnDespacho } from '../types/despacho';
import { emojiEmergencia } from '../utils/emergencia';

function hace(fechaIso: string): string {
  const min = Math.max(0, Math.round((Date.now() - new Date(fechaIso).getTime()) / 60000));
  if (min < 1) return 'ahora';
  if (min < 60) return `hace ${min} min`;
  const h = Math.floor(min / 60);
  if (h < 24) return `hace ${h} h`;
  return new Date(fechaIso).toLocaleDateString('es-CL');
}

export default function DespachoCard({ despacho }: { despacho: DespachoEmergencia }) {
  const emoji = emojiEmergencia(despacho.tipo_emergencia);
  const coords = despacho.coordenada_destino?.coordinates;
  const tripulacion = despacho.tripulacion ?? [];
  const capitan = tripulacion.find((t) => t.rol_en_despacho === RolEnDespacho.JEFE_DESPACHO);
  const nombreCapitan = capitan?.usuario
    ? `${capitan.usuario.nombre} ${capitan.usuario.apellidos}`
    : null;

  const miembros = tripulacion
    .filter((t) => t !== capitan && t.usuario)
    .map(
      (t) =>
        `${t.usuario!.nombre} ${t.usuario!.apellidos}${
          t.rol_en_despacho === 'conductor' ? ' (conductor)' : ''
        }`,
    );

  return (
    <View style={styles.card}>
      <View>
        {coords ? (
          <MapaEmergencia latitud={coords[0]} longitud={coords[1]} emoji={emoji} />
        ) : (
          <View style={styles.sinMapa}>
            <Text style={styles.sinMapaEmoji}>{emoji}</Text>
            <Text style={styles.sinMapaTexto}>Sin ubicación registrada</Text>
          </View>
        )}
        <View style={styles.chipTipo}>
          <Text style={styles.chipTipoTexto}>
            {emoji} {despacho.tipo_emergencia}
          </Text>
        </View>
        <View style={styles.chipEstado}>
          <Text style={styles.chipEstadoTexto}>EN CURSO</Text>
        </View>
      </View>

      <View style={styles.cuerpo}>
        <Text style={styles.titulo}>
          {emoji} {despacho.tipo_emergencia}
        </Text>
        <Text style={styles.hora}>
          {new Date(despacho.fecha_hora_despacho).toLocaleString('es-CL')} ·{' '}
          {hace(despacho.fecha_hora_despacho)}
        </Text>

        <View style={styles.separador} />

        <Fila
          icono="🚒"
          etiqueta="Vehículo"
          valor={
            despacho.vehiculo
              ? `${despacho.vehiculo.patente} · ${despacho.vehiculo.marca} ${despacho.vehiculo.modelo}`
              : `#${despacho.id_vehiculo}`
          }
        />
        <Fila
          icono="🏢"
          etiqueta="Compañía"
          valor={despacho.compania?.nombre ?? `#${despacho.id_compania}`}
        />
        <Fila icono="🎖️" etiqueta="Capitán" valor={nombreCapitan ?? 'Sin asignar'} />
        <Fila
          icono="👥"
          etiqueta="Tripulación"
          valor={miembros.length > 0 ? miembros.join(', ') : 'Sin asignar'}
        />
        {despacho.grifo && (
          <Fila
            icono="💧"
            etiqueta="Grifo"
            valor={despacho.grifo.direccion ?? `Grifo #${despacho.grifo.id_grifo}`}
          />
        )}
      </View>
    </View>
  );
}

// `valor` es texto (no ReactNode) para evitar choques de tipos de React
// entre los paquetes del monorepo.
function Fila({ icono, etiqueta, valor }: { icono: string; etiqueta: string; valor: string }) {
  return (
    <View style={styles.fila}>
      <Text style={styles.filaIcono}>{icono}</Text>
      <Text style={styles.filaEtiqueta}>{etiqueta}</Text>
      <Text style={styles.filaValor} numberOfLines={4}>
        {valor}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#fff',
    borderRadius: 14,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  sinMapa: {
    height: 150,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  sinMapaEmoji: { fontSize: 40 },
  sinMapaTexto: { fontSize: 12, color: '#6B7280', marginTop: 4 },
  chipTipo: {
    position: 'absolute',
    top: 10,
    left: 10,
    backgroundColor: '#B91C1C',
    borderRadius: 14,
    paddingHorizontal: 12,
    paddingVertical: 5,
  },
  chipTipoTexto: { color: '#fff', fontWeight: '800', fontSize: 12 },
  chipEstado: {
    position: 'absolute',
    top: 10,
    right: 10,
    backgroundColor: '#fff',
    borderRadius: 14,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  chipEstadoTexto: { color: '#B91C1C', fontWeight: '800', fontSize: 11 },
  cuerpo: { padding: 16 },
  titulo: { fontSize: 18, fontWeight: '800', color: '#111827' },
  hora: { fontSize: 12, color: '#6B7280', marginTop: 2 },
  separador: { height: 1, backgroundColor: '#E5E7EB', marginVertical: 12 },
  fila: { flexDirection: 'row', alignItems: 'center', marginBottom: 6 },
  filaIcono: { width: 24, fontSize: 14 },
  filaEtiqueta: { width: 88, fontSize: 12, color: '#6B7280' },
  filaValor: { flex: 1, fontSize: 13, fontWeight: '600', color: '#1F2937' },
});
