import { useCallback, useRef, useState } from 'react';
import { useFocusEffect, useRouter } from 'expo-router';
import { Picker } from '@react-native-picker/picker';
import FontAwesome5 from '@expo/vector-icons/FontAwesome5';
import * as Location from 'expo-location';
import { WebView } from 'react-native-webview';
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Modal,
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

function messageFor(error, fallback = 'Unable to save changes. Please try again.') {
  const errors = error.response?.data?.errors;
  if (errors) return Object.values(errors).flat()[0];
  return error.response?.data?.message || fallback;
}

const REQUEST_STATUS = {
  pending: { label: 'Pending Review', badge: '#fff4d6', text: '#a16207' },
  approved: { label: 'Approved', badge: '#dcfce7', text: '#15803d' },
  rejected: { label: 'Not Approved', badge: '#f3f4f6', text: '#4b5563' },
};

const EMPTY_REQUEST_FORM = {
  area_name: '',
  barangay: '',
  address: '',
  details: '',
};

const DEFAULT_MAP_CENTER = { latitude: 9.787, longitude: 125.4928 };

const LOCATION_PICKER_HTML = `<!DOCTYPE html>
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
  <script>
    function post(message) {
      if (window.ReactNativeWebView) {
        window.ReactNativeWebView.postMessage(JSON.stringify(message));
      }
    }
    function mapError(message) {
      post({ type: 'map-error', message: String(message || 'Map unavailable') });
    }
    window.onerror = function (message, source, line, column, error) {
      mapError(error && error.message ? error.message : message);
      return false;
    };
  </script>
  <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js" onerror="mapError('Leaflet failed to load')"></script>
  <script>
    (function () {
      if (typeof L === 'undefined') return;

      var map = L.map('map').setView([${DEFAULT_MAP_CENTER.latitude}, ${DEFAULT_MAP_CENTER.longitude}], 13);
      var marker = null;
      var tileFailureReported = false;
      var tiles = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap contributors</a>',
        maxZoom: 19
      }).addTo(map);

      function valid(latitude, longitude) {
        return Number.isFinite(latitude)
          && Number.isFinite(longitude)
          && latitude >= -90
          && latitude <= 90
          && longitude >= -180
          && longitude <= 180;
      }

      function notify(latitude, longitude) {
        post({
          type: 'location-selected',
          latitude: Number(latitude),
          longitude: Number(longitude)
        });
      }

      function setLocation(latitude, longitude, centerMap, shouldNotify) {
        latitude = Number(latitude);
        longitude = Number(longitude);
        if (!valid(latitude, longitude)) return;

        if (marker) marker.setLatLng([latitude, longitude]);
        else {
          marker = L.marker([latitude, longitude], { draggable: true }).addTo(map);
          marker.on('dragend', function (event) {
            var point = event.target.getLatLng();
            notify(point.lat, point.lng);
          });
        }

        if (centerMap) map.setView([latitude, longitude], Math.max(map.getZoom(), 16), { animate: true });
        if (shouldNotify) notify(latitude, longitude);
      }

      window.setPickerLocation = function (latitude, longitude) {
        setLocation(latitude, longitude, true, false);
      };
      window.clearPickerLocation = function () {
        if (marker) {
          map.removeLayer(marker);
          marker = null;
        }
      };

      map.on('click', function (event) {
        setLocation(event.latlng.lat, event.latlng.lng, false, true);
      });
      tiles.on('tileerror', function () {
        if (!tileFailureReported) {
          tileFailureReported = true;
          post({ type: 'tile-error' });
        }
      });
      map.whenReady(function () {
        setTimeout(function () { map.invalidateSize(); }, 0);
        post({ type: 'map-ready' });
      });
    })();
  </script>
</body>
</html>`;

