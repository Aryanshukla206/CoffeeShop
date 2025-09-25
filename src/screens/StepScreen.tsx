// src/screens/JsStepCaptureScreen.tsx
import React, { useState } from 'react';
import { View, Text, Button, Alert, StyleSheet } from 'react-native';
import { startJsStepCapture, stopJsStepCapture } from '../services/stepCapture';
import { request, PERMISSIONS, RESULTS } from 'react-native-permissions';

export default function JsStepCaptureScreen() {
  const [running, setRunning] = useState(false);
  const [count, setCount] = useState(0);

  async function start() {
    const ok = await request(PERMISSIONS.ANDROID.ACTIVITY_RECOGNITION);
    if (ok !== RESULTS.GRANTED) {
      Alert.alert(
        'Permission required',
        'Allow Activity Recognition to capture steps',
      );
      return;
    }
    startJsStepCapture((delta, total) => {
      setCount(total);
    });
    setRunning(true);
  }

  function stop() {
    stopJsStepCapture();
    setRunning(false);
  }

  return (
    <View style={{ padding: 16 }}>
      <Text style={styles.text} >Steps {count}</Text>
      {!running ? (
        <Button title="Start JS capture" onPress={start} />
      ) : (
        <Button title="Stop" onPress={stop} />
      )}
    </View>
  );
}

const styles = StyleSheet.create({

    text : {
      fontSize : 16 ,
    }
})