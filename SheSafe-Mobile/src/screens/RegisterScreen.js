import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  KeyboardAvoidingView, Platform, ActivityIndicator,
  Alert, StatusBar, ScrollView
} from 'react-native';
import { API_BASE } from '../config';

export default function RegisterScreen({ navigation }) {
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleRegister() {
    if (!username.trim() || !email.trim() || !phone.trim() || !password || !confirmPassword) {
      Alert.alert('Error', 'Please fill in all fields.');
      return;
    }
    if (password !== confirmPassword) {
      Alert.alert('Error', 'Passwords do not match.');
      return;
    }
    setLoading(true);
    try {
      // 1. Fetch CSRF token
      const csrfResp = await fetch(`${API_BASE}/accounts/csrf/`, { credentials: 'include' });
      const csrfData = await csrfResp.json();
      const csrfToken = csrfData.csrfToken;

      // 2. Submit registration
      const resp = await fetch(`${API_BASE}/accounts/register/api/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-CSRFToken': csrfToken,
        },
        body: JSON.stringify({
          username: username.trim(),
          email: email.trim(),
          phone: phone.trim(),
          password,
          confirm_password: confirmPassword,
        }),
        credentials: 'include',
      });
      const data = await resp.json();
      if (data.success) {
        Alert.alert('Success', 'Account created! Please log in.', [
          { text: 'OK', onPress: () => navigation.navigate('Login') }
        ]);
      } else {
        Alert.alert('Registration Failed', data.message || 'Validation error.');
      }
    } catch (e) {
      Alert.alert('Error', 'Could not connect to server.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#7c3aed" />
      <ScrollView contentContainerStyle={styles.scroll}>
        <View style={styles.header}>
          <Text style={styles.appName}>SheSafe</Text>
          <Text style={styles.tagline}>Create your safety account</Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Register</Text>

          <TextInput
            style={styles.input}
            placeholder="Username (e.g. priya_12)"
            placeholderTextColor="#a39cae"
            value={username}
            onChangeText={setUsername}
            autoCapitalize="none"
          />
          <TextInput
            style={styles.input}
            placeholder="Email (e.g. priya@example.com)"
            placeholderTextColor="#a39cae"
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
          />
          <TextInput
            style={styles.input}
            placeholder="Phone Number (10 digits)"
            placeholderTextColor="#a39cae"
            value={phone}
            onChangeText={setPhone}
            keyboardType="phone-pad"
          />
          <TextInput
            style={styles.input}
            placeholder="Password (min 8 chars, 1 uppercase, 1 special)"
            placeholderTextColor="#a39cae"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
          />
          <TextInput
            style={styles.input}
            placeholder="Confirm Password"
            placeholderTextColor="#a39cae"
            value={confirmPassword}
            onChangeText={setConfirmPassword}
            secureTextEntry
          />

          <TouchableOpacity style={styles.registerBtn} onPress={handleRegister} disabled={loading}>
            {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.registerBtnText}>Create Account</Text>}
          </TouchableOpacity>

          <TouchableOpacity onPress={() => navigation.navigate('Login')}>
            <Text style={styles.switchText}>
              Already have an account? <Text style={styles.switchLink}>Login</Text>
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#7c3aed' },
  scroll: { flexGrow: 1, justifyContent: 'center', paddingVertical: 30 },
  header: { alignItems: 'center', marginBottom: 20 },
  appName: { fontSize: 32, fontWeight: '800', color: '#fff', letterSpacing: 1 },
  tagline: { fontSize: 14, color: 'rgba(255,255,255,0.75)', marginTop: 4 },
  card: {
    backgroundColor: '#fff', marginHorizontal: 24,
    borderRadius: 24, padding: 24,
    shadowColor: '#000', shadowOpacity: 0.15, shadowRadius: 20, elevation: 10,
  },
  cardTitle: { fontSize: 22, fontWeight: '700', color: '#1e1b2e', marginBottom: 18 },
  input: {
    borderWidth: 1.5, borderColor: '#e9e3f0', borderRadius: 12,
    paddingHorizontal: 14, paddingVertical: 11,
    fontSize: 14, color: '#1e1b2e', marginBottom: 12,
  },
  registerBtn: {
    backgroundColor: '#7c3aed', borderRadius: 14,
    paddingVertical: 14, alignItems: 'center', marginTop: 4, marginBottom: 16,
  },
  registerBtnText: { color: '#fff', fontSize: 16, fontWeight: '700' },
  switchText: { textAlign: 'center', color: '#6b7280', fontSize: 13 },
  switchLink: { color: '#7c3aed', fontWeight: '700' },
});
