import React, { useRef, useCallback, useState } from 'react';
import { View, ScrollView, FlatList, StyleSheet, Text } from 'react-native';
import VideoItem from '../components/VideoItem';
import { StatusBar } from 'react-native';
import { COLORS } from '../theme/theme';

const SAMPLE_VIDEOS = [
  {
    id: '1',
    title: 'Big Buck Bunny (MP4)',
    videoUri: 'https://www.w3schools.com/html/mov_bbb.mp4',
    thumbUri:
      'https://peach.blender.org/wp-content/uploads/title_anouncement.jpg',
    duration: 10,
  },
  {
    id: '2',
    title: 'NASA Live Stream (HLS)',
    videoUri: 'https://nasatv-lh.akamaihd.net/i/NASA_101@319270/master.m3u8',
    thumbUri:
      'https://www.nasa.gov/sites/default/files/thumbnails/image/nasa-logo-web-rgb.png',
    duration: 0, // live (unknown)
  },
  {
    id: '3',
    title: 'Live Sports Demo (HLS)',
    videoUri: 'https://test-streams.mux.dev/pts_shift/master.m3u8',
    thumbUri:
      'https://upload.wikimedia.org/wikipedia/commons/1/1a/Sports_icon.png',
    duration: 0, // live stream
  },
];

export default function VideoListScreen({ navigation }: any) {
  const [visibleMap, setVisibleMap] = useState({});
  const viewabilityConfig = useRef({
    itemVisiblePercentThreshold: 60,
    waitForInteraction: false,
  }).current;

  const onViewableItemsChanged = useRef(({ viewableItems }) => {
    const newMap = {};
    viewableItems.forEach(v => {
      if (v?.item?.id) newMap[v.item.id] = v.isViewable;
    });
    setVisibleMap(prev => ({ ...prev, ...newMap }));
  }).current;

  const renderItem = useCallback(
    ({ item }) => (
      <VideoItem
        item={item}
        isVisible={!!visibleMap[item.id]}
        onPress={() => navigation.push('LiveStream', { item })}
      />
    ),
    [visibleMap, navigation],
  );

  return (
    <View style={styles.container}>
      <StatusBar backgroundColor={COLORS.primaryBlackHex} />
      <Text style={styles.heading}>Video Streaming</Text>

      <FlatList
        data={SAMPLE_VIDEOS}
        keyExtractor={i => i.id}
        renderItem={renderItem}
        contentContainerStyle={{
          padding: 12,
          borderColor: 'white',
          marginBottom: 100,
        }}
        ItemSeparatorComponent={() => <View style={{ height: 12 }} />}
        onViewableItemsChanged={onViewableItemsChanged}
        viewabilityConfig={viewabilityConfig}
        initialNumToRender={2}
        windowSize={5}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.primaryBlackHex },
  heading: {
    flexDirection: 'row',
    paddingTop: 15,
    fontSize: 26,
    alignContent: 'center',
    margin: 'auto',
    color: 'white',
  },
});
