import { PermissionsAndroid, Platform } from 'react-native';

export async function ensureReadPermission(): Promise<boolean> {
  if (Platform.OS !== 'android') return true;

  try {
    const sdk = Platform.Version as number;
    if (sdk >= 33) {
      const readImages = await PermissionsAndroid.request(
        PermissionsAndroid.PERMISSIONS.READ_MEDIA_IMAGES as any
      );
      const readVideo = await PermissionsAndroid.request(
        PermissionsAndroid.PERMISSIONS.READ_MEDIA_VIDEO as any
      );
      const readAudio = await PermissionsAndroid.request(
        PermissionsAndroid.PERMISSIONS.READ_MEDIA_AUDIO as any
      );
      return readImages === PermissionsAndroid.RESULTS.GRANTED ||
             readVideo === PermissionsAndroid.RESULTS.GRANTED ||
             readAudio === PermissionsAndroid.RESULTS.GRANTED;
    } else {
      const granted = await PermissionsAndroid.request(
        PermissionsAndroid.PERMISSIONS.READ_EXTERNAL_STORAGE
      );
      return granted === PermissionsAndroid.RESULTS.GRANTED;
    }
  } catch (e) {
    console.warn('Permission error', e);
    return false;
  }
}
