import { useCallback, useState } from 'react';
import { useFocusEffect, useRouter } from 'expo-router';
import FontAwesome5 from '@expo/vector-icons/FontAwesome5';
import * as ImagePicker from 'expo-image-picker';
import { WebView } from 'react-native-webview';
import { ActivityIndicator, Alert, Image, KeyboardAvoidingView, Platform, RefreshControl, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';

import { api, clearAuthToken } from '../../../src/api/client';

const LEAFLET_MAP_HTML = `<!DOCTYPE html>
<html>
<head>
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
  <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css">
  <style>
    html, body, #map { width: 100%; height: 100%; margin: 0; background: #e8eee9; }
    .leaflet-container { font-family: Arial, sans-serif; }
  </style>
</head>
<body>
  <div id="map"></div>
  <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
  <script>
    (function () {
      var map = L.map('map').setView([9.7870, 125.4928], 13);
      var marker = null;
      var tiles = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap contributors</a>',
        maxZoom: 19
      }).addTo(map);

      function sendLocation(lat, lng) {
        window.ReactNativeWebView.postMessage(JSON.stringify({
          type: 'location',
          latitude: Number(lat),
          longitude: Number(lng)
        }));
      }

      function setLocation(lat, lng) {
        if (marker) marker.setLatLng([lat, lng]);
        else {
          marker = L.marker([lat, lng], { draggable: true }).addTo(map);
          marker.on('dragend', function (event) {
            var point = event.target.getLatLng();
            sendLocation(point.lat, point.lng);
          });
        }
        sendLocation(lat, lng);
      }

      map.on('click', function (event) {
        setLocation(event.latlng.lat, event.latlng.lng);
      });
      map.whenReady(function () {
        window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'map_ready' }));
      });
    })();
  </script>
</body>
</html>`;
const STATUS_STYLES = {
  pending: { backgroundColor: '#fff4d6', color: '#c47a00' },
  resolved: { backgroundColor: '#dcfce7', color: '#15803d' },
  rejected: { backgroundColor: '#fee2e2', color: '#b91c1c' },
};

function errorMessage(error) {
  const errors = error.response?.data?.errors;
  return (errors && Object.values(errors).flat()[0]) || error.response?.data?.message || 'Unable to complete the request. Please try again.';
}

function ReportCard({ report }) {
  const badge = STATUS_STYLES[report.status] ?? STATUS_STYLES.pending;
  return (
    <View style={styles.reportCard}>
      <View style={styles.reportHeader}>
        <View style={styles.avatar}><Text style={styles.avatarText}>{report.author.initial}</Text></View>
        <View style={styles.authorInfo}>
          <Text style={styles.author}>{report.author.name}</Text>
          <Text style={styles.date}>{new Date(report.created_at).toLocaleString()}</Text>
        </View>
        <View style={[styles.badge, { backgroundColor: badge.backgroundColor }]}>
          <Text style={[styles.badgeText, { color: badge.color }]}>{report.status}</Text>
        </View>
      </View>
      <Text style={styles.description}>{report.description}</Text>
      {report.location ? <Text style={styles.location}><FontAwesome5 name="map-marker-alt" /> {report.location}</Text> : null}
      {report.image_url ? <Image source={{ uri: report.image_url }} style={styles.reportImage} resizeMode="cover" /> : null}
      <View style={styles.counts}>
        <Text style={styles.count}><FontAwesome5 name="heart" solid={report.is_liked} /> {report.likes_count}</Text>
        <Text style={styles.count}><FontAwesome5 name="comment" /> {report.comments_count}</Text>
      </View>
    </View>
  );
}

export default function ReportScreen() {
  const router = useRouter();
  const [location, setLocation] = useState('');
  const [coordinate, setCoordinate] = useState(null);
  const [mapKey, setMapKey] = useState(0);
  const [mapLoading, setMapLoading] = useState(true);
  const [mapError, setMapError] = useState(false);
  const [description, setDescription] = useState('');
  const [photo, setPhoto] = useState(null);
  const [reports, setReports] = useState([]);
  const [page, setPage] = useState(1);
  const [lastPage, setLastPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  const loadReports = useCallback(async ({ refresh = false, nextPage = 1 } = {}) => {
    if (refresh) setRefreshing(true);
    else if (nextPage > 1) setLoadingMore(true);
    else setLoading(true);
    setError(null);
    try {
      const { data } = await api.get('/reports', { params: { page: nextPage } });
      setReports((current) => nextPage === 1 ? data.data : [...current, ...data.data]);
      setPage(data.meta?.current_page ?? nextPage);
      setLastPage(data.meta?.last_page ?? nextPage);
    } catch (requestError) {
      if (requestError.response?.status === 401) {
        await clearAuthToken();
        router.replace('/login');
      } else setError('Unable to load community reports. Pull down to try again.');
    } finally {
      setLoading(false);
      setRefreshing(false);
      setLoadingMore(false);
    }
  }, [router]);

  useFocusEffect(useCallback(() => { loadReports(); }, [loadReports]));

  const choosePhoto = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], allowsEditing: false, quality: 0.85, selectionLimit: 1 });
    if (!result.canceled) setPhoto(result.assets[0]);
  };

  const submitReport = async () => {
    if (!description.trim()) {
      Alert.alert('Description required', 'Please describe the issue.');
      return;
    }
    setSubmitting(true);
    const form = new FormData();
    form.append('description', description.trim());
    if (location.trim()) form.append('location', location.trim());
    if (coordinate) {
      form.append('latitude', coordinate.latitude.toFixed(8));
      form.append('longitude', coordinate.longitude.toFixed(8));
    }
    if (photo) form.append('image', { uri: photo.uri, name: photo.fileName || `report-${Date.now()}.jpg`, type: photo.mimeType || 'image/jpeg' });

    try {
      await api.post('/reports', form, { headers: { 'Content-Type': 'multipart/form-data' } });
      setLocation('');
      setCoordinate(null);
      setMapKey((current) => current + 1);
      setMapLoading(true);
      setMapError(false);
      setDescription('');
      setPhoto(null);
      Alert.alert('Report submitted', 'Your report was submitted for review.');
      await loadReports();
    } catch (requestError) {
      Alert.alert('Unable to submit report', errorMessage(requestError));
    } finally {
      setSubmitting(false);
    }
  };

  const handleMapMessage = (event) => {
    try {
      const message = JSON.parse(event.nativeEvent.data);
      if (message.type === 'map_ready') {
        setMapLoading(false);
        return;
      }
      if (message.type !== 'location') return;
      const latitude = Number(message.latitude);
      const longitude = Number(message.longitude);
      if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) return;
      if (latitude < -90 || latitude > 90 || longitude < -180 || longitude > 180) return;
      setCoordinate({ latitude, longitude });
    } catch {
      // Ignore messages that do not match the map bridge payload.
    }
  };

  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled" refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => loadReports({ refresh: true })} colors={['#17843f']} />}>
        <Text style={styles.title}>Community Reports</Text>
        <View style={styles.formCard}>
          <Text style={styles.sectionTitle}>Create Report</Text>
          <Text style={styles.label}>Report Location</Text>
          <Text style={styles.help}>Tap or drag the marker to select the issue location.</Text>
          <View style={styles.mapFrame}>
            <WebView
              key={mapKey}
              style={styles.map}
              source={{ html: LEAFLET_MAP_HTML, baseUrl: 'https://localhost/' }}
              originWhitelist={['https://*']}
              javaScriptEnabled
              domStorageEnabled
              nestedScrollEnabled
              onMessage={handleMapMessage}
              onError={() => { setMapLoading(false); setMapError(true); }}
              onHttpError={() => { setMapLoading(false); setMapError(true); }}
            />
            {mapLoading ? <View style={styles.mapState}><ActivityIndicator color="#17843f" /><Text style={styles.mapStateText}>Loading map...</Text></View> : null}
            {mapError ? <View style={styles.mapState}><Text style={styles.mapStateText}>Map unavailable. Check your connection.</Text></View> : null}
          </View>
          {coordinate ? <Text style={styles.coordinates}>{coordinate.latitude.toFixed(6)}, {coordinate.longitude.toFixed(6)}</Text> : null}
          <Text style={styles.label}>Location / Barangay (optional)</Text>
          <TextInput style={styles.input} value={location} onChangeText={setLocation} maxLength={255} placeholder="Enter location or barangay" />
          <Text style={styles.label}>Describe the issue</Text>
          <TextInput style={[styles.input, styles.textarea]} value={description} onChangeText={setDescription} maxLength={1000} multiline textAlignVertical="top" placeholder="Describe the community concern" />
          {photo ? <Image source={{ uri: photo.uri }} style={styles.preview} resizeMode="cover" /> : null}
          <TouchableOpacity style={styles.photoButton} onPress={choosePhoto} disabled={submitting}>
            <FontAwesome5 name="camera" color="#17843f" size={17} /><Text style={styles.photoButtonText}>{photo ? 'Change Photo' : 'Add Photo'}</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.submitButton, submitting && styles.disabled]} onPress={submitReport} disabled={submitting}>
            <Text style={styles.submitText}>{submitting ? 'Submitting...' : 'Submit Report'}</Text>
          </TouchableOpacity>
        </View>

        <Text style={styles.feedTitle}>Community Reports</Text>
        {loading ? <ActivityIndicator color="#17843f" size="large" /> : null}
        {error ? <View style={styles.stateCard}><Text style={styles.stateText}>{error}</Text></View> : null}
        {!loading && !error && reports.length === 0 ? <View style={styles.stateCard}><Text style={styles.stateText}>No reports yet.</Text></View> : null}
        {reports.map((report) => <ReportCard key={report.id} report={report} />)}
        {page < lastPage ? <TouchableOpacity style={styles.moreButton} onPress={() => loadReports({ nextPage: page + 1 })} disabled={loadingMore}><Text style={styles.moreText}>{loadingMore ? 'Loading...' : 'Load More'}</Text></TouchableOpacity> : null}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f6f8f7' }, content: { paddingHorizontal: 18, paddingTop: 24, paddingBottom: 100 },
  title: { fontSize: 28, fontWeight: '800', color: '#111827', marginBottom: 16 }, formCard: { backgroundColor: '#fff', padding: 16, borderRadius: 16, borderWidth: 1, borderColor: '#e5e9e7', marginBottom: 28 },
  sectionTitle: { fontSize: 20, fontWeight: '800', color: '#17843f', marginBottom: 18 }, label: { fontSize: 14, fontWeight: '700', color: '#374151', marginBottom: 7 }, help: { fontSize: 12, color: '#6b7280', marginBottom: 9 },
  mapFrame: { width: '100%', height: 230, borderRadius: 12, overflow: 'hidden', backgroundColor: '#e8eee9', marginBottom: 8 }, map: { flex: 1, backgroundColor: '#e8eee9' }, mapState: { ...StyleSheet.absoluteFillObject, alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: '#e8eee9' }, mapStateText: { color: '#52665a', fontSize: 12 }, coordinates: { color: '#667085', fontSize: 12, marginBottom: 16 }, input: { minHeight: 48, borderWidth: 1, borderColor: '#d1d5db', borderRadius: 10, paddingHorizontal: 12, fontSize: 15, color: '#111827', marginBottom: 16 }, textarea: { height: 120, paddingTop: 12 },
  preview: { width: '100%', height: 200, borderRadius: 12, marginBottom: 12 }, photoButton: { minHeight: 48, borderWidth: 1, borderColor: '#17843f', borderRadius: 10, flexDirection: 'row', gap: 9, alignItems: 'center', justifyContent: 'center' }, photoButtonText: { color: '#17843f', fontWeight: '700' }, submitButton: { minHeight: 50, borderRadius: 10, backgroundColor: '#17843f', alignItems: 'center', justifyContent: 'center', marginTop: 12 }, submitText: { color: '#fff', fontWeight: '800', fontSize: 15 }, disabled: { opacity: 0.6 },
  feedTitle: { fontSize: 21, fontWeight: '800', color: '#111827', marginBottom: 14 }, reportCard: { backgroundColor: '#fff', padding: 16, borderRadius: 16, borderWidth: 1, borderColor: '#e5e9e7', marginBottom: 14 }, reportHeader: { flexDirection: 'row', alignItems: 'center' }, avatar: { width: 42, height: 42, borderRadius: 21, backgroundColor: '#17843f', alignItems: 'center', justifyContent: 'center' }, avatarText: { color: '#fff', fontSize: 16, fontWeight: '800' }, authorInfo: { flex: 1, marginLeft: 10 }, author: { fontSize: 15, fontWeight: '700', color: '#111827' }, date: { fontSize: 11, color: '#8a9390', marginTop: 3 }, badge: { paddingHorizontal: 9, paddingVertical: 5, borderRadius: 16 }, badgeText: { fontSize: 11, fontWeight: '700', textTransform: 'capitalize' }, description: { fontSize: 14, lineHeight: 21, color: '#374151', marginTop: 14 }, location: { fontSize: 13, color: '#667085', marginTop: 9 }, reportImage: { width: '100%', height: 210, borderRadius: 12, marginTop: 12 }, counts: { flexDirection: 'row', gap: 22, marginTop: 13 }, count: { color: '#667085', fontSize: 14 }, stateCard: { padding: 20, backgroundColor: '#fff', borderRadius: 14, alignItems: 'center', marginBottom: 14 }, stateText: { color: '#667085', textAlign: 'center' }, moreButton: { minHeight: 46, alignItems: 'center', justifyContent: 'center' }, moreText: { color: '#17843f', fontWeight: '700' },
});
