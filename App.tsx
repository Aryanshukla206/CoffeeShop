// import { NavigationContainer } from '@react-navigation/native';
// import { createNativeStackNavigator } from '@react-navigation/native-stack';
// import DetailsScreen from './src/screens/DetailsScreen'; // for native stack navigator
// import TabNavigator from './src/navigators/TabNavigator';
// import { AuthProvider } from './src/contexts/AuthContext';
// import Notification from './src/pushNotification/notification';
// import ComplaintForm from './src/screens/ComplaintScreen';
// import ComplainsScreen from './src/screens/ComplainsScreen';
// import { SafeAreaView } from 'react-native-safe-area-context';
// import AgentScreen from './src/screens/AgentScreen';

// import CaptureScreen from './src/screens/CaptureScreen';
// import VideoCaptureScreen from './src/screens/VideoCapture';
// import JsStepCaptureScreen from './src/screens/StepScreen';
// import StepCaptureScreen from './src/screens/StepCaptureScreen';
// import DashboardScreen from './src/screens/DashBoardScreen';
// import MainScreen from './src/screens/MainScreen';
// import VideoPlayerScreen from './src/screens/VideoPlayerScreen';

// import inAppMessaging from '@react-native-firebase/in-app-messaging';
// import analytics from '@react-native-firebase/analytics';

// import { useEffect } from 'react';

// const linking = {
//   prefixes: ['coffeeshop://'], // deep link prefix
//   config: {
//     screens: {
//       Home: 'Home',
//       DashboardScreen: 'DashboardScreen',
//     },
//   },
// };

// const stack = createNativeStackNavigator();
// const App = () => {
//   // useEffect(() => {
//   //   // suppress very early while loading
//   //   inAppMessaging().setMessagesDisplaySuppressed(true);

//   //   // after you finish initializing (user ready), allow messages:
//   //   const enableMessages = async () => {
//   //     await inAppMessaging().setMessagesDisplaySuppressed(false);
//   //   };
//   //   enableMessages();
//   // }, []);

//   useEffect(() => {
//     (async () => {
//       // start suppressed immediately (optional)
//       await inAppMessaging().setMessagesDisplaySuppressed(true);

//       // small delay to simulate init / splash
//       setTimeout(async () => {
//         await inAppMessaging().setMessagesDisplaySuppressed(false);
//         console.log('IAM allowed');
//       }, 1000);
//     })();
//   }, []);
//   // const triggerTestEvent = async () => {
//   //   await analytics().logEvent('health_dashboard_promo');
//   //   console.log('analytics event logged: health_dashboard_promo');
//   // };

//   const WEB_CLIENT_ID =
//     '714711678580-vo721svv1linmadgac59i3c19g8uhgd6.apps.googleusercontent.com';
//   return (
//     <SafeAreaView style={{ flex: 1 }}>
//       <AuthProvider webClientId={WEB_CLIENT_ID}>
//         <NavigationContainer linking={linking}>
//           {/* <Notification /> */}
//           <stack.Navigator screenOptions={{ headerShown: false }}>
//             <stack.Screen
//               name="Tab"
//               component={TabNavigator}
//               options={{ animation: 'slide_from_bottom' }}
//             ></stack.Screen>
//             <stack.Screen
//               name="Details"
//               component={DetailsScreen}
//               options={{ animation: 'slide_from_bottom' }}
//             ></stack.Screen>
//             <stack.Screen
//               name="ComplaintForm"
//               component={ComplaintForm}
//               options={{ animation: 'slide_from_bottom' }}
//             />
//             <stack.Screen
//               name="ComplainsScreen"
//               component={ComplainsScreen}
//               options={{ animation: 'slide_from_bottom' }}
//             />
//             <stack.Screen
//               name="AgentScreen"
//               component={AgentScreen}
//               options={{ animation: 'slide_from_bottom' }}
//             />
//             <stack.Screen
//               name="CaptureScreen"
//               component={CaptureScreen}
//               options={{ animation: 'slide_from_bottom' }}
//             />
//             <stack.Screen
//               name="CaptureVideo"
//               component={VideoCaptureScreen}
//               options={{ animation: 'slide_from_bottom' }}
//             />
//             <stack.Screen
//               name="StepScreen"
//               component={JsStepCaptureScreen}
//               options={{ animation: 'slide_from_bottom' }}
//             />
//             <stack.Screen
//               name="StepCaptureScreen"
//               component={StepCaptureScreen}
//               options={{ animation: 'slide_from_bottom' }}
//             />
//             <stack.Screen
//               name="DashBoardScreen"
//               component={DashboardScreen}
//               options={{ animation: 'slide_from_bottom' }}
//             />
//             <stack.Screen
//               name="MainScreen"
//               component={MainScreen}
//               options={{ animation: 'slide_from_bottom' }}
//             />
//             <stack.Screen
//               name="LiveStream"
//               component={VideoPlayerScreen}
//               options={{ animation: 'slide_from_bottom' }}
//             />
//           </stack.Navigator>
//         </NavigationContainer>
//       </AuthProvider>
//     </SafeAreaView>
//   );
// };

