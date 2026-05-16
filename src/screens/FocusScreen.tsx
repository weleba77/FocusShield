import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

export default function FocusScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.text}>Focus Screen</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#121212',
    justifyContent: 'center',
    alignItems: 'center',
  },
  text: {
    color: '#ffffff',
    fontSize: 20,
  },
});
