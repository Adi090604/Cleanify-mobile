import { Tabs } from 'expo-router';
import { Text, View } from 'react-native';

function TabIcon({ symbol, focused, prominent = false }) {
  return (
    <View style={prominent ? styles.prominentIcon : styles.icon}>
      <Text style={prominent ? styles.prominentText : [styles.iconText, focused && styles.focusedIcon]}>
        {symbol}
      </Text>
    </View>
  );
}

const styles = {
  icon: { width: 32, height: 32, alignItems: 'center', justifyContent: 'center' },
  iconText: { fontSize: 20, color: '#7b8580', fontWeight: '600' },
  focusedIcon: { color: '#17843f' },
  prominentIcon: { width: 52, height: 52, borderRadius: 26, backgroundColor: '#17843f', alignItems: 'center', justifyContent: 'center', marginTop: -18 },
  prominentText: { fontSize: 26, color: '#ffffff', fontWeight: '700' },
};

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
      <Tabs.Screen name="index" options={{ title: 'Home', tabBarIcon: ({ focused }) => <TabIcon symbol="⌂" focused={focused} /> }} />
      <Tabs.Screen name="schedule" options={{ title: 'Schedule', tabBarIcon: ({ focused }) => <TabIcon symbol="▣" focused={focused} /> }} />
      <Tabs.Screen name="report" options={{ title: 'Report', tabBarIcon: ({ focused }) => <TabIcon symbol="+" focused={focused} prominent /> }} />
      <Tabs.Screen name="tracker" options={{ title: 'Tracker', tabBarIcon: ({ focused }) => <TabIcon symbol="●" focused={focused} /> }} />
      <Tabs.Screen name="profile" options={{ title: 'Profile', tabBarIcon: ({ focused }) => <TabIcon symbol="○" focused={focused} /> }} />
    </Tabs>
  );
}
