// src/screens/DashboardScreen.tsx
import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  Button,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import { hcInit, hcReadStepsAggregate } from '../services/HealthService';

function startOfDayMs(): number {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d.getTime();
}

export default function DashboardScreen() {
  const [loading, setLoading] = useState(false);
  const [steps, setSteps] = useState<number | null>(null);

  useEffect(() => {
    hcInit().catch(e => console.warn('hcInit failed', e));
    fetchTodaySteps().catch(e => console.warn(e));
  }, []);

  async function fetchTodaySteps() {
    setLoading(true);
    try {
      const now = Date.now();
      const arr = await hcReadStepsAggregate(startOfDayMs(), now);
      // sum all buckets returned
      const total = arr.reduce((sum, a) => sum + (a.steps || 0), 0);
      setSteps(total);
    } catch (e) {
      console.warn('fetchTodaySteps error', e);
      setSteps(0);
    } finally {
      setLoading(false);
    }
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Dashboard</Text>
      {loading ? (
        <ActivityIndicator />
      ) : (
        <Text style={styles.stepsText}>{steps ?? '—'} steps today</Text>
      )}
      <View style={{ height: 16 }} />
      <Button title="Refresh" onPress={fetchTodaySteps} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16, alignItems: 'center' },
  title: { fontSize: 22, fontWeight: 'bold' },
  stepsText: { marginTop: 20, fontSize: 28, fontWeight: '600' },
});
