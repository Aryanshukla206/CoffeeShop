import React from 'react';
import {
  View,
  Text,
  Image,
  StyleSheet,
  TouchableOpacity,
  Alert,
  Platform,
} from 'react-native';
import {
  createDrawerNavigator,
  DrawerContentScrollView,
} from '@react-navigation/drawer';
import LinearGradient from 'react-native-linear-gradient';
import { COLORS } from '../theme/theme';
import CustomIcon from '../components/CustomIcon';
import BackgroundServiceScreen from '../screens/BackgroundServiceScreen';
import ComplainsScreen from '../screens/ComplainsScreen';
import ComplaintScreen from '../screens/ComplaintScreen';
import ProfileScreen from '../screens/ProfileScreen';
import { useAuth } from '../contexts/AuthContext';
import analytics from '@react-native-firebase/analytics';
import { appEvents } from '../services/events';
import inAppMessaging from '@react-native-firebase/in-app-messaging';

const Drawer = createDrawerNavigator();

function CustomDrawerContent(props: any) {
  const { navigation } = props;

  const menu = [
    { key: 'profile', label: 'Profile', screen: 'Profile', icon: 'user' },
    {
      key: 'background',
      label: 'Background Services',
      screen: 'BackgroundServices',
      icon: 'visa',
    },
    {
      key: 'register',
      label: 'Register Complaint',
      screen: 'RegisterComplaint',
      icon: 'add',
    },
    {
      key: 'view',
      label: 'View Complaints',
      screen: 'ViewComplaints',
      icon: 'search',
    },
  ];
  const { user, signOut, signInWithGoogle } = useAuth();

  const handleLogout = async () => {
    try {
      await signOut();
      appEvents({
        eventName: 'user_signed_out',
        payload: { name: 'user', age: 30 },
      });
      console.log('Analytics event logged: FireBaselogout');

      // Optional: Manually trigger message sync (helps in testing)
      await inAppMessaging().setMessagesDisplaySuppressed(false);
    } catch (err) {
      Alert.alert('Sign-out error', String(err));
    }
  };
  const onSignIn = async () => {
    try {
      await signInWithGoogle();
      appEvents({
        eventName: 'user_signed_in',
        payload: { email: 'test@gmail.com', user: 'testUser' },
      });
      console.log('Analytics event logged: FireBaseSignIn');

      // Optional: Manually trigger message sync (helps in testing)
      await inAppMessaging().setMessagesDisplaySuppressed(false);
    } catch (err) {
      Alert.alert('Sign-in error', String(err));
    }
  };

  return (
    <View style={styles.safeArea}>
      {/* Gradient header with avatar */}
      <LinearGradient
        colors={[COLORS.primaryOrangeHex, '#ff8a50']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.headerGradient}
      >
        <View style={styles.headerContent}>
          {user ? (
            <>
              <Image
                source={{ uri: user.photoURL ?? undefined }}
                style={styles.avatar}
              />
              <View style={styles.userInfo}>
                <Text style={styles.userName}>{user.displayName}</Text>
                <Text style={styles.userEmail}>{user.email}</Text>
                <TouchableOpacity
                  style={styles.logoutButton}
                  onPress={handleLogout}
                  accessibilityRole="button"
                >
                  <Text style={styles.logoutText}>Logout</Text>
                </TouchableOpacity>
              </View>
              <TouchableOpacity
                style={styles.editBtn}
                onPress={() => navigation.navigate('Profile')}
                accessibilityLabel="Edit profile"
              >
                <CustomIcon
                  name="add"
                  size={16}
                  color={COLORS.primaryWhiteHex}
                />
              </TouchableOpacity>
            </>
          ) : (
            <>
              <Image
                source={require('../assets/app_images/avatar.png')} // <-- add your avatar here
                style={styles.avatar}
                accessibilityLabel="User avatar"
              />
              <View style={styles.userInfo}>
                <Text style={styles.userName}>Aryan Shukla</Text>
                <Text style={styles.userEmail}>aryan.shukla@digicraft.ai</Text>
                <TouchableOpacity
                  style={styles.logoutButton}
                  onPress={onSignIn}
                  accessibilityRole="button"
                >
                  <Text style={styles.logoutText}>Login</Text>
                </TouchableOpacity>
              </View>
            </>
          )}
        </View>
      </LinearGradient>

      {/* Scrollable menu */}
      <DrawerContentScrollView
        {...props}
        contentContainerStyle={styles.scrollViewContent}
      >
        <View style={styles.menuContainer}>
          {menu.map(m => {
            const isActive =
              props.state?.routeNames?.[props.state?.index] === m.screen;
            return (
              <TouchableOpacity
                key={m.key}
                style={[styles.menuItem, isActive && styles.menuItemActive]}
                onPress={() => {
                  navigation.closeDrawer();
                  // small delay to allow drawer to close smoothly
                  setTimeout(() => navigation.navigate(m.screen), 200);
                }}
                accessibilityRole="button"
                accessibilityState={{ selected: isActive }}
              >
                <View style={styles.menuIcon}>
                  <CustomIcon
                    name={m.icon}
                    size={20}
                    color={
                      isActive
                        ? COLORS.primaryBlackRGBA
                        : COLORS.primaryWhiteHex
                    }
                  />
                </View>
                <Text
                  style={[styles.menuLabel, isActive && styles.menuLabelActive]}
                >
                  {m.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </DrawerContentScrollView>
    </View>
  );
}

// ---- Drawer Navigator (uses custom content) ----
const DrawerNavigator = () => {
  return (
    <Drawer.Navigator
      drawerContent={props => <CustomDrawerContent {...props} />}
      screenOptions={{
        headerShown: true,
        drawerStyle: {
          width: 300,
          backgroundColor: 'rgba(29, 27, 27, 0.45)', // gradient handles background
          borderTopRightRadius: 16,
          borderBottomRightRadius: 16,
          overflow: 'hidden',
          elevation: 10,
        },
        overlayColor: 'rgba(0,0,0,0.45)',
      }}
    >
      <Drawer.Screen
        name="Profile"
        options={{ drawerLabel: 'Profile' }}
        component={ProfileScreen}
      />
      <Drawer.Screen
        name="BackgroundServices"
        options={{ drawerLabel: 'Background Services' }}
        component={BackgroundServiceScreen}
      />
      <Drawer.Screen
        name="RegisterComplaint"
        options={{ drawerLabel: 'Register Complaint' }}
        component={ComplaintScreen}
      />
      <Drawer.Screen
        name="ViewComplaints"
        options={{ drawerLabel: 'View Complaints' }}
        component={ComplainsScreen}
      />
    </Drawer.Navigator>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: 'transparent',
    opacity: 1,
    backfaceVisibility: 'hidden',
  },
  headerGradient: {
    paddingVertical: 18,
    paddingHorizontal: 14,
    borderTopRightRadius: 16,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatar: {
    width: 64,
    height: 64,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: COLORS.primaryWhiteHex,
  },
  userInfo: {
    marginLeft: 12,
    flex: 1,
  },
  userName: {
    color: COLORS.primaryWhiteHex,
    fontSize: 16,
    fontWeight: '700',
  },
  userEmail: {
    color: COLORS.primaryWhiteHex,
    fontSize: 12,
    marginTop: 2,
    opacity: 0.9,
  },
  editBtn: {
    padding: 6,
    borderRadius: 8,
    backgroundColor: 'rgba(255,255,255,0.12)',
    justifyContent: 'center',
    alignItems: 'center',
  },

  scrollViewContent: {
    paddingTop: 6,
    paddingBottom: 8,
    opacity: 1,
  },
  menuContainer: {
    paddingVertical: 8,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    marginHorizontal: 8,
    borderRadius: 10,
  },
  menuItemActive: {
    backgroundColor: COLORS.primaryOrangeHex, // subtle active background
  },
  menuIcon: {
    width: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  menuLabel: {
    flex: 1,
    marginLeft: 2,
    fontSize: 15,
    color: COLORS.primaryWhiteHex,
  },
  menuLabelActive: {
    color: COLORS.primaryBlackHex,
    fontWeight: '900',
  },

  footer: {
    borderTopWidth: 10,
    borderTopColor: 'rgba(0,0,0,0.05)',
    padding: 2,
    paddingBottom: 10,
    backgroundColor: COLORS.primaryWhiteHex,
  },
  logoutButton: {
    padding: 5,
    borderRadius: 20,
    borderColor: 'blue',
    borderCurve: 'circular',
  },
  logoutText: {
    marginLeft: 40,
    color: COLORS.primaryWhiteHex,
    fontWeight: '900',
  },
  versionText: {
    marginTop: 8,
    color: COLORS.primaryWhiteHex,
    fontSize: 24,
    textAlign: 'center',
  },
});

export default DrawerNavigator;
