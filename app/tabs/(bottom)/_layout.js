import { Tabs } from 'expo-router';
import FontAwesome5 from '@expo/vector-icons/FontAwesome5';
import { StyleSheet, Text, View } from 'react-native';

import { useNotificationBadge } from '../../../src/notifications/NotificationBadgeContext';

function TabIcon({ name, color, size }) {
  return <FontAwesome5 name={name} color={color} size={size} />;
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

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: '#17843f',
        tabBarInactiveTintColor: '#7b8580',
        tabBarStyle: { height: 74, paddingTop: 8, paddingBottom: 10, backgroundColor: '#ffffff', borderTopColor: '#e5e9e7', borderTopWidth: 1 },
        tabBarLabelStyle: { fontSize: 11, fontWeight: '600' },
      }}
    >
      <Tabs.Screen name="index" options={{ title: 'Home', tabBarIcon: ({ color, size }) => <TabIcon name="home" color={color} size={size} /> }} />
      <Tabs.Screen name="schedule" options={{ title: 'Schedule', tabBarIcon: ({ color, size }) => <TabIcon name="calendar-alt" color={color} size={size} /> }} />
      <Tabs.Screen name="report" options={{ title: 'Report', tabBarIcon: ({ color, size }) => <TabIcon name="plus-circle" color={color} size={size} /> }} />
      <Tabs.Screen name="tracker" options={{ title: 'Tracker', tabBarIcon: ({ color, size }) => <TabIcon name="truck" color={color} size={size} /> }} />
      <Tabs.Screen name="notifications" options={{ title: 'Notifications', tabBarIcon: ({ color, size }) => <NotificationTabIcon color={color} size={size} unreadCount={unreadCount} /> }} />
      <Tabs.Screen name="profile" options={{ href: null }} />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  notificationIcon: { width: 30, height: 28, alignItems: 'center', justifyContent: 'center' },
  badge: { position: 'absolute', top: -5, right: -8, minWidth: 17, height: 17, paddingHorizontal: 4, borderRadius: 9, backgroundColor: '#dc2626', borderWidth: 1.5, borderColor: '#fff', alignItems: 'center', justifyContent: 'center' },
  badgeText: { color: '#fff', fontSize: 9, lineHeight: 11, fontWeight: '800' },
});
