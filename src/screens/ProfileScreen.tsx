import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  Alert,
  StatusBar,
  Button,
  Platform,
} from 'react-native';
import { useAuth } from '../contexts/AuthContext';
import { COLORS } from '../theme/theme';
import Share from 'react-native-share';
import RNFS from 'react-native-fs';
import Notification from '../pushNotification/notification';
import analytics from '@react-native-firebase/analytics';

const ProfileScreen = ({ navigation }: any) => {
  const { user, initializing, signInWithGoogle, signOut } = useAuth();


  if (initializing) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  const onShare = async () => {
    try {
      const destPath = `${RNFS.CachesDirectoryPath}/logo.png`;

      if (Platform.OS === 'android') {
        await RNFS.copyFileAssets('logo.png', destPath);
      } else {
        const source = `${RNFS.MainBundlePath}/logo.png`;
        await RNFS.copyFile(source, destPath);
      }

      const shareOptions = {
        message: 'Order your next Coffee from this App !! ☕️',
        url: 'file://' + destPath,
        type: 'image/png',
      };

      await Share.open(shareOptions);
    } catch (error) {
      console.log('Share Error:', error);
    }
  };

  const onSignIn = async () => {
    try {
      await signInWithGoogle();
      await analytics().logEvent('User Signed in', { source: 'debug' });
    } catch (err) {
      Alert.alert('Sign-in error', String(err));
    }
  };

  const onSignOut = async () => {
    try {
      await signOut();
      await analytics().logEvent('User Logged Out', { source: 'debug' });
    } catch (err) {
      Alert.alert('Sign-out error', String(err));
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar backgroundColor={COLORS.primaryBlackHex} />
      {user ? (
        <>
          <Notification />
          <Image
            source={{ uri: user.photoURL ?? undefined }}
            style={styles.avatar}
          />
          <Text style={styles.name}>{user.displayName}</Text>
          <Text style={styles.email}>{user.email}</Text>
          <TouchableOpacity
            style={styles.button}
            onPress={() => navigation.navigate('BackgroundService')}
          >
            <Text style={styles.buttonText}>Background Services</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.button}
            onPress={() => navigation.navigate('ComplaintForm')}
          >
            <Text style={styles.buttonText}>Register Complaint</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.button}
            onPress={() => navigation.navigate('ComplainsScreen')}
          >
            <Text style={styles.buttonText}>View Complaints</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.button} onPress={onShare}>
            <Text style={styles.buttonText}>Share App</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.button} onPress={onSignOut}>
            <Text style={styles.buttonText}>Logout</Text>
          </TouchableOpacity>
        </>
      ) : (
        <>
          <Text style={styles.title}>Welcome ☕</Text>
          <Text style={styles.subtitle}>
            Please sign in to save orders & access your profile.
          </Text>

          <TouchableOpacity style={styles.button} onPress={onSignIn}>
            <Text style={styles.buttonText}>Sign in with Google</Text>
          </TouchableOpacity>
        </>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.primaryBlackHex,
    padding: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  title: { fontSize: 22, color: '#fff', fontWeight: '700', marginBottom: 8 },
  subtitle: {
    fontSize: 14,
    color: '#666',
    marginBottom: 20,
    textAlign: 'center',
  },
  avatar: { width: 100, height: 100, borderRadius: 50, marginBottom: 12 },
  name: { fontSize: 18, fontWeight: '600' },
  email: { color: 'white', marginBottom: 20 },
  button: {
    marginTop: 10,
    backgroundColor: '#4285F4',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  buttonText: { color: '#fff', fontWeight: '600' },
});

export default ProfileScreen;
