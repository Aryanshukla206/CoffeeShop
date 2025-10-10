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
import inAppMessaging from '@react-native-firebase/in-app-messaging';

import Realm from 'realm';
import { CoffeeSchema } from '../models/Coffee';
import { UserSchema } from '../models/User';
import { appEvents } from '../services/events';

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
      appEvents({
        eventName: 'user_signed_in',
        payload: { email: 'test@gmail.com', user: 'testUser' },
      });
      console.log('Analytics event logged: FireBaseSignIn');
      await inAppMessaging().triggerEvent('user_signed_in');
      console.log('FIAM triggered for user_signed_in');

      // Optional: Manually trigger message sync (helps in testing)
      // await inAppMessaging().setMessagesDisplaySuppressed(false);
    } catch (err) {
      Alert.alert('Sign-in error', String(err));
    }
  };

  const onSignOut = async () => {
    try {
      await signOut();
      appEvents({
        eventName: 'user_signed_out',
        payload: { name: 'user', age: 30 },
      });
      console.log('Analytics event logged: FireBaselogout');
      await inAppMessaging().triggerEvent('user_signed_out');
      console.log('FIAM triggered for user_signed_out');

      // Optional: Manually trigger message sync (helps in testing)
      // await inAppMessaging().setMessagesDisplaySuppressed(false);
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

          <TouchableOpacity style={styles.button} onPress={onShare}>
            <Text style={styles.buttonText}>Share App</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.button} onPress={onSignOut}>
            <Text style={styles.buttonText}>Logout</Text>
          </TouchableOpacity>
        </>
      ) : (
        <View
          style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}
        >
          <Text style={styles.title}>Welcome ☕</Text>
          <Text style={styles.subtitle}>
            Please sign in to save orders & access your profile.
          </Text>

          <TouchableOpacity style={styles.button} onPress={onSignIn}>
            <Text style={styles.buttonText}>Sign in with Google</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
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

// // ProfileScreen.js
// import React, { useEffect, useRef, useState } from 'react';
// import {
//   View,
//   Text,
//   StyleSheet,
//   TouchableOpacity,
//   Image,
//   ActivityIndicator,
//   Alert,
//   StatusBar,
//   Platform,
//   ScrollView,
//   TextInput,
//   SafeAreaView,
//   KeyboardAvoidingView,
// } from 'react-native';
// import { useAuth } from '../contexts/AuthContext';
// import { COLORS } from '../theme/theme';
// import Share from 'react-native-share';
// import RNFS from 'react-native-fs';
// import Notification from '../pushNotification/notification';
// import analytics from '@react-native-firebase/analytics';
// import Realm from 'realm';
// import { CoffeeSchema } from '../models/Coffee';
// import { UserSchema } from '../models/User';
// import LinearGradient from 'react-native-linear-gradient';
// import Ionicons from 'react-native-vector-icons/Ionicons';

// const AVATAR_SIZE = 110;

// const ProfileScreen = ({ navigation }: any) => {
//   const { user, initializing, signInWithGoogle, signOut } = useAuth();

//   // Local states for editing
//   const [name, setName] = useState('');
//   const [bio, setBio] = useState('');
//   const [isEditing, setIsEditing] = useState(false);
//   const [loadingRealm, setLoadingRealm] = useState(true);
//   const [coffeesCount, setCoffeesCount] = useState(0);

//   const realmRef = useRef<Realm | null>(null);
//   const userId = user?.uid ?? user?.email ?? 'guest';

//   useEffect(() => {
//     let realm: Realm | undefined;
//     try {
//       realm = new Realm({
//         schema: [UserSchema, CoffeeSchema],
//         schemaVersion: 1,
//       });
//       realmRef.current = realm;

//       realm.write(() => {
//         const existing = realm.objectForPrimaryKey('User', userId) as any;
//         if (!existing && user) {
//           realm.create('User', {
//             id: userId,
//             name: user.displayName ?? '',
//             email: user.email ?? '',
//             iconLink: user.photoURL ?? '',
//             bio: '',
//             coffees: [],
//           });
//         }
//       });

