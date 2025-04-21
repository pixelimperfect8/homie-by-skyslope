import React from 'react';
import { Image, StyleSheet, View } from 'react-native';

export default function SmallLogo() {
  return (
    <View style={styles.container}>
      <Image
        source={require('../assets/images/logo-small.png')}
        style={styles.logo}
        resizeMode="contain"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  logo: {
    width: 100,
    height: 40,
  },
}); 