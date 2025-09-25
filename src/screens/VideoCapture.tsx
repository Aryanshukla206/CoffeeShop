// import React, { useRef, useState, useCallback } from 'react';
// import {
//   View,
//   Text,
//   TouchableOpacity,
//   Alert,
//   StyleSheet,
//   Platform,
//   ActivityIndicator,
// } from 'react-native';
// import { useIsFocused } from '@react-navigation/native';
// import { Camera, useCameraDevices } from 'react-native-vision-camera';
// import RNFS from 'react-native-fs';
// import Video from 'react-native-video';
// import { openSettings } from 'react-native-permissions';

// type Props = {
//   navigation: any;
//   route?: any;
// };

// const CLOUD_NAME = 'dtgtukgvf';
// const UPLOAD_PRESET = 'coffeeshop';

// // utility: move file from temp -> documents and return new path
// async function moveToAppStorage(tempPath: string) {
//   const ext = tempPath.split('.').pop() ?? 'mp4';
//   const destPath = `${RNFS.DocumentDirectoryPath}/video_${Date.now()}.${ext}`;
//   // On Android tempPath may already be a file:// or content uri; normalize:
//   const normalized = tempPath.startsWith('file://')
//     ? tempPath.replace('file://', '')
//     : tempPath;
//   await RNFS.moveFile(normalized, destPath);
//   return Platform.OS === 'android' ? `file://${destPath}` : destPath;
// }

// // helper upload to Cloudinary (unsigned preset)
// async function uploadToCloudinary(fileUri: string) {
//   const uri = fileUri.startsWith('file://') ? fileUri : `file://${fileUri}`;
//   const filename = uri.split('/').pop() ?? `video_${Date.now()}.mp4`;
//   const fd = new FormData();
//   fd.append('file', {
//     uri,
//     name: filename,
//     type: 'video/mp4',
//   } as any);
//   fd.append('upload_preset', UPLOAD_PRESET);

//   const res = await fetch(
//     `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/auto/upload`,
//     {
//       method: 'POST',
//       body: fd,
//     },
//   );
//   if (!res.ok) {
//     const txt = await res.text().catch(() => '');
//     throw new Error(`Cloudinary upload failed: ${res.status} ${txt}`);
//   }
//   return res.json();
// }

// export default function VideoCaptureScreen({ navigation }: Props) {
//   const devices = useCameraDevices();
//   const device =
//     devices.find(d => d.position === 'back') ||
//     devices.find(d => d.position === 'front');

//   const camera = useRef<Camera>(null);
//   const isFocused = useIsFocused();

//   const [recording, setRecording] = useState(false);
//   const [processing, setProcessing] = useState(false);
//   const [previewUri, setPreviewUri] = useState<string | null>(null);
//   const [uploading, setUploading] = useState(false);

//   // request permissions & start recording
//   const startRecording = useCallback(async () => {
//     try {
//       const camPerm = await Camera.requestCameraPermission();
//       const micPerm = await Camera.requestMicrophonePermission();
//       if (!camPerm || !micPerm) {
//         Alert.alert(
//           'Permissions required',
//           'Camera and microphone permissions are required.',
//           [
//             { text: 'Open settings', onPress: () => openSettings() },
//             { text: 'Cancel', style: 'cancel' },
//           ],
//         );
//         return;
//       }

//       setRecording(true);
//       setPreviewUri(null);

//       // startRecording API:
//       await camera.current?.startRecording({
//         flash: 'off',
//         onRecordingFinished: async video => {
//           try {
//             setRecording(false);
//             setProcessing(true);
//             // video.path contains the temp file path (string)
//             const saved = await moveToAppStorage(video.path);
//             setPreviewUri(saved);
//             setProcessing(false);
//           } catch (err) {
//             setProcessing(false);
//             Alert.alert('Save error', String(err));
//           }
//         },
//         onRecordingError: err => {
//           setRecording(false);
//           setProcessing(false);
//           Alert.alert('Recording error', String(err));
//         },
//       });
//     } catch (err) {
//       console.warn(err);
//       Alert.alert('Recording error', String(err));
//     }
//   }, []);

