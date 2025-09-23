import {StyleSheet, Text, View} from 'react-native';
import React from 'react';
import {COLORS, FONTFAMILY, FONTSIZE, SPACING} from '../theme/theme';
import GradientBGIcon from './GradientBGIcon';
import ProfilePic from './ProfilePic';




interface HeaderBarProps {
  title?: any;
  picture?: string;
}

const HeaderBar: React.FC<HeaderBarProps> = ({title , picture}) => {
  console.log(title)
  return (
    <View style={styles.HeaderContainer}>
      <GradientBGIcon
        name="home"
        color={COLORS.primaryLightGreyHex}
        size={FONTSIZE.size_16}
      />
     <Text style={styles.HeaderText}>
      {title?.trim() || "Welcome User"}
      </Text>
      
      <ProfilePic picture={picture} />
    </View>
  );
};

const styles = StyleSheet.create({
  HeaderContainer: {
    padding: SPACING.space_30,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  HeaderText: {
    fontFamily: FONTFAMILY.poppins_semibold,
    fontSize: FONTSIZE.size_20,
    color: COLORS.primaryWhiteHex,
  },
});

export default HeaderBar;
