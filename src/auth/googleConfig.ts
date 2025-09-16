import { GoogleSignin } from '@react-native-google-signin/google-signin';

export const configureGoogleSignIn = (webClientId: string) => {
  GoogleSignin.configure({
    webClientId,
  });
};
