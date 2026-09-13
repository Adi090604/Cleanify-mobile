import { useCallback, useState } from 'react';
import FontAwesome5 from '@expo/vector-icons/FontAwesome5';
import { useFocusEffect, useRouter } from 'expo-router';
import { ActivityIndicator, Alert, RefreshControl, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

import { api, clearAuthToken } from '../../src/api/client';

const ICONS = { schedule: 'calendar-alt', tracker: 'truck', reports: 'comments', community: 'users', system: 'bell' };

export default function NotificationsScreen() {
  const router = useRouter();
  const [notifications, setNotifications] = useState([]);
  const [categories, setCategories] = useState([]);
  const [filter, setFilter] = useState('all');
  const [category, setCategory] = useState('all');
  const [unreadCount, setUnreadCount] = useState(0);
  const [page, setPage] = useState(1);
  const [lastPage, setLastPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState(null);

  const loadNotifications = useCallback(async ({ refresh = false, nextPage = 1 } = {}) => {
    if (refresh) setRefreshing(true);
    else if (nextPage > 1) setLoadingMore(true);
    else setLoading(true);
    setError(null);
    try {
      const { data } = await api.get('/notifications', { params: { filter, category, page: nextPage } });
      setNotifications((current) => nextPage === 1 ? data.notifications : [...current, ...data.notifications]);
      setCategories(data.categories ?? []);
      setUnreadCount(data.unread_count ?? 0);
      setPage(data.meta?.current_page ?? nextPage);
      setLastPage(data.meta?.last_page ?? nextPage);
    } catch (requestError) {
      if (requestError.response?.status === 401) {
        await clearAuthToken();
        router.replace('/login');
      } else setError('Unable to load notifications. Pull down to try again.');
    } finally {
      setLoading(false);
      setRefreshing(false);
      setLoadingMore(false);
    }
  }, [category, filter, router]);

  useFocusEffect(useCallback(() => { loadNotifications(); }, [loadNotifications]));

  const openNotification = async (notification) => {
    if (!notification.is_read) await api.post('/notifications/' + notification.id + '/read');
    if (notification.action_route) router.navigate(notification.action_route);
    else await loadNotifications({ refresh: true });
  };

  const markAllRead = async () => {
    await api.post('/notifications/mark-all-read');
    await loadNotifications({ refresh: true });
  };

  const dismiss = (notification) => Alert.alert('Dismiss notification?', 'This removes it from your notification inbox.', [
    { text: 'Cancel', style: 'cancel' },
    { text: 'Dismiss', style: 'destructive', onPress: async () => {
      await api.delete('/notifications/' + notification.id);
      await loadNotifications({ refresh: true });
    } },
  ]);

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => loadNotifications({ refresh: true })} colors={['#17843f']} />}>
      <View style={styles.heading}>
        <View><Text style={styles.title}>Notifications</Text><Text style={styles.subtitle}>Schedule updates, report statuses, and reminders.</Text></View>
        {unreadCount ? <View style={styles.unreadBadge}><Text style={styles.unreadBadgeText}>{unreadCount}</Text></View> : null}
      </View>
      <View style={styles.toolbar}>
        <View style={styles.filterRow}>
          {['all', 'unread'].map((value) => <TouchableOpacity key={value} style={[styles.filterChip, filter === value && styles.filterChipActive]} onPress={() => setFilter(value)}><Text style={[styles.filterText, filter === value && styles.filterTextActive]}>{value === 'all' ? 'All' : 'Unread'}</Text></TouchableOpacity>)}
          <TouchableOpacity style={[styles.markAll, !unreadCount && styles.disabled]} disabled={!unreadCount} onPress={markAllRead}><Text style={styles.markAllText}>Mark all read</Text></TouchableOpacity>
        </View>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.categories}>
          {[{ key: 'all', label: 'All categories' }, ...categories].map((item) => <TouchableOpacity key={item.key} style={[styles.categoryChip, category === item.key && styles.categoryChipActive]} onPress={() => setCategory(item.key)}><Text style={[styles.categoryText, category === item.key && styles.categoryTextActive]}>{item.label}</Text></TouchableOpacity>)}
        </ScrollView>
      </View>
      {loading ? <ActivityIndicator color="#17843f" size="large" /> : null}
      {error ? <View style={styles.state}><Text style={styles.stateText}>{error}</Text></View> : null}
      {!loading && !error && notifications.length === 0 ? <View style={styles.state}><FontAwesome5 name="inbox" size={34} color="#c6ceca" /><Text style={styles.emptyTitle}>You’re all caught up</Text><Text style={styles.stateText}>No notifications right now.</Text></View> : null}
      {notifications.map((notification) => (
        <View key={notification.id} style={[styles.card, !notification.is_read && styles.unreadCard]}>
          <View style={styles.cardRow}>
            <View style={styles.icon}><FontAwesome5 name={ICONS[notification.category] ?? 'bell'} size={17} color="#17843f" /></View>
            <View style={styles.cardBody}>
              <View style={styles.titleRow}><Text style={styles.cardTitle}>{notification.title}</Text>{!notification.is_read ? <View style={styles.dot} /> : null}</View>
              <Text style={styles.message}>{notification.message}</Text>
              <Text style={styles.time}>{notification.created_at_human}</Text>
            </View>
          </View>
          <View style={styles.actions}>
            <TouchableOpacity style={styles.action} onPress={() => openNotification(notification)}><Text style={styles.actionText}>{notification.action_route ? 'View' : notification.is_read ? 'Read' : 'Mark read'}</Text></TouchableOpacity>
            <TouchableOpacity style={styles.action} onPress={() => dismiss(notification)}><Text style={styles.dismissText}>Dismiss</Text></TouchableOpacity>
          </View>
        </View>
      ))}
      {page < lastPage ? <TouchableOpacity style={styles.more} disabled={loadingMore} onPress={() => loadNotifications({ nextPage: page + 1 })}><Text style={styles.moreText}>{loadingMore ? 'Loading...' : 'Load more'}</Text></TouchableOpacity> : null}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f6f8f7' }, content: { paddingHorizontal: 18, paddingTop: 24, paddingBottom: 80 },
  heading: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 18 }, title: { fontSize: 28, fontWeight: '800', color: '#111827' }, subtitle: { color: '#667085', fontSize: 13, marginTop: 5, maxWidth: 260 },
  unreadBadge: { minWidth: 30, height: 30, borderRadius: 15, paddingHorizontal: 8, alignItems: 'center', justifyContent: 'center', backgroundColor: '#fee2e2' }, unreadBadgeText: { color: '#b91c1c', fontWeight: '800' },
  toolbar: { backgroundColor: '#fff', borderWidth: 1, borderColor: '#e5e9e7', borderRadius: 15, padding: 12, marginBottom: 15 }, filterRow: { flexDirection: 'row', alignItems: 'center', gap: 7 }, filterChip: { paddingHorizontal: 13, paddingVertical: 7, borderRadius: 16 }, filterChipActive: { backgroundColor: '#e7f6eb' }, filterText: { color: '#667085', fontSize: 13 }, filterTextActive: { color: '#17843f', fontWeight: '700' },
  markAll: { marginLeft: 'auto', padding: 7 }, markAllText: { color: '#17843f', fontSize: 12, fontWeight: '700' }, disabled: { opacity: 0.4 }, categories: { gap: 7, paddingTop: 10 }, categoryChip: { borderWidth: 1, borderColor: '#e1e5e3', borderRadius: 15, paddingHorizontal: 11, paddingVertical: 6 }, categoryChipActive: { borderColor: '#17843f' }, categoryText: { color: '#667085', fontSize: 11 }, categoryTextActive: { color: '#17843f', fontWeight: '700' },
  card: { backgroundColor: '#fff', borderWidth: 1, borderColor: '#e5e9e7', borderRadius: 15, padding: 14, marginBottom: 11 }, unreadCard: { backgroundColor: '#f0faf2', borderColor: '#cce8d3' }, cardRow: { flexDirection: 'row' }, icon: { width: 38, height: 38, borderRadius: 19, backgroundColor: '#e7f6eb', alignItems: 'center', justifyContent: 'center', marginRight: 11 }, cardBody: { flex: 1 }, titleRow: { flexDirection: 'row', alignItems: 'center' }, cardTitle: { flex: 1, color: '#1f2937', fontSize: 14, fontWeight: '700' }, dot: { width: 7, height: 7, borderRadius: 4, backgroundColor: '#17843f', marginLeft: 8 }, message: { color: '#59635e', fontSize: 13, lineHeight: 19, marginTop: 4 }, time: { color: '#929b96', fontSize: 11, marginTop: 7 },
  actions: { flexDirection: 'row', justifyContent: 'flex-end', gap: 9, marginTop: 11 }, action: { borderWidth: 1, borderColor: '#dce2df', borderRadius: 8, paddingHorizontal: 12, paddingVertical: 7 }, actionText: { color: '#17843f', fontSize: 11, fontWeight: '700' }, dismissText: { color: '#9b3b3b', fontSize: 11, fontWeight: '700' },
  state: { backgroundColor: '#fff', borderRadius: 15, padding: 28, alignItems: 'center', gap: 7 }, emptyTitle: { color: '#374151', fontSize: 15, fontWeight: '700', marginTop: 3 }, stateText: { color: '#7b8580', fontSize: 13, textAlign: 'center' }, more: { minHeight: 44, alignItems: 'center', justifyContent: 'center' }, moreText: { color: '#17843f', fontWeight: '700' },
});
