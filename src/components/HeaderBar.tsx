import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import React from 'react';
import { COLORS, FONTFAMILY, FONTSIZE, SPACING } from '../theme/theme';
import GradientBGIcon from './GradientBGIcon';
import ProfilePic from './ProfilePic';
import analytics from '@react-native-firebase/analytics';
import { useNotifications } from '../contexts/NotificationContext';

interface HeaderBarProps {
  title?: any;
  picture?: string;
}

const HeaderBar: React.FC<HeaderBarProps> = ({ title, picture }) => {
  const { unreadCount, checkForUpdates } = useNotifications();

  const onPressBell = async () => {
    try {
      // Analytics event
      await analytics().logEvent('notification_checked', {
        method: 'bell_press',
      });

      // Check for new notifications (triggers IAM optionally and opens modal)
      await checkForUpdates();
    } catch (err) {
      console.warn('[HeaderBar] onPressBell', err);
    }
  };

  return (
    <View style={styles.HeaderContainer}>
      <TouchableOpacity onPress={onPressBell} style={styles.bellButton}>
        <GradientBGIcon
          name="bell"
          color={COLORS.primaryLightGreyHex}
          size={FONTSIZE.size_16}
        />
        {unreadCount > 0 && (
          <View style={styles.badge}>
            <Text style={styles.badgeText}>{unreadCount}</Text>
          </View>
        )}
      </TouchableOpacity>
      <Text style={styles.HeaderText}>{title?.trim() || 'Welcome User'}</Text>

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
  bellButton: {
    padding: 6,
    marginRight: 12,
  },
  badge: {
    position: 'absolute',
    right: 0,
    top: -4,
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: '#ff3b30',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 4,
  },
  badgeText: { color: 'white', fontSize: 11, fontWeight: '700' },
});

export default HeaderBar;
