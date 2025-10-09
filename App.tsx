import 'react-native-gesture-handler';

import React, { useEffect, useRef } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Linking, Platform } from 'react-native';
import {
  NavigationContainer,
  createNavigationContainerRef,
} from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import DetailsScreen from './src/screens/DetailsScreen';
import TabNavigator from './src/navigators/TabNavigator';
import { AuthProvider } from './src/contexts/AuthContext';
import ComplaintForm from './src/screens/ComplaintScreen';
import ComplainsScreen from './src/screens/ComplainsScreen';
import AgentScreen from './src/screens/AgentScreen';
import CaptureScreen from './src/screens/CaptureScreen';
import VideoCaptureScreen from './src/screens/VideoCapture';
import JsStepCaptureScreen from './src/screens/StepScreen';
import StepCaptureScreen from './src/screens/StepCaptureScreen';
import DashboardScreen from './src/screens/DashBoardScreen';
import MainScreen from './src/screens/MainScreen';
import VideoPlayerScreen from './src/screens/VideoPlayerScreen';

import inAppMessaging from '@react-native-firebase/in-app-messaging';
import { NotificationProvider } from './src/contexts/NotificationContext';
import BackgroundServiceScreen from './src/screens/BackgroundServiceScreen';
// import { navigationRef } from './src/navigators/navigationService';

// import { RealmProvider } from '@realm/react';
// import { UserSchema } from './src/models/User';
// import { Preference } from './src/models/Preferences';
// import { CoffeeSchema } from './src/models/Coffee';

const navigationRef = createNavigationContainerRef();
const stack = createNativeStackNavigator();

