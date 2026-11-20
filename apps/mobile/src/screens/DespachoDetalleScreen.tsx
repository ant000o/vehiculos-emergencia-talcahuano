import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../context/AuthContext';
import { useRealtime } from '../context/RealtimeContext';
import MapaEmergencia from '../components/MapaEmergencia';
import {
  DespachoEmergencia,
  EstadoEmergencia,
  RolEnDespacho,
} from '../types/despacho';
import {
  DecisionApoyo,
  finalizarDespacho,
  obtenerDespacho,
  responderApoyo,
} from '../services/despacho.service';
import { emojiEmergencia } from '../utils/emergencia';
import {
  ETIQUETA_ESTADO,
  perteneceATripulacion,
  puedeFinalizarDespacho,
} from '../utils/despachos';
import { esMecanico } from '../utils/roles';

const COLOR_ESTADO: Record<EstadoEmergencia, { fondo: string; texto: string }> = {
  [EstadoEmergencia.EN_CURSO]: { fondo: '#FEE2E2', texto: '#991B1B' },
  [EstadoEmergencia.CONTROLADA]: { fondo: '#FEF9C3', texto: '#854D0E' },
  [EstadoEmergencia.FINALIZADA]: { fondo: '#DCFCE7', texto: '#166534' },
  [EstadoEmergencia.CANCELADA]: { fondo: '#E5E7EB', texto: '#374151' },
};

const ETIQUETA_ROL: Record<string, string> = {
  [RolEnDespacho.JEFE_DESPACHO]: 'Capitán / jefe',
  [RolEnDespacho.CONDUCTOR]: 'Conductor',
  [RolEnDespacho.BRIGADISTA]: 'Brigadista',
};

