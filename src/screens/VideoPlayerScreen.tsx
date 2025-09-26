import React, { useRef, useState } from 'react';
import {
  View,
  SafeAreaView,
  Text,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  StatusBar,
} from 'react-native';
import Video from 'react-native-video';
import { formatTime } from '../utils/time';
import Slider from '@react-native-community/slider';
import { COLORS } from '../theme/theme';

const { width, height } = Dimensions.get('window');

export default function VideoPlayerScreen({ navigation, route } : any) {
  const { item } = route.params;
  const playerRef = useRef(null);
  const [paused, setPaused] = useState(false);
  const [duration, setDuration] = useState(0);
  const [position, setPosition] = useState(0);
  const [buffering, setBuffering] = useState(false);

  return (
    <View style={styles.container}>
      <StatusBar backgroundColor={COLORS.primaryBlackHex} />
      <View style={styles.videoContainer}>
        <Video
          ref={playerRef}
          source={{ uri: item.videoUri }}
          style={styles.video}
          resizeMode="contain"
          paused={paused}
          controls={false}
          onLoad={meta => setDuration(meta.duration)}
          onProgress={p => setPosition(p.currentTime)}
          onBuffer={({ isBuffering }) => setBuffering(isBuffering)}
          onError={e => console.warn('Video error', e)}
        />
      </View>

      <View style={styles.controls}>
        <Text style={styles.title} numberOfLines={1}>
          {item.title}
        </Text>

        <View style={styles.row}>
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            style={styles.btn}
          >
            <Text style={styles.btnText}>Back</Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => setPaused(s => !s)}
            style={styles.btn}
          >
            <Text style={styles.btnText}>{paused ? 'Play' : 'Pause'}</Text>
          </TouchableOpacity>

          <Text style={styles.timeText}>
            {formatTime(position)} / {formatTime(duration)}
          </Text>
        </View>

        <Slider
          style={{ width: width - 48, height: 40 }}
          minimumValue={0}
          maximumValue={duration}
          value={position}
          onSlidingComplete={v =>
            playerRef.current &&
            playerRef.current.seek &&
            playerRef.current.seek(v)
          }
          minimumTrackTintColor="#ff5a5f"
          maximumTrackTintColor="#ccc"
          thumbTintColor="#ff5a5f"
        />

        {buffering && <Text style={styles.bufferText}>Buffering…</Text>}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
  videoContainer: {
    width: '100%',
    height: (width * 9) / 16,
    backgroundColor: '#000',
    justifyContent: 'center',
    alignItems: 'center',
  },
  video: { ...StyleSheet.absoluteFillObject },
  controls: { padding: 16, backgroundColor: '#0a0a0a' },
  title: { color: '#fff', fontSize: 16, fontWeight: '700', marginBottom: 8 },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  btn: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: '#222',
    borderRadius: 6,
  },
  btnText: { color: '#fff' },
  timeText: { color: '#ddd' },
  bufferText: { color: '#fff', marginTop: 8, textAlign: 'center' },
});
