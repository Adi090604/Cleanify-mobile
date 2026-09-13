import { useCallback } from 'react';
import { useFocusEffect, useRouter } from 'expo-router';
import {
  BackHandler,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

export default function SignupScreen() {
  const router = useRouter();

  useFocusEffect(
    useCallback(() => {
      const subscription = BackHandler.addEventListener('hardwareBackPress', () => {
        router.replace('/login');
        return true;
      });

      return () => subscription.remove();
    }, [router])
  );

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Create account</Text>

      <Text style={styles.text}>
        Cleanify sign-up screen will go here.
      </Text>

      <TouchableOpacity onPress={() => router.replace('/login')}>
        <Text style={styles.back}>Back</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 24,
    justifyContent: 'center',
    backgroundColor: '#ffffff',
  },

  title: {
    fontSize: 30,
    fontWeight: '700',
    color: '#111827',
  },

  text: {
    marginTop: 10,
    fontSize: 16,
    color: '#667085',
  },

  back: {
    marginTop: 30,
    color: '#17843f',
    fontSize: 16,
    fontWeight: '600',
  },
});
