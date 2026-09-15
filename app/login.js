import { useCallback, useState } from 'react';
import { useFocusEffect, useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import axios from 'axios';
import * as SecureStore from 'expo-secure-store';

import {
  Alert,
  BackHandler,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';

export default function LoginScreen() {
  const router = useRouter();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  useFocusEffect(
    useCallback(() => {
      const subscription = BackHandler.addEventListener('hardwareBackPress', () => {
        router.replace('/');
        return true;
      });

      return () => subscription.remove();
    }, [router])
  );

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert(
        'Missing information',
        'Please enter your email and password.'
      );
      return;
    }

    try {
      setLoading(true);

      const response = await axios.post(
        'http://192.168.1.5:8000/api/v1/auth/login',
        {
          email,
          password,
        },
        {
          headers: {
            Accept: 'application/json',
            'Content-Type': 'application/json',
          },
        }
      );

      const token = response.data.token;

      if (!token) {
        Alert.alert(
          'Login failed',
          'The server did not return an authentication token.'
        );
        return;
      }

      await SecureStore.setItemAsync('auth_token', token);

      router.replace('/tabs');
    } catch (error) {
      const message =
        error.response?.data?.message ||
        'Unable to sign in. Please check your credentials and connection.';

      Alert.alert('Login failed', message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar style="dark" />

      <TouchableOpacity
        style={styles.backButton}
        onPress={() => router.replace('/')}
        activeOpacity={0.7}
      >
        <Text style={styles.backIcon}>‹</Text>
      </TouchableOpacity>

      <View style={styles.header}>
        <View style={styles.logoBox}>
          <Text style={styles.logoIcon}>♻</Text>
        </View>

        <Text style={styles.brand}>Cleanify</Text>

        <Text style={styles.title}>Welcome back</Text>

        <Text style={styles.subtitle}>
          Sign in to continue.
        </Text>
      </View>

      <View style={styles.form}>
        <Text style={styles.label}>Email address</Text>

        <TextInput
          style={styles.input}
          placeholder="Enter your email"
          placeholderTextColor="#9ca3af"
          keyboardType="email-address"
          autoCapitalize="none"
          autoCorrect={false}
          value={email}
          onChangeText={setEmail}
        />

        <Text style={styles.label}>Password</Text>

        <TextInput
          style={styles.input}
          placeholder="Enter your password"
          placeholderTextColor="#9ca3af"
          secureTextEntry
          value={password}
          onChangeText={setPassword}
        />

        <TouchableOpacity
          style={styles.forgotButton}
          onPress={() => router.push('/forgot-password')}
          activeOpacity={0.7}
        >
          <Text style={styles.forgotText}>
            Forgot Password?
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.signInButton,
            loading && styles.signInButtonDisabled,
          ]}
          onPress={handleLogin}
          disabled={loading}
        >
          <Text style={styles.signInText}>
            {loading ? 'Signing in...' : 'Sign In'}
          </Text>
        </TouchableOpacity>

        <View style={styles.signupRow}>
          <Text style={styles.signupText}>
            Don't have an account?
          </Text>

          <TouchableOpacity
            onPress={() => router.push('/signup')}
          >
            <Text style={styles.signupLink}>
              Create Account
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
    paddingHorizontal: 24,
  },

  backButton: {
    marginTop: 58,
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: '#f3f6f4',
    alignItems: 'center',
    justifyContent: 'center',
  },

  backIcon: {
    fontSize: 42,
    lineHeight: 46,
    color: '#111827',
    marginTop: -3,
  },

  header: {
    marginTop: 36,
  },

  logoBox: {
    width: 50,
    height: 50,
    borderRadius: 14,
    backgroundColor: '#ecf8ef',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
  },

  logoIcon: {
    fontSize: 26,
  },

  brand: {
    fontSize: 24,
    fontWeight: '700',
    color: '#17843f',
    marginBottom: 34,
  },

  title: {
    fontSize: 32,
    fontWeight: '800',
    color: '#111827',
  },

  subtitle: {
    marginTop: 8,
    fontSize: 16,
    color: '#6b7280',
  },

  form: {
    marginTop: 34,
  },

  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
  },

  input: {
    height: 54,
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 12,
    paddingHorizontal: 14,
    fontSize: 16,
    backgroundColor: '#ffffff',
    marginBottom: 20,
  },

  forgotButton: {
    alignSelf: 'flex-end',
    marginTop: -4,
    marginBottom: 24,
  },

  forgotText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#17843f',
  },

  signInButton: {
    height: 54,
    borderRadius: 12,
    backgroundColor: '#17843f',
    alignItems: 'center',
    justifyContent: 'center',
  },

  signInButtonDisabled: {
    opacity: 0.6,
  },

  signInText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '700',
  },

  signupRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 24,
    gap: 5,
  },

  signupText: {
    fontSize: 14,
    color: '#6b7280',
  },

  signupLink: {
    fontSize: 14,
    fontWeight: '700',
    color: '#17843f',
  },
});
