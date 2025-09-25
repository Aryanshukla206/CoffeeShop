import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, Button, StyleSheet, Alert } from 'react-native';
import {
  hcInit,
  hcRequestPermissions,
  hcWriteSteps,
} from '../services/HealthService';

export default function StepCaptureScreen() {
  const [steps, setSteps] = useState<number>(0);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    hcInit().catch(e => console.warn('hcInit failed', e));
  }, []);

  async function onRequestPermissions() {
    const ok = await hcRequestPermissions();
    if (!ok)
      Alert.alert('Permissions required', 'Please allow Health Connect access');
    else Alert.alert('Permissions', 'Granted (or dialog shown)');
  }

  // call this when you have a new sensor reading (here simulated by input)
  async function onSaveSteps() {
    setLoading(true);
    try {
      const now = Date.now();
      const start = now - 60 * 1000; // pretend steps were in last minute
      const success = await hcWriteSteps(start, now, steps);
      if (success) {
        Alert.alert('Saved', `Saved ${steps} steps to Health Connect`);
      } else {
        Alert.alert('Error', 'Failed to save steps');
      }
    } catch (e) {
      console.warn(e);
      Alert.alert('Error', 'Exception saving steps');
    } finally {
      setLoading(false);
    }
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Step Capture</Text>

      <Button
        title="Request Health Connect Permissions"
        onPress={onRequestPermissions}
      />
      <View style={{ height: 10 }} />

      <Text>Captured steps (simulate):</Text>
      <TextInput
        keyboardType="number-pad"
        value={String(steps)}
        onChangeText={t => setSteps(Number(t || 0))}
        style={styles.input}
      />
      <View style={{ height: 10 }} />
      <Button
        title={loading ? 'Saving...' : 'Save to Health Connect'}
        onPress={onSaveSteps}
        disabled={loading}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16, alignItems: 'stretch' },
  title: { fontSize: 22, fontWeight: 'bold', marginBottom: 10 },
  input: { borderWidth: 1, borderColor: '#ccc', padding: 8, borderRadius: 6 },
});