//   const stopRecording = useCallback(() => {
//     try {
//       camera.current?.stopRecording();
//       setRecording(false);
//     } catch (err) {
//       console.warn('stopRecording error', err);
//     }
//   }, []);

//   const handleUpload = useCallback(async () => {
//     if (!previewUri) return;
//     try {
//       setUploading(true);
//       const result = await uploadToCloudinary(previewUri);
//       setUploading(false);
//       Alert.alert('Upload successful', 'Video uploaded to Cloudinary', [
//         { text: 'OK' },
//       ]);
//       // result.secure_url contains uploaded URL
//       // If you want to return to previous screen with uploaded url:
//       navigation.navigate('ComplainsScreen', {
//         uploadedVideoUrl: result.secure_url,
//         localUri: previewUri,
//       });
//     } catch (err: any) {
//       setUploading(false);
//       Alert.alert('Upload failed', err.message ?? String(err));
//     }
//   }, [previewUri, navigation]);

//   const handleSendBack = useCallback(() => {
//     if (!previewUri) {
//       Alert.alert('No video', 'Record a video first');
//       return;
//     }
//     // Return local URI to calling screen
//     navigation.navigate('ComplaintForm', { capturedVideo: previewUri });
//   }, [previewUri, navigation]);

//   return (
//     <View style={{ flex: 1, backgroundColor: '#000' }}>
//       {!device ? (
//         <View style={styles.center}>
//           <Text style={{ color: 'white' }}>No camera available</Text>
//         </View>
//       ) : (
//         <>
//           {!previewUri ? (
//             <>
//               {isFocused && (
//                 <Camera
//                   ref={camera}
//                   style={StyleSheet.absoluteFill}
//                   device={device}
//                   isActive={true}
//                   video={true}
//                   audio={true}
//                 />
//               )}

//               <View style={styles.controlsRow}>
//                 <TouchableOpacity
//                   style={[
//                     styles.controlBtn,
//                     recording && { backgroundColor: 'red' },
//                   ]}
//                   onPress={recording ? stopRecording : startRecording}
//                 >
//                   <Text style={styles.controlText}>
//                     {recording ? 'Stop' : 'Record'}
//                   </Text>
//                 </TouchableOpacity>

//                 <TouchableOpacity
//                   style={styles.controlBtn}
//                   onPress={() => {
//                     // flip camera
//                     // (simple flip: pick front/back device if available)
//                     // For brevity here we simply alert—if you want flip implement device selection using useCameraDevices
//                     Alert.alert(
//                       'Flip',
//                       'Flip camera: switch device implementation required.',
//                     );
//                   }}
//                 >
//                   <Text style={styles.controlText}>Flip</Text>
//                 </TouchableOpacity>

//                 <TouchableOpacity
//                   style={styles.controlBtn}
//                   onPress={() => navigation.goBack()}
//                 >
//                   <Text style={styles.controlText}>Cancel</Text>
//                 </TouchableOpacity>
//               </View>

//               {processing && (
//                 <View style={styles.processing}>
//                   <ActivityIndicator color="#fff" />
//                   <Text style={{ color: '#fff', marginTop: 8 }}>
//                     Processing...
//                   </Text>
//                 </View>
//               )}
//             </>
//           ) : (
//             // Preview player + actions
//             <View style={{ flex: 1, padding: 12, backgroundColor: '#000' }}>
//               <View style={{ height: 320, backgroundColor: '#222' }}>
//                 <Video
//                   source={{ uri: previewUri }}
//                   style={{ width: '100%', height: '100%' }}
//                   controls
//                   resizeMode="contain"
//                 />
//               </View>

//               <View style={{ marginTop: 12 }}>
//                 <Text style={{ color: '#fff', marginBottom: 8 }}>
//                   Preview saved at:
//                 </Text>
//                 <Text style={{ color: '#ccc' }} numberOfLines={1}>
//                   {previewUri}
//                 </Text>
//               </View>

//               <View style={styles.actionsRow}>
//                 <TouchableOpacity
//                   style={styles.actionBtn}
//                   onPress={handleSendBack}
//                 >
//                   <Text style={styles.actionText}>Use This</Text>
//                 </TouchableOpacity>

