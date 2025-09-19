import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  Button,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Image,
  Alert,
  Platform,
} from 'react-native';
import { launchImageLibrary, Asset } from 'react-native-image-picker';
import { BORDERRADIUS, COLORS, FONTFAMILY, FONTSIZE, SPACING } from '../theme/theme';
import GradientBGIcon from '../components/GradientBGIcon';
import firestore from '@react-native-firebase/firestore';


export default function ComplaintScreen({navigation, route}: any) {
  const [complaint, setComplaint] = useState('');
  const [file, setFile] = useState<Asset | null>(null);
  const [loading, setLoading] = useState(false);

  const CLOUD_NAME = 'dtgtukgvf';
  const UPLOAD_PRESET = 'coffeeShop';

  const pickFile = async () => {
    try {
      const result = await launchImageLibrary({
        mediaType: 'photo', // you can change to 'mixed' if you want videos also
        selectionLimit: 1,
      });

      if (result.didCancel) {
        console.log('User cancelled image picker');
        return;
      }
      if (result.errorCode) {
        throw new Error(result.errorMessage || 'ImagePicker error');
      }

      const picked = result.assets?.[0];
      if (picked) {
        setFile(picked);
      }
    } catch (err: any) {
      console.error('ImagePicker error: ', err);
      Alert.alert('Error', 'Failed to pick file: ' + (err?.message || err));
    }
  };

  const uploadToCloudinary = async (picked: Asset) => {
    if (!picked.uri) throw new Error('Invalid file uri');

    const name = picked.fileName ?? `file_${Date.now()}`;
    const type = picked.type ?? 'application/octet-stream';

    const form = new FormData();
    form.append('file', {
      uri: Platform.OS === 'android' ? picked.uri : picked.uri.replace('file://', ''),
      name,
      type,
    } as any);
    form.append('upload_preset', UPLOAD_PRESET);

    const url = `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/auto/upload`;
    const res = await fetch(url, {
      method: 'POST',
      body: form,
    });

    if (!res.ok) {
      const txt = await res.text().catch(() => '');
      throw new Error(`Upload failed ${res.status} ${txt}`);
    }
    return res.json();
  };

  const submitComplaint = async () => {
    if (!complaint.trim()) {
      Alert.alert('Validation', 'Please enter complaint text.');
      return;
    }
    if (!file) {
      Alert.alert('Validation', 'Please pick a file to upload.');
      return;
    }

    setLoading(true);
    try {
      const result = await uploadToCloudinary(file);

      console.log(result, "uploaded to cloudinary")
      const secureUrl = result?.secure_url ?? result?.url;
      if (!secureUrl) throw new Error('No URL returned from Cloudinary');

      Alert.alert('Success', 'Your complaint is registered', [{ text: 'OK' }]);
      console.log('Cloudinary response', result);
        firestore()
            .collection('CoffeeShopComplaints')
            .add({
                ImageUrl: secureUrl,
                Text: complaint ,
            })
            .then(() => {
                console.log('User added!');
            });
      // reset
      setComplaint('');
      
      setFile(null);
    } catch (err: any) {
      console.error('Upload error', err);
      Alert.alert('Upload failed', err.message || String(err));
    } finally {
      setLoading(false);
    }
  };
   const BackHandler = () => {
    navigation.pop();
  };

  return (
    <View style={styles.container}>
        <View style={styles.ImageHeaderBarContainerWithBack}>
         <TouchableOpacity
              onPress={() => {
                BackHandler();
              }}>
              <GradientBGIcon
                name="left"
                color={COLORS.primaryWhiteHex}
                size={FONTSIZE.size_16}
              />
            </TouchableOpacity>
            </View>
      <Text style={styles.heading}>Register Complaint</Text>

      <TextInput
        style={styles.input}
        placeholder = "Enter complaint"
        value={complaint}
        onChangeText={setComplaint}
        multiline
      />

      <TouchableOpacity style={styles.pickBtn} onPress={pickFile}>
        <Text style={styles.pickBtnText}>{file ? file.fileName : 'Pick File'}</Text>
      </TouchableOpacity>

      {file?.uri && (
        <Image source={{ uri: file.uri }} style={styles.preview} resizeMode="cover" />
      )}

      {loading ? (
        <ActivityIndicator size="large" color="#007bff" />
      ) : (
        <TouchableOpacity style={styles.submitButton} onPress={submitComplaint}>
                <Text style={styles.pickBtnText}>{ 'Submit'}</Text>
         </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16,  color: COLORS.primaryWhiteHex  , backgroundColor: COLORS.primaryBlackHex, paddingTop:20, justifyContent: 'center'},
  heading: { fontSize: 20, marginBottom: 12 , alignItems :'center', color :COLORS.primaryWhiteHex, marginHorizontal: 'auto', },
  input: { borderWidth: 1, color :COLORS.primaryWhiteHex , borderColor: COLORS.primaryWhiteHex, borderRadius: 6, padding: 10, minHeight: 80, marginBottom: 12,fontFamily: FONTFAMILY.poppins_semibold,
    fontSize: FONTSIZE.size_14},
  pickBtn: { backgroundColor: COLORS.primaryOrangeHex, padding: 12, borderRadius: BORDERRADIUS.radius_20, marginBottom: 12 },
  pickBtnText: { color: COLORS.primaryWhiteHex, textAlign: 'center',fontFamily: FONTFAMILY.poppins_semibold, fontSize: FONTSIZE.size_18, },
  preview: {   width: 200, height: 200, borderRadius: 8, marginBottom: 12 , alignContent: 'center', justifyContent:  'center'},
  ImageHeaderBarContainerWithBack: {
    padding: SPACING.space_20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    position : 'absolute',
    top : 20,
    left : 5,
  },
  submitButton : {
   backgroundColor: COLORS.primaryLightGreyHex, padding: 12, borderRadius: BORDERRADIUS.radius_20, marginBottom: 12
  }
});
