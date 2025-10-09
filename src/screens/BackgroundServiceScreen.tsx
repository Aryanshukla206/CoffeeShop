import { Alert, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import React, { useEffect } from 'react';
import { COLORS, FONTSIZE } from '../theme/theme';
import GradientBGIcon from '../components/GradientBGIcon';
import BackgroundService from 'react-native-background-actions';

const sleep = (time: number) =>
  new Promise<void>(resolve => setTimeout(() => resolve(), time));

const veryIntensiveTask = async (taskDataArguments: any) => {
  // Example of an infinite loop task
  const { delay } = taskDataArguments;
  await new Promise(async resolve => {
    for (let i = 0; BackgroundService.isRunning(); i++) {
      console.log(i);
      await BackgroundService.updateNotification({
        taskDesc: 'Counter Running on Background : ' + i,
      });
      await sleep(delay);
    }
  });
};

const options = {
  taskName: 'SimpleCounter',
  taskTitle: 'Counter running',
  taskDesc: 'Counting in background',
  taskIcon: {
    name: 'ic_launcher',
    type: 'mipmap',
    package: 'com.coffeeshop',
  },
  linkingURI: 'coffeeHouse://main',
  color: '#86ec9eff',
  parameters: { delay: 1000 },
};

const BackgroundServiceScreen = ({ navigation, route }: any) => {
  const startBackGroundService = async () => {
    try {
      if (BackgroundService.isRunning()) {
        console.log('[UI] background service already running');
        return;
      }
      await BackgroundService.start(veryIntensiveTask, options);
      console.log('background service started');
    } catch (err) {
      console.error('[UI] failed to start background service', err);
      Alert.alert(
        'Error',
        'Could not start background service. Check logs and native setup.',
      );
    }
  };

  const stopBackgroundService = async () => {
    try {
      if (!BackgroundService.isRunning()) {
        console.log('[UI] background service is not running');

        return;
      }
      console.log('[UI] stopping background service...');
      await BackgroundService.stop();
    } catch (err) {
      console.warn('[UI] failed to stop background service', err);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => {
            navigation.pop();
          }}
        >
          <GradientBGIcon name="left" color="white" size={FONTSIZE.size_20} />
        </TouchableOpacity>
        <Text style={styles.title}>Test Background Service</Text>
      </View>
      <TouchableOpacity
        style={styles.button}
        onPress={() => {
          startBackGroundService();
        }}
      >
        <Text style={styles.buttonText}>Start Background Services</Text>
      </TouchableOpacity>
      <TouchableOpacity
        style={styles.buttonEnd}
        onPress={() => {
          stopBackgroundService();
        }}
      >
        <Text style={styles.buttonText}>Stop Background Services</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.primaryDarkGreyHex,
  },
  header: {
    paddingTop: 20,
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  title: {
    marginRight: 40,
    fontSize: 24,
    color: 'white',
  },
  button: {
    backgroundColor: '#88e186ff',
    padding: 15,
    margin: 20,
    borderRadius: 10,
    alignItems: 'center',
  },
  controlButton: {},
  buttonText: {
    color: 'black',
    fontSize: 20,
  },
  buttonEnd: {
    backgroundColor: '#e25d71ff',
    padding: 15,
    margin: 20,
    borderRadius: 10,
    alignItems: 'center',
  },
});
export default BackgroundServiceScreen;
