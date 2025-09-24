// import React, { useRef, useState } from 'react';
// import {
//   View,
//   Text,
//   StyleSheet,
//   TouchableHighlight,
//   TouchableOpacity,
//   PermissionsAndroid,
//   Alert,
//   Platform,
//   Image,
// } from 'react-native';
// import { Camera, CameraApi, CameraType } from 'react-native-camera-kit';
// import { openSettings } from 'react-native-permissions';
// import { COLORS, FONTFAMILY, FONTSIZE } from '../theme/theme';

// const flashArray = [
//   { mode: 'auto', label: 'Auto' },
//   { mode: 'on', label: 'On' },
//   { mode: 'off', label: 'Off' },
// ] as const;

// const CaptureScreen: React.FC = () => {
//   const cameraRef = useRef<CameraApi>(null);
//   const [isPermitted, setIsPermitted] = useState(false);
//   const [flashPosition, setFlashPosition] = useState(0);
//   const [torchMode, setTorchMode] = useState(false);
//   const [cameraType, setCameraType] = useState(CameraType.Back);
//   const [capturedImage, setCapturedImage] = useState<string | null>(null);

//   const requestCameraPermission = async (): Promise<boolean> => {
//     try {
//       if (Platform.OS === 'android') {
//         const granted = await PermissionsAndroid.request(
//           PermissionsAndroid.PERMISSIONS.CAMERA,
//           {
//             title: 'Camera Permission',
//             message: 'App needs access to your camera',
//             buttonPositive: 'OK',
//           },
//         );
//         return granted === PermissionsAndroid.RESULTS.GRANTED;
//       }
//       return true;
//     } catch (err) {
//       console.warn(err);
//       return false;
//     }
//   };


//   const openCamera = async () => {
//     const granted = await requestCameraPermission();
//     if (!granted) return Alert.alert('Camera permission denied');
//     setIsPermitted(true);
//   };


//   const switchCamera = () => {
//     setCameraType(prev =>
//       prev === CameraType.Back ? CameraType.Front : CameraType.Back,
//     );
//   };


//   const toggleFlash = () => {
//     const newPos = (flashPosition + 1) % flashArray.length;
//     setFlashPosition(newPos);
//   };


//   const toggleTorch = () => setTorchMode(prev => !prev);


//   const captureImage = async () => {
//     try {
//       if (cameraRef.current) {
//         const result = await cameraRef.current.capture();
//         setCapturedImage(result.uri);
//         console.log('Captured image path:', result.uri);
//       }
//     } catch (err) {
//       console.error('Capture error:', err);
//     }
//   };

//   return (
//     <View style={{ flex: 1 }}>
//       {isPermitted ? (
//         <View style={{ flex: 1 }}>
//           <Camera
//             ref={cameraRef}
//             cameraType={cameraType}
//             flashMode={flashArray[flashPosition].mode}
//             torchMode={torchMode ? 'on' : 'off'}
//             zoomMode="on"
//             focusMode="on"
//             style={{ flex: 1 }}
//           />

//           {/* Controls */}
//           <View style={styles.controls}>
//             <TouchableOpacity
//               style={styles.controlButton}
//               onPress={switchCamera}
//             >
//               <Text style={styles.buttonText}>Flip</Text>
//             </TouchableOpacity>

//             <TouchableOpacity
//               style={styles.controlButton}
//               onPress={toggleFlash}
//             >
//               <Text style={styles.buttonText}>
//                 Flash: {flashArray[flashPosition].label}
//               </Text>
//             </TouchableOpacity>

//             <TouchableOpacity
//               style={styles.controlButton}
//               onPress={toggleTorch}
//             >
//               <Text style={styles.buttonText}>
//                 Torch {torchMode ? 'On' : 'Off'}
//               </Text>
//             </TouchableOpacity>

//             <TouchableOpacity
//               style={styles.captureButton}
//               onPress={captureImage}
//             >
//               <Text style={styles.buttonText}>📸 Capture</Text>
//             </TouchableOpacity>
//           </View>

//           {/* Preview captured image */}
//           {capturedImage && (
//             <View style={styles.previewContainer}>
//               <Image
//                 source={{ uri: capturedImage }}
//                 style={styles.previewImage}
//               />
//               <Text style={styles.previewText}>Preview</Text>
//             </View>
//           )}
//         </View>
//       ) : (
//         <View style={styles.container}>
//           <Text style={styles.title}>React Native Camera</Text>
//           <TouchableHighlight onPress={openCamera} style={styles.buttonStyle}>
//             <Text style={styles.buttonTextStyle}>Open Camera</Text>
//           </TouchableHighlight>
//           <TouchableOpacity
//             style={[styles.button, styles.secondaryButton]}
//             onPress={() => openSettings()}
//           >
//             <Text style={styles.buttonText}>Open App Settings</Text>
//           </TouchableOpacity>
//         </View>
//       )}
//     </View>
//   );
// };

