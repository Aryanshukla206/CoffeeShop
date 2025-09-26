// src/screens/JsStepCaptureScreen.tsx
import React, { useState } from 'react';
import { View, Text, Button, Alert, StyleSheet } from 'react-native';
import { startJsStepCapture, stopJsStepCapture } from '../services/stepCapture';
import { request, PERMISSIONS, RESULTS } from 'react-native-permissions';
import { StatusBar } from 'react-native';
import LottieView from 'lottie-react-native';
import { COLORS } from '../theme/theme';

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
    <View
      style={{
        padding: 16,
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
         backgroundColor: COLORS.primaryBlackHex,
      }}
    >
      <Text style={styles.heading}>Steps Tracker </Text>
      <View style={styles.lottieContainer}>
        {running ? (
          <LottieView
            source={require('../assets/animation/walking_animation.json')}
            autoPlay={running}
            loop={running}
            style={styles.walkingAnimation}
          />
        ) : (
        <LottieView
            source={require('../assets/animation/Person Sitting Holding Smartphone.json')}
            autoPlay={!running}
            loop={!running}
            style={styles.lottieAnimation}
          />
        )
        }
      </View>
      <Text style={styles.text}>Steps {count}</Text>
      {!running ? (
        <Button title="Start" onPress={start} />
      ) : (
        <Button title="Stop" onPress={stop} />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  text: {
    fontSize: 36,
    gap: 20,
    marginBottom: 20,
    color :'white'
  },
  heading : {
    fontSize : 26,
    marginBottom : 100,
    color : 'white'

  },
  lottieContainer: {
    width: 100,
    height: 100,
    marginBottom: 50,
  },
  lottieAnimation: {
    width: '100%',
    height: '150%',
  },
  walkingAnimation : {
    width: '100%',
    height: '150%',
  }
});