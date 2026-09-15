import { useCallback, useEffect, useMemo, useState } from 'react';
import { usePathname, useRouter } from 'expo-router';
import { Drawer, DrawerContentScrollView, DrawerItem, useDrawerStatus } from 'expo-router/drawer';
import FontAwesome5 from '@expo/vector-icons/FontAwesome5';
import { ActivityIndicator, AppState, Image, StyleSheet, Text, View } from 'react-native';

import { api, clearAuthToken, logout } from '../../src/api/client';
import { NotificationBadgeContext, useNotificationBadge } from '../../src/notifications/NotificationBadgeContext';

const ITEMS = [
  { label: 'Home', icon: 'home', href: '/tabs' },
  { label: 'Garbage Schedule', icon: 'calendar-alt', href: '/tabs/schedule' },
  { label: 'Notifications', icon: 'bell', href: '/tabs/notifications' },
  { label: 'Community Reports', icon: 'comments', href: '/tabs/report' },
  { label: 'Truck Tracker', icon: 'truck', href: '/tabs/tracker' },
  { label: 'Profile', icon: 'user-circle', href: '/tabs/profile' },
  { label: 'Settings', icon: 'cog', href: '/tabs/settings' },
];

function CleanifyDrawerContent(props) {
  const router = useRouter();
  const pathname = usePathname();
  const drawerStatus = useDrawerStatus();
  const [user, setUser] = useState(null);
  const [loggingOut, setLoggingOut] = useState(false);
  const [photoFailed, setPhotoFailed] = useState(false);
  const { unreadCount } = useNotificationBadge();

  useEffect(() => {
    let active = true;

    api.get('/me')
      .then((response) => {
        if (active) {
          setUser(response.data.user);
          setPhotoFailed(false);
        }
      })
      .catch(async (error) => {
        if (error.response?.status === 401) {
          await clearAuthToken();
          router.replace('/login');
        }
      });

    return () => {
      active = false;
    };
  }, [drawerStatus, pathname, router]);

  const goTo = (href) => {
    props.navigation.closeDrawer();
    router.navigate(href);
  };

  const signOut = async () => {
    if (loggingOut) return;
    setLoggingOut(true);
    await logout();
    props.navigation.closeDrawer();
    router.replace('/login');
  };

  return (
    <DrawerContentScrollView {...props} contentContainerStyle={styles.drawerContent}>
      <View style={styles.drawerHeader}>
        {user ? (
          <>
            {user.profile_photo_url && !photoFailed ? <Image source={{ uri: user.profile_photo_url }} style={styles.drawerPhoto} onError={() => setPhotoFailed(true)} /> : <View style={styles.avatar}><Text style={styles.avatarText}>{user.name?.charAt(0).toUpperCase()}</Text></View>}
            <Text style={styles.userName}>{user.name}</Text>
            <Text style={styles.userEmail}>{user.email}</Text>
          </>
        ) : (
          <ActivityIndicator color="#17843f" />
        )}
      </View>

      <View style={styles.drawerItems}>
        {ITEMS.map((item) => (
          <DrawerItem
            key={item.href}
            label={item.label === 'Notifications' ? ({ color }) => (
              <View style={styles.drawerLabelRow}>
                <Text style={[styles.itemLabel, { color }]}>{item.label}</Text>
                {unreadCount > 0 ? <View style={styles.notificationBadge}><Text style={styles.notificationBadgeText}>{unreadCount > 99 ? '99+' : unreadCount}</Text></View> : null}
              </View>
            ) : item.label}
            focused={pathname === item.href || (item.href === '/tabs' && pathname === '/tabs/')}
            icon={({ color }) => <View style={styles.itemIcon}><FontAwesome5 name={item.icon} color={color} size={16} /></View>}
            onPress={() => goTo(item.href)}
            activeTintColor="#17843f"
            activeBackgroundColor="#ecf8ef"
            inactiveTintColor="#374151"
            labelStyle={styles.itemLabel}
            style={styles.drawerItem}
          />
        ))}
      </View>

      <View style={styles.drawerFooter}>
        <DrawerItem
          label={loggingOut ? 'Signing out...' : 'Logout'}
          icon={() => <View style={styles.itemIcon}><FontAwesome5 name="sign-out-alt" color="#b91c1c" size={16} /></View>}
          onPress={signOut}
          inactiveTintColor="#b91c1c"
          labelStyle={styles.itemLabel}
          style={styles.drawerItem}
        />
      </View>
    </DrawerContentScrollView>
  );
}