// const styles = StyleSheet.create({
//   container: {
//     flex: 1,
//     backgroundColor: 'white',
//     padding: 10,
//     alignItems: 'center',
//     justifyContent: 'center',
//   },
//   title: { fontSize: 22, fontWeight: 'bold', textAlign: 'center' },
//   buttonStyle: {
//     backgroundColor: 'green',
//     marginTop: 32,
//     minWidth: 250,
//     padding: 10,
//     borderRadius: 8,
//   },
//   buttonTextStyle: { color: 'white', fontSize: 16, textAlign: 'center' },
//   button: {
//     backgroundColor: COLORS.primaryOrangeHex,
//     borderRadius: 10,
//     paddingVertical: 12,
//     paddingHorizontal: 16,
//     marginTop: 20,
//     alignItems: 'center',
//   },
//   secondaryButton: { backgroundColor: COLORS.primaryDarkGreyHex },
//   buttonText: {
//     color: COLORS.primaryWhiteHex,
//     fontSize: FONTSIZE.size_16,
//     fontFamily: FONTFAMILY.poppins_medium,
//   },
//   controls: {
//     position: 'absolute',
//     bottom: 30,
//     flexDirection: 'row',
//     justifyContent: 'space-around',
//     width: '100%',
//   },
//   controlButton: {
//     backgroundColor: 'rgba(0,0,0,0.6)',
//     padding: 12,
//     borderRadius: 8,
//   },
//   captureButton: {
//     backgroundColor: COLORS.primaryOrangeHex,
//     padding: 14,
//     borderRadius: 50,
//   },
//   previewContainer: {
//     position: 'absolute',
//     top: 50,
//     alignSelf: 'center',
//     backgroundColor: 'rgba(0,0,0,0.7)',
//     padding: 8,
//     borderRadius: 6,
//   },
//   previewImage: { width: 200, height: 200, borderRadius: 8 },
//   previewText: { color: 'white', textAlign: 'center', marginTop: 5 },
// });

// export default CaptureScreen;
// CaptureScreen.tsx
import React, { useRef, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  PermissionsAndroid,
  Alert,
  Platform,
  Image,
} from 'react-native';
import { Camera, CameraApi, CameraType } from 'react-native-camera-kit';
import { openSettings } from 'react-native-permissions';
import { COLORS, FONTFAMILY, FONTSIZE } from '../theme/theme';

const CaptureScreen = ({ navigation, route }: any) => {
  const cameraRef = useRef<CameraApi>(null);
  const [isPermitted, setIsPermitted] = useState(false);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [cameraType, setCameraType] = useState(CameraType.Back);

  const requestCameraPermission = async (): Promise<boolean> => {
    try {
      if (Platform.OS === 'android') {
        const granted = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.CAMERA,
          {
            title: 'Camera Permission',
            message: 'App needs access to your camera',
            buttonPositive: 'OK',
          },
        );
        return granted === PermissionsAndroid.RESULTS.GRANTED;
      }
      return true;
    } catch {
      return false;
    }
  };

  const openCamera = async () => {
    const ok = await requestCameraPermission();
    if (!ok) return Alert.alert('Camera permission denied');
    setIsPermitted(true);
  };

  const captureImage = async () => {
    try {
      if (!cameraRef.current) return;
      const result = await cameraRef.current.capture();
      const uri = result.uri;
      setCapturedImage(uri);

      // If caller passed onReturn callback, call it
      if (route?.params?.onReturn && typeof route.params.onReturn === 'function') {
        route.params.onReturn(uri);
        navigation.goBack();
        return;
      }

      // otherwise navigate back with param
      navigation.navigate('ComplaintScreen', { capturedImageUri: uri });
    } catch (err) {
      Alert.alert('Capture error', String(err));
    }
  };

  return (
    <View style={{ flex: 1 }}>
      {isPermitted ? (
        <>
          <Camera
            ref={cameraRef}
            cameraType={cameraType}
            style={{ flex: 1 }}
          />

          <View style={styles.controls}>
            <TouchableOpacity style={styles.controlButton} onPress={() => setCameraType(prev => prev === CameraType.Back ? CameraType.Front : CameraType.Back)}>
              <Text style={styles.buttonText}>Flip</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.captureButton} onPress={captureImage}>
              <Text style={styles.buttonText}>📸 Capture</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.controlButton} onPress={() => navigation.goBack()}>
              <Text style={styles.buttonText}>Cancel</Text>
            </TouchableOpacity>
          </View>

          {capturedImage && (
            <View style={styles.previewContainer}>
              <Image source={{ uri: capturedImage }} style={styles.previewImage} />
              <Text style={styles.previewText}>Preview</Text>
            </View>
          )}
        </>
      ) : (
        <View style={styles.center}>
          <Text style={{ color: '#000' }}>React Native Camera</Text>
          <TouchableOpacity onPress={openCamera} style={styles.openBtn}>
            <Text style={{ color: '#fff' }}>Open Camera</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => openSettings()} style={[styles.openBtn, { backgroundColor: '#444' }]}>
            <Text style={{ color: '#fff' }}>Open Settings</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  controls: { position: 'absolute', bottom: 40, width: '100%', flexDirection: 'row', justifyContent: 'space-around' },
  controlButton: { backgroundColor: 'rgba(0,0,0,0.6)', padding: 12, borderRadius: 8 },
  captureButton: { backgroundColor: '#ff7a00', padding: 14, borderRadius: 50 },
  buttonText: { color: '#fff' },
  previewContainer: { position: 'absolute', top: 40, alignSelf: 'center', backgroundColor: 'rgba(0,0,0,0.7)', padding: 8, borderRadius: 6 },
  previewImage: { width: 160, height: 160, borderRadius: 8 },
  previewText: { color: '#fff', textAlign: 'center', marginTop: 6 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  openBtn: { backgroundColor: '#0a84ff', padding: 12, borderRadius: 8, marginTop: 12 },
});

export default CaptureScreen;
