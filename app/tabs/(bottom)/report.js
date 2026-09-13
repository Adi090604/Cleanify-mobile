import { StyleSheet, Text, View } from 'react-native';

export default function ReportScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Report an Issue</Text>

      <Text style={styles.subtitle}>
        Create and submit a community report.
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