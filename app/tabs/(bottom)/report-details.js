import { useCallback, useEffect, useState } from 'react';
import FontAwesome5 from '@expo/vector-icons/FontAwesome5';
import * as Linking from 'expo-linking';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { ActivityIndicator, Image, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

import { api, clearAuthToken } from '../../../src/api/client';
import { useCleanifyAlert } from '../../../src/components/CleanifyAlert';
import ReportAuthorAvatar from '../../../src/components/ReportAuthorAvatar';
import ReportInteractions from '../../../src/components/ReportInteractions';

const STATUS_STYLES = {
  pending: { backgroundColor: '#fff4d6', color: '#c47a00' },
  in_progress: { backgroundColor: '#dbeafe', color: '#1d4ed8' },
  resolved: { backgroundColor: '#dcfce7', color: '#15803d' },
  rejected: { backgroundColor: '#fee2e2', color: '#b91c1c' },
};

export default function ReportDetailsScreen() {
  const params = useLocalSearchParams();
  const router = useRouter();
  const { showAlert } = useCleanifyAlert();
  const reportId = Array.isArray(params.id) ? params.id[0] : params.id;
  const [report, setReport] = useState(null);
  const [currentUserId, setCurrentUserId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const loadReport = useCallback(async () => {
    if (!reportId) {
      setError('This report could not be found.');
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const [reportResponse, userResponse] = await Promise.all([
        api.get(`/reports/${reportId}`),
        api.get('/me'),
      ]);
      setReport(reportResponse.data.data);
      setCurrentUserId(userResponse.data.user?.id ?? null);
    } catch (requestError) {
      if (requestError.response?.status === 401) {
        await clearAuthToken();
        router.replace('/login');
        return;
      }
      setError(requestError.response?.status === 404
        ? 'This report is no longer available.'
        : 'Unable to load report details. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [reportId, router]);

  useEffect(() => {
    loadReport();
  }, [loadReport]);

  const updateReport = useCallback((id, changes) => {
    setReport((current) => current && String(current.id) === String(id) ? { ...current, ...changes } : current);
  }, []);

  const latitude = Number(report?.latitude);
  const longitude = Number(report?.longitude);
  const hasCoordinates = report?.latitude != null
    && report?.longitude != null
    && Number.isFinite(latitude)
    && Number.isFinite(longitude);

  const openMap = async () => {
    if (!hasCoordinates) return;
    const query = encodeURIComponent(`${latitude},${longitude}`);
    try {
      await Linking.openURL(`https://www.google.com/maps/search/?api=1&query=${query}`);
    } catch {
      showAlert({ type: 'error', title: 'Unable to Open Map', message: 'No map application is available for this location.' });
    }
  };

  if (loading) {
    return <View style={styles.center}><ActivityIndicator size="large" color="#17843f" /><Text style={styles.stateText}>Loading report...</Text></View>;
  }

  if (error || !report) {
    return (
      <View style={styles.center}>
        <Text style={styles.stateText}>{error || 'This report could not be found.'}</Text>
        <TouchableOpacity style={styles.retryButton} onPress={loadReport}><Text style={styles.retryText}>Try Again</Text></TouchableOpacity>
        <TouchableOpacity style={styles.backLink} onPress={() => router.back()}><Text style={styles.backLinkText}>Back to Community Reports</Text></TouchableOpacity>
      </View>
    );
  }

  const badge = STATUS_STYLES[report.status] ?? STATUS_STYLES.pending;

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <TouchableOpacity style={styles.backButton} onPress={() => router.back()} activeOpacity={0.7}>
        <FontAwesome5 name="arrow-left" size={14} color="#17843f" />
        <Text style={styles.backText}>Community Reports</Text>
      </TouchableOpacity>

      <View style={styles.card}>
        <View style={styles.header}>
          <ReportAuthorAvatar author={report.author} style={styles.avatar} textStyle={styles.avatarText} />
          <View style={styles.authorInfo}>
            <Text style={styles.author}>{report.author?.name || 'Cleanify User'}</Text>
            <Text style={styles.date}>{new Date(report.created_at).toLocaleString()}</Text>
          </View>
          <View style={[styles.badge, { backgroundColor: badge.backgroundColor }]}>
            <Text style={[styles.badgeText, { color: badge.color }]}>{report.status_label}</Text>
          </View>
        </View>

        {report.image_url ? <Image source={{ uri: report.image_url }} style={styles.image} resizeMode="cover" /> : null}

        <View style={styles.locationCard}>
          <View style={styles.field}>
            <Text style={styles.fieldLabel}>Barangay</Text>
            <Text style={styles.fieldValue}>{report.barangay || 'Barangay not recorded'}</Text>
          </View>
          <View style={styles.divider} />
          <View style={styles.field}>
            <Text style={styles.fieldLabel}>Specific Location / Landmark</Text>
            <Text style={styles.fieldValue}>{report.location || 'Location not recorded'}</Text>
          </View>
          {hasCoordinates ? (
            <>
              <View style={styles.divider} />
              <View style={styles.gpsRow}>
                <View style={styles.gpsText}>
                  <Text style={styles.fieldLabel}>GPS Location Attached</Text>
                  <Text style={styles.coordinateText}>{latitude.toFixed(6)}, {longitude.toFixed(6)}</Text>
                </View>
                <TouchableOpacity style={styles.mapButton} onPress={openMap} activeOpacity={0.7}>
                  <FontAwesome5 name="map-marked-alt" size={13} color="#ffffff" />
                  <Text style={styles.mapButtonText}>View on Map</Text>
                </TouchableOpacity>
              </View>
            </>
          ) : null}
        </View>

        <View style={styles.descriptionSection}>
          <Text style={styles.fieldLabel}>Description</Text>
          <Text style={styles.description}>{report.description}</Text>
        </View>

        <ReportInteractions report={report} onReportUpdate={updateReport} currentUserId={currentUserId} />
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f6f8f7' },
  content: { paddingHorizontal: 18, paddingTop: 20, paddingBottom: 100 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12, padding: 24, backgroundColor: '#f6f8f7' },
  stateText: { color: '#667085', fontSize: 14, lineHeight: 20, textAlign: 'center' },
  retryButton: { minHeight: 42, minWidth: 110, borderRadius: 10, backgroundColor: '#17843f', alignItems: 'center', justifyContent: 'center', paddingHorizontal: 16 },
  retryText: { color: '#ffffff', fontWeight: '800' },
  backLink: { padding: 8 }, backLinkText: { color: '#17843f', fontWeight: '700' },
  backButton: { minHeight: 42, alignSelf: 'flex-start', flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 10, paddingRight: 12 },
  backText: { color: '#17843f', fontSize: 13, fontWeight: '700' },
  card: { backgroundColor: '#ffffff', borderRadius: 16, borderWidth: 1, borderColor: '#e5e9e7', padding: 16 },
  header: { flexDirection: 'row', alignItems: 'center' },
  avatar: { width: 44, height: 44, borderRadius: 22, backgroundColor: '#17843f', alignItems: 'center', justifyContent: 'center' },
  avatarText: { color: '#ffffff', fontSize: 17, fontWeight: '800' },
  authorInfo: { flex: 1, marginLeft: 10, paddingRight: 8 },
  author: { color: '#111827', fontSize: 15, fontWeight: '700' },
  date: { marginTop: 3, color: '#8a9390', fontSize: 11 },
  badge: { paddingHorizontal: 9, paddingVertical: 5, borderRadius: 16 }, badgeText: { fontSize: 11, fontWeight: '700' },
  image: { width: '100%', height: 250, marginTop: 16, borderRadius: 12, backgroundColor: '#edf1ef' },
  locationCard: { marginTop: 16, padding: 14, borderRadius: 12, backgroundColor: '#f5f8f6', borderWidth: 1, borderColor: '#e2e8e4' },
  field: { gap: 4 }, fieldLabel: { color: '#667085', fontSize: 11, fontWeight: '800', letterSpacing: 0.4, textTransform: 'uppercase' },
  fieldValue: { color: '#1f2937', fontSize: 14, lineHeight: 20 }, divider: { height: 1, marginVertical: 12, backgroundColor: '#e1e7e3' },
  gpsRow: { flexDirection: 'row', alignItems: 'center', gap: 12 }, gpsText: { flex: 1 }, coordinateText: { marginTop: 4, color: '#52605a', fontSize: 11 },
  mapButton: { minHeight: 38, flexDirection: 'row', alignItems: 'center', gap: 7, borderRadius: 9, backgroundColor: '#17843f', paddingHorizontal: 12 }, mapButtonText: { color: '#ffffff', fontSize: 11, fontWeight: '800' },
  descriptionSection: { marginTop: 18 }, description: { marginTop: 6, color: '#374151', fontSize: 14, lineHeight: 21 },
});
