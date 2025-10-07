import { useEffect, useState } from 'react';
import { Alert, Platform } from 'react-native';
import Geolocation from 'react-native-geolocation-service';
import { check, PERMISSIONS, request, RESULTS } from 'react-native-permissions';

export default function getCurrentLocation() {
  const [initializing, setInitializing] = useState(true);
  const [coords, setCoords] = useState<any>(null);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    const requestLocation = async () => {
      const perm =
        Platform.OS === 'ios'
          ? PERMISSIONS.IOS.LOCATION_WHEN_IN_USE
          : PERMISSIONS.ANDROID.ACCESS_FINE_LOCATION;

      let res = await check(perm);
      if (res === RESULTS.DENIED) {
        res = await request(perm);
      }

      if (res === RESULTS.GRANTED) {
        Geolocation.getCurrentPosition(
          pos => {
            setCoords(pos.coords);
          },
          error => {
            setErr(error.message);
          },
          { enableHighAccuracy: true, timeout: 15000, maximumAge: 10000 },
        );
      } else {
        Alert.alert('Permission denied', 'Location is required.');
      }

      setInitializing(false);
    };

    requestLocation();
  }, []);
  return {coords};
}
