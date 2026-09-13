import { useCallback, useState } from 'react';
import { useFocusEffect, useRouter } from 'expo-router';
import { Picker } from '@react-native-picker/picker';
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';

import { api, clearAuthToken } from '../../src/api/client';

const CATEGORY_LABELS = {
  report_updates: 'Report Updates',
  schedule_reminders: 'Schedule Reminders',
  community_posts: 'Community Posts',
  truck_tracking: 'Truck Tracking',
};

function messageFor(error) {
  const errors = error.response?.data?.errors;
  if (errors) return Object.values(errors).flat()[0];
  return error.response?.data?.message || 'Unable to save changes. Please try again.';
}

function Section({ title, children }) {
  return (
    <View style={styles.card}>
      <Text style={styles.sectionTitle}>{title}</Text>
      {children}
    </View>
  );
}

function PreferenceRow({ label, value, onValueChange }) {
  return (
    <View style={styles.preferenceRow}>
      <Text style={styles.preferenceLabel}>{label}</Text>
      <Switch
        value={value}
        onValueChange={onValueChange}
        trackColor={{ false: '#d1d5db', true: '#86d39d' }}
        thumbColor={value ? '#17843f' : '#f4f4f5'}
      />
    </View>
  );
}

export default function SettingsScreen() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [saving, setSaving] = useState(null);
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [serviceArea, setServiceArea] = useState('');
  const [serviceAreas, setServiceAreas] = useState([]);
  const [currentPassword, setCurrentPassword] = useState('');
  const [password, setPassword] = useState('');
  const [passwordConfirmation, setPasswordConfirmation] = useState('');
  const [notifications, setNotifications] = useState(null);

  const loadSettings = useCallback(async (asRefresh = false) => {
    if (asRefresh) setRefreshing(true);
    else setLoading(true);

    try {
      const { data } = await api.get('/settings');
      setEmail(data.account.email || '');
      setPhone(data.account.phone || '');
      setServiceArea(data.account.service_area || '');
      setServiceAreas(data.service_areas || []);
      setNotifications(data.notifications);
    } catch (error) {
      if (error.response?.status === 401) {
        await clearAuthToken();
        router.replace('/login');
      } else {
        Alert.alert('Unable to load settings', messageFor(error));
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [router]);

  useFocusEffect(useCallback(() => {
    loadSettings();
  }, [loadSettings]));

  const saveAccount = async () => {
    setSaving('account');
    try {
      await api.patch('/settings/account', {
        email: email.trim(),
        phone: phone.trim() || null,
        service_area: serviceArea || null,
      });
      Alert.alert('Saved', 'Account information updated successfully.');
      await loadSettings();
    } catch (error) {
      Alert.alert('Unable to save account', messageFor(error));
    } finally {
      setSaving(null);
    }
  };

  const savePassword = async () => {
    setSaving('password');
    try {
      await api.patch('/settings/password', {
        current_password: currentPassword,
        password,
        password_confirmation: passwordConfirmation,
      });
      setCurrentPassword('');
      setPassword('');
      setPasswordConfirmation('');
      Alert.alert('Updated', 'Password updated successfully.');
    } catch (error) {
      Alert.alert('Unable to update password', messageFor(error));
    } finally {
      setSaving(null);
    }
  };

  const setGlobalPreference = (key, value) => {
    setNotifications((current) => ({ ...current, [key]: value }));
  };

  const setCategoryPreference = (key, value) => {
    setNotifications((current) => ({
      ...current,
      preferences: { ...current.preferences, [key]: value },
    }));
  };

  const saveNotifications = async () => {
    setSaving('notifications');
    try {
      await api.patch('/settings/notifications', notifications);
      Alert.alert('Saved', 'Notification preferences updated successfully.');
      await loadSettings();
    } catch (error) {
      Alert.alert('Unable to save preferences', messageFor(error));
    } finally {
      setSaving(null);
    }
  };

  if (loading || !notifications) {
    return <View style={styles.center}><ActivityIndicator size="large" color="#17843f" /></View>;
  }

  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => loadSettings(true)} tintColor="#17843f" />}
      >
        <Text style={styles.title}>Settings</Text>

        <Section title="Account Information">
          <Text style={styles.label}>Email Address</Text>
          <TextInput style={styles.input} value={email} onChangeText={setEmail} keyboardType="email-address" autoCapitalize="none" />
          <Text style={styles.label}>Phone Number</Text>
          <TextInput style={styles.input} value={phone} onChangeText={setPhone} keyboardType="phone-pad" placeholder="+63 912 345 6789" />
          <Text style={styles.label}>Service Area</Text>
          <View style={styles.pickerBox}>
            <Picker selectedValue={serviceArea} onValueChange={setServiceArea}>
              <Picker.Item label="Select your area" value="" />
              {serviceAreas.map((area) => <Picker.Item key={area} label={area} value={area} />)}
            </Picker>
          </View>
          <Text style={styles.help}>Only active service areas managed by Cleanify are shown.</Text>
          <TouchableOpacity style={styles.button} onPress={saveAccount} disabled={saving !== null}>
            <Text style={styles.buttonText}>{saving === 'account' ? 'Saving...' : 'Save Changes'}</Text>
          </TouchableOpacity>
        </Section>

        <Section title="Change Password">
          <Text style={styles.label}>Current Password</Text>
          <TextInput style={styles.input} value={currentPassword} onChangeText={setCurrentPassword} secureTextEntry autoCapitalize="none" />
          <Text style={styles.label}>New Password</Text>
          <TextInput style={styles.input} value={password} onChangeText={setPassword} secureTextEntry autoCapitalize="none" />
          <Text style={styles.help}>Must meet the same password rules as the web application.</Text>
          <Text style={styles.label}>Confirm New Password</Text>
          <TextInput style={styles.input} value={passwordConfirmation} onChangeText={setPasswordConfirmation} secureTextEntry autoCapitalize="none" />
          <TouchableOpacity style={styles.button} onPress={savePassword} disabled={saving !== null}>
            <Text style={styles.buttonText}>{saving === 'password' ? 'Updating...' : 'Update Password'}</Text>
          </TouchableOpacity>
        </Section>

        <Section title="Notification Preferences">
          <Text style={styles.subheading}>Global Settings</Text>
          <PreferenceRow label="Email Notifications" value={notifications.email_notifications} onValueChange={(value) => setGlobalPreference('email_notifications', value)} />
          <PreferenceRow label="SMS Notifications" value={notifications.sms_notifications} onValueChange={(value) => setGlobalPreference('sms_notifications', value)} />
          <PreferenceRow label="Push Notifications" value={notifications.push_notifications} onValueChange={(value) => setGlobalPreference('push_notifications', value)} />
          <Text style={styles.subheading}>Notification Categories</Text>
          {Object.entries(CATEGORY_LABELS).map(([key, label]) => (
            <PreferenceRow key={key} label={label} value={notifications.preferences[key]} onValueChange={(value) => setCategoryPreference(key, value)} />
          ))}
          <TouchableOpacity style={styles.button} onPress={saveNotifications} disabled={saving !== null}>
            <Text style={styles.buttonText}>{saving === 'notifications' ? 'Saving...' : 'Save Preferences'}</Text>
          </TouchableOpacity>
        </Section>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f6f8f7' },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#f6f8f7' },
  content: { padding: 18, paddingBottom: 38 },
  title: { fontSize: 28, fontWeight: '800', color: '#111827', marginBottom: 16 },
  card: { backgroundColor: '#ffffff', borderRadius: 14, padding: 18, marginBottom: 16, borderWidth: 1, borderColor: '#e5e9e7' },
  sectionTitle: { color: '#17843f', fontSize: 18, fontWeight: '800', borderBottomWidth: 2, borderBottomColor: '#17843f', paddingBottom: 10, marginBottom: 16 },
  subheading: { color: '#374151', fontSize: 15, fontWeight: '700', marginTop: 4, marginBottom: 6 },
  label: { color: '#374151', fontSize: 14, fontWeight: '600', marginBottom: 7 },
  input: { minHeight: 48, borderWidth: 1, borderColor: '#d1d5db', borderRadius: 10, paddingHorizontal: 13, fontSize: 15, color: '#111827', backgroundColor: '#ffffff', marginBottom: 14 },
  pickerBox: { borderWidth: 1, borderColor: '#d1d5db', borderRadius: 10, overflow: 'hidden', marginBottom: 6 },
  help: { color: '#6b7280', fontSize: 12, lineHeight: 18, marginBottom: 14 },
  preferenceRow: { minHeight: 54, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderBottomWidth: 1, borderBottomColor: '#edf0ee' },
  preferenceLabel: { flex: 1, color: '#374151', fontSize: 14, marginRight: 12 },
  button: { minHeight: 48, backgroundColor: '#17843f', borderRadius: 10, alignItems: 'center', justifyContent: 'center', marginTop: 16 },
  buttonText: { color: '#ffffff', fontSize: 15, fontWeight: '800' },
});
