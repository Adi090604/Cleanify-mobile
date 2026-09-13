import { useCallback, useState } from 'react';
import { useFocusEffect, useRouter } from 'expo-router';
import FontAwesome5 from '@expo/vector-icons/FontAwesome5';
import * as ImagePicker from 'expo-image-picker';
import { ActivityIndicator, Alert, Image, RefreshControl, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

import { api, clearAuthToken, logout as logoutRequest } from '../../../src/api/client';

const STATUS_STYLES = {
  pending: { backgroundColor: '#fff4d6', color: '#c47a00' },
  resolved: { backgroundColor: '#dcfce7', color: '#15803d' },
  rejected: { backgroundColor: '#fee2e2', color: '#b91c1c' },
};

function MyPost({ report }) {
  const badge = STATUS_STYLES[report.status] ?? STATUS_STYLES.pending;
  return (
    <View style={styles.postCard}>
      <View style={styles.postTop}>
        <Text style={styles.postDate}>{new Date(report.created_at).toLocaleString()}</Text>
        <View style={[styles.badge, { backgroundColor: badge.backgroundColor }]}><Text style={[styles.badgeText, { color: badge.color }]}>{report.status}</Text></View>
      </View>
      <Text style={styles.description}>{report.description}</Text>
      {report.location ? <Text style={styles.location}><FontAwesome5 name="map-marker-alt" /> {report.location}</Text> : null}
      {report.image_url ? <Image source={{ uri: report.image_url }} style={styles.postImage} resizeMode="cover" /> : null}
      <View style={styles.counts}>
        <Text style={styles.count}><FontAwesome5 name="heart" /> {report.likes_count}</Text>
        <Text style={styles.count}><FontAwesome5 name="comment" /> {report.comments_count}</Text>
      </View>
    </View>
  );
}

export default function ProfileScreen() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [account, setAccount] = useState(null);
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const [loggingOut, setLoggingOut] = useState(false);
  const [photoBusy, setPhotoBusy] = useState(false);
  const [photoFailed, setPhotoFailed] = useState(false);

  const loadProfile = useCallback(async ({ refresh = false } = {}) => {
    if (refresh) setRefreshing(true); else setLoading(true);
    setError(null);
    try {
      const [meResponse, settingsResponse, reportsResponse] = await Promise.all([api.get('/me'), api.get('/settings'), api.get('/me/reports')]);
      setUser(meResponse.data.user);
      setPhotoFailed(false);
      setAccount(settingsResponse.data.account);
      setReports(reportsResponse.data.data ?? []);
    } catch (requestError) {
      if (requestError.response?.status === 401) {
        await clearAuthToken();
        router.replace('/login');
      } else setError('Unable to load your profile. Pull down to try again.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [router]);

  useFocusEffect(useCallback(() => { loadProfile(); }, [loadProfile]));

  const handleLogout = async () => {
    if (loggingOut) return;
    setLoggingOut(true);
    await logoutRequest();
    router.replace('/login');
  };

  const chooseProfilePhoto = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], allowsEditing: true, aspect: [1, 1], quality: 0.85, selectionLimit: 1 });
    if (result.canceled) return;

    const photo = result.assets[0];
    const form = new FormData();
    form.append('profile_photo', {
      uri: photo.uri,
      name: photo.fileName || `profile-${Date.now()}.jpg`,
      type: photo.mimeType || 'image/jpeg',
    });

    setPhotoBusy(true);
    try {
      await api.post('/me/profile-photo', form, { headers: { 'Content-Type': 'multipart/form-data' } });
      await loadProfile();
      Alert.alert('Photo updated', 'Your profile photo has been updated.');
    } catch (requestError) {
      const errors = requestError.response?.data?.errors;
      Alert.alert('Unable to update photo', (errors && Object.values(errors).flat()[0]) || requestError.response?.data?.message || 'Please try another image.');
    } finally {
      setPhotoBusy(false);
    }
  };

  const removeProfilePhoto = () => {
    Alert.alert('Remove profile photo?', 'Your initials will be shown instead.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Remove', style: 'destructive', onPress: async () => {
          setPhotoBusy(true);
          try {
            await api.delete('/me/profile-photo');
            await loadProfile();
          } catch (requestError) {
            Alert.alert('Unable to remove photo', requestError.response?.data?.message || 'Please try again.');
          } finally {
            setPhotoBusy(false);
          }
        },
      },
    ]);
  };

  if (loading) return <View style={styles.center}><ActivityIndicator size="large" color="#17843f" /></View>;

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => loadProfile({ refresh: true })} colors={['#17843f']} />}>
      <Text style={styles.title}>Profile</Text>
      {error ? <View style={styles.stateCard}><Text style={styles.stateText}>{error}</Text></View> : null}
      {user && account ? (
        <View style={styles.profileCard}>
          {user.profile_photo_url && !photoFailed ? (
            <Image source={{ uri: user.profile_photo_url }} style={styles.profilePhoto} onError={() => setPhotoFailed(true)} />
          ) : (
            <View style={styles.avatar}><Text style={styles.avatarText}>{user.name?.charAt(0).toUpperCase()}</Text></View>
          )}
          <Text style={styles.name}>{user.name}</Text>
          <Text style={styles.email}>{user.email}</Text>
          <View style={styles.details}>
            <Text style={styles.detail}><FontAwesome5 name="phone" /> {account.phone || 'No phone number'}</Text>
            <Text style={styles.detail}><FontAwesome5 name="map-marker-alt" /> {account.service_area || 'No service area selected'}</Text>
          </View>
          <View style={styles.photoActions}>
            <TouchableOpacity style={styles.photoButton} onPress={chooseProfilePhoto} disabled={photoBusy}>
              <FontAwesome5 name="camera" color="#17843f" size={14} />
              <Text style={styles.photoButtonText}>{photoBusy ? 'Updating...' : user.profile_photo_url ? 'Change Photo' : 'Add Photo'}</Text>
            </TouchableOpacity>
            {user.profile_photo_url ? <TouchableOpacity onPress={removeProfilePhoto} disabled={photoBusy}><Text style={styles.removePhoto}>Remove Photo</Text></TouchableOpacity> : null}
          </View>
          <TouchableOpacity style={styles.editButton} onPress={() => router.navigate('/tabs/settings')}>
            <FontAwesome5 name="user-edit" color="#17843f" size={16} /><Text style={styles.editText}>Edit Profile</Text>
          </TouchableOpacity>
        </View>
      ) : null}
      <Text style={styles.sectionTitle}>My Posts</Text>
      {!error && reports.length === 0 ? <View style={styles.stateCard}><Text style={styles.stateText}>No reports yet.</Text></View> : null}
      {reports.map((report) => <MyPost key={report.id} report={report} />)}
      <TouchableOpacity style={styles.logoutButton} onPress={handleLogout} disabled={loggingOut}><Text style={styles.logoutText}>{loggingOut ? 'Signing out...' : 'Sign Out'}</Text></TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#f6f8f7' }, container: { flex: 1, backgroundColor: '#f6f8f7' }, content: { paddingHorizontal: 18, paddingTop: 24, paddingBottom: 100 }, title: { fontSize: 28, fontWeight: '800', color: '#111827', marginBottom: 16 },
  profileCard: { backgroundColor: '#fff', padding: 20, borderRadius: 16, borderWidth: 1, borderColor: '#e5e9e7', alignItems: 'center', marginBottom: 26 }, profilePhoto: { width: 84, height: 84, borderRadius: 42, backgroundColor: '#e5e9e7' }, avatar: { width: 84, height: 84, borderRadius: 42, backgroundColor: '#17843f', alignItems: 'center', justifyContent: 'center' }, avatarText: { color: '#fff', fontSize: 32, fontWeight: '800' }, name: { marginTop: 14, fontSize: 21, fontWeight: '800', color: '#111827' }, email: { marginTop: 4, color: '#667085', fontSize: 14 }, details: { alignSelf: 'stretch', marginTop: 18, gap: 10 }, detail: { color: '#374151', fontSize: 14 }, photoActions: { marginTop: 16, alignItems: 'center', gap: 10 }, photoButton: { minHeight: 40, paddingHorizontal: 15, borderWidth: 1, borderColor: '#17843f', borderRadius: 10, flexDirection: 'row', gap: 8, alignItems: 'center', justifyContent: 'center' }, photoButtonText: { color: '#17843f', fontWeight: '700', fontSize: 13 }, removePhoto: { color: '#b91c1c', fontWeight: '700', fontSize: 13 }, editButton: { marginTop: 16, minHeight: 46, alignSelf: 'stretch', borderWidth: 1, borderColor: '#17843f', borderRadius: 10, flexDirection: 'row', gap: 9, alignItems: 'center', justifyContent: 'center' }, editText: { color: '#17843f', fontWeight: '700' },
  sectionTitle: { fontSize: 21, fontWeight: '800', color: '#111827', marginBottom: 14 }, postCard: { backgroundColor: '#fff', padding: 16, borderRadius: 16, borderWidth: 1, borderColor: '#e5e9e7', marginBottom: 14 }, postTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }, postDate: { color: '#8a9390', fontSize: 11 }, badge: { paddingHorizontal: 9, paddingVertical: 5, borderRadius: 16 }, badgeText: { fontSize: 11, fontWeight: '700', textTransform: 'capitalize' }, description: { marginTop: 13, color: '#374151', fontSize: 14, lineHeight: 21 }, location: { marginTop: 9, color: '#667085', fontSize: 13 }, postImage: { width: '100%', height: 210, borderRadius: 12, marginTop: 12 }, counts: { flexDirection: 'row', gap: 22, marginTop: 13 }, count: { color: '#667085', fontSize: 14 }, stateCard: { padding: 20, backgroundColor: '#fff', borderRadius: 14, alignItems: 'center', marginBottom: 14 }, stateText: { color: '#667085', textAlign: 'center' }, logoutButton: { marginTop: 18, minHeight: 50, borderRadius: 10, borderWidth: 1, borderColor: '#17843f', alignItems: 'center', justifyContent: 'center', backgroundColor: '#fff' }, logoutText: { color: '#17843f', fontSize: 15, fontWeight: '700' },
});
