import { StatusBar } from 'expo-status-bar';
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

export default function HomeScreen() {
  return (
    <View style={styles.container}>
      <StatusBar style="dark" />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.welcome}>
              Welcome back, Adrian 👋
            </Text>

            <Text style={styles.subtitle}>
              See the latest updates from your community.
            </Text>
          </View>

          <TouchableOpacity style={styles.notificationButton}>
            <Text style={styles.notificationIcon}>●</Text>
          </TouchableOpacity>
        </View>

        {/* Next Collection */}
        <Text style={styles.sectionLabel}>
          YOUR ZONE THIS WEEK
        </Text>

        <View style={styles.collectionCard}>
          <View style={styles.collectionTop}>
            <View>
              <Text style={styles.zoneTitle}>
                Zone 31 - Barangay Mabua
              </Text>

              <Text style={styles.collectionDate}>
                Sunday, September 13
              </Text>
            </View>

            <View style={styles.timeBadge}>
              <Text style={styles.timeText}>
                8:00 AM
              </Text>
            </View>
          </View>

          <View style={styles.divider} />

          <Text style={styles.truckLabel}>
            Collection Truck
          </Text>

          <Text style={styles.truckText}>
            TRK-01-MABUA · General
          </Text>
        </View>

        {/* Quick Actions */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>
            Quick Actions
          </Text>
        </View>

        <View style={styles.quickActions}>
          <TouchableOpacity style={styles.actionCard}>
            <View style={styles.actionIcon}>
              <Text style={styles.actionIconText}>!</Text>
            </View>

            <Text style={styles.actionTitle}>
              Report Issue
            </Text>

            <Text style={styles.actionDescription}>
              Report a community concern
            </Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.actionCard}>
            <View style={styles.actionIcon}>
              <Text style={styles.actionIconText}>✓</Text>
            </View>

            <Text style={styles.actionTitle}>
              Schedule
            </Text>

            <Text style={styles.actionDescription}>
              View collection dates
            </Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.actionCard}>
            <View style={styles.actionIcon}>
              <Text style={styles.actionIconText}>●</Text>
            </View>

            <Text style={styles.actionTitle}>
              Track Truck
            </Text>

            <Text style={styles.actionDescription}>
              View active trucks
            </Text>
          </TouchableOpacity>
        </View>

        {/* Community Reports */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>
            Community Reports
          </Text>

          <TouchableOpacity>
            <Text style={styles.viewAll}>
              View all
            </Text>
          </TouchableOpacity>
        </View>

        <View style={styles.reportCard}>
          <View style={styles.reportHeader}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>K</Text>
            </View>

            <View style={styles.reportUserInfo}>
              <Text style={styles.reportUser}>
                kayeloraine
              </Text>

              <Text style={styles.reportTime}>
                1 week ago
              </Text>
            </View>

            <View style={styles.resolvedBadge}>
              <Text style={styles.resolvedText}>
                Resolved
              </Text>
            </View>
          </View>

          <Text style={styles.reportDescription}>
            Community concern reported in the area.
          </Text>

          <View style={styles.reportImagePlaceholder}>
            <Text style={styles.imagePlaceholderText}>
              Report Image
            </Text>
          </View>
        </View>

        <View style={styles.reportCard}>
          <View style={styles.reportHeader}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>A</Text>
            </View>

            <View style={styles.reportUserInfo}>
              <Text style={styles.reportUser}>
                Adrian
              </Text>

              <Text style={styles.reportTime}>
                2 weeks ago
              </Text>
            </View>

            <View style={styles.pendingBadge}>
              <Text style={styles.pendingText}>
                Pending
              </Text>
            </View>
          </View>

          <Text style={styles.reportDescription}>
            Waste collection concern near Barangay Mabua.
          </Text>
        </View>

        <View style={styles.bottomSpace} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f6f8f7',
  },

  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 58,
  },

  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 32,
  },

  welcome: {
    fontSize: 25,
    fontWeight: '800',
    color: '#111827',
  },

  subtitle: {
    marginTop: 6,
    fontSize: 14,
    color: '#667085',
  },

  notificationButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#ffffff',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e7ebe8',
  },

  notificationIcon: {
    color: '#18a34a',
    fontSize: 18,
  },

  sectionLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: '#7b8580',
    marginBottom: 10,
    letterSpacing: 0.7,
  },

  collectionCard: {
    backgroundColor: '#ffffff',
    borderRadius: 18,
    padding: 18,
    borderWidth: 1,
    borderColor: '#e4e9e6',
    marginBottom: 30,
  },

  collectionTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },

  zoneTitle: {
    fontSize: 19,
    fontWeight: '800',
    color: '#111827',
    maxWidth: 240,
  },

  collectionDate: {
    marginTop: 7,
    fontSize: 14,
    color: '#667085',
  },

  timeBadge: {
    backgroundColor: '#ecf8ef',
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 7,
  },

  timeText: {
    color: '#17843f',
    fontSize: 13,
    fontWeight: '700',
  },

  divider: {
    height: 1,
    backgroundColor: '#edf0ee',
    marginVertical: 16,
  },

  truckLabel: {
    fontSize: 12,
    color: '#7b8580',
    marginBottom: 4,
  },

  truckText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#374151',
  },

  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },

  sectionTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#111827',
  },

  viewAll: {
    color: '#17843f',
    fontSize: 14,
    fontWeight: '700',
  },

  quickActions: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 32,
  },

  actionCard: {
    flex: 1,
    backgroundColor: '#ffffff',
    borderRadius: 16,
    paddingVertical: 18,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: '#e5e9e7',
  },

  actionIcon: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: '#ecf8ef',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },

  actionIconText: {
    color: '#17843f',
    fontSize: 20,
    fontWeight: '800',
  },

  actionTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#111827',
  },

  actionDescription: {
    marginTop: 5,
    fontSize: 11,
    lineHeight: 15,
    color: '#7b8580',
  },

  reportCard: {
    backgroundColor: '#ffffff',
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    borderColor: '#e5e9e7',
    marginBottom: 14,
  },

  reportHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },

  avatar: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: '#2d6aec',
    justifyContent: 'center',
    alignItems: 'center',
  },

  avatarText: {
    color: '#ffffff',
    fontWeight: '800',
    fontSize: 17,
  },

  reportUserInfo: {
    flex: 1,
    marginLeft: 12,
  },

  reportUser: {
    fontSize: 15,
    fontWeight: '700',
    color: '#111827',
  },

  reportTime: {
    marginTop: 3,
    fontSize: 12,
    color: '#8a9390',
  },

  resolvedBadge: {
    backgroundColor: '#dcfce7',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 20,
  },

  resolvedText: {
    color: '#15803d',
    fontSize: 11,
    fontWeight: '700',
  },

  pendingBadge: {
    backgroundColor: '#fff4d6',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 20,
  },

  pendingText: {
    color: '#c47a00',
    fontSize: 11,
    fontWeight: '700',
  },

  reportDescription: {
    marginTop: 16,
    fontSize: 14,
    lineHeight: 21,
    color: '#374151',
  },

  reportImagePlaceholder: {
    height: 170,
    backgroundColor: '#edf1ef',
    borderRadius: 14,
    marginTop: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },

  imagePlaceholderText: {
    color: '#98a19d',
    fontSize: 14,
  },

  bottomSpace: {
    height: 40,
  },
});