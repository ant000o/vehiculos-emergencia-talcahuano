import React, { useCallback, useEffect, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { useAuth } from '../context/AuthContext';
import { useRealtime } from '../context/RealtimeContext';
import { listarDespachosEnCurso } from '../services/despacho.service';
import { DespachoEmergencia } from '../types/despacho';
import DespachoCard from '../components/DespachoCard';
import { esMecanico } from '../utils/roles';
import { obtenerDashboard, obtenerAlertasMantencion } from '../services/estadisticas.service';
import { DashboardEstadisticas, AlertaMantencion, ConteoPorEstado } from '../types/estadisticas';

interface CardDef {
  titulo: string;
  descripcion: string;
  emoji: string;
  ruta: string;
  disponible: boolean;
  ocultoMecanico?: boolean;
}

function total(lista: ConteoPorEstado[] | undefined, ...estados: string[]): number {
  if (!lista) return 0;
  return lista
    .filter((i) => estados.includes(i.estado))
    .reduce((acc, i) => acc + Number(i.total), 0);
}

interface StatDef {
  valor: number | string;
  etiqueta: string;
  color: string;
  fondo: string;
  ruta?: string;
}

const CARDS: CardDef[] = [
  {
    titulo: 'Despachos',
    descripcion: 'Emergencias en curso',
    emoji: '🚨',
    ruta: 'DespachosList',
    disponible: true,
    ocultoMecanico: true,
  },
  {
    titulo: 'Vehículos',
    descripcion: 'Estado operativo y revisión diaria',
    emoji: '🚒',
    ruta: 'VehiculosList',
    disponible: true,
  },
  {
    titulo: 'Mantenciones',
    descripcion: 'Historial y registro de mantenciones',
    emoji: '🔧',
    ruta: 'MantencionesList',
    disponible: false,
  },
  {
    titulo: 'Grifos',
    descripcion: 'Marcar estado de disponibilidad',
    emoji: '💧',
    ruta: 'GrifosList',
    disponible: true,
    ocultoMecanico: true,
  },
  {
    titulo: 'Personal',
    descripcion: 'Ver y gestionar cuentas de usuario',
    emoji: '👥',
    ruta: 'UsuariosList',
    disponible: true,
    ocultoMecanico: true,
  },
];

export default function HomeScreen({ navigation }: any) {
  const { usuario, logout } = useAuth();
  const [dashboard, setDashboard] = useState<DashboardEstadisticas | null>(null);
  const [alertas, setAlertas] = useState<AlertaMantencion[] | null>(null);
  const [refrescando, setRefrescando] = useState(false);
  const [despachos, setDespachos] = useState<DespachoEmergencia[]>([]);
  const { conectado, suscribir } = useRealtime();
  const mecanico = esMecanico(usuario?.rol);

  // Si una de las dos consultas falla, la otra igual se muestra (allSettled).
  async function cargarResumen() {
    const [d, a, desp] = await Promise.allSettled([
      obtenerDashboard(),
      obtenerAlertasMantencion(),
      mecanico ? Promise.resolve([] as DespachoEmergencia[]) : listarDespachosEnCurso(),
    ]);
    setDespachos(desp.status === 'fulfilled' ? desp.value : []);
    setDashboard(d.status === 'fulfilled' ? d.value : null);
    setAlertas(a.status === 'fulfilled' ? a.value : null);
  }

  useFocusEffect(
    useCallback(() => {
      cargarResumen();
    }, []),
  );

  // Si llega un despacho nuevo en vivo, se refresca el resumen del inicio.
  useEffect(() => {
    if (mecanico) return;
    return suscribir('nuevo_despacho', () => {
      cargarResumen();
    });
  }, [suscribir, mecanico]);

  async function onRefresh() {
    setRefrescando(true);
    await cargarResumen();
    setRefrescando(false);
  }

  const criticas = alertas?.filter((x) => x.nivel_alerta === 'critica').length ?? 0;
  const sinDatos = '–';

  const statsFlota: StatDef[] = [
    {
      valor: dashboard ? total(dashboard.flota, 'operativo') : sinDatos,
      etiqueta: 'Operativos',
      color: '#166534',
      fondo: '#DCFCE7',
      ruta: 'VehiculosList',
    },
    {
      valor: dashboard ? total(dashboard.flota, 'en_mantencion') : sinDatos,
      etiqueta: 'En mantención',
      color: '#854D0E',
      fondo: '#FEF9C3',
      ruta: 'VehiculosList',
    },
    {
      valor: dashboard ? total(dashboard.flota, 'fuera_de_servicio') : sinDatos,
      etiqueta: 'Fuera de servicio',
      color: '#991B1B',
      fondo: '#FEE2E2',
      ruta: 'VehiculosList',
    },
  ];

  const statsOtros: StatDef[] = [
    {
      valor: dashboard ? total(dashboard.mantenciones, 'pendiente', 'en_proceso') : sinDatos,
      etiqueta: 'Mantenciones activas',
      color: '#1E40AF',
      fondo: '#DBEAFE',
    },
    {
      valor: alertas ? alertas.length : sinDatos,
      etiqueta: alertas && criticas > 0 ? `Alertas (${criticas} críticas)` : 'Alertas de mantención',
      color: '#9A3412',
      fondo: '#FFEDD5',
    },
    {
      valor: dashboard ? dashboard.inventario?.articulos_bajo_stock ?? 0 : sinDatos,
      etiqueta: 'Repuestos con poco stock',
      color: '#374151',
      fondo: '#E5E7EB',
    },
  ];

  function Tile({ s }: { s: StatDef }) {
    const contenido = (
      <>
        <Text style={[styles.statValor, { color: s.color }]}>{s.valor}</Text>
        <Text style={[styles.statEtiqueta, { color: s.color }]} numberOfLines={2}>
          {s.etiqueta}
        </Text>
      </>
    );
    return s.ruta ? (
      <TouchableOpacity
        style={[styles.stat, { backgroundColor: s.fondo }]}
        onPress={() => navigation.navigate(s.ruta!)}
      >
        {contenido}
      </TouchableOpacity>
    ) : (
      <View style={[styles.stat, { backgroundColor: s.fondo }]}>{contenido}</View>
    );
  }

  function abrirMenu() {
    Alert.alert('Cuenta', undefined, [
      { text: 'Mi perfil (próximamente)', onPress: () => {} },
      { text: 'Cerrar sesión', style: 'destructive', onPress: logout },
      { text: 'Cancelar', style: 'cancel' },
    ]);
  }

  useEffect(() => {
    navigation.setOptions({
      headerShown: true,
      title: 'SIGEV',
      headerStyle: { backgroundColor: '#fff' },
      headerShadowVisible: false,
      headerTitleStyle: { color: '#B91C1C', fontWeight: '800' },
      headerRight: () => (
        <TouchableOpacity style={styles.menuBoton} onPress={abrirMenu}>
          <Text style={styles.menuTexto}>⋮</Text>
        </TouchableOpacity>
      ),
    });
  }, []);

  return (
    <SafeAreaView style={styles.safeArea} edges={['bottom']}>
      <ScrollView
        contentContainerStyle={styles.contenido}
        refreshControl={<RefreshControl refreshing={refrescando} onRefresh={onRefresh} />}
      >
        <Text style={styles.saludo}>Hola, {usuario?.nombre}</Text>
        <Text style={styles.detalle}>
          {usuario?.rol} — {usuario?.compania}
        </Text>
        <Text style={[styles.conexion, { color: conectado ? '#166534' : '#9CA3AF' }]}>
          {conectado ? '● En línea (notificaciones en vivo)' : '○ Sin conexión en tiempo real'}
        </Text>

        <Text style={styles.seccion}>Resumen</Text>
        <View style={styles.statFila}>
          {statsFlota.map((st) => (
            <Tile key={st.etiqueta} s={st} />
          ))}
        </View>
        <View style={styles.statFila}>
          {statsOtros.map((st) => (
            <Tile key={st.etiqueta} s={st} />
          ))}
        </View>

        {!mecanico && (
          <>
            <View style={styles.seccionFila}>
              <Text style={styles.seccion}>Despachos en curso</Text>
              <TouchableOpacity onPress={() => navigation.navigate('DespachosList')}>
                <Text style={styles.verTodos}>Ver todos</Text>
              </TouchableOpacity>
            </View>
            {despachos.length === 0 ? (
              <Text style={styles.sinDespachos}>No hay despachos en curso. ✅</Text>
            ) : (
              despachos.slice(0, 2).map((d) => (
                <View key={d.id_despacho} style={{ marginBottom: 12 }}>
                  <DespachoCard despacho={d} />
                </View>
              ))
            )}
          </>
        )}

        <Text style={styles.seccion}>Accesos</Text>
        <View style={styles.grid}>
          {CARDS.filter((c) => !(c.ocultoMecanico && mecanico)).map((card) => (
            <TouchableOpacity
              key={card.titulo}
              style={[styles.card, !card.disponible && styles.cardDeshabilitada]}
              disabled={!card.disponible}
              onPress={() => navigation.navigate(card.ruta)}
            >
              <Text style={styles.cardEmoji}>{card.emoji}</Text>
              <Text style={styles.cardTitulo}>{card.titulo}</Text>
              <Text style={styles.cardDescripcion}>{card.descripcion}</Text>
              {!card.disponible && <Text style={styles.cardProximamente}>Próximamente</Text>}
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#fff' },
  contenido: { padding: 20, paddingBottom: 40 },
  saludo: { fontSize: 22, fontWeight: 'bold' },
  detalle: { fontSize: 14, color: '#666', marginTop: 4, marginBottom: 20 },
  conexion: { fontSize: 12, fontWeight: '600', marginTop: -14, marginBottom: 16 },
  seccionFila: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  verTodos: { fontSize: 13, fontWeight: '700', color: '#B91C1C' },
  sinDespachos: { fontSize: 13, color: '#6B7280', marginBottom: 14 },
  seccion: { fontSize: 13, fontWeight: '700', color: '#6B7280', marginBottom: 8, marginTop: 4 },
  statFila: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 10 },
  stat: { width: '31.5%', borderRadius: 14, paddingVertical: 14, paddingHorizontal: 10 },
  statValor: { fontSize: 26, fontWeight: '800' },
  statEtiqueta: { fontSize: 11, fontWeight: '600', marginTop: 2 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' },
  card: {
    width: '48%',
    backgroundColor: '#F3F4F6',
    borderRadius: 14,
    padding: 16,
    marginBottom: 14,
  },
  cardDeshabilitada: { opacity: 0.5 },
  cardEmoji: { fontSize: 28, marginBottom: 8 },
  cardTitulo: { fontSize: 16, fontWeight: '700', color: '#1F2937' },
  cardDescripcion: { fontSize: 12, color: '#6B7280', marginTop: 4 },
  cardProximamente: { fontSize: 11, color: '#B91C1C', fontWeight: '600', marginTop: 8 },
  menuBoton: { paddingHorizontal: 12, paddingVertical: 4 },
  menuTexto: { fontSize: 24, fontWeight: '900', color: '#B91C1C' },
});
