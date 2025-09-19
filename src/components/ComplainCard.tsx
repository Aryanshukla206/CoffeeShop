import React from 'react';
import { ImageBackground, StyleSheet, Text, View } from 'react-native';

interface ComplainCardProps {
  id: string;
  text: string;
  imageUrl: string;
//   BackHandler : any // Cloudinary URL
}

const ComplainCard: React.FC<ComplainCardProps> = ({ id, text, imageUrl }) => {
  console.log(imageUrl)
    return (
    <View style={styles.card}>
      
      <ImageBackground
        source={{ uri: imageUrl }}
        style={styles.image}
        imageStyle={{ borderRadius: 12, objectFit: 'scale-down' }}
      >
        <View style={styles.overlay}>
          <Text style={styles.text} numberOfLines={3}>
            {text}
          </Text>
        </View>
      </ImageBackground>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    marginBottom: 16,
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: '#f5f5f5',
    elevation: 3, // Android shadow
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
  },
  image: {
    width: '100%',
    height: 250, // <-- use fixed height instead of flex
    justifyContent: 'flex-end',
    
  },
  overlay: {
    backgroundColor: 'rgba(0,0,0,0.5)',
    padding: 8,
  },
  text: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
});

export default ComplainCard;
