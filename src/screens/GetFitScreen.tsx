
import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Button,
  Alert,
  ScrollView,
  ActivityIndicator,
  TouchableOpacity,
} from 'react-native';
import { request, PERMISSIONS, RESULTS } from 'react-native-permissions';
import * as GoogleFitService from '../services/GoogleFitService';
import { StatusBar } from 'react-native';
import { COLORS } from '../theme/theme';
import inAppMessaging, { triggerEvent } from '@react-native-firebase/in-app-messaging';


export default function GetFitScreen({navigation}: any) {
  const [loading, setLoading] = useState(false);
  const [dailySteps, setDailySteps] = useState<number | string>(0);
  const [heartRate, setHeartRate] = useState<number | string>('Not Found');
  const [calories, setCalories] = useState<number | string>('Not Found');
  const [sleep, setSleep] = useState<number | string>('Not Found');
  const [weight, setWeight] = useState<number | string>('Not Found');
  const [bloodPressure, setBloodPressure] = useState<{
    systolic?: number | string;
    diastolic?: number | string;
  }>({});

  useEffect(() => {
    (async () => {
      await ensureAndFetch();
      triggerInAppEvent("GetFitScreen")
    })();
  }, []);

   function triggerInAppEvent({eventName}:any) {
    // RNFirebase exposes triggerEvent — this triggers programmatic campaigns
    try {
      return inAppMessaging().triggerEvent(eventName);
    } catch (e) {
      console.warn('FIAM trigger failed', e);
    }
  }

  async function ensureActivityPermission() {
    // Android only
    try {
      const res = await request(PERMISSIONS.ANDROID.ACTIVITY_RECOGNITION);
      console.log(res, "ensureActivityPermission")
      return res === RESULTS.GRANTED;
    } catch (err) {
      return false;
    }
  }

  async function ensureAuthorized() {
    const ok = await ensureActivityPermission();
    if (!ok) {
      Alert.alert(
        'Permission required',
        'Activity permission is required to read Google Fit data.',
      );
      return false;
    }
    console.log("new")
    const auth = await GoogleFitService.authorize();
    console.log(auth, "from auth GoogleFitService");
    if (!auth.success) {
      Alert.alert('Auth failed', auth.message ?? 'Authorization failed');
      return false;
    }
    return true;
  }

  async function ensureAndFetch() {
    setLoading(true);
    try {
      const ready = await ensureAuthorized();
      console.log(ready, "from ensureAndFetch");
      if (!ready) return;

      // Steps
      const stepsRes = await GoogleFitService.fetchDailyStepSamples();
      console.log(stepsRes, 'sample data fetchDailyStepSamples');
      // pick recommended source if present
      let foundSteps: number | string = 'Not Found';
      if (Array.isArray(stepsRes) && stepsRes.length > 0) {
        // find estimated_steps source
        const source =
          stepsRes.find((s: any) => s.source?.includes('estimated_steps')) ??
          stepsRes[0];
        if (source?.steps?.length > 0) {
          // steps is array of day buckets; pick last (today)
          const last = source.steps[source.steps.length - 1];
          foundSteps =
            typeof last?.value === 'number'
              ? last.value
              : last?.value ?? 'Not Found';
        }
      }
      setDailySteps(foundSteps);

      // Heart rate
      const hr = await GoogleFitService.fetchHeartRateSamples({
        startDate: new Date(Date.now() - 7 * 24 * 3600 * 1000).toISOString(),
        endDate: new Date().toISOString(),
      });
      if (Array.isArray(hr) && hr.length > 0) {
        const last = hr[hr.length - 1];
        setHeartRate(last?.value ?? 'Not Found');
      }

      // Calories
      const cal = await GoogleFitService.fetchDailyCalories();
      console.log(cal, "calories");
      if (Array.isArray(cal) && cal.length > 0) {
        const day = cal[0]; // depends on returned shape: reverse if needed
        // this library returns array of daily objects; try to find most recent
        const latest = (cal as any[]).flatMap(r => r)[0] ?? cal[0]; // safe attempt
        // Many implementations return objects with property 'calorie' or 'calories'
        setCalories((latest?.calorie ?? latest?.value ?? latest) as any);
      }

      // Sleep: compute hours for today
      const sleeps = await GoogleFitService.fetchSleepSamples({
        startDate: new Date(new Date().setHours(0, 0, 0, 0)).toISOString(),
      } as any);

      console.log(sleeps, 'sleeps');

      if (Array.isArray(sleeps) && sleeps.length > 0) {
        let sleepTotalMs = 0;
        const todayStart = new Date().setHours(0, 0, 0, 0);

        for (let i = 0; i < sleeps.length; i++) {
          const item = sleeps[i];
          const s = new Date(item.startDate).getTime();
          const e = new Date(item.endDate).getTime();

          // consider only if end time is today
          if (e > todayStart) {
            const st = Math.max(s, todayStart);
            sleepTotalMs += e - st;
          }
        }

        setSleep(Math.round((sleepTotalMs / (1000 * 60 * 60)) * 100) / 100);
      }


      // Weight
      const weights = await GoogleFitService.fetchWeightSamples();
      console.log(weights, "weights");
      if (Array.isArray(weights) && weights.length > 0) {
        const latest = weights[0];
        setWeight(latest?.value ?? 'Not Found');
      }

      // Blood pressure
      const bps = await GoogleFitService.fetchBloodPressure();
      console.log(bps, "bps")
      if (Array.isArray(bps) && bps.length > 0) {
        const latest = bps[bps.length - 1];
        setBloodPressure({
          systolic: latest.systolic ?? 'Not Found',
          diastolic: latest.diastolic ?? 'Not Found',
        });
      }
    } catch (err: any) {
      console.warn('Fetch error', err);
      Alert.alert('Error', err?.message ?? String(err));
    } finally {
      setLoading(false);
    }
  }

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={{ padding: 12 }}
    >
      <StatusBar backgroundColor={COLORS.primaryBlackHex} />
      <Button title="Get Data From Google Fit Api" onPress={ensureAndFetch} />
      {loading && <ActivityIndicator style={{ marginTop: 12 }} />}
      <View style={styles.row}>
        <View style={styles.left}>
          <Text style={styles.leftText}>Step Count - Today</Text>
        </View>
        <View style={styles.right}>
          <Text style={styles.rightText}>{String(dailySteps)}</Text>
        </View>
      </View>
      <View style={styles.row}>
        <View style={styles.left}>
          <Text style={styles.leftText}>Heart Rate</Text>
        </View>
        <View style={styles.right}>
          <Text style={styles.rightText}>{String(heartRate)}</Text>
        </View>
      </View>
      <View style={styles.row}>
        <View style={styles.left}>
          <Text style={styles.leftText}>BP - Systolic</Text>
        </View>
        <View style={styles.right}>
          <Text style={styles.rightText}>
            {String(bloodPressure.systolic ?? 'Not Found')}
          </Text>
        </View>
      </View>
      <View style={styles.row}>
        <View style={styles.left}>
          <Text style={styles.leftText}>BP - Diastolic</Text>
        </View>
        <View style={styles.right}>
          <Text style={styles.rightText}>
            {String(bloodPressure.diastolic ?? 'Not Found')}
          </Text>
        </View>
      </View>
      <View style={styles.row}>
        <View style={styles.left}>
          <Text style={styles.leftText}>Calories</Text>
        </View>
        <View style={styles.right}>
          <Text style={styles.rightText}>{String(calories)}</Text>
        </View>
      </View>
      <View style={styles.row}>
        <View style={styles.left}>
          <Text style={styles.leftText}>Sleep - Today (hrs)</Text>
        </View>
        <View style={styles.right}>
          <Text style={styles.rightText}>{String(sleep)}</Text>
        </View>
      </View>
      <View style={styles.row}>
        <View style={styles.left}>
          <Text style={styles.leftText}>Weight (kg)</Text>
        </View>
        <View style={styles.right}>
          <Text style={styles.rightText}>{String(weight)}</Text>
        </View>
      </View>
      <View style={styles.MainScreenButton}>
        <Button
          title="Accelerometer"
          onPress={() => navigation.navigate('StepScreen')}
        />
        {/* <Button
          title="DashBoard"
          onPress={() => navigation.navigate('DashBoardScreen')}
        />
        <Button
          title="StepCounter"
          onPress={() => navigation.navigate('StepCaptureScreen')}
        /> */}
      </View>
      <View style={styles.MainScreenButton}>
        <Button
          title="Health DashBoard"
          onPress={() => navigation.navigate('MainScreen')}
        />
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', height: 48, margin: 10, alignItems: 'center' },
  left: {
    flex: 1,
    paddingLeft: 12,
    backgroundColor: '#187FA1',
    height: '100%',
    justifyContent: 'center',
  },
  right: {
    flex: 1,
    paddingLeft: 12,
    backgroundColor: '#fff',
    height: '100%',
    justifyContent: 'center',
  },
  leftText: { color: '#fff', fontWeight: '600' },
  rightText: { color: '#187FA1', fontWeight: '600' },
  container: { flex: 1, backgroundColor: "grey"},

  ButtonContainer: {
    flex: 1,
    gap: 10,
    margin: 10,
    flexDirection: 'row',
  },
  MainScreenButton: {
    gap: 10,
    margin: 10,
    flex: 1,
  },
});