import { useCallback, useState } from 'react';
import { useFocusEffect, useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import * as SecureStore from 'expo-secure-store';
import { Alert, BackHandler, KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';

import { api, AUTH_TOKEN_KEY } from '../src/api/client';

const firstError = (errors, field) => Array.isArray(errors?.[field]) ? errors[field][0] : null;

export default function SignupScreen() {
  const router = useRouter();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [passwordConfirmation, setPasswordConfirmation] = useState('');
  const [errors, setErrors] = useState({});
  const [message, setMessage] = useState(null);
  const [loading, setLoading] = useState(false);

  useFocusEffect(useCallback(() => {
    const subscription = BackHandler.addEventListener('hardwareBackPress', () => {
      router.replace('/login');
      return true;
    });
    return () => subscription.remove();
  }, [router]));

  const updateField = (field, setter) => (value) => {
    setter(value);
    setErrors((current) => ({ ...current, [field]: undefined }));
    setMessage(null);
  };

  const createAccount = async () => {
    if (loading) return;
    setLoading(true);
    setErrors({});
    setMessage(null);

    try {
      const { data } = await api.post('/auth/register', {
        name: name.trim(),
        email: email.trim().toLowerCase(),
        password,
        password_confirmation: passwordConfirmation,
      });

      if (!data.token) {
        Alert.alert('Account created', 'The server did not return a login token. Please sign in with your new account.');
        router.replace('/login');
        return;
      }

      try {
        await SecureStore.setItemAsync(AUTH_TOKEN_KEY, data.token);
      } catch {
        Alert.alert('Account created', 'Your account was created, but the login session could not be saved. Please sign in.');
        router.replace('/login');
        return;
      }
      router.replace('/tabs');
    } catch (error) {
      if (error.response?.status === 422) {
        setErrors(error.response.data?.errors ?? {});
        setMessage(error.response.data?.message || 'Please correct the highlighted fields.');
      } else if (!error.response) {
        setMessage('Unable to reach Cleanify. Check your connection and try again.');
      } else {
        setMessage('Unable to create your account right now. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <StatusBar style="dark" />
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <TouchableOpacity style={styles.backButton} onPress={() => router.replace('/login')} activeOpacity={0.7}>
          <Text style={styles.backIcon}>‹</Text>
        </TouchableOpacity>

        <View style={styles.header}>
          <View style={styles.logoBox}><Text style={styles.logoIcon}>♻</Text></View>
          <Text style={styles.brand}>Cleanify</Text>
          <Text style={styles.title}>Create account</Text>
          <Text style={styles.subtitle}>Join Cleanify and help keep your community clean.</Text>
        </View>

        <View style={styles.form}>
          <Text style={styles.label}>Full name</Text>
          <TextInput style={[styles.input, firstError(errors, 'name') && styles.inputError]} placeholder="Enter your full name" placeholderTextColor="#9ca3af" autoCapitalize="words" autoComplete="name" value={name} onChangeText={updateField('name', setName)} editable={!loading} />
          {firstError(errors, 'name') ? <Text style={styles.errorText}>{firstError(errors, 'name')}</Text> : null}

          <Text style={styles.label}>Email address</Text>
          <TextInput style={[styles.input, firstError(errors, 'email') && styles.inputError]} placeholder="Enter your email" placeholderTextColor="#9ca3af" keyboardType="email-address" autoCapitalize="none" autoCorrect={false} autoComplete="email" value={email} onChangeText={updateField('email', setEmail)} editable={!loading} />
          {firstError(errors, 'email') ? <Text style={styles.errorText}>{firstError(errors, 'email')}</Text> : null}

          <Text style={styles.label}>Password</Text>
          <TextInput style={[styles.input, firstError(errors, 'password') && styles.inputError]} placeholder="Create a password" placeholderTextColor="#9ca3af" secureTextEntry autoComplete="new-password" value={password} onChangeText={updateField('password', setPassword)} editable={!loading} />
          {firstError(errors, 'password') ? <Text style={styles.errorText}>{firstError(errors, 'password')}</Text> : null}

          <Text style={styles.label}>Confirm password</Text>
          <TextInput style={[styles.input, firstError(errors, 'password_confirmation') && styles.inputError]} placeholder="Repeat your password" placeholderTextColor="#9ca3af" secureTextEntry autoComplete="new-password" value={passwordConfirmation} onChangeText={updateField('password_confirmation', setPasswordConfirmation)} editable={!loading} onSubmitEditing={createAccount} />
          {firstError(errors, 'password_confirmation') ? <Text style={styles.errorText}>{firstError(errors, 'password_confirmation')}</Text> : null}

          {message ? <Text style={styles.formMessage}>{message}</Text> : null}

          <TouchableOpacity style={[styles.submitButton, loading && styles.disabled]} onPress={createAccount} disabled={loading}>
            <Text style={styles.submitText}>{loading ? 'Creating Account...' : 'Create Account'}</Text>
          </TouchableOpacity>

          <View style={styles.loginRow}>
            <Text style={styles.loginText}>Already have an account?</Text>
            <TouchableOpacity onPress={() => router.replace('/login')} disabled={loading}><Text style={styles.loginLink}>Sign In</Text></TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' }, content: { flexGrow: 1, paddingHorizontal: 24, paddingBottom: 38 },
  backButton: { marginTop: 58, width: 52, height: 52, borderRadius: 26, backgroundColor: '#f3f6f4', alignItems: 'center', justifyContent: 'center' }, backIcon: { fontSize: 42, lineHeight: 46, color: '#111827', marginTop: -3 },
  header: { marginTop: 26 }, logoBox: { width: 50, height: 50, borderRadius: 14, backgroundColor: '#ecf8ef', alignItems: 'center', justifyContent: 'center', marginBottom: 14 }, logoIcon: { fontSize: 26 }, brand: { fontSize: 24, fontWeight: '700', color: '#17843f', marginBottom: 25 },
  title: { fontSize: 32, fontWeight: '800', color: '#111827' }, subtitle: { marginTop: 8, fontSize: 15, lineHeight: 21, color: '#6b7280' }, form: { marginTop: 28 },
  label: { fontSize: 14, fontWeight: '600', color: '#374151', marginBottom: 8 }, input: { height: 54, borderWidth: 1, borderColor: '#d1d5db', borderRadius: 12, paddingHorizontal: 14, fontSize: 16, backgroundColor: '#fff', marginBottom: 16, color: '#111827' }, inputError: { borderColor: '#dc2626', marginBottom: 5 }, errorText: { color: '#b91c1c', fontSize: 12, marginBottom: 13 },
  formMessage: { color: '#b45309', fontSize: 13, lineHeight: 18, marginBottom: 12 }, submitButton: { height: 54, borderRadius: 12, backgroundColor: '#17843f', alignItems: 'center', justifyContent: 'center' }, disabled: { opacity: 0.6 }, submitText: { color: '#fff', fontSize: 16, fontWeight: '700' },
  loginRow: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', marginTop: 23, gap: 5 }, loginText: { fontSize: 14, color: '#6b7280' }, loginLink: { fontSize: 14, fontWeight: '700', color: '#17843f' },
});
