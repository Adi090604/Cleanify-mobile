import { useCallback, useEffect, useMemo, useState } from 'react';
import { usePathname, useRouter } from 'expo-router';
import { Drawer, DrawerContentScrollView, DrawerItem } from 'expo-router/drawer';
import FontAwesome5 from '@expo/vector-icons/FontAwesome5';
import { AppState, Image, StyleSheet, Text, View } from 'react-native';

import { api, logout } from '../../src/api/client';
import { useCleanifyAlert } from '../../src/components/CleanifyAlert';
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
  const { showAlert } = useCleanifyAlert();
  const pathname = usePathname();
  const [loggingOut, setLoggingOut] = useState(false);
  const { unreadCount } = useNotificationBadge();

  const goTo = (href) => {
    props.navigation.closeDrawer();
    router.navigate(href);
  };

  const performSignOut = async () => {
    if (loggingOut) return;
    setLoggingOut(true);
    await logout();
    props.navigation.closeDrawer();
    router.replace('/login');
  };

  const signOut = () => {
    showAlert({
      type: 'confirm',
      title: 'Log Out?',
      message: 'Are you sure you want to log out of Cleanify?',
      confirmText: 'Log Out',
      showCancel: true,
      destructive: true,
      onConfirm: performSignOut,
    });
  };

  return (
    <DrawerContentScrollView {...props} contentContainerStyle={styles.drawerContent}>
      <View style={styles.drawerHeader}>
        <Image source={require('../../assets/cleanify-logo.png')} style={styles.drawerLogo} resizeMode="contain" />
        <Text style={styles.drawerBrand}>Cleanify</Text>
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
            icon={({ color }) => <View style={styles.itemIcon}><FontAwesome5 name={item.icon} color={color} size={15} /></View>}
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
          icon={() => <View style={styles.itemIcon}><FontAwesome5 name="sign-out-alt" color="#b91c1c" size={15} /></View>}
          onPress={signOut}
          inactiveTintColor="#b91c1c"
          labelStyle={styles.itemLabel}
          style={[styles.drawerItem, styles.logoutItem]}
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
        drawerStyle: { width: 286, backgroundColor: '#fbfcfb' },
        headerTintColor: '#17843f',
        headerStyle: { backgroundColor: '#ffffff' },
        headerTitleStyle: { fontSize: 18, fontWeight: '700', color: '#18211c' },
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
  drawerHeader: { height: 104, backgroundColor: '#fbfcfb', paddingHorizontal: 20, paddingVertical: 8, alignItems: 'center', justifyContent: 'center', borderBottomWidth: 1, borderBottomColor: '#edf0ee' },
  drawerLogo: { width: 64, height: 54 },
  drawerBrand: { marginTop: 5, color: '#18211c', fontSize: 18, lineHeight: 22, fontWeight: '700', textAlign: 'center' },
  drawerItems: { flex: 1, paddingTop: 8, paddingHorizontal: 8 },
  drawerItem: { minHeight: 40, borderRadius: 10, marginVertical: 1 },
  logoutItem: { backgroundColor: '#fff5f5' },
  itemIcon: { width: 20, alignItems: 'center' },
  drawerFooter: { borderTopWidth: 1, borderTopColor: '#edf0ee', paddingTop: 7, paddingBottom: 9, paddingHorizontal: 8 },
  itemLabel: { fontSize: 12.5, fontWeight: '600', marginLeft: -4 },
  drawerLabelRow: { width: 176, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  notificationBadge: { minWidth: 16, height: 16, paddingHorizontal: 4, borderRadius: 8, backgroundColor: '#dc2626', alignItems: 'center', justifyContent: 'center' },
  notificationBadgeText: { color: '#fff', fontSize: 8, lineHeight: 10, fontWeight: '800' },
});