const linking = {
  prefixes: ['coffeeHouse://', 'https://coffeehouse.com'],
  config: {
    screens: {
      Tab: 'home',
      DashBoardScreen: 'dashboard', // coffeeshop://dashboard -> DashBoardScreen
      MainScreen: 'main', // coffeeshop://main -> MainScreen
      Details: 'details/:id',
      BackgroundServiceScreen: 'BackgroundService',
    },
  },
};
const waitForNavigationAndNavigate = (
  navigateFn: () => void,
  timeout = 5000,
) => {
  const start = Date.now();
  const timer = setInterval(() => {
    if (navigationRef.isReady()) {
      clearInterval(timer);
      navigateFn();
    } else if (Date.now() - start > timeout) {
      clearInterval(timer);
      console.warn('[DeepLink] nav not ready within timeout, skipping');
    }
  }, 150);
};
const App = () => {
  // IAM initialization: keep what you had
  useEffect(() => {
    (async () => {
      try {
        await inAppMessaging().setMessagesDisplaySuppressed(true);
        setTimeout(async () => {
          await inAppMessaging().setMessagesDisplaySuppressed(false);
          console.log('IAM allowed');
        }, 1000);
      } catch (e) {
        console.warn('IAM init err', e);
      }
    })();
  }, []);

  // Programmatic deep link handler
  useEffect(() => {
    // Handler that accepts either a string URL or an event with .url
    const handleUrl = (
      incoming: string | { url?: string } | null | undefined,
    ) => {
      try {
        const urlString =
          typeof incoming === 'string' ? incoming : incoming?.url;
        if (!urlString) return;

        console.log('[DeepLink] raw url:', urlString);

        // Parse using URL (polyfilled). Works for both custom schemes and https.
        // const parsed = new URL(urlString);
        // console.log(parsed, 'parsed URL');

        // path: remove leading slash(es)

        const re = /^[a-zA-Z][a-zA-Z0-9+.\-]*:\/\/([^\/\?#]+)(?:\/([^?\#]*))?/;
        const path = urlString.match(re);
        console.log(path[1]);
        console.log(path[2]);

        // const path = (urlString || '').replace(/^\/+/, ''); // e.g. 'details/123'
        // console.log('[DeepLink] path ->', path);

        // ROUTING LOGIC
        if (path[1] === 'dashboard' || path[1].startsWith('dashboard/')) {
          const navigate = () => navigationRef.navigate('DashBoardScreen');
          if (navigationRef.isReady()) navigate();
          else waitForNavigationAndNavigate(navigate);
          return;
        }

        if (path[1] === 'main' || path[1].startsWith('main/')) {
          const navigate = () => navigationRef.navigate('MainScreen');
          if (navigationRef.isReady()) navigate();
          else waitForNavigationAndNavigate(navigate);
          return;
        }

        if (
          path[1] === 'BackgroundService' ||
          path[1].startsWith('BackgroundService/')
        ) {
          const navigate = () =>
            navigationRef.navigate('BackgroundServiceScreen', {
              screen: 'BackgroundServiceScreen',
            });
          if (navigationRef.isReady()) navigate();
          else waitForNavigationAndNavigate(navigate);
          return;
        }

        // if (path[1].startsWith('details/')) {
        //   const id = path[2];
        //   // safe access to searchParams (URL polyfill gives this)
        //   const type = parsed.searchParams?.get('type') ?? 'coffee';
        //   const index = parsed.searchParams?.get('index')
        //     ? parseInt(parsed.searchParams.get('index')!, 10)
        //     : 0;

        //   console.log('[DeepLink] details ->', { id, type, index });

        //   const navigate = () =>
        //     navigationRef.navigate('Details', {
        //       id,
        //       type,
        //       index,
        //     });

        //   if (navigationRef.isReady()) navigate();
        //   else waitForNavigationAndNavigate(navigate);
        //   return;
        // }

        console.log('[DeepLink] no matching route for path:', path);
      } catch (err) {
        console.error('[DeepLink] parse error', err);
      }
    };

    // Cold start: getInitialURL
    (async () => {
      try {
        const initialUrl = await Linking.getInitialURL();
        if (initialUrl) {
          console.log('[DeepLink] initialURL:', initialUrl);
          handleUrl(initialUrl);
        }
      } catch (e) {
        console.error('[DeepLink] getInitialURL error', e);
      }
    })();

    // Subscribe to incoming links while the app is running.
    // Newer RN: Linking.addEventListener returns subscription with remove(); older RN used removeEventListener
    const eventHandler = (event: any) => {
      // event may be string or { url }
      const url = event?.url ?? event;
      console.log('[DeepLink] incoming event:', url);
      handleUrl(url);
    };

    let subscription: { remove?: () => void } | null = null;
    try {
      // Preferred modern API
      subscription = Linking.addEventListener('url', eventHandler);
    } catch (e) {
      // Fallback for older RN: addEventListener returns nothing; use legacy API
      Linking.addEventListener('url', eventHandler);
      subscription = null;
    }

    return () => {
      // Cleanup
      try {
        if (subscription && typeof subscription.remove === 'function') {
          subscription.remove();
        } else {
          // legacy
          Linking.removeEventListener &&
            Linking.removeEventListener('url', eventHandler);
        }
      } catch (err) {
        // ignore cleanup errors
      }
    };
  }, []);

  const WEB_CLIENT_ID =
    '714711678580-vo721svv1linmadgac59i3c19g8uhgd6.apps.googleusercontent.com';

  return (
    <SafeAreaView style={{ flex: 1 }}>
      <NotificationProvider>
        <AuthProvider webClientId={WEB_CLIENT_ID}>
          {/* <RealmProvider deleteRealmIfMigrationNeeded schema={[ UserSchema, CoffeeSchema]} > */}
          <NavigationContainer linking={linking} ref={navigationRef}>
            {/* <Notification /> */}
            <stack.Navigator screenOptions={{ headerShown: false }}>
              <stack.Screen
                name="Tab"
                component={TabNavigator}
                options={{ animation: 'slide_from_bottom' }}
              />
              <stack.Screen
                name="Details"
                component={DetailsScreen}
                options={{ animation: 'slide_from_bottom' }}
              />
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
              <stack.Screen
                name="StepScreen"
                component={JsStepCaptureScreen}
                options={{ animation: 'slide_from_bottom' }}
              />
              <stack.Screen
                name="StepCaptureScreen"
                component={StepCaptureScreen}
                options={{ animation: 'slide_from_bottom' }}
              />
              <stack.Screen
                name="DashBoardScreen"
                component={DashboardScreen}
                options={{ animation: 'slide_from_bottom' }}
              />
              <stack.Screen
                name="MainScreen"
                component={MainScreen}
                options={{ animation: 'slide_from_bottom' }}
              />
              <stack.Screen
                name="LiveStream"
                component={VideoPlayerScreen}
                options={{ animation: 'slide_from_bottom' }}
              />
              <stack.Screen
                name="BackgroundService"
                component={BackgroundServiceScreen}
                options={{ animation: 'slide_from_bottom' }}
              />
            </stack.Navigator>
          </NavigationContainer>
          {/* </RealmProvider> */}
        </AuthProvider>
      </NotificationProvider>
    </SafeAreaView>
  );
};

export default App;
