import { useCallback, useState } from 'react';
import { useFocusEffect, useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import {
  ActivityIndicator,
  Image,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

import { api, clearAuthToken } from '../../../src/api/client';
import ReportInteractions from '../../../src/components/ReportInteractions';

const STATUS_STYLES = {
  pending: { backgroundColor: '#fff4d6', color: '#c47a00' },
  resolved: { backgroundColor: '#dcfce7', color: '#15803d' },
  rejected: { backgroundColor: '#fee2e2', color: '#b91c1c' },
};

function reportTime(value) {
  const created = new Date(value);
  const seconds = Math.max(0, Math.floor((Date.now() - created.getTime()) / 1000));

  if (seconds < 60) return 'Just now';
  if (seconds < 3600) return `${Math.floor(seconds / 60)} min ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)} hr ago`;
  if (seconds < 604800) return `${Math.floor(seconds / 86400)} days ago`;

  return created.toLocaleDateString();
}

function ReportCard({ report, onReportUpdate }) {
  const badge = STATUS_STYLES[report.status] ?? STATUS_STYLES.pending;

  return (
    <View style={styles.reportCard}>
      <View style={styles.reportHeader}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{report.author.initial}</Text>
        </View>
        <View style={styles.reportUserInfo}>
          <Text style={styles.reportUser}>{report.author.name}</Text>
          <Text style={styles.reportTime}>{reportTime(report.created_at)}</Text>
        </View>
        <View style={[styles.statusBadge, { backgroundColor: badge.backgroundColor }]}>
          <Text style={[styles.statusText, { color: badge.color }]}>
            {report.status.charAt(0).toUpperCase() + report.status.slice(1)}
          </Text>
        </View>
      </View>

      <Text style={styles.reportDescription}>{report.description}</Text>
      {report.location ? <Text style={styles.location}>⌖ {report.location}</Text> : null}
      {report.image_url ? (
        <Image
          source={{ uri: report.image_url }}
          style={styles.reportImage}
          resizeMode="cover"
          accessibilityLabel="Community report photo"
        />
      ) : null}
      <ReportInteractions report={report} onReportUpdate={onReportUpdate} />
    </View>
  );
}

export default function HomeScreen() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [reports, setReports] = useState([]);
  const [nextCollection, setNextCollection] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);

  const updateReport = useCallback((reportId, changes) => {
    setReports((current) => current.map((report) => report.id === reportId ? { ...report, ...changes } : report));
  }, []);

  const loadHome = useCallback(async ({ refresh = false } = {}) => {
    if (refresh) setRefreshing(true);
    else setLoading(true);
    setError(null);

    try {
      const [userResponse, reportsResponse, scheduleResponse] = await Promise.all([
        api.get('/me'),
        api.get('/reports'),
        api.get('/schedules/next'),
      ]);

      setUser(userResponse.data.user);
      setReports(reportsResponse.data.data ?? []);
      setNextCollection(scheduleResponse.data.next_collection ?? null);
    } catch (requestError) {
      if (requestError.response?.status === 401) {
        await clearAuthToken();
        router.replace('/login');
        return;
      }

      setError('Unable to load community reports. Pull down to try again.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [router]);

  useFocusEffect(
    useCallback(() => {
      loadHome();
    }, [loadHome])
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#17843f" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar style="dark" />
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        refreshControl={(
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => loadHome({ refresh: true })}
            colors={['#17843f']}
            tintColor="#17843f"
          />
        )}
      >
        <View style={styles.header}>
          <Text style={styles.greeting}>Hello, {user?.name}</Text>
          <Text style={styles.subtitle}>Here’s what’s happening in your community.</Text>
        </View>

        <Text style={styles.sectionLabel}>YOUR ZONE THIS WEEK</Text>
        {nextCollection ? (
          <View style={styles.collectionCard}>
            <Text style={styles.zoneTitle}>{nextCollection.area}</Text>
            <Text style={styles.collectionDate}>
              {nextCollection.date_display} · {nextCollection.time_range}
            </Text>
            <Text style={styles.collectionTruck}>{nextCollection.truck}</Text>
          </View>
        ) : (
          <View style={styles.collectionCard}>
            <Text style={styles.emptyCollection}>No upcoming collection scheduled.</Text>
          </View>
        )}

        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Community Reports</Text>
        </View>

        {error ? (
          <View style={styles.stateCard}>
            <Text style={styles.stateText}>{error}</Text>
            <TouchableOpacity onPress={() => loadHome()}>
              <Text style={styles.retryText}>Try again</Text>
            </TouchableOpacity>
          </View>
        ) : null}

        {!error && reports.length === 0 ? (
          <View style={styles.stateCard}>
            <Text style={styles.stateTitle}>No reports yet</Text>
            <Text style={styles.stateText}>Community reports will appear here.</Text>
          </View>
        ) : null}

        {reports.map((report) => <ReportCard key={report.id} report={report} onReportUpdate={updateReport} />)}
        <View style={styles.bottomSpace} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  loadingContainer: { flex: 1, backgroundColor: '#f6f8f7', justifyContent: 'center', alignItems: 'center' },
  container: { flex: 1, backgroundColor: '#f6f8f7' },
  scrollContent: { paddingHorizontal: 20, paddingTop: 58 },
  header: { marginBottom: 32 },
  greeting: { fontSize: 25, fontWeight: '800', color: '#111827' },
  subtitle: { marginTop: 6, fontSize: 14, color: '#667085' },
  sectionLabel: { fontSize: 12, fontWeight: '700', color: '#7b8580', marginBottom: 10, letterSpacing: 0.7 },
  collectionCard: { backgroundColor: '#ffffff', borderRadius: 18, padding: 18, borderWidth: 1, borderColor: '#e4e9e6', marginBottom: 30 },
  zoneTitle: { fontSize: 19, fontWeight: '800', color: '#111827' },
  collectionDate: { marginTop: 7, fontSize: 14, color: '#667085' },
  collectionTruck: { marginTop: 7, fontSize: 13, fontWeight: '600', color: '#374151' },
  emptyCollection: { fontSize: 14, color: '#667085' },
  sectionHeader: { marginBottom: 15 },
  sectionTitle: { fontSize: 20, fontWeight: '800', color: '#111827' },
  reportCard: { backgroundColor: '#ffffff', borderRadius: 18, padding: 16, borderWidth: 1, borderColor: '#e5e9e7', marginBottom: 14 },
  reportHeader: { flexDirection: 'row', alignItems: 'center' },
  avatar: { width: 46, height: 46, borderRadius: 23, backgroundColor: '#2d6aec', justifyContent: 'center', alignItems: 'center' },
  avatarText: { color: '#ffffff', fontWeight: '800', fontSize: 17 },
  reportUserInfo: { flex: 1, marginLeft: 12 },
  reportUser: { fontSize: 15, fontWeight: '700', color: '#111827' },
  reportTime: { marginTop: 3, fontSize: 12, color: '#8a9390' },
  statusBadge: { paddingHorizontal: 10, paddingVertical: 6, borderRadius: 20 },
  statusText: { fontSize: 11, fontWeight: '700' },
  reportDescription: { marginTop: 16, fontSize: 14, lineHeight: 21, color: '#374151' },
  location: { marginTop: 10, fontSize: 13, color: '#667085' },
  reportImage: { width: '100%', height: 210, borderRadius: 14, marginTop: 14, backgroundColor: '#edf1ef' },
  stateCard: { backgroundColor: '#ffffff', borderRadius: 18, padding: 22, borderWidth: 1, borderColor: '#e5e9e7', marginBottom: 14, alignItems: 'center' },
  stateTitle: { fontSize: 16, fontWeight: '700', color: '#111827' },
  stateText: { marginTop: 5, fontSize: 14, color: '#667085', textAlign: 'center' },
  retryText: { marginTop: 12, color: '#17843f', fontWeight: '700' },
  bottomSpace: { height: 100 },
});