export default function AuthenticatedDrawerLayout() {
  const [unreadCount, setUnreadCount] = useState(0);
  const refreshUnreadCount = useCallback(async () => {
    try {
      const { data } = await api.get('/notifications', { params: { page: 1 } });
      setUnreadCount(Number(data.unread_count) || 0);
    } catch {
      // Notification request errors are surfaced by the Notifications screen.
    }
  }, []);

  useEffect(() => {
    refreshUnreadCount();
    const subscription = AppState.addEventListener('change', (state) => {
      if (state === 'active') refreshUnreadCount();
    });
    return () => subscription.remove();
  }, [refreshUnreadCount]);

  const badge = useMemo(() => ({ unreadCount, setUnreadCount, refreshUnreadCount }), [refreshUnreadCount, unreadCount]);

  return (
    <NotificationBadgeContext.Provider value={badge}>
    <Drawer
      drawerContent={(props) => <CleanifyDrawerContent {...props} />}
      screenOptions={{
        drawerPosition: 'left',
        drawerStyle: { width: 300 },
        headerTintColor: '#17843f',
        headerTitleStyle: { fontWeight: '800' },
        headerShadowVisible: false,
      }}
    >
      <Drawer.Screen
        name="(bottom)"
        options={{
          title: 'Cleanify',
          drawerItemStyle: { display: 'none' },
        }}
      />
      <Drawer.Screen
        name="settings"
        options={{
          title: 'Settings',
          drawerItemStyle: { display: 'none' },
        }}
      />
    </Drawer>
    </NotificationBadgeContext.Provider>
  );
}

const styles = StyleSheet.create({
  drawerContent: { flex: 1, paddingTop: 0, backgroundColor: '#fbfcfb' },
  drawerHeader: { minHeight: 205, backgroundColor: '#fbfcfb', paddingHorizontal: 22, paddingTop: 34, paddingBottom: 22, alignItems: 'center', justifyContent: 'center', borderBottomWidth: 1, borderBottomColor: '#e8ece9' },
  avatar: { width: 78, height: 78, borderRadius: 39, backgroundColor: '#e4f4e8', borderWidth: 3, borderColor: '#fff', alignItems: 'center', justifyContent: 'center', marginBottom: 12 },
  drawerPhoto: { width: 78, height: 78, borderRadius: 39, backgroundColor: '#e4f4e8', borderWidth: 3, borderColor: '#fff', marginBottom: 12 },
  avatarText: { color: '#17843f', fontSize: 29, fontWeight: '800' },
  userName: { color: '#18211c', fontSize: 18, fontWeight: '800', textAlign: 'center' },
  userEmail: { marginTop: 4, color: '#78817c', fontSize: 12, textAlign: 'center' },
  drawerItems: { flex: 1, paddingTop: 10, paddingHorizontal: 9 },
  drawerItem: { minHeight: 43, borderRadius: 10, marginVertical: 1 },
  itemIcon: { width: 22, alignItems: 'center' },
  drawerFooter: { borderTopWidth: 1, borderTopColor: '#e5e9e7', paddingTop: 7, paddingBottom: 11, paddingHorizontal: 9 },
  itemLabel: { fontSize: 13, fontWeight: '600', marginLeft: -3 },
  drawerLabelRow: { width: 188, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  notificationBadge: { minWidth: 18, height: 18, paddingHorizontal: 5, borderRadius: 9, backgroundColor: '#dc2626', alignItems: 'center', justifyContent: 'center' },
  notificationBadgeText: { color: '#fff', fontSize: 9, lineHeight: 11, fontWeight: '800' },
});
