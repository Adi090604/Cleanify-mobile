import { useState } from 'react';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';

import { api } from '../src/api/client';

export default function ForgotPasswordScreen() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [emailError, setEmailError] = useState('');
  const [requestError, setRequestError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [loading, setLoading] = useState(false);

  const returnToLogin = () => {
    if (router.canGoBack()) {
      router.back();
      return;
    }

    router.replace('/login');
  };

  const handleSubmit = async () => {
    const normalizedEmail = email.trim();

    setEmailError('');
    setRequestError('');

    if (!normalizedEmail) {
      setEmailError('The email field is required.');
      return;
    }

    try {
      setLoading(true);

      const response = await api.post('/auth/forgot-password', {
        email: normalizedEmail,
      });

      setSuccessMessage(response.data?.message || 'We have emailed your password reset link.');
    } catch (error) {
      const serverEmailError = error.response?.data?.errors?.email?.[0];

      if (serverEmailError) {
        setEmailError(serverEmailError);
      } else {
        setRequestError(
          error.response?.data?.message
          || 'Unable to send the reset link. Please check your connection and try again.'
        );
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <StatusBar style="dark" />
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <TouchableOpacity
          style={styles.backButton}
          onPress={returnToLogin}
          activeOpacity={0.7}
          accessibilityRole="button"
          accessibilityLabel="Back to login"
        >
          <Text style={styles.backIcon}>‹</Text>
        </TouchableOpacity>

        <View style={styles.header}>
          <View style={styles.logoBox}>
            <Text style={styles.logoIcon}>♻</Text>
          </View>
          <Text style={styles.brand}>Cleanify</Text>
          <Text style={styles.title}>Forgot password?</Text>
          <Text style={styles.subtitle}>
            Enter your email address and we'll send you a password reset link.
          </Text>
        </View>

        {successMessage ? (
          <View style={styles.successCard}>
            <Text style={styles.successTitle}>Check your email</Text>
            <Text style={styles.successText}>{successMessage}</Text>
            <Text style={styles.successHint}>
              Open the link in the email to reset your password, then return to Cleanify to sign in.
            </Text>
            <TouchableOpacity style={styles.primaryButton} onPress={returnToLogin} activeOpacity={0.8}>
              <Text style={styles.primaryButtonText}>Back to Login</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.form}>
            <Text style={styles.label}>Email address</Text>
            <TextInput
              style={[styles.input, emailError ? styles.inputError : null]}
              placeholder="Enter your email"
              placeholderTextColor="#9ca3af"
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
              autoComplete="email"
              value={email}
              onChangeText={(value) => {
                setEmail(value);
                if (emailError) setEmailError('');
                if (requestError) setRequestError('');
              }}
              onSubmitEditing={handleSubmit}
              editable={!loading}
              returnKeyType="send"
            />
            {emailError ? <Text style={styles.fieldError}>{emailError}</Text> : null}
            {requestError ? <Text style={styles.requestError}>{requestError}</Text> : null}

            <TouchableOpacity
              style={[styles.primaryButton, loading && styles.primaryButtonDisabled]}
              onPress={handleSubmit}
              disabled={loading}
              activeOpacity={0.8}
            >
              <Text style={styles.primaryButtonText}>
                {loading ? 'Sending...' : 'Send Reset Link'}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.loginLink} onPress={returnToLogin} activeOpacity={0.7}>
              <Text style={styles.loginLinkText}>Back to Login</Text>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 24,
    paddingBottom: 36,
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
    lineHeight: 23,
    color: '#6b7280',
  },
  form: {
    marginTop: 34,
  },
  label: {
    marginBottom: 8,
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
  },
  input: {
    height: 54,
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 12,
    paddingHorizontal: 14,
    fontSize: 16,
    color: '#111827',
    backgroundColor: '#ffffff',
  },
  inputError: {
    borderColor: '#dc2626',
  },
  fieldError: {
    marginTop: 7,
    fontSize: 13,
    color: '#dc2626',
  },
  requestError: {
    marginTop: 14,
    borderRadius: 10,
    backgroundColor: '#fef2f2',
    padding: 12,
    fontSize: 13,
    lineHeight: 19,
    color: '#b91c1c',
  },
  primaryButton: {
    height: 54,
    marginTop: 24,
    borderRadius: 12,
    backgroundColor: '#17843f',
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryButtonDisabled: {
    opacity: 0.6,
  },
  primaryButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '700',
  },
  loginLink: {
    alignSelf: 'center',
    marginTop: 22,
    padding: 6,
  },
  loginLinkText: {
    color: '#17843f',
    fontSize: 14,
    fontWeight: '700',
  },
  successCard: {
    marginTop: 34,
    borderWidth: 1,
    borderColor: '#cce8d4',
    borderRadius: 16,
    backgroundColor: '#f2faf4',
    padding: 20,
  },
  successTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#166534',
  },
  successText: {
    marginTop: 10,
    fontSize: 15,
    lineHeight: 22,
    color: '#285b38',
  },
  successHint: {
    marginTop: 8,
    fontSize: 14,
    lineHeight: 21,
    color: '#4b6353',
  },
});
