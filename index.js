/**
 * @format
 */
import 'react-native-gesture-handler'; // if you use gesture handler - first
import 'react-native-reanimated';      // must be before other imports that use reanimated

import 'fast-text-encoding';
import { AppRegistry } from 'react-native';
import App from './App';
import { name as appName } from './app.json';

AppRegistry.registerComponent(appName, () => App);
