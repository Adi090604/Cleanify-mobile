import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { ActivityIndicator, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

import { api, clearAuthToken, getAuthToken } from '../src/api/client';

export default function LandingScreen() {
  const router = useRouter();
  const [checkingSession, setCheckingSession] = useState(true);
  const [sessionError, setSessionError] = useState(null);

  const restoreSession = useCallback(async () => {
    setCheckingSession(true);
    setSessionError(null);

    try {
      const token = await getAuthToken();

      if (!token) {
        return;
      }

      await api.get('/me');
      router.replace('/tabs');
    } catch (error) {
      if (error.response?.status === 401) {
        await clearAuthToken();
        router.replace('/login');
      } else {
        setSessionError('Unable to connect to the Cleanify server. Check your network connection and try again.');
      }
    } finally {
      setCheckingSession(false);
    }
  }, [router]);

  useEffect(() => {
    restoreSession();
  }, [restoreSession]);

  if (checkingSession) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#17843f" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar style="dark" />
      <View style={styles.header}>
        <View style={styles.logoRow}>
          <View style={styles.logoBox}><Text style={styles.logoIcon}>♻</Text></View>
          <Text style={styles.brand}>Cleanify</Text>
        </View>
      </View>

      <View style={styles.hero}>
        <Text style={styles.eyebrow}>Smarter community waste management</Text>
        <Text style={styles.title}>A cleaner community starts with clear action.</Text>
        <Text style={styles.description}>
          Report concerns, follow collection schedules, and stay connected with your community.
        </Text>
        {sessionError ? <Text style={styles.sessionError}>{sessionError}</Text> : null}

        <TouchableOpacity style={styles.primaryButton} onPress={() => router.push('/login')}>
          <Text style={styles.primaryButtonText}>Get Started</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.features}>
        <Text style={styles.featuresTitle}>What you can do</Text>
        <View style={styles.featureRow}>
          {['Schedules', 'Reports', 'Tracking'].map((feature) => (
            <View key={feature} style={styles.featureCard}>
              <Text style={styles.featureText}>{feature}</Text>
            </View>
          ))}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  loadingContainer: { flex: 1, backgroundColor: '#f8faf9', alignItems: 'center', justifyContent: 'center' },
  container: { flex: 1, backgroundColor: '#f8faf9' },
  header: { paddingTop: 58, paddingHorizontal: 24 },
  logoRow: { flexDirection: 'row', alignItems: 'center' },
  logoBox: { width: 46, height: 46, borderRadius: 13, backgroundColor: '#ecf8ef', alignItems: 'center', justifyContent: 'center', marginRight: 12 },
  logoIcon: { fontSize: 24 },
  brand: { fontSize: 23, fontWeight: '700', color: '#111827' },
  hero: { paddingHorizontal: 24, paddingTop: 48 },
  eyebrow: { alignSelf: 'flex-start', fontSize: 13, fontWeight: '600', color: '#17843f', backgroundColor: '#eef9f1', paddingHorizontal: 12, paddingVertical: 7, borderRadius: 20, marginBottom: 22 },
  title: { fontSize: 38, lineHeight: 45, fontWeight: '800', color: '#111827' },
  description: { marginTop: 20, fontSize: 17, lineHeight: 26, color: '#667085' },
  sessionError: { marginTop: 14, color: '#b45309', fontSize: 13 },
  primaryButton: { height: 56, backgroundColor: '#17843f', borderRadius: 12, justifyContent: 'center', alignItems: 'center', marginTop: 32 },
  primaryButtonText: { color: '#ffffff', fontSize: 17, fontWeight: '700' },
  secondaryButton: { height: 56, backgroundColor: '#ffffff', borderWidth: 1, borderColor: '#17843f', borderRadius: 12, justifyContent: 'center', alignItems: 'center', marginTop: 12 },
  secondaryButtonText: { color: '#17843f', fontSize: 17, fontWeight: '700' },
  features: { paddingHorizontal: 24, paddingTop: 42 },
  featuresTitle: { fontSize: 22, fontWeight: '700', color: '#111827', marginBottom: 18 },
  featureRow: { flexDirection: 'row', gap: 10 },
  featureCard: { flex: 1, backgroundColor: '#ffffff', borderRadius: 14, paddingVertical: 18, alignItems: 'center', borderWidth: 1, borderColor: '#edf0ee' },
  featureText: { fontSize: 14, fontWeight: '600', color: '#374151' },
});
