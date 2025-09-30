import inAppMessaging from '@react-native-firebase/in-app-messaging';

export async function initInAppMessaging() {
  try {
    // Suppress until ready (optional)
    await inAppMessaging().setMessagesDisplaySuppressed(true);
    console.log('message recieved -----__> ');
    // Enable after splash/login is done
    setTimeout(async () => {
      await inAppMessaging().setMessagesDisplaySuppressed(false);
    }, 3000);
  } catch (err) {
    console.warn('IAM setup error', err);
  }
}