//       const obj = realm.objectForPrimaryKey('User', userId) as any;
//       if (obj) {
//         setName(obj.name ?? user?.displayName ?? '');
//         setBio(obj.bio ?? '');
//         setCoffeesCount(Array.isArray(obj.coffees) ? obj.coffees.length : obj.coffees?.length ?? 0);
//       }
//     } catch (err) {
//       console.error('Realm open error', err);
//       Alert.alert('Storage error', 'Could not open local database.');
//     } finally {
//       setLoadingRealm(false);
//     }

//     return () => {
//       try {
//         if (realmRef.current && !realmRef.current.isClosed) {
//           realmRef.current.close();
//           realmRef.current = null;
//         }
//       } catch (err) {
//         console.warn('Error closing realm', err);
//       }
//     };
//   }, [userId]);

//   if (initializing || loadingRealm) {
//     return (
//       <View style={styles.center}>
//         <ActivityIndicator size="large" color={COLORS.primaryOrangeHex} />
//       </View>
//     );
//   }

//   const saveProfileToRealm = () => {
//     const realm = realmRef.current;
//     if (!realm) {
//       Alert.alert('Error', 'Local database not available.');
//       return;
//     }
//     try {
//       realm.write(() => {
//         const existing = realm.objectForPrimaryKey('User', userId) as any;
//         if (existing) {
//           existing.name = name;
//           existing.bio = bio;
//           setCoffeesCount(Array.isArray(existing.coffees) ? existing.coffees.length : existing.coffees?.length ?? 0);
//         } else {
//           realm.create('User', {
//             id: userId,
//             name,
//             email: user?.email ?? '',
//             iconLink: user?.photoURL ?? '',
//             bio,
//             coffees: [],
//           });
//           setCoffeesCount(0);
//         }
//       });
//       setIsEditing(false);
//       Alert.alert('Saved', 'Profile saved locally.');
//     } catch (err) {
//       console.error('Realm write error', err);
//       Alert.alert('Save error', 'Could not save profile locally.');
//     }
//   };

//   const deleteBio = () => {
//     const realm = realmRef.current;
//     if (!realm) return;
//     try {
//       realm.write(() => {
//         const existing = realm.objectForPrimaryKey('User', userId) as any;
//         if (existing) {
//           existing.bio = '';
//         }
//       });
//       setBio('');
//       setIsEditing(false);
//     } catch (err) {
//       console.error('Realm delete error', err);
//     }
//   };

//   const addCoffee = (title = 'New Coffee', size = 'Medium') => {
//     const realm = realmRef.current;
//     if (!realm) return;
//     const id = `${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
//     try {
//       realm.write(() => {
//         const coffeeObj = realm.create('Coffee', {
//           id,
//           title,
//           size,
//           notes: '',
//           createdAt: new Date(),
//         });
//         const userObj = realm.objectForPrimaryKey('User', userId) as any;
//         if (userObj) {
//           userObj.coffees.push(coffeeObj);
//           const count = Array.isArray(userObj.coffees) ? userObj.coffees.length : userObj.coffees?.length ?? 0;
//           setCoffeesCount(count);
//         }
//       });
//       Alert.alert('Saved', 'Coffee added to your profile (local).');
//     } catch (err) {
//       console.error('addCoffee error', err);
//     }
//   };

//   const onShare = async () => {
//     try {
//       const destPath = `${RNFS.CachesDirectoryPath}/logo.png`;

//       if (Platform.OS === 'android') {
//         await RNFS.copyFileAssets('logo.png', destPath);
//       } else {
//         const source = `${RNFS.MainBundlePath}/logo.png`;
//         await RNFS.copyFile(source, destPath);
//       }

//       const shareOptions = {
//         message: 'Order your next Coffee from this App !! ☕️',
//         url: 'file://' + destPath,
//         type: 'image/png',
//       };

//       await Share.open(shareOptions);
//     } catch (error) {
//       console.log('Share Error:', error);
//     }
//   };

