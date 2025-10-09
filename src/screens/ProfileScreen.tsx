import React, { useEffect, useRef, useState } from 'react';
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
  ScrollView,
  TextInput,
} from 'react-native';
import { useAuth } from '../contexts/AuthContext';
import { COLORS } from '../theme/theme';
import Share from 'react-native-share';
import RNFS from 'react-native-fs';
import Notification from '../pushNotification/notification';
import analytics from '@react-native-firebase/analytics';

import Realm from 'realm';
import { CoffeeSchema } from '../models/Coffee';
import { UserSchema } from '../models/User';

const ProfileScreen = ({ navigation }: any) => {
  const { user, initializing, signInWithGoogle, signOut } = useAuth();
  console.log(user, 'user after authentication =====+>');

  // Local states for editing
  const [name, setName] = useState('');
  const [bio, setBio] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [loadingRealm, setLoadingRealm] = useState(true);

  const realmRef = useRef<Realm | null>(null);

  // Use uid if present, otherwise use email as a fallback id
  const userId = user?.uid ?? user?.email ?? 'guest';

  useEffect(() => {
    let realm: Realm;
    try {
      realm = new Realm({
        schema: [UserSchema, CoffeeSchema],
        schemaVersion: 1,
      });
      realmRef.current = realm;

      // load user if exists; else create
      realm.write(() => {
        const existing = realm.objectForPrimaryKey('User', userId) as
          | Realm.Object
          | undefined;
        if (!existing && user) {
          realm.create('User', {
            id: userId,
            name: user.displayName ?? '',
            email: user.email ?? '',
            iconLink: user.photoURL ?? '',
            bio: '',
            coffees: [],
          });
        }
      });
      // read values to local state
      const obj = realm.objectForPrimaryKey('User', userId) as any;
      if (obj) {
        setName(obj.name ?? user?.displayName ?? '');
        setBio(obj.bio ?? '');
      }
    } catch (err) {
      console.error('Realm open error', err);
      Alert.alert('Storage error', 'Could not open local database.');
    } finally {
      setLoadingRealm(false);
    }
    return () => {
      try {
        if (realmRef.current && !realmRef.current.isClosed) {
          realmRef.current.close();
          realmRef.current = null;
        }
      } catch (err) {
        console.warn('Error closing realm', err);
      }
    };
  }, [userId]); // reload if userId changes

  if (initializing || loadingRealm) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  // --- Persist name & bio to realm
  const saveProfileToRealm = () => {
    const realm = realmRef.current;
    if (!realm) {
      Alert.alert('Error', 'Local database not available.');
      return;
    }
    try {
      realm.write(() => {
        // if object exists update, otherwise create
        const existing = realm.objectForPrimaryKey('User', userId) as any;
        if (existing) {
          existing.name = name;
          existing.bio = bio;
        } else {
          realm.create('User', {
            id: userId,
            name,
            email: user?.email ?? '',
            iconLink: user?.photoURL ?? '',
            bio,
            coffees: [],
          });
        }
      });
      setIsEditing(false);
    } catch (err) {
      console.error('Realm write error', err);
      Alert.alert('Save error', 'Could not save profile locally.');
    }
  };

  // clear bio (delete bio)
  const deleteBio = () => {
    const realm = realmRef.current;
    if (!realm) return;
    try {
      realm.write(() => {
        const existing = realm.objectForPrimaryKey('User', userId) as any;
        if (existing) {
          existing.bio = '';
        }
      });
      setBio('');
      setIsEditing(false);
    } catch (err) {
      console.error('Realm delete error', err);
    }
  };

  // Example: add a Coffee item linked to the user
  const addCoffee = (title = 'New Coffee', size = 'Medium') => {
    const realm = realmRef.current;
    if (!realm) return;
    const id = `${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
    try {
      realm.write(() => {
        const coffeeObj = realm.create('Coffee', {
          id,
          title,
          size,
          notes: '',
          createdAt: new Date(),
        });
        const userObj = realm.objectForPrimaryKey('User', userId) as any;
        if (userObj) {
          userObj.coffees.push(coffeeObj);
        }
      });
      Alert.alert('Saved', 'Coffee added to your profile (local).');
    } catch (err) {
      console.error('addCoffee error', err);
    }
  };

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
    <ScrollView contentContainerStyle={styles.container}>
      <StatusBar backgroundColor={COLORS.primaryBlackHex} />
      {user ? (
        <>
          <Notification />
          <Image
            source={{ uri: user.photoURL ?? undefined }}
            style={styles.avatar}
          />
          {/* NAME */}
          <View style={{ width: '100%', alignItems: 'center' }}>
            <Text style={{ color: '#fff', marginBottom: 6 }}>Name</Text>
            <TextInput
              value={name}
              onChangeText={setName}
              editable={isEditing}
              placeholder="Your name"
              placeholderTextColor="#888"
              style={[styles.input, !isEditing && styles.readonlyInput]}
            />
          </View>

          {/* EMAIL */}
          <Text style={styles.email}>{user.email}</Text>

          {/* BIO */}
          <View style={{ width: '100%', marginTop: 12 }}>
            <Text style={{ color: '#fff', marginBottom: 6 }}>Bio</Text>
            <TextInput
              value={bio}
              onChangeText={setBio}
              editable={isEditing}
              placeholder="Write a short bio..."
              placeholderTextColor="#888"
              multiline
              numberOfLines={4}
              style={[styles.textarea, !isEditing && styles.readonlyInput]}
            />
          </View>

          {/* Buttons: Edit / Save / Delete */}
          <View style={{ flexDirection: 'row', marginTop: 12 }}>
            {!isEditing ? (
              <TouchableOpacity
                style={[styles.smallButton, { backgroundColor: '#4CAF50' }]}
                onPress={() => setIsEditing(true)}
              >
                <Text style={styles.buttonText}>Edit</Text>
              </TouchableOpacity>
            ) : (
              <TouchableOpacity
                style={styles.smallButton}
                onPress={saveProfileToRealm}
              >
                <Text style={styles.buttonText}>Save</Text>
              </TouchableOpacity>
            )}

            <TouchableOpacity
              style={[
                styles.smallButton,
                { marginLeft: 8, backgroundColor: '#E53935' },
              ]}
              onPress={() =>
                Alert.alert(
                  'Delete bio?',
                  'This will clear your bio locally.',
                  [
                    { text: 'Cancel', style: 'cancel' },
                    { text: 'OK', onPress: deleteBio },
                  ],
                )
              }
            >
              <Text style={styles.buttonText}>Delete Bio</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.smallButton,
                { marginLeft: 8, backgroundColor: '#1976D2' },
              ]}
              onPress={() => addCoffee('Espresso', 'Small')}
            >
              <Text style={styles.buttonText}>Add Coffee (demo)</Text>
            </TouchableOpacity>
          </View>

          {/* Navigation & other actions */}
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
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 24,
    backgroundColor: COLORS.primaryBlackHex,
    alignItems: 'center',
    paddingBottom: 60,
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
    width: '100%',
    alignItems: 'center',
  },
  buttonText: { color: '#fff', fontWeight: '600' },
  input: {
    width: '95%',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: '#fff',
    color: '#000',
    fontSize: 16,
  },
  textarea: {
    width: '95%',
    minHeight: 90,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: '#fff',
    color: '#000',
    textAlignVertical: 'top',
  },
  readonlyInput: {
    backgroundColor: '#222', // darker when readonly to match theme
    color: '#fff',
  },
  smallButton: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: '#555',
    alignItems: 'center',
  },
});

export default ProfileScreen;
  
  
  
//   (
//     <View style={styles.container}>
//       <StatusBar backgroundColor={COLORS.primaryBlackHex} />
//       {user ? (
//         <>
//           <Notification />
//           <Image
//             source={{ uri: user.photoURL ?? undefined }}
//             style={styles.avatar}
//           />
//           <Text style={styles.name}>{user.displayName}</Text>
//           <Text style={styles.email}>{user.email}</Text>
//           <TouchableOpacity
//             style={styles.button}
//             onPress={() => navigation.navigate('BackgroundService')}
//           >
//             <Text style={styles.buttonText}>Background Services</Text>
//           </TouchableOpacity>
//           <TouchableOpacity
//             style={styles.button}
//             onPress={() => navigation.navigate('ComplaintForm')}
//           >
//             <Text style={styles.buttonText}>Register Complaint</Text>
//           </TouchableOpacity>
//           <TouchableOpacity
//             style={styles.button}
//             onPress={() => navigation.navigate('ComplainsScreen')}
//           >
//             <Text style={styles.buttonText}>View Complaints</Text>
//           </TouchableOpacity>
//           <TouchableOpacity style={styles.button} onPress={onShare}>
//             <Text style={styles.buttonText}>Share App</Text>
//           </TouchableOpacity>
//           <TouchableOpacity style={styles.button} onPress={onSignOut}>
//             <Text style={styles.buttonText}>Logout</Text>
//           </TouchableOpacity>
//         </>
//       ) : (
//         <>
//           <Text style={styles.title}>Welcome ☕</Text>
//           <Text style={styles.subtitle}>
//             Please sign in to save orders & access your profile.
//           </Text>

//           <TouchableOpacity style={styles.button} onPress={onSignIn}>
//             <Text style={styles.buttonText}>Sign in with Google</Text>
//           </TouchableOpacity>
//         </>
//       )}
//     </View>
//   );
// };

// const styles = StyleSheet.create({
//   container: {
//     flex: 1,
//     backgroundColor: COLORS.primaryBlackHex,
//     padding: 24,
//     justifyContent: 'center',
//     alignItems: 'center',
//   },
//   center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
//   title: { fontSize: 22, color: '#fff', fontWeight: '700', marginBottom: 8 },
//   subtitle: {
//     fontSize: 14,
//     color: '#666',
//     marginBottom: 20,
//     textAlign: 'center',
//   },
//   avatar: { width: 100, height: 100, borderRadius: 50, marginBottom: 12 },
//   name: { fontSize: 18, fontWeight: '600' },
//   email: { color: 'white', marginBottom: 20 },
//   button: {
//     marginTop: 10,
//     backgroundColor: '#4285F4',
//     paddingHorizontal: 20,
//     paddingVertical: 10,
//     borderRadius: 8,
//   },
//   buttonText: { color: '#fff', fontWeight: '600' },
// });

// export default ProfileScreen;