function isValidCoordinate(latitude, longitude) {
  return Number.isFinite(latitude)
    && Number.isFinite(longitude)
    && latitude >= -90
    && latitude <= 90
    && longitude >= -180
    && longitude <= 180;
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

function FieldError({ value }) {
  if (!value) return null;
  return <Text style={styles.fieldError}>{Array.isArray(value) ? value[0] : value}</Text>;
}

export default function SettingsScreen() {
  const router = useRouter();
  const submissionInFlight = useRef(false);
  const locationMapRef = useRef(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [saving, setSaving] = useState(null);
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [serviceArea, setServiceArea] = useState('');
  const [officialServiceArea, setOfficialServiceArea] = useState('');
  const [serviceAreas, setServiceAreas] = useState([]);
  const [currentPassword, setCurrentPassword] = useState('');
  const [password, setPassword] = useState('');
  const [passwordConfirmation, setPasswordConfirmation] = useState('');
  const [notifications, setNotifications] = useState(null);
  const [latestRequest, setLatestRequest] = useState(null);
  const [requestLoading, setRequestLoading] = useState(true);
  const [requestError, setRequestError] = useState(null);
  const [requestModalVisible, setRequestModalVisible] = useState(false);
  const [requestForm, setRequestForm] = useState(EMPTY_REQUEST_FORM);
  const [requestFormErrors, setRequestFormErrors] = useState({});
  const [requestSubmitError, setRequestSubmitError] = useState(null);
  const [coordinate, setCoordinate] = useState(null);
  const [locationMessage, setLocationMessage] = useState(null);
  const [gettingLocation, setGettingLocation] = useState(false);
  const [locationMapVisible, setLocationMapVisible] = useState(false);
  const [locationMapReady, setLocationMapReady] = useState(false);
  const [locationMapError, setLocationMapError] = useState(null);
  const [locationMapNotice, setLocationMapNotice] = useState(null);
  const [locationMapKey, setLocationMapKey] = useState(0);
  const [submittingRequest, setSubmittingRequest] = useState(false);

  const loadSettings = useCallback(async (asRefresh = false) => {
    if (asRefresh) setRefreshing(true);
    else setLoading(true);

    try {
      const { data } = await api.get('/settings');
      setEmail(data.account.email || '');
      setPhone(data.account.phone || '');
      setServiceArea(data.account.service_area || '');
      setOfficialServiceArea(data.account.service_area || '');
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

  const loadLatestRequest = useCallback(async () => {
    setRequestLoading(true);
    setRequestError(null);

    try {
      const { data } = await api.get('/service-area-requests/latest');
      setLatestRequest(data.data ?? null);
    } catch (error) {
      if (error.response?.status === 401) {
        await clearAuthToken();
        router.replace('/login');
      } else {
        setRequestError('Unable to load your latest request. Please try again.');
      }
    } finally {
      setRequestLoading(false);
    }
  }, [router]);

  useFocusEffect(useCallback(() => {
    loadSettings();
    loadLatestRequest();
  }, [loadLatestRequest, loadSettings]));

  const refreshSettings = async () => {
    setRefreshing(true);
    await Promise.all([loadSettings(true), loadLatestRequest()]);
    setRefreshing(false);
  };

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

  const updateRequestField = (field, value) => {
    setRequestForm((current) => ({ ...current, [field]: value }));
    setRequestFormErrors((current) => ({ ...current, [field]: undefined }));
    setRequestSubmitError(null);
  };

  const resetRequestForm = () => {
    setRequestForm(EMPTY_REQUEST_FORM);
    setRequestFormErrors({});
    setRequestSubmitError(null);
    setCoordinate(null);
    setLocationMessage(null);
    setLocationMapVisible(false);
    setLocationMapReady(false);
    setLocationMapError(null);
    setLocationMapNotice(null);
  };

  const closeRequestModal = () => {
    if (submittingRequest) return;
    setRequestModalVisible(false);
    resetRequestForm();
  };

  const openRequestModal = () => {
    if (latestRequest?.status === 'pending') return;
    resetRequestForm();
    setRequestModalVisible(true);
  };

  const useMyLocation = async () => {
    if (gettingLocation) return;

    setGettingLocation(true);
    setLocationMessage(null);

    try {
      const permission = await Location.requestForegroundPermissionsAsync();

      if (permission.status !== 'granted') {
        setLocationMessage('Location is optional. You can submit this request without it.');
        return;
      }

      const current = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });
      const latitude = Number(current.coords?.latitude);
      const longitude = Number(current.coords?.longitude);

      if (!isValidCoordinate(latitude, longitude)) {
        throw new Error('Invalid location');
      }

      setCoordinate({ latitude, longitude });
      setLocationMapVisible(true);
      setLocationMessage(null);
      setLocationMapError(null);

      if (locationMapReady) {
        locationMapRef.current?.injectJavaScript(`
          if (typeof window.setPickerLocation === 'function') {
            window.setPickerLocation(${latitude}, ${longitude});
          }
          true;
        `);
      }
    } catch {
      setLocationMessage('Your location could not be captured. You can still submit without it.');
    } finally {
      setGettingLocation(false);
    }
  };

  const showLocationMap = () => {
    setLocationMapVisible(true);
    setLocationMapError(null);
    setLocationMapNotice(null);
  };

  const clearLocation = () => {
    setCoordinate(null);
    setLocationMessage(null);

    if (locationMapReady) {
      locationMapRef.current?.injectJavaScript(`
        if (typeof window.clearPickerLocation === 'function') {
          window.clearPickerLocation();
        }
        true;
      `);
    }
  };

  const handleLocationMapMessage = (event) => {
    try {
      const message = JSON.parse(event.nativeEvent?.data);

      if (message.type === 'map-ready') {
        setLocationMapReady(true);
        setLocationMapError(null);

        if (coordinate && isValidCoordinate(coordinate.latitude, coordinate.longitude)) {
          locationMapRef.current?.injectJavaScript(`
            if (typeof window.setPickerLocation === 'function') {
              window.setPickerLocation(${coordinate.latitude}, ${coordinate.longitude});
            }
            true;
          `);
        }
        return;
      }

      if (message.type === 'location-selected') {
        const latitude = Number(message.latitude);
        const longitude = Number(message.longitude);

        if (isValidCoordinate(latitude, longitude)) {
          setCoordinate({ latitude, longitude });
          setLocationMessage(null);
        }
        return;
      }

      if (message.type === 'tile-error') {
        setLocationMapNotice('Map tiles are unavailable. Your selected coordinates can still be submitted.');
        return;
      }

      if (message.type === 'map-error') {
        setLocationMapReady(false);
        setLocationMapError('The map could not load. You can still use GPS coordinates or submit without a location.');
      }
    } catch {
      // Ignore malformed or unrelated WebView messages.
    }
  };

  const retryLocationMap = () => {
    setLocationMapReady(false);
    setLocationMapError(null);
    setLocationMapNotice(null);
    setLocationMapKey((current) => current + 1);
  };

  const validateRequestForm = () => {
    const errors = {};
    const areaName = requestForm.area_name.trim();
    const barangay = requestForm.barangay.trim();
    const address = requestForm.address.trim();
    const details = requestForm.details.trim();

    if (!areaName) errors.area_name = 'Area / Purok is required.';
    else if (areaName.length > 255) errors.area_name = 'Area / Purok must be 255 characters or fewer.';
    if (barangay.length > 255) errors.barangay = 'Barangay must be 255 characters or fewer.';
    if (address.length > 255) errors.address = 'Address / Landmark must be 255 characters or fewer.';
    if (details.length > 2000) errors.details = 'Additional Details must be 2,000 characters or fewer.';

    setRequestFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const submitServiceAreaRequest = async () => {
    if (submissionInFlight.current || !validateRequestForm()) return;

    submissionInFlight.current = true;
    setSubmittingRequest(true);
    setRequestSubmitError(null);

    const payload = {
      area_name: requestForm.area_name.trim(),
      barangay: requestForm.barangay.trim() || null,
      address: requestForm.address.trim() || null,
      latitude: coordinate?.latitude ?? null,
      longitude: coordinate?.longitude ?? null,
      details: requestForm.details.trim() || null,
    };

    try {
      await api.post('/service-area-requests', payload);
      setRequestModalVisible(false);
      resetRequestForm();
      await loadLatestRequest();
      Alert.alert('Request submitted', 'Your service area request is now pending review.');
    } catch (error) {
      const errors = error.response?.data?.errors;
      if (errors) setRequestFormErrors(errors);
      setRequestSubmitError(messageFor(error, 'Unable to submit your request. Check your connection and try again.'));
    } finally {
      submissionInFlight.current = false;
      setSubmittingRequest(false);
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
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={refreshSettings} tintColor="#17843f" />}
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

        <Section title="Service Area">
          <Text style={styles.currentAreaLabel}>CURRENT SERVICE AREA</Text>
          <View style={styles.currentAreaRow}>
            <View style={styles.currentAreaIcon}>
              <FontAwesome5 name="map-marker-alt" size={16} color="#17843f" />
            </View>
            <View style={styles.currentAreaCopy}>
              <Text style={styles.currentAreaValue}>{officialServiceArea || 'Not assigned'}</Text>
              <Text style={styles.currentAreaHelp}>Your official service area assigned in Cleanify.</Text>
            </View>
          </View>

          {requestLoading ? (
            <View style={styles.requestStateRow}>
              <ActivityIndicator size="small" color="#17843f" />
              <Text style={styles.requestStateText}>Loading latest request...</Text>
            </View>
          ) : null}

          {!requestLoading && requestError ? (
            <View style={styles.requestErrorCard}>
              <Text style={styles.requestErrorText}>{requestError}</Text>
              <TouchableOpacity onPress={loadLatestRequest} style={styles.retryButton}>
                <Text style={styles.retryButtonText}>Retry</Text>
              </TouchableOpacity>
            </View>
          ) : null}

          {!requestLoading && !requestError && latestRequest ? (() => {
            const status = REQUEST_STATUS[latestRequest.status] ?? REQUEST_STATUS.pending;
            const zoneName = latestRequest.service_zone?.display_name || latestRequest.service_zone?.name;

            return (
              <View style={styles.requestCard}>
                <View style={styles.requestCardHeader}>
                  <Text style={styles.requestCardTitle}>Service Area Request</Text>
                  <View style={[styles.requestBadge, { backgroundColor: status.badge }]}>
                    <Text style={[styles.requestBadgeText, { color: status.text }]}>{status.label}</Text>
                  </View>
                </View>
                <Text style={styles.requestAreaLabel}>Area</Text>
                <Text style={styles.requestAreaValue}>{latestRequest.area_name}</Text>
                {latestRequest.status === 'pending' ? (
                  <Text style={styles.requestMessage}>Your request has been submitted and is waiting for review.</Text>
                ) : null}
                {latestRequest.status === 'approved' && zoneName ? (
                  <View style={styles.officialZoneBox}>
                    <Text style={styles.officialZoneLabel}>OFFICIAL SERVICE ZONE</Text>
                    <Text style={styles.officialZoneValue}>{zoneName}</Text>
                  </View>
                ) : null}
                {latestRequest.status === 'approved' && !zoneName ? (
                  <Text style={styles.requestMessage}>Your request was approved. Service Zone setup is still being completed.</Text>
                ) : null}
                {latestRequest.status === 'rejected' ? (
                  <Text style={styles.requestMessage}>This request was not approved. You can submit a new request with updated area details.</Text>
                ) : null}
              </View>
            );
          })() : null}

          <TouchableOpacity
            style={[styles.areaRequestButton, latestRequest?.status === 'pending' && styles.areaRequestButtonDisabled]}
            onPress={openRequestModal}
            disabled={requestLoading || latestRequest?.status === 'pending'}
            accessibilityRole="button"
            accessibilityState={{ disabled: requestLoading || latestRequest?.status === 'pending' }}
          >
            <View style={styles.areaRequestButtonIcon}>
              <FontAwesome5 name="map-marked-alt" size={15} color="#17843f" />
            </View>
            <View style={styles.areaRequestButtonCopy}>
              <Text style={styles.areaRequestButtonTitle}>{latestRequest?.status === 'pending' ? 'Request pending review' : 'My area is not listed'}</Text>
              <Text style={styles.areaRequestButtonText}>{latestRequest?.status === 'pending' ? 'You can submit again after this request is reviewed.' : 'Ask Cleanify to review service coverage for your area.'}</Text>
            </View>
            <FontAwesome5 name="chevron-right" size={12} color="#88928d" />
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

      <Modal
        visible={requestModalVisible}
        transparent
        animationType="slide"
        onRequestClose={closeRequestModal}
      >
        <KeyboardAvoidingView style={styles.modalRoot} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
          <View style={styles.modalSheet}>
            <View style={styles.modalHeader}>
              <View style={styles.modalHeaderCopy}>
                <Text style={styles.modalTitle}>Request a Service Area</Text>
                <Text style={styles.modalSubtitle}>Tell us which area needs Cleanify service coverage.</Text>
              </View>
              <TouchableOpacity
                style={styles.closeButton}
                onPress={closeRequestModal}
                disabled={submittingRequest}
                accessibilityLabel="Close request form"
              >
                <FontAwesome5 name="times" size={16} color="#4b5563" />
              </TouchableOpacity>
            </View>

            <ScrollView
              contentContainerStyle={styles.modalContent}
              keyboardShouldPersistTaps="handled"
              showsVerticalScrollIndicator={false}
            >
              <Text style={styles.label}>Area / Purok *</Text>
              <TextInput
                style={[styles.input, requestFormErrors.area_name && styles.inputError]}
                value={requestForm.area_name}
                onChangeText={(value) => updateRequestField('area_name', value)}
                placeholder="e.g. Sitio Riverside"
                maxLength={255}
              />
              <FieldError value={requestFormErrors.area_name} />

              <Text style={styles.label}>Barangay</Text>
              <TextInput
                style={[styles.input, requestFormErrors.barangay && styles.inputError]}
                value={requestForm.barangay}
                onChangeText={(value) => updateRequestField('barangay', value)}
                placeholder="Barangay name"
                maxLength={255}
              />
              <FieldError value={requestFormErrors.barangay} />

              <Text style={styles.label}>Address / Landmark</Text>
              <TextInput
                style={[styles.input, requestFormErrors.address && styles.inputError]}
                value={requestForm.address}
                onChangeText={(value) => updateRequestField('address', value)}
                placeholder="Street, landmark, or nearby place"
                maxLength={255}
              />
              <FieldError value={requestFormErrors.address} />

              <Text style={styles.label}>Location</Text>
              <View style={styles.locationActions}>
                <TouchableOpacity style={styles.locationButton} onPress={useMyLocation} disabled={gettingLocation}>
                  {gettingLocation ? <ActivityIndicator size="small" color="#17843f" /> : <FontAwesome5 name="crosshairs" size={14} color="#17843f" />}
                  <Text style={styles.locationButtonText}>{gettingLocation ? 'Getting location...' : 'Use My Current Location'}</Text>
                </TouchableOpacity>
                {!locationMapVisible ? (
                  <TouchableOpacity style={styles.locationButton} onPress={showLocationMap}>
                    <FontAwesome5 name="map" size={14} color="#17843f" />
                    <Text style={styles.locationButtonText}>Choose Location on Map</Text>
                  </TouchableOpacity>
                ) : null}
              </View>
              <Text style={styles.locationHelp}>Optional. Location access is requested only when you tap the button.</Text>
              {locationMessage ? <Text style={styles.locationMessage}>{locationMessage}</Text> : null}

              {locationMapVisible ? (
                <>
                  <View style={styles.locationMapFrame}>
                    <WebView
                      ref={locationMapRef}
                      key={locationMapKey}
                      style={styles.locationMap}
                      source={{ html: LOCATION_PICKER_HTML }}
                      originWhitelist={['*']}
                      javaScriptEnabled
                      domStorageEnabled
                      nestedScrollEnabled
                      onMessage={handleLocationMapMessage}
                      onError={() => {
                        setLocationMapReady(false);
                        setLocationMapError('The map could not load. You can still use GPS coordinates or submit without a location.');
                      }}
                    />
                    {!locationMapReady && !locationMapError ? (
                      <View style={styles.locationMapState} pointerEvents="none">
                        <ActivityIndicator color="#17843f" />
                        <Text style={styles.locationMapStateText}>Loading map...</Text>
                      </View>
                    ) : null}
                    {locationMapError ? (
                      <View style={styles.locationMapState}>
                        <Text style={styles.locationMapStateText}>{locationMapError}</Text>
                        <TouchableOpacity style={styles.mapRetryButton} onPress={retryLocationMap}>
                          <Text style={styles.mapRetryButtonText}>Retry Map</Text>
                        </TouchableOpacity>
                      </View>
                    ) : null}
                  </View>
                  <Text style={styles.mapInstruction}>Tap the map or drag the marker to adjust the location.</Text>
                  {locationMapNotice ? <Text style={styles.locationMapNotice}>{locationMapNotice}</Text> : null}
                </>
              ) : null}

              {coordinate ? (
                <View style={styles.selectedLocationCard}>
                  <View style={styles.selectedLocationHeader}>
                    <View style={styles.selectedLocationTitleRow}>
                      <FontAwesome5 name="map-marker-alt" size={14} color="#17843f" />
                      <Text style={styles.selectedLocationTitle}>Selected Location</Text>
                    </View>
                    <TouchableOpacity onPress={clearLocation} style={styles.clearLocationButton}>
                      <Text style={styles.clearLocationText}>Clear Location</Text>
                    </TouchableOpacity>
                  </View>
                  <Text style={styles.coordinateValue}>Latitude: {coordinate.latitude.toFixed(6)}</Text>
                  <Text style={styles.coordinateValue}>Longitude: {coordinate.longitude.toFixed(6)}</Text>
                </View>
              ) : locationMapVisible ? (
                <Text style={styles.noLocationSelected}>No location selected. Tap the map to place a marker.</Text>
              ) : null}

              <Text style={styles.label}>Additional Details</Text>
              <TextInput
                style={[styles.input, styles.detailsInput, requestFormErrors.details && styles.inputError]}
                value={requestForm.details}
                onChangeText={(value) => updateRequestField('details', value)}
                placeholder="Share any useful coverage details"
                multiline
                textAlignVertical="top"
                maxLength={2000}
              />
              <FieldError value={requestFormErrors.details} />
              <Text style={styles.characterCount}>{requestForm.details.length}/2000</Text>

              {requestSubmitError ? <Text style={styles.submitError}>{requestSubmitError}</Text> : null}

              <View style={styles.modalActions}>
                <TouchableOpacity style={styles.cancelButton} onPress={closeRequestModal} disabled={submittingRequest}>
                  <Text style={styles.cancelButtonText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.submitButton, submittingRequest && styles.submitButtonDisabled]}
                  onPress={submitServiceAreaRequest}
                  disabled={submittingRequest}
                >
                  {submittingRequest ? <ActivityIndicator size="small" color="#ffffff" /> : null}
                  <Text style={styles.submitButtonText}>{submittingRequest ? 'Submitting...' : 'Submit Request'}</Text>
                </TouchableOpacity>
              </View>
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
      </Modal>
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
  currentAreaLabel: { color: '#7b8580', fontSize: 10, fontWeight: '800', letterSpacing: 0.8, marginBottom: 8 },
  currentAreaRow: { flexDirection: 'row', alignItems: 'center', paddingBottom: 16, borderBottomWidth: 1, borderBottomColor: '#edf0ee' },
  currentAreaIcon: { width: 38, height: 38, borderRadius: 19, alignItems: 'center', justifyContent: 'center', backgroundColor: '#e7f6eb', marginRight: 11 },
  currentAreaCopy: { flex: 1 },
  currentAreaValue: { color: '#1f2937', fontSize: 15, fontWeight: '800' },
  currentAreaHelp: { color: '#7b8580', fontSize: 11, lineHeight: 16, marginTop: 2 },
  requestStateRow: { minHeight: 54, flexDirection: 'row', alignItems: 'center', gap: 9, marginTop: 12 },
  requestStateText: { color: '#7b8580', fontSize: 12 },
  requestErrorCard: { marginTop: 13, padding: 12, borderRadius: 10, backgroundColor: '#fff7ed', borderWidth: 1, borderColor: '#fed7aa' },
  requestErrorText: { color: '#9a3412', fontSize: 12, lineHeight: 17 },
  retryButton: { alignSelf: 'flex-start', marginTop: 8, paddingVertical: 5, paddingHorizontal: 9, borderRadius: 7, borderWidth: 1, borderColor: '#17843f' },
  retryButtonText: { color: '#17843f', fontSize: 11, fontWeight: '700' },
  requestCard: { marginTop: 14, padding: 13, borderRadius: 12, backgroundColor: '#f9fbfa', borderWidth: 1, borderColor: '#dde5e1' },
  requestCardHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8, marginBottom: 12 },
  requestCardTitle: { flex: 1, color: '#1f2937', fontSize: 14, fontWeight: '800' },
  requestBadge: { borderRadius: 14, paddingHorizontal: 9, paddingVertical: 5 },
  requestBadgeText: { fontSize: 10, fontWeight: '800' },
  requestAreaLabel: { color: '#8a9390', fontSize: 10, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.5 },
  requestAreaValue: { color: '#374151', fontSize: 14, fontWeight: '700', marginTop: 3 },
  requestMessage: { color: '#667085', fontSize: 12, lineHeight: 18, marginTop: 9 },
  officialZoneBox: { marginTop: 11, padding: 10, borderRadius: 9, backgroundColor: '#eaf7ed' },
  officialZoneLabel: { color: '#17843f', fontSize: 9, fontWeight: '800', letterSpacing: 0.7 },
  officialZoneValue: { color: '#166534', fontSize: 13, fontWeight: '700', marginTop: 3 },
  areaRequestButton: { minHeight: 62, flexDirection: 'row', alignItems: 'center', marginTop: 14, padding: 11, borderRadius: 12, borderWidth: 1, borderColor: '#cde5d3', backgroundColor: '#f3faf5' },
  areaRequestButtonDisabled: { opacity: 0.62, backgroundColor: '#f5f6f5', borderColor: '#e1e5e3' },
  areaRequestButtonIcon: { width: 34, height: 34, borderRadius: 17, alignItems: 'center', justifyContent: 'center', backgroundColor: '#ffffff', marginRight: 10 },
  areaRequestButtonCopy: { flex: 1, paddingRight: 8 },
  areaRequestButtonTitle: { color: '#176c38', fontSize: 13, fontWeight: '800' },
  areaRequestButtonText: { color: '#667085', fontSize: 10.5, lineHeight: 15, marginTop: 2 },
  modalRoot: { flex: 1, justifyContent: 'flex-end', paddingTop: 42, backgroundColor: 'rgba(17, 24, 39, 0.42)' },
  modalSheet: { maxHeight: '94%', backgroundColor: '#ffffff', borderTopLeftRadius: 22, borderTopRightRadius: 22, borderWidth: 1, borderBottomWidth: 0, borderColor: '#e5e9e7' },
  modalHeader: { flexDirection: 'row', alignItems: 'flex-start', paddingHorizontal: 18, paddingTop: 18, paddingBottom: 14, borderBottomWidth: 1, borderBottomColor: '#edf0ee' },
  modalHeaderCopy: { flex: 1, paddingRight: 12 },
  modalTitle: { color: '#111827', fontSize: 19, fontWeight: '800' },
  modalSubtitle: { color: '#7b8580', fontSize: 11.5, lineHeight: 17, marginTop: 4 },
  closeButton: { width: 38, height: 38, borderRadius: 19, alignItems: 'center', justifyContent: 'center', backgroundColor: '#f3f5f4' },
  modalContent: { padding: 18, paddingBottom: 30 },
  inputError: { borderColor: '#dc2626', marginBottom: 5 },
  fieldError: { color: '#b91c1c', fontSize: 11, lineHeight: 16, marginBottom: 11 },
  locationActions: { gap: 8 },
  locationButton: { minHeight: 46, flexDirection: 'row', gap: 9, alignItems: 'center', justifyContent: 'center', borderRadius: 10, borderWidth: 1, borderColor: '#b9d9c1', backgroundColor: '#f4fbf6' },
  locationButtonText: { color: '#17843f', fontSize: 13, fontWeight: '700' },
  locationHelp: { color: '#7b8580', fontSize: 10.5, lineHeight: 16, marginTop: 6, marginBottom: 13 },
  locationMessage: { color: '#9a3412', fontSize: 11, lineHeight: 16, marginTop: -7, marginBottom: 13 },
  locationMapFrame: { height: 238, borderRadius: 12, overflow: 'hidden', backgroundColor: '#e8eee9', borderWidth: 1, borderColor: '#dce4df' },
  locationMap: { flex: 1, backgroundColor: '#e8eee9' },
  locationMapState: { ...StyleSheet.absoluteFillObject, alignItems: 'center', justifyContent: 'center', gap: 8, paddingHorizontal: 22, backgroundColor: '#e8eee9' },
  locationMapStateText: { color: '#52665a', fontSize: 11.5, lineHeight: 17, textAlign: 'center' },
  mapRetryButton: { marginTop: 3, borderWidth: 1, borderColor: '#17843f', borderRadius: 8, paddingHorizontal: 13, paddingVertical: 7, backgroundColor: '#ffffff' },
  mapRetryButtonText: { color: '#17843f', fontSize: 11, fontWeight: '700' },
  mapInstruction: { color: '#667085', fontSize: 10.5, lineHeight: 15, marginTop: 6 },
  locationMapNotice: { color: '#9a3412', fontSize: 10.5, lineHeight: 15, marginTop: 4 },
  selectedLocationCard: { marginTop: 9, marginBottom: 14, padding: 11, borderRadius: 10, borderWidth: 1, borderColor: '#cde5d3', backgroundColor: '#f4fbf6' },
  selectedLocationHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8, marginBottom: 5 },
  selectedLocationTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 7 },
  selectedLocationTitle: { color: '#176c38', fontSize: 12, fontWeight: '800' },
  coordinateValue: { color: '#52665a', fontSize: 11.5, lineHeight: 18 },
  clearLocationButton: { minHeight: 32, justifyContent: 'center', paddingHorizontal: 8 },
  clearLocationText: { color: '#9a3412', fontSize: 11, fontWeight: '700' },
  noLocationSelected: { color: '#7b8580', fontSize: 10.5, lineHeight: 15, marginTop: 7, marginBottom: 14 },
  detailsInput: { minHeight: 104, paddingTop: 12 },
  characterCount: { alignSelf: 'flex-end', color: '#929b96', fontSize: 10, marginTop: -9, marginBottom: 12 },
  submitError: { color: '#b91c1c', fontSize: 12, lineHeight: 17, padding: 10, borderRadius: 9, backgroundColor: '#fef2f2', marginBottom: 3 },
  modalActions: { flexDirection: 'row', gap: 9, marginTop: 15 },
  cancelButton: { flex: 1, minHeight: 48, alignItems: 'center', justifyContent: 'center', borderRadius: 10, borderWidth: 1, borderColor: '#d1d5db', backgroundColor: '#ffffff' },
  cancelButtonText: { color: '#4b5563', fontSize: 14, fontWeight: '700' },
  submitButton: { flex: 1.5, minHeight: 48, flexDirection: 'row', gap: 8, alignItems: 'center', justifyContent: 'center', borderRadius: 10, backgroundColor: '#17843f' },
  submitButtonDisabled: { opacity: 0.65 },
  submitButtonText: { color: '#ffffff', fontSize: 14, fontWeight: '800' },
});
