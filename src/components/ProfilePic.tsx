import React from 'react';
import {StyleSheet, Image, View} from 'react-native';
import {COLORS, SPACING} from '../theme/theme';



const ProfilePic = (picture : any) => {
  const obj = picture ;
  const url = obj.picture;


  return (
    <View > 
      {url ? (
        <Image
          source={{ uri: url }}
          style={styles.Image}
        />
      ) : (
        <Image
          source={require('../assets/app_images/aryanDP.jpg')} // fallback
          style={styles.Image}
        />
      )}
      
    </View>
  );
};

const styles = StyleSheet.create({
  ImageContainer: {
    height: SPACING.space_36,
    width: SPACING.space_36,
    borderRadius: SPACING.space_12,
    borderWidth: 2,
    borderColor: COLORS.secondaryDarkGreyHex,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  Image: {
    height: SPACING.space_36,
    width: SPACING.space_36,
  },
});

export default ProfilePic;
