import { useState } from 'react';
import {
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';

export default function ScheduleScreen() {
  const [remindersEnabled, setRemindersEnabled] = useState(true);

  const upcomingPickups = [
    {
      day: 'SUN',
      date: '13',
      month: 'SEP',
      area: 'Zone 31 - Barangay Mabua',
      time: '8:00 AM',
      truck: 'TRK-01-MABUA',
    },
    {
      day: 'SUN',
      date: '20',
      month: 'SEP',
      area: 'Zone 31 - Barangay Mabua',
      time: '8:00 AM',
      truck: 'TRK-01-MABUA',
    },
    {
      day: 'SUN',
      date: '27',
      month: 'SEP',
      area: 'Zone 31 - Barangay Mabua',
      time: '8:00 AM',
      truck: 'TRK-01-MABUA',
    },
  ];

  return (
    <View style={styles.container}>
      <StatusBar style="dark" />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>Garbage Schedule</Text>

          <Text style={styles.subtitle}>
            Stay updated with your area's collection schedule.
          </Text>
        </View>

        {/* Service Area */}
        <Text style={styles.sectionLabel}>YOUR SERVICE AREA</Text>

        <TouchableOpacity style={styles.areaCard}>
          <View style={styles.areaIcon}>
            <Text style={styles.areaIconText}>⌖</Text>
          </View>

          <View style={styles.areaInfo}>
            <Text style={styles.areaName}>
              Zone 31 - Barangay Mabua
            </Text>

            <Text style={styles.areaDescription}>
              Surigao City
            </Text>
          </View>

          <Text style={styles.changeText}>Change</Text>
        </TouchableOpacity>

        {/* Next Collection */}
        <Text style={styles.sectionLabel}>NEXT COLLECTION</Text>

        <View style={styles.nextCollectionCard}>
          <View style={styles.nextCollectionHeader}>
            <View>
              <Text style={styles.nextCollectionLabel}>
                Upcoming pickup
              </Text>

              <Text style={styles.nextCollectionDate}>
                Sunday, September 13
              </Text>
            </View>

            <View style={styles.timeBadge}>
              <Text style={styles.timeBadgeText}>8:00 AM</Text>
            </View>
          </View>

          <View style={styles.divider} />

          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Service Area</Text>
            <Text style={styles.detailValue}>
              Zone 31 - Barangay Mabua
            </Text>
          </View>

          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Truck</Text>
            <Text style={styles.detailValue}>
              TRK-01-MABUA
            </Text>
          </View>

          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Status</Text>

            <View style={styles.activeBadge}>
              <Text style={styles.activeBadgeText}>
                Active
              </Text>
            </View>
          </View>
        </View>

        {/* Reminder */}
        <View style={styles.reminderCard}>
          <View style={styles.reminderContent}>
            <View style={styles.reminderIcon}>
              <Text style={styles.reminderIconText}>!</Text>
            </View>

            <View style={styles.reminderTextContainer}>
              <Text style={styles.reminderTitle}>
                Collection Reminders
              </Text>

              <Text style={styles.reminderDescription}>
                Get notified before your scheduled pickup.
              </Text>
            </View>
          </View>

          <Switch
            value={remindersEnabled}
            onValueChange={setRemindersEnabled}
            trackColor={{
              false: '#d1d5db',
              true: '#9ad7ad',
            }}
            thumbColor={
              remindersEnabled ? '#17843f' : '#f4f4f5'
            }
          />
        </View>

        {/* Upcoming */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>
            Upcoming Pickups
          </Text>
        </View>

        <View style={styles.upcomingList}>
          {upcomingPickups.map((pickup, index) => (
            <View
              key={`${pickup.date}-${index}`}
              style={styles.pickupCard}
            >
              <View style={styles.dateBox}>
                <Text style={styles.dateDay}>
                  {pickup.day}
                </Text>

                <Text style={styles.dateNumber}>
                  {pickup.date}
                </Text>

                <Text style={styles.dateMonth}>
                  {pickup.month}
                </Text>
              </View>

              <View style={styles.pickupInfo}>
                <Text style={styles.pickupArea}>
                  {pickup.area}
                </Text>

                <Text style={styles.pickupDetail}>
                  {pickup.time}
                </Text>

                <Text style={styles.pickupTruck}>
                  {pickup.truck}
                </Text>
              </View>

              {index === 0 && (
                <View style={styles.nextBadge}>
                  <Text style={styles.nextBadgeText}>
                    Next
                  </Text>
                </View>
              )}
            </View>
          ))}
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
    marginBottom: 30,
  },

  title: {
    fontSize: 28,
    fontWeight: '800',
    color: '#111827',
  },

  subtitle: {
    marginTop: 7,
    fontSize: 14,
    lineHeight: 20,
    color: '#667085',
  },

  sectionLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: '#7b8580',
    letterSpacing: 0.7,
    marginBottom: 10,
  },

  areaCard: {
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#e4e9e6',
    borderRadius: 16,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 28,
  },

  areaIcon: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: '#ecf8ef',
    justifyContent: 'center',
    alignItems: 'center',
  },

  areaIconText: {
    fontSize: 23,
    color: '#17843f',
    fontWeight: '700',
  },

  areaInfo: {
    flex: 1,
    marginLeft: 12,
  },

  areaName: {
    fontSize: 15,
    fontWeight: '700',
    color: '#111827',
  },

  areaDescription: {
    marginTop: 3,
    fontSize: 13,
    color: '#7b8580',
  },

  changeText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#17843f',
  },

  nextCollectionCard: {
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#dfe6e2',
    borderRadius: 18,
    padding: 18,
    marginBottom: 16,
  },

  nextCollectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },

  nextCollectionLabel: {
    fontSize: 12,
    color: '#7b8580',
  },

  nextCollectionDate: {
    marginTop: 5,
    fontSize: 19,
    fontWeight: '800',
    color: '#111827',
  },

  timeBadge: {
    backgroundColor: '#ecf8ef',
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 7,
  },

  timeBadgeText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#17843f',
  },

  divider: {
    height: 1,
    backgroundColor: '#edf0ee',
    marginVertical: 17,
  },

  detailRow: {
    minHeight: 30,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },

  detailLabel: {
    fontSize: 13,
    color: '#7b8580',
  },

  detailValue: {
    flex: 1,
    marginLeft: 20,
    textAlign: 'right',
    fontSize: 13,
    fontWeight: '600',
    color: '#374151',
  },

  activeBadge: {
    backgroundColor: '#dcfce7',
    borderRadius: 20,
    paddingHorizontal: 9,
    paddingVertical: 4,
  },

  activeBadgeText: {
    color: '#15803d',
    fontSize: 11,
    fontWeight: '700',
  },

  reminderCard: {
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#e4e9e6',
    borderRadius: 16,
    padding: 16,
    marginBottom: 30,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },

  reminderContent: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 10,
  },

  reminderIcon: {
    width: 42,
    height: 42,
    borderRadius: 13,
    backgroundColor: '#ecf8ef',
    alignItems: 'center',
    justifyContent: 'center',
  },

  reminderIconText: {
    color: '#17843f',
    fontSize: 20,
    fontWeight: '800',
  },

  reminderTextContainer: {
    flex: 1,
    marginLeft: 12,
  },

  reminderTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#111827',
  },

  reminderDescription: {
    marginTop: 4,
    fontSize: 12,
    lineHeight: 17,
    color: '#7b8580',
  },

  sectionHeader: {
    marginBottom: 14,
  },

  sectionTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#111827',
  },

  upcomingList: {
    gap: 12,
  },

  pickupCard: {
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#e4e9e6',
    borderRadius: 16,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
  },

  dateBox: {
    width: 58,
    minHeight: 72,
    borderRadius: 13,
    backgroundColor: '#ecf8ef',
    alignItems: 'center',
    justifyContent: 'center',
  },

  dateDay: {
    fontSize: 10,
    fontWeight: '700',
    color: '#17843f',
  },

  dateNumber: {
    fontSize: 23,
    fontWeight: '800',
    color: '#111827',
  },

  dateMonth: {
    fontSize: 10,
    fontWeight: '700',
    color: '#7b8580',
  },

  pickupInfo: {
    flex: 1,
    marginLeft: 13,
  },

  pickupArea: {
    fontSize: 14,
    fontWeight: '700',
    color: '#111827',
  },

  pickupDetail: {
    marginTop: 5,
    fontSize: 13,
    color: '#667085',
  },

  pickupTruck: {
    marginTop: 3,
    fontSize: 12,
    color: '#8a9390',
  },

  nextBadge: {
    backgroundColor: '#17843f',
    borderRadius: 20,
    paddingHorizontal: 9,
    paddingVertical: 5,
  },

  nextBadgeText: {
    color: '#ffffff',
    fontSize: 10,
    fontWeight: '700',
  },

  bottomSpace: {
    height: 110,
  },
});