//   const onSignIn = async () => {
//     try {
//       await signInWithGoogle();
//       await analytics().logEvent('User Signed in', { source: 'debug' });
//     } catch (err) {
//       Alert.alert('Sign-in error', String(err));
//     }
//   };

//   const onSignOut = async () => {
//     try {
//       await signOut();
//       await analytics().logEvent('User Logged Out', { source: 'debug' });
//     } catch (err) {
//       Alert.alert('Sign-out error', String(err));
//     }
//   };

//   const renderAvatar = () => {
//     if (user?.photoURL) {
//       return <Image source={{ uri: user.photoURL }} style={styles.avatar} />;
//     }
//     // fallback initials
//     const initials =
//       (user?.displayName || user?.email || 'U')
//         .split(' ')
//         .map((n: any) => n[0])
//         .slice(0, 2)
//         .join('')
//         .toUpperCase() || 'U';
//     return (
//       <View style={[styles.avatar, styles.avatarFallback]}>
//         <Text style={styles.avatarInitials}>{initials}</Text>
//       </View>
//     );
//   };

//   return (
//     <View style={styles.safe}>
//       <StatusBar backgroundColor={COLORS.primaryBlackHex} barStyle="light-content" />
//       <KeyboardAvoidingView
//         behavior={Platform.select({ ios: 'padding', android: undefined })}
//         style={{ flex: 1 }}
//         keyboardVerticalOffset={Platform.select({ ios: 90, android: 0 })}
//       >
//         <ScrollView contentContainerStyle={styles.container}>
//           <LinearGradient
//             colors={[COLORS.primaryOrangeHex, '#ff9466']}
//             style={styles.header}
//             start={{ x: 0, y: 0 }}
//             end={{ x: 1, y: 1 }}
//           >
//             <View style={styles.headerInner}>
//               <View style={styles.avatarWrapper}>
//                 {renderAvatar()}
//                 <TouchableOpacity
//                   style={styles.editAvatarBtn}
//                   onPress={() => Alert.alert('Change Avatar', 'Implement avatar change flow')}
//                 >
//                   <Ionicons name="camera" size={18} color="#fff" />
//                 </TouchableOpacity>
//               </View>

//               <View style={styles.nameBlock}>
//                 <View style={{ flexDirection: 'row', alignItems: 'center' }}>
//                   <Text style={styles.nameText} numberOfLines={1}>
//                     {name || user?.displayName || 'Unnamed User'}
//                   </Text>
//                   <TouchableOpacity
//                     onPress={() => setIsEditing((s) => !s)}
//                     style={styles.inlineEditBtn}
//                     accessibilityLabel="Edit name"
//                   >
//                     <Ionicons name={isEditing ? 'checkmark' : 'pencil'} size={18} color="#fff" />
//                   </TouchableOpacity>
//                 </View>
//                 <Text style={styles.emailText} numberOfLines={1}>
//                   {user?.email ?? 'No Email'}
//                 </Text>
//               </View>
//             </View>
//           </LinearGradient>

//           <View style={styles.card}>
//             <View style={styles.statsRow}>
//               <View style={styles.stat}>
//                 <Text style={styles.statValue}>{coffeesCount}</Text>
//                 <Text style={styles.statLabel}>Coffees</Text>
//               </View>
//               <View style={styles.divider} />
//               <View style={styles.stat}>
//                 <Text style={styles.statValue}>—</Text>
//                 <Text style={styles.statLabel}>Favorites</Text>
//               </View>
//               <View style={styles.divider} />
//               <View style={styles.stat}>
//                 <Text style={styles.statValue}>—</Text>
//                 <Text style={styles.statLabel}>Orders</Text>
//               </View>
//             </View>

