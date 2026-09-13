import { useState } from 'react';
import { useRouter } from 'expo-router';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';

import { api, clearAuthToken } from '../../src/api/client';

export default function ProfileScreen() {
  const router = useRouter();
  const [loggingOut, setLoggingOut] = useState(false);

  const logout = async () => {
    if (loggingOut) return;

    setLoggingOut(true);

    try {
      await api.post('/auth/logout');
    } finally {
      await clearAuthToken();
      router.replace('/login');
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Profile</Text>
      <Text style={styles.subtitle}>View and manage your Cleanify account.</Text>

      <TouchableOpacity
        style={[styles.logoutButton, loggingOut && styles.disabledButton]}
        onPress={logout}
        disabled={loggingOut}
      >
        <Text style={styles.logoutText}>{loggingOut ? 'Signing out...' : 'Sign Out'}</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f6f8f7', paddingTop: 60, paddingHorizontal: 20 },
  title: { fontSize: 28, fontWeight: '800', color: '#111827' },
  subtitle: { marginTop: 8, fontSize: 16, color: '#667085' },
  logoutButton: { marginTop: 32, height: 52, borderRadius: 12, borderWidth: 1, borderColor: '#17843f', alignItems: 'center', justifyContent: 'center', backgroundColor: '#ffffff' },
  disabledButton: { opacity: 0.6 },
  logoutText: { color: '#17843f', fontSize: 16, fontWeight: '700' },
});
