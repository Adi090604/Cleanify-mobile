import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'expo-router';
import { ActivityIndicator, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

import { api, clearAuthToken, getAuthToken } from '../src/api/client';

export default function AuthGate() {
  const router = useRouter();
  const [error, setError] = useState(null);

  const restoreSession = useCallback(async () => {
    setError(null);

    try {
      const token = await getAuthToken();

      if (!token) {
        router.replace('/login');
        return;
      }

      await api.get('/me');
      router.replace('/tabs');
    } catch (requestError) {
      if (requestError.response?.status === 401) {
        await clearAuthToken();
        router.replace('/login');
        return;
      }

      setError('Unable to connect to Cleanify. Please try again.');
    }
  }, [router]);

  useEffect(() => {
    restoreSession();
  }, [restoreSession]);

  return (
    <View style={styles.container}>
      {error ? (
        <>
          <Text style={styles.error}>{error}</Text>
          <TouchableOpacity style={styles.retryButton} onPress={restoreSession}>
            <Text style={styles.retryText}>Try again</Text>
          </TouchableOpacity>
        </>
      ) : (
        <ActivityIndicator size="large" color="#17843f" />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24, backgroundColor: '#f6f8f7' },
  error: { color: '#667085', fontSize: 15, textAlign: 'center' },
  retryButton: { marginTop: 18, borderRadius: 12, backgroundColor: '#17843f', paddingHorizontal: 20, paddingVertical: 12 },
  retryText: { color: '#ffffff', fontWeight: '700' },
});