export default function DespachoDetalleScreen({ route }: any) {
  const inicial: DespachoEmergencia = route.params.despacho;
  const { usuario } = useAuth();
  const { suscribir } = useRealtime();

  const [despacho, setDespacho] = useState<DespachoEmergencia>(inicial);
  const [finalizando, setFinalizando] = useState(false);
  const [enviando, setEnviando] = useState<DecisionApoyo | null>(null);
  const [decision, setDecision] = useState<DecisionApoyo | null>(null);
  const [mensaje, setMensaje] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Datos frescos del servidor. Si el usuario no pertenece a la tripulación,
  // el backend puede responder 403: en ese caso se queda con los datos del aviso.
  useEffect(() => {
    obtenerDespacho(inicial.id_despacho)
      .then(setDespacho)
      .catch(() => {});
  }, [inicial.id_despacho]);

  // Si este despacho cambia de estado (p. ej. lo finalizan), se actualiza al instante.
  useEffect(() => {
    return suscribir('despacho_actualizado', (d: DespachoEmergencia) => {
      if (d?.id_despacho === inicial.id_despacho) setDespacho(d);
    });
  }, [suscribir, inicial.id_despacho]);

  if (esMecanico(usuario?.rol)) {
    return (
      <SafeAreaView style={styles.centro} edges={['bottom']}>
        <Text style={styles.gris}>Tu perfil no tiene acceso a los despachos.</Text>
      </SafeAreaView>
    );
  }

  const emoji = emojiEmergencia(despacho.tipo_emergencia);
  const coords = despacho.coordenada_destino?.coordinates;
  const tripulacion = despacho.tripulacion ?? [];
  const enCurso = despacho.estado_emergencia === EstadoEmergencia.EN_CURSO;
  const esTripulante = perteneceATripulacion(despacho, usuario);
  const color = COLOR_ESTADO[despacho.estado_emergencia] ?? COLOR_ESTADO[EstadoEmergencia.EN_CURSO];

  function confirmarFinalizar() {
    Alert.alert(
      'Finalizar despacho',
      'Se marcará la emergencia como finalizada y se avisará a todo el personal conectado.',
      [
        { text: 'Cancelar', style: 'cancel' },
        { text: 'Finalizar', style: 'destructive', onPress: finalizar },
      ],
    );
  }

  async function finalizar() {
    setError(null);
    setMensaje(null);
    setFinalizando(true);
    try {
      const actualizado = await finalizarDespacho(despacho.id_despacho);
      setDespacho((prev) => ({ ...prev, ...actualizado }));
      setMensaje('Despacho finalizado. Se notificó al personal.');
    } catch (err: any) {
      if (err?.response?.status === 403) {
        setError('Tu perfil no tiene permiso para finalizar despachos.');
      } else {
        setError('No se pudo finalizar el despacho. Intenta nuevamente.');
      }
    } finally {
      setFinalizando(false);
    }
  }

  async function responder(d: DecisionApoyo) {
    setError(null);
    setMensaje(null);
    setEnviando(d);
    try {
      await responderApoyo(despacho.id_despacho, d);
      setDecision(d);
      setMensaje(
        d === 'voy'
          ? 'Registraste que vas a apoyar. Central fue informada.'
          : 'Registraste que no puedes asistir.',
      );
    } catch (err: any) {
      if (err?.response?.status === 404) {
        setError('El servidor aún no tiene habilitada esta función (pendiente en el backend).');
      } else {
        setError('No se pudo enviar tu respuesta. Intenta nuevamente.');
      }
    } finally {
      setEnviando(null);
    }
  }

  return (
    <SafeAreaView style={styles.safe} edges={['bottom']}>
      <ScrollView contentContainerStyle={styles.contenido}>
        {coords ? (
          <MapaEmergencia latitud={coords[0]} longitud={coords[1]} emoji={emoji} alto={220} />
        ) : (
          <View style={styles.sinMapa}>
            <Text style={{ fontSize: 44 }}>{emoji}</Text>
            <Text style={styles.gris}>Sin ubicación registrada</Text>
          </View>
        )}

        <View style={styles.card}>
          <View style={styles.encabezado}>
            <Text style={styles.titulo}>
              {emoji} {despacho.tipo_emergencia}
            </Text>
            <View style={[styles.badge, { backgroundColor: color.fondo }]}>
              <Text style={[styles.badgeTexto, { color: color.texto }]}>
                {ETIQUETA_ESTADO[despacho.estado_emergencia] ?? despacho.estado_emergencia}
              </Text>
            </View>
          </View>
          <Text style={styles.hora}>
            {new Date(despacho.fecha_hora_despacho).toLocaleString('es-CL')}
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
          {despacho.grifo && (
            <Fila
              icono="💧"
              etiqueta="Grifo"
              valor={despacho.grifo.direccion ?? `Grifo #${despacho.grifo.id_grifo}`}
            />
          )}
          {coords && (
            <Fila
              icono="📍"
              etiqueta="Ubicación"
              valor={`${Number(coords[0]).toFixed(5)}, ${Number(coords[1]).toFixed(5)}`}
            />
          )}
        </View>

        <View style={styles.card}>
          <Text style={styles.subtitulo}>Tripulación</Text>
          {tripulacion.length === 0 ? (
            <Text style={styles.gris}>Sin tripulación asignada.</Text>
          ) : (
            tripulacion.map((t) => (
              <View key={`${t.id_despacho}-${t.id_usuario}`} style={styles.tripulante}>
                <Text style={styles.tripulanteNombre}>
                  {t.usuario ? `${t.usuario.nombre} ${t.usuario.apellidos}` : `Usuario #${t.id_usuario}`}
                </Text>
                <Text style={styles.tripulanteRol}>
                  {t.rol_en_despacho ? ETIQUETA_ROL[t.rol_en_despacho] ?? t.rol_en_despacho : '—'}
                </Text>
              </View>
            ))
          )}
        </View>

        {mensaje && <Text style={styles.ok}>{mensaje}</Text>}
        {error && <Text style={styles.error}>{error}</Text>}

        {/* Bombero notificado que no está en la tripulación: decide si apoya. */}
        {enCurso && !esTripulante && (
          <View style={styles.card}>
            <Text style={styles.subtitulo}>¿Puedes apoyar en esta emergencia?</Text>
            <Text style={styles.gris}>
              Fuiste notificado pero no estás asignado. Indica si asistirás.
            </Text>
            <View style={styles.botonesFila}>
              <TouchableOpacity
                style={[
                  styles.botonVoy,
                  decision === 'voy' && styles.botonElegido,
                  !!enviando && styles.deshabilitado,
                ]}
                onPress={() => responder('voy')}
                disabled={!!enviando}
              >
                {enviando === 'voy' ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={styles.botonTexto}>
                    {decision === 'voy' ? '✔ Voy a apoyar' : 'Voy a apoyar'}
                  </Text>
                )}
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.botonNoVoy,
                  decision === 'no_voy' && styles.botonElegidoGris,
                  !!enviando && styles.deshabilitado,
                ]}
                onPress={() => responder('no_voy')}
                disabled={!!enviando}
              >
                {enviando === 'no_voy' ? (
                  <ActivityIndicator color="#374151" />
                ) : (
                  <Text style={styles.botonNoVoyTexto}>
                    {decision === 'no_voy' ? '✔ No puedo ir' : 'No puedo ir'}
                  </Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        )}

        {enCurso && puedeFinalizarDespacho(usuario) && (
          <TouchableOpacity
            style={[styles.botonFinalizar, finalizando && styles.deshabilitado]}
            onPress={confirmarFinalizar}
            disabled={finalizando}
          >
            {finalizando ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.botonTexto}>Finalizar despacho</Text>
            )}
          </TouchableOpacity>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

function Fila({ icono, etiqueta, valor }: { icono: string; etiqueta: string; valor: string }) {
  return (
    <View style={styles.fila}>
      <Text style={styles.filaIcono}>{icono}</Text>
      <Text style={styles.filaEtiqueta}>{etiqueta}</Text>
      <Text style={styles.filaValor}>{valor}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#F3F4F6' },
  centro: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#F3F4F6' },
  contenido: { paddingBottom: 40 },
  sinMapa: {
    height: 160,
    backgroundColor: '#E5E7EB',
    alignItems: 'center',
    justifyContent: 'center',
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    marginHorizontal: 14,
    marginTop: 14,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  encabezado: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  titulo: { fontSize: 20, fontWeight: '800', color: '#111827', flex: 1, marginRight: 8 },
  badge: { borderRadius: 14, paddingHorizontal: 10, paddingVertical: 5 },
  badgeTexto: { fontWeight: '800', fontSize: 11 },
  hora: { fontSize: 12, color: '#6B7280', marginTop: 4 },
  separador: { height: 1, backgroundColor: '#E5E7EB', marginVertical: 12 },
  fila: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
  filaIcono: { width: 24, fontSize: 14 },
  filaEtiqueta: { width: 88, fontSize: 12, color: '#6B7280' },
  filaValor: { flex: 1, fontSize: 13, fontWeight: '600', color: '#1F2937' },
  subtitulo: { fontSize: 15, fontWeight: '800', color: '#111827', marginBottom: 8 },
  gris: { color: '#6B7280', fontSize: 13 },
  tripulante: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 7,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  tripulanteNombre: { fontSize: 14, fontWeight: '600', color: '#1F2937', flex: 1 },
  tripulanteRol: { fontSize: 12, color: '#6B7280' },
  ok: { color: '#166534', textAlign: 'center', marginTop: 14, paddingHorizontal: 20 },
  error: { color: '#B91C1C', textAlign: 'center', marginTop: 14, paddingHorizontal: 20 },
  botonesFila: { flexDirection: 'row', gap: 10, marginTop: 14 },
  botonVoy: {
    flex: 1,
    backgroundColor: '#166534',
    borderRadius: 12,
    padding: 14,
    alignItems: 'center',
  },
  botonNoVoy: {
    flex: 1,
    backgroundColor: '#E5E7EB',
    borderRadius: 12,
    padding: 14,
    alignItems: 'center',
  },
  botonElegido: { backgroundColor: '#14532D' },
  botonElegidoGris: { backgroundColor: '#D1D5DB' },
  botonNoVoyTexto: { color: '#374151', fontWeight: '700', fontSize: 15 },
  botonFinalizar: {
    backgroundColor: '#B91C1C',
    borderRadius: 12,
    padding: 15,
    alignItems: 'center',
    marginHorizontal: 14,
    marginTop: 18,
  },
  botonTexto: { color: '#fff', fontWeight: '700', fontSize: 15 },
  deshabilitado: { opacity: 0.6 },
});