//             <View style={{ marginTop: 14 }}>
//               <Text style={styles.sectionTitle}>Bio</Text>
//               <TextInput
//                 value={bio}
//                 onChangeText={setBio}
//                 editable={isEditing}
//                 placeholder="Write a short bio..."
//                 placeholderTextColor="#888"
//                 multiline
//                 numberOfLines={4}
//                 style={[styles.textarea, !isEditing && styles.textareaReadonly]}
//               />
//               <View style={styles.rowBetween}>
//                 <Text style={styles.charCount}>{bio.length} / 200</Text>
//                 <View style={{ flexDirection: 'row' }}>
//                   {isEditing && (
//                     <TouchableOpacity
//                       onPress={saveProfileToRealm}
//                       style={[styles.ghostBtn, { marginRight: 8 }]}
//                     >
//                       <Text style={styles.ghostBtnText}>Save</Text>
//                     </TouchableOpacity>
//                   )}
//                   <TouchableOpacity
//                     onPress={() =>
//                       Alert.alert('Clear Bio', 'Delete your bio locally?', [
//                         { text: 'Cancel', style: 'cancel' },
//                         { text: 'Delete', style: 'destructive', onPress: deleteBio },
//                       ])
//                     }
//                     style={styles.ghostBtn}
//                   >
//                     <Text style={[styles.ghostBtnText, { color: '#E53935' }]}>Delete</Text>
//                   </TouchableOpacity>
//                 </View>
//               </View>
//             </View>

//             <View style={{ marginTop: 18 }}>
//               <TouchableOpacity style={styles.primaryBtn} onPress={onShare}>
//                 <Ionicons name="share-social" size={18} color="#fff" style={{ marginRight: 8 }} />
//                 <Text style={styles.primaryBtnText}>Share App</Text>
//               </TouchableOpacity>

//               <TouchableOpacity
//                 style={[styles.secondaryBtn, { marginTop: 10 }]}
//                 onPress={() => addCoffee('Espresso', 'Small')}
//               >
//                 <Ionicons name="add-circle-outline" size={18} color={COLORS.primaryOrangeHex} />
//                 <Text style={[styles.secondaryBtnText, { marginLeft: 8 }]}>Add Coffee</Text>
//               </TouchableOpacity>

//               <TouchableOpacity
//                 style={[styles.secondaryBtn, { marginTop: 10, backgroundColor: '#111' }]}
//                 onPress={onSignOut}
//               >
//                 <Ionicons name="log-out-outline" size={18} color="#fff" />
//                 <Text style={[styles.secondaryBtnText, { marginLeft: 8, color: '#fff' }]}>Logout</Text>
//               </TouchableOpacity>
//             </View>
//           </View>

//           {!user && (
//             <View style={{ width: '100%', marginTop: 16 }}>
//               <TouchableOpacity style={styles.primaryBtn} onPress={onSignIn}>
//                 <Ionicons name="logo-google" size={18} color="#fff" style={{ marginRight: 8 }} />
//                 <Text style={styles.primaryBtnText}>Sign in with Google</Text>
//               </TouchableOpacity>
//             </View>
//           )}

//           <View style={{ height: 80 }} />
//         </ScrollView>

//         {/* Floating Add Coffee FAB */}
//         <TouchableOpacity
//           style={styles.fab}
//           onPress={() => addCoffee('Cappuccino', 'Medium')}
//           accessibilityLabel="Add coffee"
//         >
//           <Ionicons name="cafe" size={22} color="#fff" />
//         </TouchableOpacity>

//         <Notification />
//       </KeyboardAvoidingView>
//     </View>
//   );
// };

