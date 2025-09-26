import { Alert, PermissionsAndroid, Platform } from 'react-native';
import { StyleSheet, Text, View } from 'react-native';
import React, { useEffect, useState } from 'react';
import messaging from '@react-native-firebase/messaging';

const Notification = () => {
  const [token, setToken] = useState('');

  useEffect(() => {
    requestPermission();
  }, []);

  useEffect(() => {
    const unsubscribe = messaging().onMessage(async remoteMessage => {
      Alert.alert('📩 New FCM message!', JSON.stringify(remoteMessage));
    });

    return unsubscribe;
  }, []);

  const requestPermission = async () => {
    try {
      if (Platform.OS === 'android') {
        const result = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.POST_NOTIFICATIONS,
        );
        if (result === PermissionsAndroid.RESULTS.GRANTED) {
          console.log('✅ Notification permission granted');
          requestToken();
        } else {
          Alert.alert('❌ Permission Denied for Push Notifications');
        }
      } else {
        // iOS permission
        const authStatus = await messaging().requestPermission();
        const enabled =
          authStatus === messaging.AuthorizationStatus.AUTHORIZED ||
          authStatus === messaging.AuthorizationStatus.PROVISIONAL;

        if (enabled) {
          console.log('✅ iOS notification permission granted');
          requestToken();
        }
      }
    } catch (error) {
      console.log('Permission error:', error);
    }
  };

  const requestToken = async () => {
    try {
      await messaging().registerDeviceForRemoteMessages();
      const token = await messaging().getToken();
      setToken(token);
      console.log('📱 FCM Token:', token);
    } catch (error) {
      console.log('Token error:', error);
    }
  };

  return (
    <>
      <Text style={styles.text} selectable> {token} </Text>
    </>
  );
};

const styles = StyleSheet.create({
  text : {
    color : 'white',
  }
});
export default Notification;
