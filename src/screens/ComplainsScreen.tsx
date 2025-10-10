// ComplainsScreen.tsx
import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  FlatList,
  ActivityIndicator,
  TouchableOpacity,
  StyleSheet,
  StatusBar,
} from 'react-native';
import firestore from '@react-native-firebase/firestore';
import ComplainCard from '../components/ComplainCard';
import { COLORS, FONTFAMILY, FONTSIZE, SPACING } from '../theme/theme';
import GradientBGIcon from '../components/GradientBGIcon';

const ComplainsScreen = ({ navigation }: any) => {
  const [complaints, setComplaints] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  const BackHandler = () => {
    navigation.pop();
  };

  useEffect(() => {
    const unsubscribe = firestore()
      .collection('coffeeshopComplaints')
      .onSnapshot(
        snapshot => {
          const items = snapshot.docs.map(doc => {
            const data = doc.data();
            console.log(data, 'data==');
            return {
              id: doc.id,
              imageUrl: data.ImageUrl ?? data.imageUrl ?? null,
              text: data.Text,
            };
          });
          setComplaints(items);
          setLoading(false);
        },
        err => {
          console.error('Firestore onSnapshot error:', err);
          setLoading(false);
        },
      );

    return () => unsubscribe();
  }, []);
  console.log(complaints, 'complaints from firebase=======.');
  // console.log(items, "items===========")
  const renderItem = ({ item }: { item: any }) => (
    <ComplainCard
      id={item.id}
      text={item.text}
      imageUrl={item.imageUrl ?? ''}
    />
  );

  return (
    <View style={styles.ScreenContainer}>
      {loading ? (
        <View style={styles.loadingWrap}>
          <ActivityIndicator size="large" color={COLORS.primaryWhiteHex} />
        </View>
      ) : (
        <FlatList
          data={complaints}
          keyExtractor={item => item.id}
          renderItem={renderItem}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <Text style={styles.emptyText}>No complaints found.</Text>
          }
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  ScreenContainer: {
    flex: 1,
    backgroundColor: COLORS.primaryBlackHex,
  },
  listContent: {
    paddingHorizontal: 16,
    paddingTop: 24,
    paddingBottom: 40,
  },
  loadingWrap: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 40,
  },
  Heading: {
    fontFamily: FONTFAMILY.poppins_semibold,
    fontSize: FONTSIZE.size_28,
    color: COLORS.primaryWhiteHex,
    marginBottom: SPACING.space_10,
    marginTop: 30,
    alignSelf: 'center',
  },
  ImageHeaderBarContainerWithBack: {
    padding: SPACING.space_30,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-start',
    position: 'absolute',
    top: 0,
    left: 0,
    zIndex: 10,
  },
  emptyText: {
    color: COLORS.primaryWhiteHex,
    textAlign: 'center',
    marginTop: 40,
    fontSize: 16,
  },
});

export default ComplainsScreen;
