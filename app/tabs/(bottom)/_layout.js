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
      <FontAwesome5 name="plus" color={focused ? '#ffffff' : '#17843f'} size={22} />
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
  const bottomPadding = Math.max(insets.bottom, 6);

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: '#17843f',
        tabBarInactiveTintColor: '#7b8580',
        tabBarStyle: { height: 52 + bottomPadding, paddingTop: 4, paddingBottom: bottomPadding, backgroundColor: '#ffffff', borderTopColor: '#e5e9e7', borderTopWidth: 1 },
        tabBarItemStyle: { paddingVertical: 1 },
        tabBarLabelStyle: { fontSize: 10, fontWeight: '600' },
      }}
    >
      <Tabs.Screen name="index" options={{ title: 'Home', tabBarIcon: ({ color }) => <TabIcon name="home" color={color} size={20} /> }} />
      <Tabs.Screen name="schedule" options={{ title: 'Schedule', tabBarIcon: ({ color }) => <TabIcon name="calendar-alt" color={color} size={20} /> }} />
      <Tabs.Screen name="report" options={{ title: 'Report', tabBarIcon: ({ focused }) => <ReportTabIcon focused={focused} /> }} />
      <Tabs.Screen name="tracker" options={{ title: 'Tracker', tabBarIcon: ({ color }) => <TabIcon name="truck" color={color} size={20} /> }} />
      <Tabs.Screen name="notifications" options={{ title: 'Notifications', tabBarIcon: ({ color }) => <NotificationTabIcon color={color} size={20} unreadCount={unreadCount} /> }} />
      <Tabs.Screen name="profile" options={{ href: null }} />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  reportIcon: { width: 36, height: 36, borderRadius: 18, backgroundColor: '#eef7f1', borderWidth: 1, borderColor: '#d5eadc', alignItems: 'center', justifyContent: 'center', transform: [{ translateY: -3 }], shadowColor: '#0f5132', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.12, shadowRadius: 2, elevation: 2 },
  reportIconActive: { backgroundColor: '#17843f', borderColor: '#17843f' },
  notificationIcon: { width: 28, height: 24, alignItems: 'center', justifyContent: 'center' },
  badge: { position: 'absolute', top: -5, right: -8, minWidth: 17, height: 17, paddingHorizontal: 4, borderRadius: 9, backgroundColor: '#dc2626', borderWidth: 1.5, borderColor: '#fff', alignItems: 'center', justifyContent: 'center' },
  badgeText: { color: '#fff', fontSize: 9, lineHeight: 11, fontWeight: '800' },
});
