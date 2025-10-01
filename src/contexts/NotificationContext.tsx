// src/contexts/NotificationContext.tsx
import React, {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
} from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Modal,
  StyleSheet,
  Alert,
} from 'react-native';
import { navigate } from '../navigators/navigationService'; // your helper
import { Linking } from 'react-native';
import messaging from '@react-native-firebase/messaging';
import inAppMessaging from '@react-native-firebase/in-app-messaging';
import analytics from '@react-native-firebase/analytics';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { COLORS } from '../theme/theme';

type NotificationItem = {
  id: string;
  title: string;
  body?: string;
  routeName?: string;
  routeParams?: Record<string, any>;
  deepLink?: string;
  read?: boolean;
  createdAt?: number;
};

type NotificationContextType = {
  notifications: NotificationItem[];
  unreadCount: number;
  addNotification: (
    item: Omit<NotificationItem, 'id' | 'createdAt' | 'read'>,
  ) => NotificationItem;
  clearAll: () => void;
  openAll: () => void;
  markRead: (id: string) => void;
  checkForUpdates: () => Promise<void>; 
};

const NotificationContext = createContext<NotificationContextType | undefined>(
  undefined,
);

export const useNotifications = () => {
  const ctx = useContext(NotificationContext);
  if (!ctx)
    throw new Error(
      'useNotifications must be used inside NotificationProvider',
    );
  return ctx;
};

const STORAGE_KEY = '@myapp_notifications_v1';

