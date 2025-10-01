import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  ActivityIndicator,
  Platform,
  Alert,
  ScrollView,
  StyleSheet,
  Image,
  TouchableOpacity,
} from 'react-native';
import Geolocation from 'react-native-geolocation-service';
import {
  check,
  request,
  openSettings,
  PERMISSIONS,
  RESULTS,
} from 'react-native-permissions';
import { getApp } from '@react-native-firebase/app';
import { getAI, getGenerativeModel } from '@react-native-firebase/ai';
import { useAuth } from '../contexts/AuthContext';
import { COLORS, FONTFAMILY, FONTSIZE, SPACING } from '../theme/theme';
import Icon from 'react-native-vector-icons/Ionicons';
import { fetchWeather } from '../utils/fetchWeather';
import CustomIcon from '../components/CustomIcon';

// keep your normalizeUser and runAgent helpers as before
// (not shown here for brevity — just paste your existing ones above)

export default function AgentScreen() {
  const [initializing, setInitializing] = useState(true);
  const [message, setMessage] = useState('Idle');
  const [err, setErr] = useState<string | null>(null);
  const [coords, setCoords] = useState<any>(null);
  const [agentText, setAgentText] = useState<string | null>(null);
  const [structured, setStructured] = useState<any | null>(null);

  const { user } = useAuth();

  const runAgent = useCallback(async () => {
    setMessage('Running agent...');
    setErr(null);
    try {
      const app = getApp();
      const ai = getAI(app);
      const model = getGenerativeModel(ai, { model: 'gemini-2.5-flash' });

      const userData = {
        displayName: user?.displayName || 'Guest',
        email: user?.email || 'unknown',
      };

      // Example prompt
      const prompt = `You are an AI Barista. Suggest a coffee drink for ${userData.displayName}`;

      const result = await model.generateContent(prompt);
      console.log(result, 'response from agent');

      setAgentText(result.response.text());
      try {
        setStructured(result.response.candidates?.[0]?.content || {});
      } catch (e) {
        setStructured(null);
      }

      setMessage('Agent finished.');
    } catch (e: any) {
      setErr(e.message);
      setMessage('Error running agent');
    }
  }, [user]);

  useEffect(() => {
    const requestLocation = async () => {
      const perm =
        Platform.OS === 'ios'
          ? PERMISSIONS.IOS.LOCATION_WHEN_IN_USE
          : PERMISSIONS.ANDROID.ACCESS_FINE_LOCATION;

      let res = await check(perm);
      if (res === RESULTS.DENIED) {
        res = await request(perm);
      }

      if (res === RESULTS.GRANTED) {
        Geolocation.getCurrentPosition(
          pos => {
            setCoords(pos.coords);
          },
          error => {
            setErr(error.message);
          },
          { enableHighAccuracy: true, timeout: 15000, maximumAge: 10000 },
        );
      } else {
        Alert.alert('Permission denied', 'Location is required.');
      }

      setInitializing(false);
    };

    requestLocation();
  }, []);

  if (initializing) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={COLORS.primaryOrangeHex} />
        <Text style={styles.loadingText}>Initializing user...</Text>
      </View>
    );
  }

  return (
    <ScrollView contentContainerStyle={styles.ScreenContainer}>
      <View style={styles.header}>
        <Image
          source={require('../assets/app_images/BotCoffee.jpg')}
          style={styles.avatar}
        />
        <Text style={styles.ScreenTitle}>AI Barista</Text>
      </View>

      {/* Status / Message */}
      <Text style={styles.status}>{message}</Text>
      {err && <Text style={styles.error}>{err}</Text>}

      {coords && (
        <Text style={styles.coords}>
          📍 {coords.latitude.toFixed(5)}, {coords.longitude.toFixed(5)}
        </Text>
      )}

      {/* Recommendation */}
      {agentText ? (
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <CustomIcon
              name="bubble"
              size={20}
              color={COLORS.primaryOrangeHex}
            />
            <Text style={styles.cardTitle}>Recommendation</Text>
          </View>
          <Text style={styles.cardText}>{agentText}</Text>

          {structured && (
            <View style={[styles.card, { marginTop: 12 }]}>
              <View style={styles.cardHeader}>
                <Icon
                  name="document-text-outline"
                  size={20}
                  color={COLORS.primaryOrangeHex}
                />
                <Text style={styles.cardTitle}>Structured Data</Text>
              </View>
              <ScrollView horizontal>
                <Text style={styles.jsonText}>
                  {JSON.stringify(structured, null, 2)}
                </Text>
              </ScrollView>
            </View>
          )}
        </View>
      ) : (
        <Text style={styles.hint}>👉 Ask the AI barista.</Text>
      )}

      {/* Actions */}
      <View style={styles.buttonContainer}>
        <TouchableOpacity style={styles.button} onPress={runAgent}>
          <Text style={styles.buttonText}>Suggest Me a Coffee!!</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.button, styles.secondaryButton]}
          onPress={() => openSettings()}
        >
          <Text style={styles.buttonText}>Open App Settings</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  ScreenContainer: {
    flexGrow: 1,
    backgroundColor: COLORS.primaryLightGreyHex,
    padding: SPACING.space_20,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.space_20,
  },
  avatar: {
    height: 40,
    width: 40,
    borderRadius: 20,
    marginRight: SPACING.space_12,
  },
  ScreenTitle: {
    fontSize: FONTSIZE.size_28,
    fontFamily: FONTFAMILY.poppins_semibold,
    color: COLORS.primaryWhiteHex,
  },
  status: {
    fontSize: FONTSIZE.size_14,
    color: COLORS.primaryWhiteHex,
    marginBottom: 6,
  },
  error: { color: 'red', marginBottom: 8 },
  coords: { color: COLORS.primaryOrangeHex, marginBottom: 12 },
  hint: { marginTop: 12, fontStyle: 'italic', color: COLORS.primaryWhiteHex },
  card: {
    backgroundColor: COLORS.primaryDarkGreyHex,
    borderRadius: 12,
    padding: SPACING.space_16,
    shadowColor: '#000',
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 3,
  },
  cardHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
  cardTitle: {
    fontSize: FONTSIZE.size_18,
    fontFamily: FONTFAMILY.poppins_medium,
    color: COLORS.primaryWhiteHex,
    marginLeft: 6,
  },
  cardText: { color: COLORS.primaryWhiteHex, fontSize: FONTSIZE.size_14 },
  jsonText: {
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    color: COLORS.primaryWhiteHex,
    fontSize: 12,
  },
  buttonContainer: { marginTop: 20 },
  button: {
    backgroundColor: COLORS.primaryOrangeHex,
    borderRadius: 10,
    paddingVertical: 12,
    paddingHorizontal: 16,
    marginBottom: 10,
    alignItems: 'center',
  },
  secondaryButton: { backgroundColor: COLORS.primaryDarkGreyHex },
  buttonText: {
    color: COLORS.primaryWhiteHex,
    fontSize: FONTSIZE.size_16,
    fontFamily: FONTFAMILY.poppins_medium,
  },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  loadingText: { marginTop: 8, color: COLORS.primaryWhiteHex },
});
