import { useCallback, useState } from 'react';
import { useFocusEffect, useRouter } from 'expo-router';
import FontAwesome5 from '@expo/vector-icons/FontAwesome5';
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

function ReportCard({ report, onReportUpdate, currentUserId }) {
  const badge = STATUS_STYLES[report.status] ?? STATUS_STYLES.pending;

  return (
    <View style={styles.reportCard}>
      <View style={styles.reportHeader}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{report.author.initial}</Text>
        </View>
        <View style={styles.reportUserInfo}>
          <Text style={styles.reportUser} numberOfLines={1}>{report.author.name}</Text>
          <Text style={styles.reportTime}>{reportTime(report.created_at)}</Text>
        </View>
        <View style={[styles.statusBadge, { backgroundColor: badge.backgroundColor }]}>
          <Text style={[styles.statusText, { color: badge.color }]}>
            {report.status.charAt(0).toUpperCase() + report.status.slice(1)}
          </Text>
        </View>
      </View>

      <Text style={styles.reportDescription}>{report.description}</Text>
      {report.location ? (
        <View style={styles.locationRow}>
          <FontAwesome5 name="map-marker-alt" size={11} color="#6f7b75" />
          <Text style={styles.location}>{report.location}</Text>
        </View>
      ) : null}
      {report.image_url ? (
        <Image
          source={{ uri: report.image_url }}
          style={styles.reportImage}
          resizeMode="cover"
          accessibilityLabel="Community report photo"
        />
      ) : null}
      <ReportInteractions report={report} onReportUpdate={onReportUpdate} currentUserId={currentUserId} />
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
        <Text style={styles.loadingText}>Loading your community dashboard...</Text>
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
          <Text style={styles.subtitle}>Here’s what’s happening in your area.</Text>
        </View>

        {nextCollection ? (
          <View style={styles.collectionCard}>
            <View style={styles.collectionHeader}>
              <View style={styles.collectionIcon}>
                <FontAwesome5 name="map-marker-alt" size={16} color="#17843f" />
              </View>
              <View style={styles.collectionTitleArea}>
                <Text style={styles.sectionLabel}>YOUR ZONE THIS WEEK</Text>
                <Text style={styles.zoneTitle}>{nextCollection.area}</Text>
              </View>
            </View>

            <View style={styles.collectionDetails}>
              <View style={styles.collectionDetailRow}>
                <View style={styles.collectionDetailIcon}>
                  <FontAwesome5 name="calendar-alt" size={11} color="#17843f" />
                </View>
                <View style={styles.collectionDetailText}>
                  <Text style={styles.collectionDetailLabel}>Collection date</Text>
                  <Text style={styles.collectionDetailValue}>{nextCollection.date_display}</Text>
                </View>
              </View>
              <View style={styles.collectionDivider} />
              <View style={styles.collectionDetailRow}>
                <View style={styles.collectionDetailIcon}>
                  <FontAwesome5 name="clock" size={11} color="#17843f" />
                </View>
                <View style={styles.collectionDetailText}>
                  <Text style={styles.collectionDetailLabel}>Collection time</Text>
                  <Text style={styles.collectionDetailValue}>{nextCollection.time_range}</Text>
                </View>
              </View>
              <View style={styles.collectionDivider} />
              <View style={styles.collectionDetailRow}>
                <View style={styles.collectionDetailIcon}>
                  <FontAwesome5 name="truck" size={11} color="#17843f" />
                </View>
                <View style={styles.collectionDetailText}>
                  <Text style={styles.collectionDetailLabel}>Assigned truck</Text>
                  <Text style={styles.collectionDetailValue}>{nextCollection.truck}</Text>
                </View>
              </View>
            </View>
          </View>
        ) : (
          <View style={[styles.collectionCard, styles.emptyCollectionCard]}>
            <View style={styles.emptyCollectionIcon}>
              <FontAwesome5 name="calendar-alt" size={16} color="#17843f" />
            </View>
            <View style={styles.emptyCollectionText}>
              <Text style={styles.sectionLabel}>YOUR ZONE THIS WEEK</Text>
              <Text style={styles.emptyCollection}>No upcoming collection scheduled.</Text>
            </View>
          </View>
        )}

        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Community Reports</Text>
          <Text style={styles.sectionSupport}>Latest concerns shared by your community.</Text>
        </View>

        {error ? (
          <View style={styles.stateCard}>
            <View style={styles.stateIcon}>
              <FontAwesome5 name="exclamation-circle" size={17} color="#718078" />
            </View>
            <Text style={styles.stateText}>{error}</Text>
            <TouchableOpacity style={styles.retryButton} onPress={() => loadHome()} activeOpacity={0.72}>
              <Text style={styles.retryText}>Try again</Text>
            </TouchableOpacity>
          </View>
        ) : null}

        {!error && reports.length === 0 ? (
          <View style={styles.stateCard}>
            <View style={styles.stateIcon}>
              <FontAwesome5 name="comments" size={16} color="#718078" />
            </View>
            <Text style={styles.stateTitle}>No reports yet</Text>
            <Text style={styles.stateText}>Community reports will appear here.</Text>
          </View>
        ) : null}

        {reports.map((report) => <ReportCard key={report.id} report={report} onReportUpdate={updateReport} currentUserId={user?.id} />)}
        <View style={styles.bottomSpace} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  loadingContainer: { flex: 1, backgroundColor: '#f6f8f7', justifyContent: 'center', alignItems: 'center', padding: 24 },
  loadingText: { marginTop: 11, color: '#75807a', fontSize: 12.5 },
  container: { flex: 1, backgroundColor: '#f6f8f7' },
  scrollContent: { paddingHorizontal: 18, paddingTop: 28 },
  header: { marginBottom: 22 },
  greeting: { flexShrink: 1, fontSize: 26, lineHeight: 32, fontWeight: '800', color: '#111827' },
  subtitle: { marginTop: 4, fontSize: 13.5, lineHeight: 19, color: '#667085' },
  sectionLabel: { fontSize: 10.5, fontWeight: '800', color: '#4b7257', letterSpacing: 0.7 },
  collectionCard: { backgroundColor: '#eff9f2', borderRadius: 18, padding: 16, borderWidth: 1, borderColor: '#cfe7d5', marginBottom: 27, shadowColor: '#123d24', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 6, elevation: 2 },
  emptyCollectionCard: { minHeight: 76, flexDirection: 'row', alignItems: 'center' },
  collectionHeader: { flexDirection: 'row', alignItems: 'center' },
  collectionIcon: { width: 42, height: 42, borderRadius: 13, backgroundColor: '#ffffff', borderWidth: 1, borderColor: '#d8eadc', alignItems: 'center', justifyContent: 'center', marginRight: 12 },
  collectionTitleArea: { flex: 1, minWidth: 0 },
  zoneTitle: { marginTop: 4, flexShrink: 1, fontSize: 18, lineHeight: 23, fontWeight: '800', color: '#153a22' },
  collectionDetails: { marginTop: 15, backgroundColor: '#ffffff', borderWidth: 1, borderColor: '#dcebe0', borderRadius: 14, paddingHorizontal: 12, paddingVertical: 4 },
  collectionDetailRow: { minHeight: 48, flexDirection: 'row', alignItems: 'center', paddingVertical: 7 },
  collectionDetailIcon: { width: 28, height: 28, borderRadius: 8, marginRight: 10, alignItems: 'center', justifyContent: 'center', backgroundColor: '#edf7f0' },
  collectionDetailText: { flex: 1, minWidth: 0 },
  collectionDetailLabel: { fontSize: 10.5, color: '#7b8580' },
  collectionDetailValue: { marginTop: 2, flexShrink: 1, fontSize: 13, lineHeight: 18, fontWeight: '700', color: '#28352d' },
  collectionDivider: { height: 1, marginLeft: 38, backgroundColor: '#edf1ee' },
  emptyCollectionIcon: { width: 40, height: 40, borderRadius: 12, backgroundColor: '#ffffff', borderWidth: 1, borderColor: '#d8eadc', alignItems: 'center', justifyContent: 'center' },
  emptyCollectionText: { flex: 1, minWidth: 0, marginLeft: 12 },
  emptyCollection: { marginTop: 4, fontSize: 13.5, lineHeight: 19, color: '#53675a' },
  sectionHeader: { marginBottom: 13 },
  sectionTitle: { fontSize: 20, fontWeight: '800', color: '#111827' },
  sectionSupport: { marginTop: 3, fontSize: 11.5, lineHeight: 16, color: '#7b8580' },
  reportCard: { backgroundColor: '#ffffff', borderRadius: 17, padding: 15, borderWidth: 1, borderColor: '#e2e8e4', marginBottom: 12, shadowColor: '#111827', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.035, shadowRadius: 4, elevation: 1 },
  reportHeader: { flexDirection: 'row', alignItems: 'center' },
  avatar: { width: 40, height: 40, borderRadius: 12, backgroundColor: '#e7f4ea', borderWidth: 1, borderColor: '#d6eadb', justifyContent: 'center', alignItems: 'center' },
  avatarText: { color: '#17843f', fontWeight: '800', fontSize: 14 },
  reportUserInfo: { flex: 1, minWidth: 0, marginLeft: 10, paddingRight: 8 },
  reportUser: { flexShrink: 1, fontSize: 14, lineHeight: 18, fontWeight: '700', color: '#18211c' },
  reportTime: { marginTop: 2, fontSize: 10.5, color: '#8a9390' },
  statusBadge: { flexShrink: 0, paddingHorizontal: 9, paddingVertical: 5, borderRadius: 16 },
  statusText: { fontSize: 10, fontWeight: '700' },
  reportDescription: { marginTop: 13, fontSize: 13.5, lineHeight: 20, color: '#374151' },
  locationRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 7, marginTop: 9 },
  location: { flex: 1, minWidth: 0, fontSize: 11.5, lineHeight: 16, color: '#667085' },
  reportImage: { width: '100%', height: 198, borderRadius: 12, marginTop: 12, backgroundColor: '#edf1ef' },
  stateCard: { backgroundColor: '#ffffff', borderRadius: 16, padding: 20, borderWidth: 1, borderColor: '#e2e8e4', marginBottom: 12, alignItems: 'center' },
  stateIcon: { width: 38, height: 38, borderRadius: 12, marginBottom: 9, backgroundColor: '#f0f4f1', alignItems: 'center', justifyContent: 'center' },
  stateTitle: { fontSize: 15, fontWeight: '700', color: '#26312b' },
  stateText: { marginTop: 4, fontSize: 13, lineHeight: 19, color: '#667085', textAlign: 'center' },
  retryButton: { minHeight: 38, marginTop: 13, paddingHorizontal: 16, borderRadius: 10, borderWidth: 1, borderColor: '#b9ddc4', backgroundColor: '#f2faf4', alignItems: 'center', justifyContent: 'center' },
  retryText: { color: '#17843f', fontSize: 12.5, fontWeight: '700' },
  bottomSpace: { height: 100 },
});
