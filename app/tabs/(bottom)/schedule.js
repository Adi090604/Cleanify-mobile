import { useCallback, useState } from 'react';
import { useFocusEffect, useRouter } from 'expo-router';
import FontAwesome5 from '@expo/vector-icons/FontAwesome5';
import { StatusBar } from 'expo-status-bar';
import {
  ActivityIndicator,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

import { api, clearAuthToken } from '../../../src/api/client';

function PickupCard({ pickup }) {
  const date = new Date(pickup.collection_at);

  return (
    <View style={styles.pickupCard}>
      <View style={styles.dateBox}>
        <Text style={styles.dateDay}>{date.toLocaleDateString(undefined, { weekday: 'short' }).toUpperCase()}</Text>
        <Text style={styles.dateNumber}>{date.getDate()}</Text>
        <Text style={styles.dateMonth}>{date.toLocaleDateString(undefined, { month: 'short' }).toUpperCase()}</Text>
      </View>
      <View style={styles.pickupInfo}>
        <Text style={styles.pickupArea}>{pickup.area}</Text>
        <View style={styles.pickupMetaRow}>
          <FontAwesome5 name="clock" size={10} color="#77827c" />
          <Text style={styles.pickupDetail}>{pickup.time_range}</Text>
        </View>
        <View style={styles.pickupMetaRow}>
          <FontAwesome5 name="truck" size={10} color="#8a9390" />
          <Text style={styles.pickupTruck}>{pickup.truck}</Text>
        </View>
      </View>
    </View>
  );
}

export default function ScheduleScreen() {
  const router = useRouter();
  const [scheduleData, setScheduleData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);

  const loadSchedules = useCallback(async ({ refresh = false } = {}) => {
    if (refresh) setRefreshing(true);
    else setLoading(true);
    setError(null);

    try {
      const response = await api.get('/schedules');
      setScheduleData(response.data);
    } catch (requestError) {
      if (requestError.response?.status === 401) {
        await clearAuthToken();
        router.replace('/login');
        return;
      }

      setError('Unable to load your collection schedule.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [router]);

  useFocusEffect(
    useCallback(() => {
      loadSchedules();
    }, [loadSchedules])
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#17843f" />
      </View>
    );
  }

  const nextCollection = scheduleData?.upcoming_pickups?.[0] ?? null;
  const upcomingPickups = (scheduleData?.upcoming_pickups ?? []).filter((pickup) => (
    pickup.schedule_id !== nextCollection?.schedule_id
    || pickup.collection_at !== nextCollection?.collection_at
  ));
  const nextCollectionDate = nextCollection ? new Date(nextCollection.collection_at) : null;

  return (
    <View style={styles.container}>
      <StatusBar style="dark" />
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        refreshControl={(
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => loadSchedules({ refresh: true })}
            colors={['#17843f']}
            tintColor="#17843f"
          />
        )}
      >
        <View style={styles.header}>
          <Text style={styles.title}>Garbage Schedule</Text>
          <Text style={styles.subtitle}>Stay updated on collection days in your area.</Text>
        </View>

        {error ? (
          <View style={styles.stateCard}>
            <Text style={styles.stateText}>{error}</Text>
            <TouchableOpacity onPress={() => loadSchedules()}>
              <Text style={styles.retryText}>Try again</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <>
            <View style={styles.areaCard}>
              <View style={styles.areaIcon}>
                <FontAwesome5 name="map-marker-alt" size={15} color="#17843f" />
              </View>
              <View style={styles.areaInfo}>
                <Text style={styles.areaLabel}>Your Service Area</Text>
                <Text style={styles.areaName}>{scheduleData?.service_area ?? 'No service area selected'}</Text>
                <Text style={styles.areaHelp}>Schedules are based on your selected service area.</Text>
              </View>
            </View>

            {nextCollection ? (
              <View style={styles.nextCollectionCard}>
                <View style={styles.nextCollectionTopRow}>
                  <View style={styles.nextCollectionEyebrow}>
                    <FontAwesome5 name="calendar-alt" size={11} color="#17843f" />
                    <Text style={styles.nextCollectionLabel}>NEXT COLLECTION</Text>
                  </View>
                  <View style={styles.timeBadge}>
                    <Text style={styles.timeBadgeText}>{nextCollection.time_display}</Text>
                  </View>
                </View>

                <View style={styles.nextDateBlock}>
                  <Text style={styles.nextCollectionDay}>
                    {nextCollectionDate.toLocaleDateString(undefined, { weekday: 'long' })}
                  </Text>
                  <Text style={styles.nextCollectionDate}>{nextCollection.date_display}</Text>
                </View>

                <View style={styles.nextCollectionDetails}>
                  <View style={styles.featuredDetailRow}>
                    <View style={styles.detailIcon}><FontAwesome5 name="clock" size={12} color="#17843f" /></View>
                    <View style={styles.detailText}>
                      <Text style={styles.detailLabel}>Collection time</Text>
                      <Text style={styles.featuredDetailValue}>{nextCollection.time_range}</Text>
                    </View>
                  </View>
                  <View style={styles.detailDivider} />
                  <View style={styles.featuredDetailRow}>
                    <View style={styles.detailIcon}><FontAwesome5 name="map-marker-alt" size={12} color="#17843f" /></View>
                    <View style={styles.detailText}>
                      <Text style={styles.detailLabel}>Service area</Text>
                      <Text style={styles.detailValue}>{nextCollection.area}</Text>
                    </View>
                  </View>
                  <View style={styles.detailDivider} />
                  <View style={styles.featuredDetailRow}>
                    <View style={styles.detailIcon}><FontAwesome5 name="truck" size={12} color="#17843f" /></View>
                    <View style={styles.detailText}>
                      <Text style={styles.detailLabel}>Assigned truck</Text>
                      <Text style={styles.detailValue}>{nextCollection.truck}</Text>
                    </View>
                  </View>
                </View>
              </View>
            ) : (
              <View style={styles.stateCard}>
                <Text style={styles.stateTitle}>No upcoming collection scheduled.</Text>
              </View>
            )}

            {nextCollection ? (
              <>
                <View style={styles.sectionHeader}>
                  <Text style={styles.sectionTitle}>Upcoming Pickups</Text>
                  <Text style={styles.sectionSupport}>Later collection dates for your service area.</Text>
                </View>
                {upcomingPickups.length ? (
                  <View style={styles.upcomingList}>
                    {upcomingPickups.map((pickup) => (
                      <PickupCard key={`${pickup.schedule_id}-${pickup.collection_at}`} pickup={pickup} />
                    ))}
                  </View>
                ) : (
                  <View style={styles.stateCard}><Text style={styles.stateText}>No additional pickups scheduled.</Text></View>
                )}
              </>
            ) : null}
          </>
        )}

        <View style={styles.bottomSpace} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  loadingContainer: { flex: 1, backgroundColor: '#f6f8f7', justifyContent: 'center', alignItems: 'center' },
  container: { flex: 1, backgroundColor: '#f6f8f7' },
  scrollContent: { paddingHorizontal: 18, paddingTop: 28 },
  header: { marginBottom: 22 },
  title: { fontSize: 27, fontWeight: '800', color: '#111827' },
  subtitle: { marginTop: 5, fontSize: 13.5, lineHeight: 19, color: '#667085' },
  areaCard: { minHeight: 86, backgroundColor: '#ffffff', borderWidth: 1, borderColor: '#e2e8e4', borderRadius: 15, paddingHorizontal: 13, paddingVertical: 12, flexDirection: 'row', alignItems: 'center', marginBottom: 16 },
  areaIcon: { width: 38, height: 38, borderRadius: 11, backgroundColor: '#edf7f0', justifyContent: 'center', alignItems: 'center' },
  areaInfo: { flex: 1, minWidth: 0, marginLeft: 11 },
  areaLabel: { fontSize: 10.5, fontWeight: '700', letterSpacing: 0.5, textTransform: 'uppercase', color: '#75807a' },
  areaName: { marginTop: 3, fontSize: 14, lineHeight: 19, fontWeight: '700', color: '#18211c' },
  areaHelp: { marginTop: 2, fontSize: 10.5, lineHeight: 15, color: '#8a9390' },
  nextCollectionCard: { backgroundColor: '#eff9f2', borderWidth: 1, borderColor: '#cfe7d5', borderRadius: 18, padding: 16, marginBottom: 26, shadowColor: '#123d24', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 6, elevation: 2 },
  nextCollectionTopRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 10 },
  nextCollectionEyebrow: { flex: 1, minWidth: 0, flexDirection: 'row', alignItems: 'center', gap: 7 },
  nextCollectionLabel: { fontSize: 10.5, fontWeight: '800', letterSpacing: 0.7, color: '#3f6d4d' },
  nextDateBlock: { marginTop: 17, marginBottom: 16 },
  nextCollectionDay: { fontSize: 22, lineHeight: 27, fontWeight: '800', color: '#153a22' },
  nextCollectionDate: { marginTop: 1, fontSize: 16, lineHeight: 22, fontWeight: '700', color: '#46604e' },
  timeBadge: { maxWidth: '46%', flexShrink: 1, backgroundColor: '#ffffff', borderRadius: 18, borderWidth: 1, borderColor: '#d7eadc', paddingHorizontal: 10, paddingVertical: 6 },
  timeBadgeText: { fontSize: 11, lineHeight: 15, textAlign: 'center', fontWeight: '700', color: '#17843f' },
  nextCollectionDetails: { backgroundColor: '#ffffff', borderRadius: 14, borderWidth: 1, borderColor: '#dcebe0', paddingHorizontal: 12, paddingVertical: 5 },
  featuredDetailRow: { minHeight: 50, flexDirection: 'row', alignItems: 'center', paddingVertical: 7 },
  detailIcon: { width: 30, height: 30, borderRadius: 9, marginRight: 10, alignItems: 'center', justifyContent: 'center', backgroundColor: '#edf7f0' },
  detailText: { flex: 1, minWidth: 0 },
  detailLabel: { fontSize: 10.5, color: '#7b8580' },
  detailValue: { marginTop: 2, fontSize: 12.5, lineHeight: 17, fontWeight: '600', color: '#374151' },
  featuredDetailValue: { marginTop: 2, fontSize: 14, lineHeight: 19, fontWeight: '800', color: '#18211c' },
  detailDivider: { height: 1, marginLeft: 40, backgroundColor: '#edf1ee' },
  sectionHeader: { marginBottom: 12 },
  sectionTitle: { fontSize: 20, fontWeight: '800', color: '#111827' },
  sectionSupport: { marginTop: 3, fontSize: 11.5, lineHeight: 16, color: '#7b8580' },
  upcomingList: { gap: 9 },
  pickupCard: { minHeight: 82, backgroundColor: '#ffffff', borderWidth: 1, borderColor: '#e2e8e4', borderRadius: 15, paddingHorizontal: 12, paddingVertical: 10, flexDirection: 'row', alignItems: 'center' },
  dateBox: { width: 52, minHeight: 62, borderRadius: 12, backgroundColor: '#edf7f0', alignItems: 'center', justifyContent: 'center' },
  dateDay: { fontSize: 9, fontWeight: '800', color: '#17843f' },
  dateNumber: { fontSize: 20, lineHeight: 23, fontWeight: '800', color: '#18211c' },
  dateMonth: { fontSize: 9, fontWeight: '700', color: '#75807a' },
  pickupInfo: { flex: 1, minWidth: 0, marginLeft: 12 },
  pickupArea: { flexShrink: 1, fontSize: 13.5, lineHeight: 18, fontWeight: '700', color: '#18211c' },
  pickupMetaRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 4 },
  pickupDetail: { flex: 1, minWidth: 0, fontSize: 11.5, lineHeight: 15, color: '#667085' },
  pickupTruck: { flex: 1, minWidth: 0, fontSize: 11, lineHeight: 15, color: '#8a9390' },
  stateCard: { backgroundColor: '#ffffff', borderRadius: 16, borderWidth: 1, borderColor: '#e4e9e6', padding: 20, marginBottom: 28, alignItems: 'center' },
  stateTitle: { color: '#374151', fontSize: 15, fontWeight: '700', textAlign: 'center' },
  stateText: { color: '#667085', fontSize: 14, textAlign: 'center' },
  retryText: { marginTop: 12, color: '#17843f', fontWeight: '700' },
  bottomSpace: { height: 110 },
});
