import React from 'react';
import { View, Text, Image, StyleSheet } from 'react-native';

// Escudo del Cuerpo de Bomberos de Talcahuano (fondo transparente).
const LOGO = require('../../assets/logo.png');

interface Props {
  size?: number;
}

export default function LogoSigev({ size = 96 }: Props) {
  if (LOGO) {
    return (
      <Image
        source={LOGO}
        style={{ width: size, height: size }}
        resizeMode="contain"
      />
    );
  }
  // Marcador por si algún día se quita el logo.
  return (
    <View style={[styles.circulo, { width: size, height: size, borderRadius: size / 2 }]}>
      <Text style={{ fontSize: size * 0.5 }}>🚒</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  circulo: { backgroundColor: '#fff', alignItems: 'center', justifyContent: 'center' },
});