export const NotificationProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [currentIndex, setCurrentIndex] = useState<number>(0);
  const unreadCount = notifications.filter(n => !n.read).length;

  // persist -> load on start
  useEffect(() => {
    (async () => {
      try {
        const raw = await AsyncStorage.getItem(STORAGE_KEY);
        if (raw) setNotifications(JSON.parse(raw));
      } catch (err) {
        console.warn('[Notifications] failed to load from storage', err);
      }
    })();
  }, []);

  // save on change
  useEffect(() => {
    (async () => {
      try {
        await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(notifications));
      } catch (err) {
        console.warn('[Notifications] failed to save to storage', err);
      }
    })();
  }, [notifications]);

  // FCM foreground listener: add notification when a data message arrives
  useEffect(() => {
    const unsubscribe = messaging().onMessage(async remoteMessage => {
      try {
        // Expect remoteMessage.data contains structured payload (route, params etc)
        const data = remoteMessage.data || {};
        const title =
          remoteMessage.notification?.title ?? data.title ?? 'New message';
        const body = remoteMessage.notification?.body ?? data.body ?? undefined;

        // Map data to route/deeplink if present
        const routeName = data.routeName;
        const routeParams = data.routeParams
          ? JSON.parse(data.routeParams)
          : undefined; // if server sends stringified JSON
        const deepLink = data.deepLink;

        addNotification({
          title,
          body,
          routeName,
          routeParams,
          deepLink,
        });
      } catch (err) {
        console.warn('[Notifications] onMessage handler failed', err);
      }
    });

    return () => unsubscribe();
  }, []);

  const persistAdd = useCallback((newItem: NotificationItem) => {
    setNotifications(prev => [newItem, ...prev]);
  }, []);

  const addNotification = useCallback(
    (item: Omit<NotificationItem, 'id' | 'createdAt' | 'read'>) => {
      const newItem: NotificationItem = {
        id: `${Date.now()}-${Math.floor(Math.random() * 10000)}`,
        createdAt: Date.now(),
        read: false,
        ...item,
      };
      persistAdd(newItem);
      return newItem;
    },
    [persistAdd],
  );

  const clearAll = useCallback(() => {
    setNotifications([]);
  }, []);

  const markRead = useCallback((id: string) => {
    setNotifications(prev =>
      prev.map(n => (n.id === id ? { ...n, read: true } : n)),
    );
  }, []);

  const openNotificationTarget = async (n: NotificationItem) => {
    try {
      if (n.routeName) {
        navigate(n.routeName, n.routeParams);
      } else if (n.deepLink) {
        await Linking.openURL(n.deepLink);
      } else {
        console.warn('[Notification] no route or deepLink for', n);
      }
    } catch (err) {
      console.warn('[Notification] failed to open target', err);
    }
  };

  // open all flow (modal + navigate)
  const openAll = useCallback(() => {
    if (!notifications || notifications.length === 0) return;
    const startIndex = notifications.findIndex(n => !n.read);
    const firstIndex = startIndex >= 0 ? startIndex : 0;
    setCurrentIndex(firstIndex);
    setModalVisible(true);

    setTimeout(() => {
      const n = notifications[firstIndex];
      if (n) openNotificationTarget(n);
    }, 200);
  }, [notifications]);

  const showNext = useCallback(() => {
    const nextIndex = currentIndex + 1;
    const curr = notifications[currentIndex];
    if (curr) markRead(curr.id);

    if (nextIndex >= notifications.length) {
      setModalVisible(false);
      setCurrentIndex(0);
    } else {
      setCurrentIndex(nextIndex);
      const next = notifications[nextIndex];
      if (next) openNotificationTarget(next);
    }
  }, [currentIndex, notifications, markRead]);

  // IMPORTANT: this method is called by the Bell press (check for updates)
  // Steps:
  // 1) log analytics event
  // 2) optionally trigger IAM campaign event
  // 3) fetch pending notifications from server (or from local queue)
  // 4) if new notifications exist -> add them and openAll()
  const fetchPendingFromServer = useCallback(async (): Promise<
    NotificationItem[]
  > => {
    // Replace with actual API call.
    // Example expected shape from server:
    // [{ title, body, routeName, routeParams, deepLink }]
    try {
      // MOCK example: returns zero or one item for demonstration
      // const res = await fetch('https://api.myserver.com/notifications/pending', { headers: { Authorization: 'Bearer ...' }});
      // const data = await res.json();
      // return data.items;
      return []; // no-op by default; replace with your real fetch
    } catch (err) {
      console.warn('[Notifications] fetchPendingFromServer error', err);
      return [];
    }
  }, []);

  const checkForUpdates = useCallback(async () => {
    try {
      // 1) analytics
      await analytics().logEvent('notification_checked', {
        method: 'bell_press',
      });

      // 2) trigger IAM (optional) — in case you have an IAM campaign triggered by this event
      try {
        await inAppMessaging().triggerEvent('bell_pressed');
      } catch (e) {
        // not fatal if IAM trigger fails
        console.warn('[Notifications] IAM triggerEvent failed', e);
      }

      // 3) fetch pending notifications from server (or you could read local queued ones)
      const pending = await fetchPendingFromServer();

      if (pending && pending.length > 0) {
        // add to local queue
        for (const p of pending) {
          addNotification({
            title: p.title,
            body: p.body,
            routeName: p.routeName,
            routeParams: p.routeParams,
            deepLink: p.deepLink,
          });
        }
        // show modal flow
        openAll();
      } else if (notifications.length > 0) {
        // no server pending, but local notifications exist — just open them
        openAll();
      } else {
        // nothing found — show a small feedback optionally
        Alert.alert('No new notifications');
      }
    } catch (err) {
      console.warn('[Notifications] checkForUpdates failed', err);
    }
  }, [fetchPendingFromServer, addNotification, openAll, notifications]);

  const value: NotificationContextType = {
    notifications,
    unreadCount,
    addNotification,
    clearAll,
    openAll,
    markRead,
    checkForUpdates,
  };

  return (
    <NotificationContext.Provider value={value}>
      {children}

      {/* Modal that steps through notifications */}
      <Modal visible={modalVisible} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            {notifications[currentIndex] ? (
              <>
                <Text style={styles.title}>
                  {notifications[currentIndex].title}
                </Text>
                {notifications[currentIndex].body ? (
                  <Text style={styles.body}>
                    {notifications[currentIndex].body}
                  </Text>
                ) : null}

                <View style={{ height: 16 }} />

                <View style={styles.row}>
                  <TouchableOpacity onPress={showNext} style={styles.nextBtn}>
                    <Text style={styles.nextText}>
                      {currentIndex === notifications.length - 1
                        ? 'Close'
                        : 'Next'}
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    onPress={() => {
                      const curr = notifications[currentIndex];
                      if (curr) markRead(curr.id);
                      setModalVisible(false);
                    }}
                    style={[styles.nextBtn, { backgroundColor: '#ddd' }]}
                  >
                    <Text style={{ color: '#333' }}>Dismiss</Text>
                  </TouchableOpacity>
                </View>
              </>
            ) : (
              <Text>No notifications</Text>
            )}
          </View>
        </View>
      </Modal>
    </NotificationContext.Provider>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: COLORS.primaryBlackHex,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalCard: {
    width: '86%',
    backgroundColor: '#fff',
    padding: 18,
    borderRadius: 12,
    elevation: 6,
  },
  title: { fontSize: 18, fontWeight: '700' },
  body: { marginTop: 8, color: '#444' },
  row: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 18 },
  nextBtn: {
    flex: 1,
    padding: 12,
    marginHorizontal: 6,
    borderRadius: 8,
    backgroundColor: '#ff6b00',
    alignItems: 'center',
  },
  nextText: { color: 'white', fontWeight: '700' },
});

export default NotificationProvider;
