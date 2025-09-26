import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Image } from 'react-native';

// If you installed react-native-fast-image, replace Image import with FastImage usage for thumbnails.
// For simplicity we use RN Image here.

export default function VideoItem({
  item,
  onPress = () => {},
  isVisible = false,
}) {
  return (
    <TouchableOpacity
      style={styles.container}
      activeOpacity={0.9}
      onPress={() => onPress(item)}
    >
      <View style={styles.thumbWrap}>
        <Image
          source={{ uri: item.thumbUri }}
          style={styles.thumbnail}
          resizeMode="cover"
        />
        <View style={styles.metaOverlay}>
          <View style={styles.leftMeta}>
            <Text numberOfLines={2} style={styles.title}>
              {item.title}
            </Text>
            {item.duration ? (
              <Text style={styles.duration}>
                {formatDuration(item.duration)}
              </Text>
            ) : null}
          </View>
          <View style={styles.playWrapper}>
            <Text style={styles.playIcon}>▶</Text>
          </View>
        </View>
        {isVisible && (
          <View style={styles.visibleBadge}>
            <Text style={styles.visibleText}>Visible</Text>
          </View>
        )}
      </View>
    </TouchableOpacity>
  );
}

function formatDuration(sec) {
  if (!sec || isNaN(sec)) return '';
  const s = Math.floor(sec % 60)
    .toString()
    .padStart(2, '0');
  const m = Math.floor((sec / 60) % 60);
  const h = Math.floor(sec / 3600);
  if (h > 0) return `${h}:${m.toString().padStart(2, '0')}:${s}`;
  return `${m}:${s}`;
}

const styles = StyleSheet.create({
  container: { borderRadius: 8, overflow: 'hidden', backgroundColor: '#111' },
  thumbWrap: { width: '100%', aspectRatio: 16 / 9, backgroundColor: '#000' },
  thumbnail: {
    ...StyleSheet.absoluteFillObject,
    width: '100%',
    height: '100%',
  },
  metaOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'space-between',
    flexDirection: 'row',
    alignItems: 'flex-end',
    padding: 10,
    backgroundColor: 'transparent',
  },
  leftMeta: { flex: 1 },
  title: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 14,
    textShadowColor: 'rgba(0,0,0,0.6)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  duration: { color: '#fff', fontSize: 12, marginTop: 4, opacity: 0.95 },
  playWrapper: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 8,
  },
  playIcon: { color: '#fff', fontSize: 18, marginLeft: 2 },
  visibleBadge: {
    position: 'absolute',
    top: 8,
    left: 8,
    backgroundColor: 'rgba(0,0,0,0.6)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  visibleText: { color: '#fff', fontSize: 11 },
});
