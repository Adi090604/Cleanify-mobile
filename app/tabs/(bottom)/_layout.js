import { Tabs } from 'expo-router';
import FontAwesome5 from '@expo/vector-icons/FontAwesome5';

function TabIcon({ name, color, size }) {
  return <FontAwesome5 name={name} color={color} size={size} />;
}

export default function TabLayout() {
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
      <Tabs.Screen name="profile" options={{ title: 'Profile', tabBarIcon: ({ color, size }) => <TabIcon name="user-circle" color={color} size={size} /> }} />
    </Tabs>
  );
}
