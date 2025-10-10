import analytics from '@react-native-firebase/analytics';

import { Alert } from 'react-native';

export const appEvents = async ({ eventName = '', payload = {} }) => {
  try {
    await analytics().logEvent(eventName, payload);
    console.log(
      'Event  : ' + eventName + 'triggered with payload : ' + payload,
    );
  } catch (error) {
    Alert.alert('events not captured : ' + error);
  }
};
