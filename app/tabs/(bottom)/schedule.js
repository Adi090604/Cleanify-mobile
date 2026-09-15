import { useCallback, useState } from 'react';
import { useFocusEffect, useRouter } from 'expo-router';
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
        <Text style={styles.pickupDetail}>{pickup.time_range}</Text>
        <Text style={styles.pickupTruck}>{pickup.truck}</Text>
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
          <Text style={styles.subtitle}>Stay updated with your area's collection schedule.</Text>
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
            <Text style={styles.sectionLabel}>YOUR SERVICE AREA</Text>
            <View style={styles.areaCard}>
              <View style={styles.areaIcon}><Text style={styles.areaIconText}>⌖</Text></View>
              <View style={styles.areaInfo}>
                <Text style={styles.areaName}>{scheduleData?.service_area ?? 'No service area selected'}</Text>
              </View>
            </View>

            <Text style={styles.sectionLabel}>NEXT COLLECTION</Text>
            {nextCollection ? (
              <View style={styles.nextCollectionCard}>
                <View style={styles.nextCollectionHeader}>
                  <View style={styles.nextCollectionText}>
                    <Text style={styles.nextCollectionLabel}>Upcoming pickup</Text>
                    <Text style={styles.nextCollectionDate}>{nextCollection.date_display}</Text>
                  </View>
                  <View style={styles.timeBadge}><Text style={styles.timeBadgeText}>{nextCollection.time_display}</Text></View>
                </View>
                <View style={styles.divider} />
                <View style={styles.detailRow}><Text style={styles.detailLabel}>Service Area</Text><Text style={styles.detailValue}>{nextCollection.area}</Text></View>
                <View style={styles.detailRow}><Text style={styles.detailLabel}>Time</Text><Text style={styles.detailValue}>{nextCollection.time_range}</Text></View>
                <View style={styles.detailRow}><Text style={styles.detailLabel}>Truck</Text><Text style={styles.detailValue}>{nextCollection.truck}</Text></View>
                <View style={styles.detailRow}><Text style={styles.detailLabel}>Status</Text><View style={styles.activeBadge}><Text style={styles.activeBadgeText}>Active</Text></View></View>
              </View>
            ) : (
              <View style={styles.stateCard}>
                <Text style={styles.stateTitle}>No upcoming collection scheduled.</Text>
              </View>
            )}

            {nextCollection ? (
              <>
                <View style={styles.sectionHeader}><Text style={styles.sectionTitle}>Upcoming Pickups</Text></View>
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
  scrollContent: { paddingHorizontal: 20, paddingTop: 58 },
  header: { marginBottom: 30 },
  title: { fontSize: 28, fontWeight: '800', color: '#111827' },
  subtitle: { marginTop: 7, fontSize: 14, lineHeight: 20, color: '#667085' },
  sectionLabel: { fontSize: 12, fontWeight: '700', color: '#7b8580', letterSpacing: 0.7, marginBottom: 10 },
  areaCard: { backgroundColor: '#ffffff', borderWidth: 1, borderColor: '#e4e9e6', borderRadius: 12, paddingHorizontal: 13, paddingVertical: 10, flexDirection: 'row', alignItems: 'center', marginBottom: 24 },
  areaIcon: { width: 34, height: 34, borderRadius: 10, backgroundColor: '#ecf8ef', justifyContent: 'center', alignItems: 'center' },
  areaIconText: { fontSize: 18, color: '#17843f', fontWeight: '700' },
  areaInfo: { flex: 1, marginLeft: 10 },
  areaName: { fontSize: 14, fontWeight: '700', color: '#111827' },
  nextCollectionCard: { backgroundColor: '#ffffff', borderWidth: 1, borderColor: '#dfe6e2', borderRadius: 18, padding: 18, marginBottom: 30 },
  nextCollectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  nextCollectionText: { flex: 1, paddingRight: 12 },
  nextCollectionLabel: { fontSize: 12, color: '#7b8580' },
  nextCollectionDate: { marginTop: 5, fontSize: 19, fontWeight: '800', color: '#111827' },
  timeBadge: { backgroundColor: '#ecf8ef', borderRadius: 20, paddingHorizontal: 12, paddingVertical: 7 },
  timeBadgeText: { fontSize: 13, fontWeight: '700', color: '#17843f' },
  divider: { height: 1, backgroundColor: '#edf0ee', marginVertical: 17 },
  detailRow: { minHeight: 30, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  detailLabel: { fontSize: 13, color: '#7b8580' },
  detailValue: { flex: 1, marginLeft: 20, textAlign: 'right', fontSize: 13, fontWeight: '600', color: '#374151' },
  activeBadge: { backgroundColor: '#dcfce7', borderRadius: 20, paddingHorizontal: 9, paddingVertical: 4 },
  activeBadgeText: { color: '#15803d', fontSize: 11, fontWeight: '700' },
  sectionHeader: { marginBottom: 14 },
  sectionTitle: { fontSize: 20, fontWeight: '800', color: '#111827' },
  upcomingList: { gap: 12 },
  pickupCard: { backgroundColor: '#ffffff', borderWidth: 1, borderColor: '#e4e9e6', borderRadius: 16, padding: 14, flexDirection: 'row', alignItems: 'center' },
  dateBox: { width: 58, minHeight: 72, borderRadius: 13, backgroundColor: '#ecf8ef', alignItems: 'center', justifyContent: 'center' },
  dateDay: { fontSize: 10, fontWeight: '700', color: '#17843f' },
  dateNumber: { fontSize: 23, fontWeight: '800', color: '#111827' },
  dateMonth: { fontSize: 10, fontWeight: '700', color: '#7b8580' },
  pickupInfo: { flex: 1, marginLeft: 13 },
  pickupArea: { fontSize: 14, fontWeight: '700', color: '#111827' },
  pickupDetail: { marginTop: 5, fontSize: 13, color: '#667085' },
  pickupTruck: { marginTop: 3, fontSize: 12, color: '#8a9390' },
  stateCard: { backgroundColor: '#ffffff', borderRadius: 16, borderWidth: 1, borderColor: '#e4e9e6', padding: 20, marginBottom: 28, alignItems: 'center' },
  stateTitle: { color: '#374151', fontSize: 15, fontWeight: '700', textAlign: 'center' },
  stateText: { color: '#667085', fontSize: 14, textAlign: 'center' },
  retryText: { marginTop: 12, color: '#17843f', fontWeight: '700' },
  bottomSpace: { height: 110 },
});
