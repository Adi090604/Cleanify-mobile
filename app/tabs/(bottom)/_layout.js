import { Tabs } from 'expo-router';
import FontAwesome5 from '@expo/vector-icons/FontAwesome5';
import { StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useNotificationBadge } from '../../../src/notifications/NotificationBadgeContext';

function TabIcon({ name, color, size }) {
  return <FontAwesome5 name={name} color={color} size={size} />;
}

function ReportTabIcon({ focused }) {
  return (
    <View style={[styles.reportIcon, focused && styles.reportIconActive]}>
      <FontAwesome5 name="plus" color="#ffffff" size={18} />
    </View>
  );
}

function NotificationTabIcon({ color, size, unreadCount }) {
  const label = unreadCount > 99 ? '99+' : String(unreadCount);
  return (
    <View style={styles.notificationIcon}>
      <FontAwesome5 name="bell" color={color} size={size} />
      {unreadCount > 0 ? <View style={styles.badge}><Text style={styles.badgeText}>{label}</Text></View> : null}
    </View>
  );
}

export default function TabLayout() {
  const { unreadCount } = useNotificationBadge();
  const insets = useSafeAreaInsets();
  const bottomPadding = Math.max(insets.bottom, 5);

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: '#17843f',
        tabBarInactiveTintColor: '#89928e',
        tabBarHideOnKeyboard: true,
        tabBarLabelPosition: 'below-icon',
        tabBarStyle: { height: 50 + bottomPadding, paddingTop: 3, paddingBottom: bottomPadding, overflow: 'visible', backgroundColor: '#ffffff', borderTopColor: '#edf0ee', borderTopWidth: 1, shadowColor: '#111827', shadowOffset: { width: 0, height: -2 }, shadowOpacity: 0.05, shadowRadius: 5, elevation: 7 },
        tabBarItemStyle: { paddingTop: 1, overflow: 'visible' },
        tabBarIconStyle: { marginTop: 0 },
        tabBarLabelStyle: { fontSize: 9.5, lineHeight: 12, fontWeight: '600', marginTop: -1 },
      }}
    >
      <Tabs.Screen name="index" options={{ title: 'Home', tabBarIcon: ({ color }) => <TabIcon name="home" color={color} size={18} /> }} />
      <Tabs.Screen name="schedule" options={{ title: 'Schedule', tabBarIcon: ({ color }) => <TabIcon name="calendar-alt" color={color} size={18} /> }} />
      <Tabs.Screen name="report" options={{ title: 'Report', tabBarIcon: ({ focused }) => <ReportTabIcon focused={focused} />, tabBarLabelStyle: styles.reportLabel }} />
      <Tabs.Screen name="tracker" options={{ title: 'Tracker', tabBarIcon: ({ color }) => <TabIcon name="truck" color={color} size={18} /> }} />
      <Tabs.Screen name="notifications" options={{ title: 'Notifications', tabBarIcon: ({ color }) => <NotificationTabIcon color={color} size={18} unreadCount={unreadCount} /> }} />
      <Tabs.Screen name="profile" options={{ href: null }} />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  reportIcon: { width: 42, height: 42, borderRadius: 21, backgroundColor: '#17843f', borderWidth: 3, borderColor: '#ffffff', alignItems: 'center', justifyContent: 'center', transform: [{ translateY: -7 }], shadowColor: '#0f5132', shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.2, shadowRadius: 4, elevation: 5 },
  reportIconActive: { backgroundColor: '#126f35', shadowOpacity: 0.28, elevation: 6 },
  reportLabel: { fontSize: 9.5, lineHeight: 12, fontWeight: '700', marginTop: -1 },
  notificationIcon: { width: 26, height: 22, alignItems: 'center', justifyContent: 'center' },
  badge: { position: 'absolute', top: -5, right: -7, minWidth: 16, height: 16, paddingHorizontal: 3, borderRadius: 8, backgroundColor: '#dc2626', borderWidth: 1.5, borderColor: '#fff', alignItems: 'center', justifyContent: 'center' },
  badgeText: { color: '#fff', fontSize: 8, lineHeight: 10, fontWeight: '800' },
});
