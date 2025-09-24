import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import DetailsScreen from './src/screens/DetailsScreen'; // for native stack navigator
import TabNavigator from './src/navigators/TabNavigator';
import { AuthProvider } from './src/contexts/AuthContext';
import Notification from './src/pushNotification/notification';
import ComplaintForm from './src/screens/ComplaintScreen';
import ComplainsScreen from './src/screens/ComplainsScreen';
import {
  SafeAreaView,
} from 'react-native-safe-area-context';
import AgentScreen from './src/screens/AgentScreen';

import CaptureScreen from './src/screens/CaptureScreen';
import VideoCaptureScreen from './src/screens/VideoCapture';
const stack = createNativeStackNavigator();
const App = () => {
  const WEB_CLIENT_ID =
    '965192633882-n9gue9isqj1g4mq00tosr3n3d7t0h63e.apps.googleusercontent.com';

  return (
    <SafeAreaView style={{ flex: 1 }}>
      <AuthProvider webClientId={WEB_CLIENT_ID}>
        <NavigationContainer>
          <Notification />
          <stack.Navigator screenOptions={{ headerShown: false }}>
            <stack.Screen
              name="Tab"
              component={TabNavigator}
              options={{ animation: 'slide_from_bottom' }}
            ></stack.Screen>
            <stack.Screen
              name="Details"
              component={DetailsScreen}
              options={{ animation: 'slide_from_bottom' }}
            ></stack.Screen>
            <stack.Screen
              name="ComplaintForm"
              component={ComplaintForm}
              options={{ animation: 'slide_from_bottom' }}
            />
            <stack.Screen
              name="ComplainsScreen"
              component={ComplainsScreen}
              options={{ animation: 'slide_from_bottom' }}
            />
            <stack.Screen
              name="AgentScreen"
              component={AgentScreen}
              options={{ animation: 'slide_from_bottom' }}
            />
            <stack.Screen
              name="CaptureScreen"
              component={CaptureScreen}
              options={{ animation: 'slide_from_bottom' }}
            />
            <stack.Screen
              name="CaptureVideo"
              component={VideoCaptureScreen}
              options={{ animation: 'slide_from_bottom' }}
            />
          </stack.Navigator>
        </NavigationContainer>
      </AuthProvider>
    </SafeAreaView>
  );
};

export default App;
