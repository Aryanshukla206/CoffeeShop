import React, { useEffect, useState, useRef } from 'react';
import {
  View,
  Text,
  ActivityIndicator,
  TouchableOpacity,
  StyleSheet,
  Image,
  Alert,
  PermissionsAndroid,
} from 'react-native';
import MapView, { Marker, PROVIDER_GOOGLE } from 'react-native-maps';
import MapViewDirections from 'react-native-maps-directions';
import Geolocation from 'react-native-geolocation-service';

const GOOGLE_API_KEY = 'AIzaSyCEf5d0gjEB4LE6Ba-xm_CTWKUAd4Ez8mI';
const FSQ_SERVICE_KEY = '12HGYO5QT5RY2P55OOF5RSMDJPHJ2LOEM31JDCPW0ZFKWQHY';

export default function MapsScreen() {
  const [region, setRegion] = useState<any>(null);
  const [currentLocation, setCurrentLocation] = useState<any>(null);
  const [places, setPlaces] = useState<any[]>([]);
  const [selectedPlace, setSelectedPlace] = useState<any>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [exploring, setExploring] = useState<boolean>(false);
  const mapRef = useRef<MapView>(null);

  useEffect(() => {
    requestLocationPermission();
  }, []);

  const requestLocationPermission = async () => {
    try {
      setLoading(true);

      // Request Android location permission
      const granted = await PermissionsAndroid.request(
        PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
        {
          title: 'Location Permission',
          message:
            'CoffeeMap needs access to your location to find nearby coffee shops.',
          buttonNeutral: 'Ask Me Later',
          buttonNegative: 'Cancel',
          buttonPositive: 'OK',
        },
      );

      if (granted !== PermissionsAndroid.RESULTS.GRANTED) {
        Alert.alert(
          'Permission Denied',
          'Location permission is required to show coffee shops near you.',
        );
        setLoading(false);
        return;
      }

      // Get current location using Geolocation
      Geolocation.getCurrentPosition(
        position => {
          const coords = {
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
          };

          setCurrentLocation(coords);

          const initialRegion = {
            latitude: coords.latitude,
            longitude: coords.longitude,
            latitudeDelta: 0.01,
            longitudeDelta: 0.01,
          };

          setRegion(initialRegion);
          setLoading(false);

          console.log('Current location set:', coords);
        },
        error => {
          console.error('Error getting location:', error);
          Alert.alert(
            'Error',
            'Failed to get your current location. Please enable GPS.',
          );
          setLoading(false);
        },
        {
          enableHighAccuracy: true,
          timeout: 15000,
          maximumAge: 10000,
        },
      );
    } catch (error) {
      console.error('Error requesting permission:', error);
      Alert.alert('Error', 'Failed to request location permission');
      setLoading(false);
    }
  };

  const handleExplore = async () => {
    if (!currentLocation) {
      Alert.alert('Error', 'Location not available. Please try again.');
      return;
    }

    setExploring(true);
    await fetchNearbyCoffeeShops(
      currentLocation.latitude,
      currentLocation.longitude,
    );
    setExploring(false);
  };

  const fetchNearbyCoffeeShops = async (lat: number, lng: number) => {
    try {
      console.log('Fetching coffee shops at:', lat, lng);

      const url = `https://places-api.foursquare.com/places/search?query=coffee&ll=${lat},${lng}&radius=5000&limit=20`;

      const response = await fetch(url, {
        method: 'GET',
        headers: {
          Accept: 'application/json',
          Authorization: `Bearer ${FSQ_SERVICE_KEY}`,
          'X-Places-Api-Version': '2025-06-17',
        },
      });

      const data = await response.json();

      if (!response.ok) {
        console.error('Foursquare API error:', data);
        Alert.alert('Error', 'Failed to fetch coffee shops');
        return;
      }

      const results = data.results || [];

      const normalized = results.map((r: any) => ({
        id: r.fsq_place_id || r.fsq_id || null,
        name: r.name || 'Unknown',
        latitude:
          r.geocodes?.main?.latitude ??
          r.geocodes?.latitude ??
          r.latitude ??
          null,
        longitude:
          r.geocodes?.main?.longitude ??
          r.geocodes?.longitude ??
          r.longitude ??
          null,
        address:
          r.location?.formatted_address || r.location?.address || 'No address',
        categories: r.categories || [],
        icon: r.categories?.[0]?.icon || null,
      }));

      console.log('Fetched coffee shops:', normalized.length);
      setPlaces(normalized);

      if (normalized.length === 0) {
        Alert.alert('No Results', 'No coffee shops found nearby');
      }
    } catch (error) {
      console.error('Error fetching coffee shops:', error);
      Alert.alert('Error', 'Failed to fetch coffee shops');
    }
  };

  const handleMarkerPress = (place: any) => {
    setSelectedPlace(place);

    // Zoom to selected place
    if (mapRef.current) {
      mapRef.current.animateToRegion(
        {
          latitude: place.latitude,
          longitude: place.longitude,
          latitudeDelta: 0.005,
          longitudeDelta: 0.005,
        },
        1000,
      );
    }
  };

  const handleBackPress = () => {
    setSelectedPlace(null);

    // Zoom back to current location
    if (mapRef.current && region) {
      mapRef.current.animateToRegion(region, 1000);
    }
  };

  if (loading) {
    return (
      <View style={styles.loaderContainer}>
        <ActivityIndicator size="large" color="#8B4513" />
        <Text style={styles.loadingText}>Loading your location...</Text>
      </View>
    );
  }

  if (!region) {
    return (
      <View style={styles.loaderContainer}>
        <Text style={styles.errorText}>Unable to get your location</Text>
        <TouchableOpacity
          style={styles.retryButton}
          onPress={requestLocationPermission}
        >
          <Text style={styles.retryButtonText}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>CoffeeMap ☕️</Text>
        <TouchableOpacity
          style={[
            styles.exploreButton,
            exploring && styles.exploreButtonDisabled,
          ]}
          onPress={handleExplore}
          disabled={exploring}
        >
          {exploring ? (
            <ActivityIndicator size="small" color="white" />
          ) : (
            <Text style={styles.exploreButtonText}>Explore Coffee Shops</Text>
          )}
        </TouchableOpacity>
      </View>

      <MapView
        ref={mapRef}
        style={styles.map}
        initialRegion={region}
        showsUserLocation
        showsMyLocationButton
        provider={PROVIDER_GOOGLE}
      >
        <Marker
          coordinate={{
            latitude: region.latitude,
            longitude: region.longitude,
          }}
          title="Current Location"
          description="My Current Location"
          pinColor="plum"
        />
        {places.map((place, index) => (
          <Marker
            key={place.id || index}
            coordinate={{
              latitude: place.latitude,
              longitude: place.longitude,
            }}
            title={place.name}
            description={place.address}
            onPress={() => handleMarkerPress(place)}
            pinColor="#8B4513"
          />
        ))}

        {/* {selectedPlace && currentLocation && (
          <MapViewDirections
            origin={{
              latitude: currentLocation.latitude,
              longitude: currentLocation.longitude,
            }}
            destination={{
              latitude: selectedPlace.latitude,
              longitude: selectedPlace.longitude,
            }}
            apikey="AIzaSyCEf5d0gjEB4LE6Ba-xm_CTWKUAd4Ez8mI"
            strokeWidth={4}
            strokeColor="#8B4513"
            // onError={err => console.warn('Direction error:', err)}
            onReady={result => {
              console.log('Distance:', result.distance, 'km');
              console.log('Duration:', result.duration, 'min');
            }}
            onError={err => {
              console.error('Direction error details:', err);
              Alert.alert(
                'Direction Error',
                'Unable to fetch directions. Please check your API key and ensure Directions API is enabled.',
              );
            }}
          />
        )} */}
      </MapView>

      {selectedPlace && (
        <View style={styles.infoBox}>
          <View style={styles.infoHeader}>
            <View style={styles.infoTextContainer}>
              <Text style={styles.infoTitle}>{selectedPlace.name}</Text>
              <Text style={styles.infoAddress}>{selectedPlace.address}</Text>
            </View>
            {selectedPlace.icon && (
              <Image
                source={{
                  uri:
                    selectedPlace.icon.prefix +
                    '64' +
                    selectedPlace.icon.suffix,
                }}
                style={styles.categoryIcon}
                resizeMode="contain"
              />
            )}
          </View>
          <TouchableOpacity style={styles.backButton} onPress={handleBackPress}>
            <Text style={styles.backButtonText}>Back to Map</Text>
          </TouchableOpacity>
        </View>
      )}

      {places.length > 0 && !selectedPlace && (
        <View style={styles.resultsCounter}>
          <Text style={styles.resultsText}>
            Found {places.length} coffee shop{places.length !== 1 ? 's' : ''}{' '}
            nearby
          </Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loaderContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFF',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#666',
  },
  errorText: {
    fontSize: 16,
    color: '#666',
    marginBottom: 20,
  },
  retryButton: {
    backgroundColor: '#8B4513',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  retryButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  header: {
    position: 'absolute',
    top: 50,
    left: 10,
    right: 10,
    zIndex: 10,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#8B4513',
    backgroundColor: 'white',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 12,
    elevation: 5,
  },
  exploreButton: {
    backgroundColor: '#8B4513',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 12,
    elevation: 5,
    minWidth: 140,
    alignItems: 'center',
  },
  exploreButtonDisabled: {
    opacity: 0.7,
  },
  exploreButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
  },
  map: {
    flex: 1,
  },
  infoBox: {
    position: 'absolute',
    bottom: 80,
    left: 20,
    right: 20,
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 20,
    elevation: 8,
  },
  infoHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  infoTextContainer: {
    flex: 1,
    marginRight: 12,
  },
  infoTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#8B4513',
    marginBottom: 6,
  },
  infoAddress: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
  },
  categoryIcon: {
    width: 50,
    height: 50,
    borderRadius: 8,
    backgroundColor: '#543030ff',
  },
  backButton: {
    backgroundColor: '#8B4513',
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
  },
  backButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  resultsCounter: {
    position: 'absolute',
    top: 100,
    alignSelf: 'center',
    backgroundColor: 'white',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
    elevation: 5,
  },
  resultsText: {
    color: '#8B4513',
    fontSize: 14,
    fontWeight: '600',
  },
});
