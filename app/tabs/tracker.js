import { StyleSheet, Text, View } from 'react-native';

export default function TrackerScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Truck Tracker</Text>

      <Text style={styles.subtitle}>
        View active garbage trucks and their current location.
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f6f8f7',
    paddingTop: 60,
    paddingHorizontal: 20,
  },

  title: {
    fontSize: 28,
    fontWeight: '800',
    color: '#111827',
  },

  subtitle: {
    marginTop: 8,
    fontSize: 16,
    color: '#667085',
  },
});