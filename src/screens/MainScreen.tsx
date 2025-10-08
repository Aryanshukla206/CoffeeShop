import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Dimensions,
  StatusBar,
  Image,
  Platform,
} from 'react-native';
import LottieView from 'lottie-react-native';
import {
  accelerometer,
  setUpdateIntervalForType,
  SensorTypes,
} from 'react-native-sensors';
import {
  initialize,
  requestPermission,
  readRecords,
  insertRecords,
  getSdkStatus,
  openHealthConnectSettings,
} from 'react-native-health-connect';
import {
  Permission,
  RecordType,
  SdkAvailabilityStatus,
} from 'react-native-health-connect';
import { COLORS } from '../theme/theme';

import ViewShot, { captureScreen } from 'react-native-view-shot';

import Share from 'react-native-share';
import RNFS from 'react-native-fs';
import CustomIcon from '../components/CustomIcon';

const { width, height } = Dimensions.get('window');

interface HealthData {
  steps: number;
  heartRate: number;
  weight: number;
  bloodPressure: { systolic: number; diastolic: number };
  sleepHours: number;
  calories: number;
}

const MainScreen = ({ navigation }: any) => {
  const [healthData, setHealthData] = useState<HealthData>({
    steps: 0,
    heartRate: 0,
    weight: 0,
    bloodPressure: { systolic: 0, diastolic: 0 },
    sleepHours: 0,
    calories: 0,
  });

  const [currentSteps, setCurrentSteps] = useState(0);
  const [isTracking, setIsTracking] = useState(false);
  const [healthConnectReady, setHealthConnectReady] = useState(false);
  const [stepCountStart, setStepCountStart] = useState(0);
  const [trackingStartTime, setTrackingStartTime] = useState<string | null>(
    null,
  );

  // Use refs for step detection to avoid stale closures
  const stepThreshold = useRef(12);
  const stepBuffer = useRef<number[]>([]);
  const lastAcceleration = useRef(0);
  const lastStepTime = useRef(0);
  const subscriptionRef = useRef<any>(null);

  useEffect(() => {
    initializeHealthConnect();

    // Cleanup subscription on unmount
    return () => {
      if (subscriptionRef.current) {
        subscriptionRef.current.unsubscribe();
      }
    };
  }, []);

  const initializeHealthConnect = async () => {
    try {
      const status = await getSdkStatus();

      if (status === SdkAvailabilityStatus.SDK_AVAILABLE) {
        const initialized = await initialize();
        if (initialized) {
          await requestHealthPermissions();
          setHealthConnectReady(true);
          await fetchHealthData();
        }
      } else {
        Alert.alert(
          'Health Connect Not Available',
          'Please install Google Health Connect to use this app.',
          [{ text: 'OK', onPress: () => {} }],
        );
      }
    } catch (error) {
      console.error('Health Connect initialization failed:', error);
      Alert.alert('Error', 'Failed to initialize Health Connect');
    }
  };

  const requestHealthPermissions = async () => {
    const permissions: Permission[] = [
      { accessType: 'read', recordType: 'Steps' as RecordType },
      { accessType: 'write', recordType: 'Steps' as RecordType },
      { accessType: 'read', recordType: 'HeartRate' as RecordType },
      { accessType: 'read', recordType: 'Weight' as RecordType },
      { accessType: 'read', recordType: 'BloodPressure' as RecordType },
      { accessType: 'read', recordType: 'SleepSession' as RecordType },
      { accessType: 'read', recordType: 'TotalCaloriesBurned' as RecordType },
    ];

    try {
      await requestPermission(permissions);
    } catch (error) {
      console.error('Permission request failed:', error);
    }
  };

  const fetchHealthData = async () => {
    if (!healthConnectReady) return;

    try {
      const endTime = new Date().toISOString();
      const startTime = new Date(
        Date.now() - 24 * 60 * 60 * 1000,
      ).toISOString();

      // Fetch Steps
      const stepsResult = await readRecords('Steps', {
        timeRangeFilter: { startTime, endTime },
      });
      console.log(stepsResult, 'getting data from the Health Connect ');
      const totalSteps = stepsResult.records.reduce(
        (sum, record) => sum + record.count,
        0,
      );

      // Fetch Heart Rate
      const heartRateResult = await readRecords('HeartRate', {
        timeRangeFilter: { startTime, endTime },
      });
      const avgHeartRate =
        heartRateResult.records.length > 0
          ? heartRateResult.records.reduce(
              (sum, record) => sum + record.beatsPerMinute,
              0,
            ) / heartRateResult.records.length
          : 0;

      // Fetch Weight
      const weightResult = await readRecords('Weight', {
        timeRangeFilter: { startTime, endTime },
      });
      const latestWeight =
        weightResult.records.length > 0
          ? weightResult.records[weightResult.records.length - 1].weight
              .inKilograms
          : 0;

      // Fetch Blood Pressure
      const bpResult = await readRecords('BloodPressure', {
        timeRangeFilter: { startTime, endTime },
      });
      const latestBP =
        bpResult.records.length > 0
          ? bpResult.records[bpResult.records.length - 1]
          : {
              systolic: { inMillimetersOfMercury: 0 },
              diastolic: { inMillimetersOfMercury: 0 },
            };

      // Fetch Sleep
      const sleepResult = await readRecords('SleepSession', {
        timeRangeFilter: { startTime, endTime },
      });
      const totalSleep = sleepResult.records.reduce((sum, record) => {
        const start = new Date(record.startTime);
        const end = new Date(record.endTime);
        return sum + (end.getTime() - start.getTime()) / (1000 * 60 * 60);
      }, 0);

      // Fetch Calories
      const caloriesResult = await readRecords('TotalCaloriesBurned', {
        timeRangeFilter: { startTime, endTime },
      });
      const totalCalories = caloriesResult.records.reduce(
        (sum, record) => sum + record.energy.inCalories,
        0,
      );

      setHealthData({
        steps: totalSteps,
        heartRate: Math.round(avgHeartRate),
        weight: Math.round(latestWeight * 10) / 10,
        bloodPressure: {
          systolic: Math.round(latestBP.systolic.inMillimetersOfMercury),
          diastolic: Math.round(latestBP.diastolic.inMillimetersOfMercury),
        },
        sleepHours: Math.round(totalSleep * 10) / 10,
        calories: Math.round(totalCalories),
      });
    } catch (error) {
      console.error('Failed to fetch health data:', error);
      Alert.alert('Error', 'Failed to fetch health data from Health Connect');
    }
  };

  // Use a lower threshold and smaller significant change for slow movements
  const detectStep = (acceleration: number) => {
    const now = Date.now();
    const buffer = stepBuffer.current;
    const threshold = 5; // lower threshold for slow movement
    const minStepInterval = 250; // minimum 250ms between steps

    // Add current acceleration to buffer
    buffer.push(acceleration);
    if (buffer.length > 20) {
      buffer.shift();
    }

    if (buffer.length < 5) return false; // fewer readings required

    // Calculate average and find peaks
    const average = buffer.reduce((sum, val) => sum + val, 0) / buffer.length;
    const recent = buffer.slice(-3); // Last 3 readings
    const isCurrentPeak = recent.every(val => val <= acceleration);

    const timeSinceLastStep = now - lastStepTime.current;
    const significantChange =
      Math.abs(acceleration - lastAcceleration.current) > 1; // smaller for slow movement

    if (
      acceleration > average + threshold &&
      isCurrentPeak &&
      significantChange &&
      timeSinceLastStep > minStepInterval
    ) {
      lastStepTime.current = now;
      return true;
    }

    return false;
  };

  const startStepTracking = () => {
    if (isTracking) return;

    setIsTracking(true);
    setStepCountStart(currentSteps);
    setTrackingStartTime(new Date().toISOString());

    // Reset detection variables
    stepBuffer.current = [];
    lastAcceleration.current = 0;
    lastStepTime.current = 0;

    setUpdateIntervalForType(SensorTypes.accelerometer, 50); // 20Hz, more frequent readings

    const subscription = accelerometer.subscribe(({ x, y, z }) => {
      const acceleration = Math.sqrt(x * x + y * y + z * z);

      if (detectStep(acceleration)) {
        setCurrentSteps(prev => prev + 1);
      }

      lastAcceleration.current = acceleration;
    });

    subscriptionRef.current = subscription;
  };

  const stopStepTracking = () => {
    if (!isTracking) return;

    setIsTracking(false);
    if (subscriptionRef.current) {
      subscriptionRef.current.unsubscribe();
      subscriptionRef.current = null;
    }
  };

  const saveStepsToHealthConnect = async () => {
    console.log('saveStepsToHealthConnect called');

    if (!healthConnectReady) {
      Alert.alert('Error', 'Health Connect not ready');
      return;
    }

    if (!trackingStartTime) {
      Alert.alert('Error', 'No tracking session to save');
      return;
    }

    const stepsToSave = currentSteps - stepCountStart;

    // if (stepsToSave <= 0) {
    //   Alert.alert('Error', 'No steps to save');
    //   return;
    // }

    try {
      const endTime = new Date().toISOString();

      // Correct Health Connect Steps record format
      const stepRecord = {
        recordType: 'Steps' as RecordType,
        count: stepsToSave,
        startTime: trackingStartTime,
        endTime: endTime,
        // Optional metadata
        metadata: {
          id: `step_tracking_${Date.now()}`, // Unique identifier
          clientRecordId: `client_${Date.now()}`, // Client-side ID
          dataOrigin: 'com.coffeeApp.package', // Your app's package name
          lastModifiedTime: endTime,
        },
      };

      // const stepRecord = {
      //   recordType: 'Steps',
      //   count: 100,
      //   startTime: '2025-09-26T06:31:22.171Z',
      //   endTime: '2025-09-26T06:34:07.614Z',
      //   metadata: {
      //     id: `step_tracking_${Date.now()}`, // Unique identifier
      //     clientRecordId: `client_${Date.now()}`, // Client-side ID
      //     dataOrigin: 'com.coffeeApp.package', // Your app's package name
      //     lastModifiedTime: endTime,
      //   },
      // };

      console.log(stepRecord, 'step Record to save');

      console.log('stepRecord to insert:', JSON.stringify(stepRecord, null, 2));

      await insertRecords([stepRecord]);

      Alert.alert('Success', `Saved ${stepsToSave} steps to Health Connect!`, [
        {
          text: 'OK',
          onPress: () => {
            // Reset tracking state after successful save
            setCurrentSteps(0);
            setStepCountStart(0);
            setTrackingStartTime(null);
            fetchHealthData(); // Refresh health data
          },
        },
      ]);
    } catch (error) {
      console.error('Failed to save steps:', error);
      Alert.alert(
        'Error',
        `Failed to save steps to Health Connect: ${error.message || error}`,
      );
    }
  };

  const resetStepCounter = () => {
    Alert.alert(
      'Reset Steps',
      'Are you sure you want to reset the step counter?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Reset',
          onPress: () => {
            setCurrentSteps(0);
            setStepCountStart(0);
            setTrackingStartTime(null);
            if (isTracking) {
              stopStepTracking();
            }
          },
        },
      ],
    );
  };

  const HealthCard: React.FC<{
    title: string;
    value: string | number;
    unit: string;
    color: string;
  }> = ({ title, value, unit, color }) => (
    <View style={[styles.healthCard, { borderColor: color }]}>
      <Text style={styles.cardTitle}>{title}</Text>
      <Text style={[styles.cardValue, { color }]}>{value}</Text>
      <Text style={styles.cardUnit}>{unit}</Text>
    </View>
  );

  // Screen Shot
  const ref = useRef<ViewShot>(null);

  const [ss, setSS] = useState(false);

  const [savedImagePath, setSavedImagePath] = useState('');

  console.log(savedImagePath, 'from MainScreen---------->');
  const [imageURI, setImageURI] = useState();
  const takeScreenShot = () => {
    // // To capture Screenshot
    captureScreen({
      // Either png or jpg (or webm Android Only), Defaults: png
      format: 'jpg',
      // Quality 0.0 - 1.0 (only available for jpg)
      quality: 0.8,
    }).then(
      //callback function to get the result URL of the screnshot
      uri => {
        setSavedImagePath(uri);
        setImageURI(uri);
        setSS(true);
      },
      error => console.error('Oops, Something Went Wrong', error),
    );
  };

  const onShare = async () => {
    try {
      const destPath = imageURI;
      const shareOptions = {
        message: 'Hey There Look i have achieved a new Milestone!! 🏋🏻‍♀️',
        url: destPath,
        type: 'image/png',
      };

      await Share.open(shareOptions);
    } catch (error) {
      console.log('Share Error:', error);
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar backgroundColor={COLORS.primaryLightGreyHex} />
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        {/* Header */}
        <ViewShot ref={ref}>
          <View style={styles.header}>
            <Text style={styles.headerTitle}>Health Dashboard</Text>
            <TouchableOpacity
              style={styles.settingsButton}
              onPress={openHealthConnectSettings}
            >
              <Text style={styles.settingsButtonText}>Settings</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.settingsButton}
              onPress={() => navigation.pop()}
            >
              <Text style={styles.settingsButtonText}>Back</Text>
            </TouchableOpacity>
          </View>

          {/* Step Counter Section */}
          <View style={styles.stepSection}>
            <View style={styles.lottieContainer}>
              <LottieView
                source={require('../assets/animation/walking_animation.json')}
                autoPlay={isTracking}
                loop={isTracking}
                style={styles.lottieAnimation}
              />
            </View>

            <Text style={styles.stepCount}>{currentSteps}</Text>
            <Text style={styles.stepLabel}>Current Steps</Text>

            {trackingStartTime && (
              <Text style={styles.trackingInfo}>
                Tracking since:{' '}
                {new Date(trackingStartTime).toLocaleTimeString()}
              </Text>
            )}

            <View style={styles.buttonContainer}>
              <TouchableOpacity
                style={[
                  styles.button,
                  isTracking ? styles.stopButton : styles.startButton,
                ]}
                onPress={isTracking ? stopStepTracking : startStepTracking}
              >
                <Text style={styles.buttonText}>
                  {isTracking ? 'Stop Tracking' : 'Start Tracking'}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.button,
                  styles.saveButton,
                  (!healthConnectReady || !trackingStartTime) &&
                    styles.disabledButton,
                ]}
                onPress={saveStepsToHealthConnect}
                disabled={!healthConnectReady || !trackingStartTime}
              >
                <Text
                  style={[
                    styles.buttonText,
                    (!healthConnectReady || !trackingStartTime) &&
                      styles.disabledButtonText,
                  ]}
                >
                  Save to Health Connect
                </Text>
              </TouchableOpacity>
            </View>

            <TouchableOpacity
              style={[styles.button, styles.resetButton]}
              onPress={resetStepCounter}
            >
              <Text style={styles.buttonText}>Reset Counter</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.screenShotButton}
              onPress={takeScreenShot}
            >
              <Text>Take Screenshot</Text>
            </TouchableOpacity>
            {ss && (
              <>
                <Image source={{ uri: savedImagePath }} style={styles.Image} />
                <CustomIcon
                  name="add"
                  style={{ position: 'absolute', bottom: 120, left: 250 }}
                  onPress={onShare}
                />
                <CustomIcon
                  name="close"
                  style={{ position: 'absolute', bottom: 215, left: 250 }}
                  onPress={() => {
                    setSS(false);
                  }}
                />
              </>
            )}
          </View>

          {/* Health Data Grid */}
          <View style={styles.healthGrid}>
            <HealthCard
              title="Daily Steps"
              value={healthData.steps}
              unit="steps"
              color="#4CAF50"
            />
            <HealthCard
              title="Heart Rate"
              value={healthData.heartRate}
              unit="bpm"
              color="#F44336"
            />
            <HealthCard
              title="Weight"
              value={healthData.weight}
              unit="kg"
              color="#2196F3"
            />
            <HealthCard
              title="Blood Pressure"
              value={`${healthData.bloodPressure.systolic}/${healthData.bloodPressure.diastolic}`}
              unit="mmHg"
              color="#9C27B0"
            />
            <HealthCard
              title="Sleep"
              value={healthData.sleepHours}
              unit="hours"
              color="#607D8B"
            />
            <HealthCard
              title="Calories"
              value={healthData.calories}
              unit="cal"
              color="#FF9800"
            />
          </View>
        </ViewShot>

        {/* Refresh Button */}
        <TouchableOpacity
          style={[
            styles.refreshButton,
            !healthConnectReady && styles.disabledButton,
          ]}
          onPress={fetchHealthData}
          disabled={!healthConnectReady}
        >
          <Text
            style={[
              styles.refreshButtonText,
              !healthConnectReady && styles.disabledButtonText,
            ]}
          >
            Refresh Health Data
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  scrollContainer: {
    padding: 16,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
  },
  settingsButton: {
    backgroundColor: '#2196F3',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  settingsButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
  },
  stepSection: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 24,
    marginBottom: 24,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  lottieContainer: {
    width: 100,
    height: 100,
    marginBottom: 20,
  },
  lottieAnimation: {
    width: '100%',
    height: '100%',
  },
  stepCount: {
    fontSize: 48,
    fontWeight: 'bold',
    color: '#4CAF50',
    marginBottom: 8,
  },
  stepLabel: {
    fontSize: 16,
    color: '#666',
    marginBottom: 8,
  },
  trackingInfo: {
    fontSize: 12,
    color: '#999',
    marginBottom: 16,
  },
  buttonContainer: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 12,
  },
  button: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
    minWidth: 120,
  },
  startButton: {
    backgroundColor: '#4CAF50',
  },
  stopButton: {
    backgroundColor: '#F44336',
  },
  saveButton: {
    backgroundColor: '#2196F3',
  },
  resetButton: {
    backgroundColor: '#FF9800',
    minWidth: 200,
  },
  disabledButton: {
    backgroundColor: '#CCCCCC',
  },
  buttonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'center',
  },
  disabledButtonText: {
    color: '#888888',
  },
  healthGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: 12,
    marginBottom: 24,
  },
  healthCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    width: (width - 44) / 2,
    borderWidth: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  cardTitle: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
  },
  cardValue: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  cardUnit: {
    fontSize: 12,
    color: '#999',
  },
  refreshButton: {
    backgroundColor: '#4CAF50',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  refreshButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  screenShotButton: {
    backgroundColor: 'white',
    marginTop: 15,
    paddingVertical: 5,
    paddingHorizontal: 10,
    borderRadius: 12,
    borderWidth: 1,
  },
  Image: {
    width: 100,
    height: 200,
    marginTop: 10,
  },
});

export default MainScreen;
