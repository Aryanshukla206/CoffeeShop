import React, { createContext, useContext, useEffect, useState } from 'react';
import auth, { FirebaseAuthTypes } from '@react-native-firebase/auth';
import { GoogleSignin } from '@react-native-google-signin/google-signin';
import { configureGoogleSignIn } from '../auth/googleConfig';

type User = FirebaseAuthTypes.User | null;

type AuthContextType = {
  user: User;
  initializing: boolean;
  signInWithGoogle: () => Promise<void>;
  signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode; webClientId: string }> = ({ children, webClientId }) => {
  const [user, setUser] = useState<User>(null);
  const [initializing, setInitializing] = useState(true);
  console.log(user, "----------_>")
  useEffect(() => {
    configureGoogleSignIn(webClientId);
    const subscriber = auth().onAuthStateChanged(u => {
      setUser(u);
      if (initializing) setInitializing(false);
    });
    return subscriber; 
  }, [webClientId]);

  const signInWithGoogle = async () => {
  try {
    await GoogleSignin.hasPlayServices({ showPlayServicesUpdateDialog: true });
    // here is the problem

    const userInfo = await GoogleSignin.signIn();
    console.log('signup result:', userInfo);
    const idToken = (userInfo.data as any).idToken;
    console.log('idToken:', idToken);
    if (!idToken) throw new Error('Missing idToken');

    const googleCredential = auth.GoogleAuthProvider.credential(idToken);
    await auth().signInWithCredential(googleCredential);
  } catch (err) {
    console.error('Google sign-in error', err);
    throw err;
  }
};

  const signOut = async () => {
    try {
      await auth().signOut();
      await GoogleSignin.signOut();
    } catch (err) {
      console.error('Sign out error', err);
      throw err;
    }
  };

  return (
    <AuthContext.Provider value={{ user, initializing, signInWithGoogle, signOut }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  console.log(ctx, "--------->")
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
};