//                 <TouchableOpacity
//                   style={styles.actionBtn}
//                   onPress={handleUpload}
//                 >
//                   <Text style={styles.actionText}>
//                     {uploading ? 'Uploading…' : 'Upload'}
//                   </Text>
//                 </TouchableOpacity>

//                 <TouchableOpacity
//                   style={[styles.actionBtn, { backgroundColor: '#444' }]}
//                   onPress={() => {
//                     // delete local file if you want
//                     Alert.alert('Delete', 'Discard this recording?', [
//                       { text: 'No', style: 'cancel' },
//                       {
//                         text: 'Yes',
//                         onPress: async () => {
//                           try {
//                             const path = previewUri.startsWith('file://')
//                               ? previewUri.replace('file://', '')
//                               : previewUri;
//                             await RNFS.unlink(path).catch(() => {});
//                             setPreviewUri(null);
//                           } catch (err) {
//                             console.warn(err);
//                           }
//                         },
//                       },
//                     ]);
//                   }}
//                 >
//                   <Text style={styles.actionText}>Discard</Text>
//                 </TouchableOpacity>
//               </View>
//             </View>
//           )}
//         </>
//       )}
//     </View>
//   );
// }

// const styles = StyleSheet.create({
//   center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
//   controlsRow: {
//     position: 'absolute',
//     bottom: 24,
//     left: 0,
//     right: 0,
//     flexDirection: 'row',
//     justifyContent: 'space-around',
//     paddingHorizontal: 20,
//   },
//   controlBtn: {
//     backgroundColor: '#222',
//     paddingHorizontal: 18,
//     paddingVertical: 12,
//     borderRadius: 8,
//     alignItems: 'center',
//   },
//   controlText: { color: '#fff', fontWeight: '600' },
//   processing: {
//     position: 'absolute',
//     top: 20,
//     right: 20,
//     alignItems: 'center',
//   },
//   actionsRow: {
//     flexDirection: 'row',
//     justifyContent: 'space-between',
//     marginTop: 16,
//   },
//   actionBtn: {
//     flex: 1,
//     backgroundColor: '#0a84ff',
//     marginHorizontal: 6,
//     paddingVertical: 12,
//     borderRadius: 8,
//     alignItems: 'center',
//   },
//   actionText: { color: '#fff', fontWeight: '600' },
// });
// VideoCaptureScreen.tsx
import React, { useRef, useState, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Alert,
  StyleSheet,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { useIsFocused } from '@react-navigation/native';
import { Camera, useCameraDevices } from 'react-native-vision-camera';
import RNFS from 'react-native-fs';
import Video from 'react-native-video';
import { openSettings } from 'react-native-permissions';

export default function VideoCaptureScreen({ navigation, route }: any) {
  const devices = useCameraDevices();
  const device = devices.find(d => d.position === 'back') || devices[0];
  const camera = useRef<any>(null);
  const isFocused = useIsFocused();

  const [recording, setRecording] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [previewUri, setPreviewUri] = useState<string | null>(null);

  async function moveToAppStorage(tempPath: string) {
    const ext = tempPath.split('.').pop() ?? 'mp4';
    const destPath = `${RNFS.DocumentDirectoryPath}/video_${Date.now()}.${ext}`;
    const normalized = tempPath.startsWith('file://')
      ? tempPath.replace('file://', '')
      : tempPath;
    await RNFS.moveFile(normalized, destPath);
    return Platform.OS === 'android' ? `file://${destPath}` : destPath;
  }

  const startRecording = useCallback(async () => {
    try {
      const camPerm = await Camera.requestCameraPermission();
      const micPerm = await Camera.requestMicrophonePermission();
      if (!camPerm || !micPerm) {
        Alert.alert(
          'Permissions required',
          'Camera and microphone permissions are required.',
          [
            { text: 'Open settings', onPress: () => openSettings() },
            { text: 'Cancel', style: 'cancel' },
          ],
        );
        return;
      }

      setRecording(true);
      setPreviewUri(null);

      await camera.current?.startRecording({
        onRecordingFinished: async (video: any) => {
          try {
            setRecording(false);
            setProcessing(true);
            const saved = await moveToAppStorage(video.path);
            setPreviewUri(saved);
            setProcessing(false);
          } catch (err) {
            setProcessing(false);
            Alert.alert('Save error', String(err));
          }
        },
        onRecordingError: (err: any) => {
          setRecording(false);
          setProcessing(false);
          Alert.alert('Recording error', String(err));
        },
      });
    } catch (err) {
      Alert.alert('Recording error', String(err));
    }
  }, []);

  const stopRecording = useCallback(() => {
    try {
      camera.current?.stopRecording();
      setRecording(false);
    } catch (err) {
      console.warn('stopRecording error', err);
    }
  }, []);

  const useThisRecording = () => {
    if (!previewUri) {
      Alert.alert('No video', 'Record a video first');
      return;
    }
    if (
      route?.params?.onReturn &&
      typeof route.params.onReturn === 'function'
    ) {
      route.params.onReturn(previewUri);
      navigation.goBack();
      return;
    }
    navigation.navigate('ComplaintScreen', { capturedVideoUri: previewUri });
  };

  return (
    <View style={{ flex: 1, backgroundColor: '#000' }}>
      {!device ? (
        <View style={styles.center}>
          <Text style={{ color: '#fff' }}>No camera available</Text>
        </View>
      ) : (
        <>
          {!previewUri ? (
            <>
              {isFocused && (
                <Camera
                  ref={camera}
                  style={StyleSheet.absoluteFill}
                  device={device}
                  isActive={true}
                  video={true}
                  audio={true}
                />
              )}

              <View style={styles.controlsRow}>
                <TouchableOpacity
                  style={[
                    styles.controlBtn,
                    recording && { backgroundColor: 'red' },
                  ]}
                  onPress={recording ? stopRecording : startRecording}
                >
                  <Text style={styles.controlText}>
                    {recording ? 'Stop' : 'Record'}
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.controlBtn}
                  onPress={() => navigation.goBack()}
                >
                  <Text style={styles.controlText}>Cancel</Text>
                </TouchableOpacity>
              </View>

              {processing && (
                <View style={styles.processing}>
                  <ActivityIndicator color="#fff" />
                  <Text style={{ color: '#fff', marginTop: 8 }}>
                    Processing...
                  </Text>
                </View>
              )}
            </>
          ) : (
            <View style={{ flex: 1, padding: 12 }}>
              <View style={{ height: 320, backgroundColor: '#222' }}>
                <Video
                  source={{ uri: previewUri }}
                  style={{ width: '100%', height: '100%' }}
                  controls
                  resizeMode="contain"
                />
              </View>

              <View style={{ marginTop: 12 }}>
                <Text style={{ color: '#fff', marginBottom: 8 }}>
                  Preview saved at:
                </Text>
                <Text style={{ color: '#ccc' }} numberOfLines={1}>
                  {previewUri}
                </Text>
              </View>

              <View style={styles.actionsRow}>
                <TouchableOpacity
                  style={styles.actionBtn}
                  onPress={useThisRecording}
                >
                  <Text style={styles.actionText}>Use This</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.actionBtn}
                  onPress={() => {
                    // discard
                    RNFS.unlink(previewUri.replace('file://', '')).catch(
                      () => {},
                    );
                    setPreviewUri(null);
                  }}
                >
                  <Text style={styles.actionText}>Discard</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  controlsRow: {
    position: 'absolute',
    bottom: 24,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingHorizontal: 20,
  },
  controlBtn: {
    backgroundColor: '#222',
    paddingHorizontal: 18,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  controlText: { color: '#fff', fontWeight: '600' },
  processing: {
    position: 'absolute',
    top: 20,
    right: 20,
    alignItems: 'center',
  },
  actionsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 16,
  },
  actionBtn: {
    flex: 1,
    backgroundColor: '#0a84ff',
    marginHorizontal: 6,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  actionText: { color: '#fff', fontWeight: '600' },
});