// const styles = StyleSheet.create({
//   safe: { flex: 1, backgroundColor: COLORS.primaryBlackHex },
//   center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
//   container: {
//     padding: 16,
//     paddingBottom: 24,
//   },
//   header: {
//     borderBottomLeftRadius: 16,
//     borderBottomRightRadius: 16,
//     paddingBottom: 18,
//   },
//   headerInner: {
//     flexDirection: 'row',
//     alignItems: 'center',
//     paddingTop: 18,
//     paddingHorizontal: 14,
//   },
//   avatarWrapper: {
//     width: AVATAR_SIZE,
//     height: AVATAR_SIZE,
//     marginRight: 14,
//     justifyContent: 'center',
//     alignItems: 'center',
//   },
//   avatar: {
//     width: AVATAR_SIZE,
//     height: AVATAR_SIZE,
//     borderRadius: AVATAR_SIZE / 2,
//     borderWidth: 3,
//     borderColor: 'rgba(255,255,255,0.18)',
//   },
//   avatarFallback: {
//     backgroundColor: 'rgba(255,255,255,0.12)',
//     justifyContent: 'center',
//     alignItems: 'center',
//   },
//   avatarInitials: {
//     color: '#fff',
//     fontSize: 32,
//     fontWeight: '700',
//   },
//   editAvatarBtn: {
//     position: 'absolute',
//     bottom: 6,
//     right: 6,
//     backgroundColor: 'rgba(0,0,0,0.28)',
//     padding: 8,
//     borderRadius: 18,
//   },
//   nameBlock: {
//     flex: 1,
//     justifyContent: 'center',
//   },
//   nameText: {
//     color: '#fff',
//     fontSize: 20,
//     fontWeight: '700',
//     maxWidth: '82%',
//   },
//   emailText: {
//     color: 'rgba(255,255,255,0.9)',
//     marginTop: 6,
//   },
//   inlineEditBtn: {
//     marginLeft: 10,
//     padding: 6,
//     borderRadius: 8,
//     backgroundColor: 'rgba(255,255,255,0.08)',
//   },
//   card: {
//     backgroundColor: '#0E0E0E',
//     borderRadius: 12,
//     padding: 14,
//     marginTop: -28,
//     shadowColor: '#000',
//     shadowOpacity: 0.18,
//     shadowRadius: 8,
//     elevation: 8,
//   },
//   sectionTitle: { color: '#fff', fontWeight: '700', marginBottom: 8 },
//   statsRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
//   stat: { flex: 1, alignItems: 'center' },
//   statValue: { color: COLORS.primaryOrangeHex, fontSize: 20, fontWeight: '800' },
//   statLabel: { color: '#BBB', marginTop: 6 },
//   divider: { width: 1, height: 36, backgroundColor: 'rgba(255,255,255,0.05)' },

//   textarea: {
//     width: '100%',
//     minHeight: 86,
//     borderRadius: 10,
//     backgroundColor: '#111',
//     color: '#fff',
//     padding: 12,
//     textAlignVertical: 'top',
//   },
//   textareaReadonly: {
//     backgroundColor: '#0B0B0B',
//     opacity: 0.95,
//   },
//   rowBetween: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 8 },
//   charCount: { color: '#888' },

//   primaryBtn: {
//     marginTop: 6,
//     backgroundColor: COLORS.primaryOrangeHex,
//     paddingVertical: 12,
//     borderRadius: 10,
//     flexDirection: 'row',
//     alignItems: 'center',
//     justifyContent: 'center',
//   },
//   primaryBtnText: { color: '#fff', fontWeight: '700' },

//   secondaryBtn: {
//     marginTop: 6,
//     backgroundColor: '#fff',
//     paddingVertical: 12,
//     borderRadius: 10,
//     flexDirection: 'row',
//     alignItems: 'center',
//     justifyContent: 'center',
//   },
//   secondaryBtnText: { color: COLORS.primaryOrangeHex, fontWeight: '700' },

//   ghostBtn: {
//     paddingHorizontal: 12,
//     paddingVertical: 8,
//     borderRadius: 8,
//     backgroundColor: 'rgba(255,255,255,0.04)',
//   },
//   ghostBtnText: { color: '#fff', fontWeight: '600' },

//   fab: {
//     position: 'absolute',
//     right: 18,
//     bottom: 30,
//     width: 56,
//     height: 56,
//     borderRadius: 28,
//     backgroundColor: COLORS.primaryOrangeHex,
//     justifyContent: 'center',
//     alignItems: 'center',
//     elevation: 10,
//     shadowColor: '#000',
//     shadowOpacity: 0.2,
//     shadowRadius: 8,
//   },
// });

// export default ProfileScreen;