// export default App;

// App.js
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
import Notification from './src/pushNotification/notification';
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
import analytics from '@react-native-firebase/analytics';

const navigationRef = createNavigationContainerRef();
const stack = createNativeStackNavigator();

/**
 * Keep a linking config to allow RN to handle links automatically
 * Mapping path 'dashboard' -> screen 'DashBoardScreen'
 */
const linking = {
  prefixes: ['coffeeshop://'],
  config: {
    screens: {
      Tab: 'home', // optional mapping for tab root
      DashBoardScreen: 'dashboard', // coffeeshop://dashboard -> DashBoardScreen
      MainScreen: 'main', // coffeeshop://main -> MainScreen
      Details: 'details/:id', // example with param
      // add other mappings if you need them
    },
  },
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
    let isMounted = true;

    // handle a URL (either initial or incoming)
    const handleUrl = (url : any) => {
      console.log(url, 'from inAppMessaging ------------>');
      if (!url) return;
      console.log('[DeepLink] received url ->', url);

      // normalize and parse path
      try {
        // remove scheme
        const withoutScheme = url.replace(/.*?:\/\//g, '');
        // path part (strip query)
        const path = withoutScheme.split('?')[0];
        console.log('[DeepLink] path ->', path);

        // simple routing rules — extend as needed
        if (path === 'dashboard' || path.startsWith('dashboard/')) {
          if (navigationRef.isReady()) {
            navigationRef.navigate('DashBoardScreen');
          } else {
            // navigation not ready; schedule it (works on cold start)
            const unreadyTimer = setInterval(() => {
              if (navigationRef.isReady()) {
                clearInterval(unreadyTimer);
                navigationRef.navigate('DashBoardScreen');
              }
            }, 200);
          }
          return;
        }

        if (path === 'main' || path.startsWith('main/')) {
          if (navigationRef.isReady()) {
            navigationRef.navigate('MainScreen');
          } else {
            const unreadyTimer = setInterval(() => {
              if (navigationRef.isReady()) {
                clearInterval(unreadyTimer);
                navigationRef.navigate('MainScreen');
              }
            }, 200);
          }
          return;
        }

        // Example: details/:id -> navigate with param
        // if (path.startsWith('details/')) {
        //   const id = path.split('/')[1];
        //   if (navigationRef.isReady()) {
        //     navigationRef.navigate('Details', { id });
        //   }
        //   return;
        // }

        console.log('[DeepLink] no matching route for path:', path);
      } catch (err) {
        console.error('[DeepLink] parse error', err);
      }
    };

    // read initial url (cold start)
    (async () => {
      try {
        const initialUrl = await Linking.getInitialURL();
        console.log('[DeepLink] initialURL:', initialUrl);
        if (initialUrl) handleUrl(initialUrl);
      } catch (e) {
        console.error('[DeepLink] getInitialURL error', e);
      }
    })();

    // subscribe to incoming urls
    const subscription =
      Linking.addEventListener &&
      Linking.addEventListener('url', event => {
        const url = event?.url ?? event;
        console.log('[DeepLink] incoming url event:', url);
        handleUrl(url);
      });

    // cleanup
    return () => {
      isMounted = false;
      try {
        if (subscription && subscription.remove) subscription.remove();
        else
          Linking.removeEventListener &&
            Linking.removeEventListener('url', handleUrl);
      } catch (err) {
        // ignore
      }
    };
  }, []);

  useEffect(() => {
  const logUrl = async () => {
    const initialUrl = await Linking.getInitialURL();
    console.log('[DeepLink] initialURL ->', initialUrl);
  };
  logUrl();

  const handler = event => {
    const url = event?.url ?? event;
    console.log('[DeepLink] incoming url ->', url);
  };

  const sub = Linking.addEventListener ? Linking.addEventListener('url', handler) : Linking.addEventListener('url', handler);
  return () => {
    if (sub && sub.remove) sub.remove();
    else Linking.removeEventListener && Linking.removeEventListener('url', handler);
  };
}, []);

  const WEB_CLIENT_ID =
    '714711678580-vo721svv1linmadgac59i3c19g8uhgd6.apps.googleusercontent.com';

  return (
    <SafeAreaView style={{ flex: 1 }}>
      <AuthProvider webClientId={WEB_CLIENT_ID}>
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
          </stack.Navigator>
        </NavigationContainer>
      </AuthProvider>
    </SafeAreaView>
  );
};

export default App;
