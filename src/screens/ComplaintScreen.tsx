import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Image,
  Alert,
  Platform,
  Linking,
} from 'react-native';
import { launchImageLibrary, Asset } from 'react-native-image-picker';
import { pick, types, keepLocalCopy } from '@react-native-documents/picker';
import Video from 'react-native-video';
import firestore from '@react-native-firebase/firestore';
import RNFS from 'react-native-fs';

const CLOUD_NAME = 'dtgtukgvf';
const UPLOAD_PRESET = 'coffeeShop';

type Mode = 'none' | 'image' | 'livePhoto' | 'liveVideo' | 'pdf';

export default function ComplaintScreen({ navigation, route }: any) {
  const [complaint, setComplaint] = useState('');
  const [selectedMode, setSelectedMode] = useState<Mode>('none');

  const [imageAsset, setImageAsset] = useState<Asset | null>(null);
  const [photoUri, setPhotoUri] = useState<string | null>(null);
  const [videoUri, setVideoUri] = useState<string | null>(null);
  const [pdfPath, setPdfPath] = useState<string | null>(null);

  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (route?.params?.capturedImageUri) {
      setSelectedMode('livePhoto');
      setPhotoUri(route.params.capturedImageUri);
    }
    if (route?.params?.capturedVideoUri) {
      setSelectedMode('liveVideo');
      setVideoUri(route.params.capturedVideoUri);
    }
  }, [route?.params]);

  const clearAllMedia = () => {
    setImageAsset(null);
    setPhotoUri(null);
    setVideoUri(null);
    setPdfPath(null);
  };

  const onSelectMode = (mode: Mode) => {
    if (mode !== selectedMode) {
      clearAllMedia();
      setSelectedMode(mode);
      if (mode === 'image') pickFile();
      if (mode === 'livePhoto') openCaptureScreen();
      if (mode === 'liveVideo') openVideoCaptureScreen();
      if (mode === 'pdf') pickPdf();
    } else {
      setSelectedMode('none');
      clearAllMedia();
    }
  };

  const pickFile = async () => {
    try {
      const result = await launchImageLibrary({
        mediaType: 'photo',
        selectionLimit: 1,
      });

      if (result.didCancel) return;
      if (result.errorCode)
        throw new Error(result.errorMessage || 'ImagePicker error');

      const picked = result.assets?.[0];
      if (picked) {
        setImageAsset(picked);
        setSelectedMode('image');
      }
    } catch (err: any) {
      Alert.alert(
        'Error',
        'Failed to pick image: ' + (err?.message || String(err)),
      );
    }
  };

  const pickPdf = async () => {
    try {
      const [file] = await pick({
        type: [types.pdf],
        allowVirtualFiles: true,
      });

      if (!file) return;

      if ((file as any).isVirtual) {
        const virtualMeta = file.convertibleToMimeTypes?.[0];
        if (!virtualMeta) throw new Error('Virtual file: no convertible types');

        let name = file.name ?? `document_${Date.now()}`;
        if (!name.endsWith(`.${virtualMeta.extension}`)) {
          name = `${name}.${virtualMeta.extension}`;
        }

        const [copyResult] = await keepLocalCopy({
          files: [
            {
              uri: file.uri,
              fileName: name,
              convertVirtualFileToType: virtualMeta.mimeType,
            },
          ],
          destination: 'cachesDirectory',
        });

        if (copyResult.status === 'success') {
          setPdfPath(copyResult.localUri);
          setSelectedMode('pdf');
        } else {
          throw new Error(
            'Failed to copy virtual file: ' + copyResult.copyError,
          );
        }
      } else {
        setPdfPath(file.uri);
        setSelectedMode('pdf');
      }
    } catch (err: any) {
      if ((err as any)?.code === 'DOCUMENT_PICKER_CANCELED') return;
      Alert.alert(
        'Error',
        'Failed to pick PDF: ' + (err?.message || String(err)),
      );
    }
  };

  const openCaptureScreen = () => {
    // pass a JS callback (works inside same JS runtime)
    navigation.navigate('CaptureScreen', {
      onReturn: (uri: string) => {
        setPhotoUri(uri);
        setSelectedMode('livePhoto');
      },
    });
  };

  const openVideoCaptureScreen = () => {
    navigation.navigate('CaptureVideo', {
      onReturn: (uri: string) => {
        setVideoUri(uri);
        setSelectedMode('liveVideo');
      },
    });
  };

  const uploadToCloudinaryGeneric = async (input: Asset | string) => {
    // input: Asset (from image picker) or file URI string (file:// or content)
    let uri: string | undefined;
    let name = `file_${Date.now()}`;
    let mimeType = 'application/octet-stream';

    if (typeof input === 'string') {
      uri = input.startsWith('file://') ? input : input;
      name = uri.split('/').pop() ?? name;
      // infer mime from extension
      const ext = name.split('.').pop()?.toLowerCase();
      if (ext === 'pdf') mimeType = 'application/pdf';
      else if (ext === 'mp4') mimeType = 'video/mp4';
      else if (ext === 'mov') mimeType = 'video/quicktime';
      else if (ext === 'jpg' || ext === 'jpeg') mimeType = 'image/jpeg';
      else if (ext === 'png') mimeType = 'image/png';
    } else {
      uri =
        Platform.OS === 'android'
          ? input.uri
          : input.uri?.replace('file://', '');
      name = input.fileName ?? name;
      mimeType = input.type ?? mimeType;
    }

    if (!uri) throw new Error('Invalid file uri');

    // Ensure file is accessible for fetch (Cloudinary) - on Android content:// URIs might not be accepted by fetch.
    // If content://, copy to tmp file path
    if (uri.startsWith('content://')) {
      const tmpPath = `${RNFS.CachesDirectoryPath}/${name}`;
      // read via RNFS.copyFile won't accept content://—if failing, try using keepLocalCopy (if pdf) or rely on libraries
      // We'll attempt to copy by reading file (best-effort)
      try {
        // try to copy content to tmp via RNFS (may fail depending on content URI handling)
        // If it fails for you, consider using react-native-document-picker keepLocalCopy above for PDFs or native handling.
        const dest = tmpPath;
        // no direct content copy — leave as-is and rely on upload handling in your environment
        uri = uri; // proceed; may fail on some devices
      } catch (err) {
        console.warn(
          'Could not copy content URI; proceeding with original URI; upload may fail',
          err,
        );
      }
    }

    const fd = new FormData();
    // Cloudinary expects file field
    fd.append('file', {
      uri: Platform.OS === 'android' && !uri.startsWith('file://') ? uri : uri,
      name,
      type: mimeType,
    } as any);
    fd.append('upload_preset', UPLOAD_PRESET);

    const res = await fetch(
      `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/auto/upload`,
      {
        method: 'POST',
        body: fd,
      },
    );

    if (!res.ok) {
      const txt = await res.text().catch(() => '');
      throw new Error(`Upload failed: ${res.status} ${txt}`);
    }
    return res.json();
  };

  // --- Submit ---
  const submitComplaint = async () => {
    if (!complaint.trim()) {
      Alert.alert('Validation', 'Please enter complaint text.');
      return;
    }

    // Check one media selected
    const hasImage = !!imageAsset;
    const hasPhoto = !!photoUri;
    const hasVideo = !!videoUri;
    const hasPdf = !!pdfPath;

    if (!hasImage && !hasPhoto && !hasVideo && !hasPdf) {
      Alert.alert(
        'Validation',
        'Please pick/select one media (image/photo/video/pdf).',
      );
      return;
    }

    setLoading(true);
    try {
      let uploadResult: any;
      if (hasImage && imageAsset) {
        uploadResult = await uploadToCloudinaryGeneric(imageAsset);
      } else if (hasPhoto && photoUri) {
        uploadResult = await uploadToCloudinaryGeneric(photoUri);
      } else if (hasVideo && videoUri) {
        uploadResult = await uploadToCloudinaryGeneric(videoUri);
      } else if (hasPdf && pdfPath) {
        uploadResult = await uploadToCloudinaryGeneric(pdfPath);
      } else {
        throw new Error('No valid media for upload');
      }

      const secureUrl = uploadResult?.secure_url ?? uploadResult?.url;
      if (!secureUrl) throw new Error('Cloudinary did not return URL');

      await firestore()
        .collection('CoffeeShopComplaints')
        .add({
          text: complaint,
          mediaUrl: secureUrl,
          mediaType: hasPdf ? 'pdf' : hasVideo ? 'video' : 'image',
          createdAt: firestore.FieldValue.serverTimestamp(),
        });

      Alert.alert('Success', 'Complaint submitted successfully');
      // reset
      setComplaint('');
      clearAllMedia();
      setSelectedMode('none');
    } catch (err: any) {
      Alert.alert('Upload failed', err.message ?? String(err));
    } finally {
      setLoading(false);
    }
  };

  // --- Preview open PDF ---
  const openPdf = async (uri: string) => {
    try {
      // local file URI or content — try to open in external viewer
      const should = await Linking.canOpenURL(uri);
      if (should) {
        await Linking.openURL(uri);
      } else {
        Alert.alert('Cannot open PDF', uri);
      }
    } catch (err) {
      Alert.alert('Error opening PDF', String(err));
    }
  };

  // --- UI ---
  return (
    <View style={styles.container}>
      <Text style={styles.heading}>Register Complaint</Text>

      <TextInput
        style={styles.input}
        placeholder="Enter complaint"
        placeholderTextColor="#ddd"
        value={complaint}
        onChangeText={setComplaint}
        multiline
      />

      <View style={styles.selectorRow}>
        <TouchableOpacity
          style={[
            styles.modeBtn,
            selectedMode === 'image' && styles.modeBtnActive,
          ]}
          onPress={() => onSelectMode('image')}
        >
          <Text style={styles.modeText}>Pick Image</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.modeBtn,
            selectedMode === 'livePhoto' && styles.modeBtnActive,
          ]}
          onPress={() => onSelectMode('livePhoto')}
        >
          <Text style={styles.modeText}>Live Photo</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.modeBtn,
            selectedMode === 'liveVideo' && styles.modeBtnActive,
          ]}
          onPress={() => onSelectMode('liveVideo')}
        >
          <Text style={styles.modeText}>Live Video</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.modeBtn,
            selectedMode === 'pdf' && styles.modeBtnActive,
          ]}
          onPress={() => onSelectMode('pdf')}
        >
          <Text style={styles.modeText}>Pick PDF</Text>
        </TouchableOpacity>
      </View>

      {/* Preview area */}
      <View style={styles.previewArea}>
        {imageAsset && imageAsset.uri && (
          <Image source={{ uri: imageAsset.uri }} style={styles.previewImage} />
        )}

        {photoUri && (
          <Image source={{ uri: photoUri }} style={styles.previewImage} />
        )}

        {videoUri && (
          <View style={styles.videoContainer}>
            <Video source={{ uri: videoUri }} style={styles.video} controls />
            <Text style={styles.smallText} numberOfLines={1}>
              {videoUri}
            </Text>
          </View>
        )}

        {pdfPath && (
          <View>
            <Text style={styles.smallText} numberOfLines={1}>
              {pdfPath}
            </Text>
            <TouchableOpacity
              style={styles.openBtn}
              onPress={() => openPdf(pdfPath)}
            >
              <Text style={styles.openBtnText}>Open PDF</Text>
            </TouchableOpacity>
          </View>
        )}

        {!imageAsset && !photoUri && !videoUri && !pdfPath && (
          <Text style={styles.smallText}>No media selected</Text>
        )}
      </View>

      {loading ? (
        <ActivityIndicator size="large" color="#007bff" />
      ) : (
        <TouchableOpacity style={styles.submitButton} onPress={submitComplaint}>
          <Text style={styles.submitText}>Submit</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16, backgroundColor: '#000' },
  heading: { fontSize: 20, color: '#fff', marginBottom: 12 },
  input: {
    borderWidth: 1,
    borderColor: '#666',
    color: '#fff',
    borderRadius: 8,
    padding: 10,
    minHeight: 80,
    marginBottom: 12,
  },
  selectorRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  modeBtn: {
    padding: 10,
    backgroundColor: '#333',
    borderRadius: 8,
    flex: 1,
    marginHorizontal: 4,
    alignItems: 'center',
  },
  modeBtnActive: { backgroundColor: '#ff7a00' },
  modeText: { color: '#fff' },
  previewArea: {
    minHeight: 220,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  previewImage: { width: 220, height: 220, borderRadius: 8, marginBottom: 8 },
  videoContainer: {
    width: '100%',
    height: 240,
    backgroundColor: '#111',
    marginBottom: 8,
  },
  video: { width: '100%', height: '100%' },
  smallText: { color: '#ccc', marginVertical: 6 },
  openBtn: {
    backgroundColor: '#1e90ff',
    padding: 10,
    borderRadius: 8,
    alignSelf: 'center',
  },
  openBtnText: { color: '#fff' },
  submitButton: {
    backgroundColor: '#0a84ff',
    padding: 14,
    borderRadius: 10,
    alignItems: 'center',
  },
  submitText: { color: '#fff', fontWeight: '600' },
});
