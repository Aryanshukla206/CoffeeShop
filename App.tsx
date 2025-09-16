import { NavigationContainer } from '@react-navigation/native'
import  { createNativeStackNavigator } from '@react-navigation/native-stack'
import PaymentScreen from './src/screens/PaymentScreen' // for native stack navigator
import DetailsScreen from './src/screens/DetailsScreen' // for native stack navigator
import TabNavigator from './src/navigators/TabNavigator'
import { AuthProvider } from './src/contexts/AuthContext';
const stack = createNativeStackNavigator();
const App = () => {
  const WEB_CLIENT_ID = '614978611115-9kj2ps5m0d7lnqqi0soab3fgc37f3uoi.apps.googleusercontent.com'

  return (
    <AuthProvider webClientId={WEB_CLIENT_ID}>
      <NavigationContainer>
        <stack.Navigator screenOptions={{headerShown: false}}>
          <stack.Screen
            name="Tab"
            component={TabNavigator}
            options={{animation: 'slide_from_bottom'}}></stack.Screen>
          <stack.Screen 
            name='Details'
            component={DetailsScreen}
            options={{animation : 'slide_from_bottom' }}
          ></stack.Screen>
          <stack.Screen 
            name='Payments'
            component={PaymentScreen}
            options={{animation : 'slide_from_bottom' }}
          ></stack.Screen>
        </stack.Navigator>
      </NavigationContainer>
    </AuthProvider>


  )
}

export default App
