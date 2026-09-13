import { useEffect, useState } from 'react';
import { usePathname, useRouter } from 'expo-router';
import { Drawer, DrawerContentScrollView, DrawerItem, useDrawerStatus } from 'expo-router/drawer';
import FontAwesome5 from '@expo/vector-icons/FontAwesome5';
import { ActivityIndicator, Image, StyleSheet, Text, View } from 'react-native';

import { api, clearAuthToken, logout } from '../../src/api/client';

const ITEMS = [
  { label: 'Home', icon: 'home', href: '/tabs' },
  { label: 'Garbage Schedule', icon: 'calendar-alt', href: '/tabs/schedule' },
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
          <ActivityIndicator color="#ffffff" />
        )}
      </View>

      <View style={styles.drawerItems}>
        {ITEMS.map((item) => (
          <DrawerItem
            key={item.href}
            label={item.label}
            focused={pathname === item.href || (item.href === '/tabs' && pathname === '/tabs/')}
            icon={({ color, size }) => <FontAwesome5 name={item.icon} color={color} size={size} />}
            onPress={() => goTo(item.href)}
            activeTintColor="#17843f"
            activeBackgroundColor="#ecf8ef"
            inactiveTintColor="#374151"
            labelStyle={styles.itemLabel}
          />
        ))}
      </View>

      <View style={styles.drawerFooter}>
        <DrawerItem
          label={loggingOut ? 'Signing out...' : 'Logout'}
          icon={() => <FontAwesome5 name="sign-out-alt" color="#b91c1c" size={20} />}
          onPress={signOut}
          inactiveTintColor="#b91c1c"
          labelStyle={styles.itemLabel}
        />
      </View>
    </DrawerContentScrollView>
  );
}

export default function AuthenticatedDrawerLayout() {
  return (
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
  );
}

const styles = StyleSheet.create({
  drawerContent: { flex: 1, paddingTop: 0 },
  drawerHeader: { minHeight: 190, backgroundColor: '#17843f', paddingHorizontal: 22, paddingTop: 38, paddingBottom: 22, justifyContent: 'flex-end' },
  avatar: { width: 54, height: 54, borderRadius: 27, backgroundColor: '#ffffff', alignItems: 'center', justifyContent: 'center', marginBottom: 12 },
  drawerPhoto: { width: 54, height: 54, borderRadius: 27, backgroundColor: '#d8f3df', marginBottom: 12 },
  avatarText: { color: '#17843f', fontSize: 22, fontWeight: '800' },
  userName: { color: '#ffffff', fontSize: 18, fontWeight: '800' },
  userEmail: { marginTop: 3, color: '#d8f3df', fontSize: 13 },
  drawerItems: { flex: 1, paddingTop: 12, paddingHorizontal: 4 },
  drawerFooter: { borderTopWidth: 1, borderTopColor: '#e5e9e7', paddingTop: 8, paddingBottom: 12, paddingHorizontal: 4 },
  itemLabel: { fontSize: 14, fontWeight: '700' },
});
