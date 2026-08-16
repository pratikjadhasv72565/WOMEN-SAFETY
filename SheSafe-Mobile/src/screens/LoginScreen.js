import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  KeyboardAvoidingView, Platform, ActivityIndicator,
  Alert, StatusBar
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_BASE } from '../config';

export default function LoginScreen({ navigation, onLogin }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleLogin() {
    if (!username.trim() || !password.trim()) {
      Alert.alert('Error', 'Please enter username and password.');
      return;
    }
    setLoading(true);
    try {
      // 1. Get CSRF token
      const csrfResp = await fetch(`${API_BASE}/accounts/csrf/`, { credentials: 'include' });
      const csrfData = await csrfResp.json();
      const csrfToken = csrfData.csrfToken;

      // 2. Login
      const resp = await fetch(`${API_BASE}/accounts/login/api/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-CSRFToken': csrfToken,
        },
        body: JSON.stringify({ username: username.trim(), password }),
        credentials: 'include',
      });
      const data = await resp.json();
      if (data.success) {
        await AsyncStorage.setItem('username', data.username || username);
        onLogin(data.username || username);
      } else {
        Alert.alert('Login Failed', data.message || 'Invalid credentials.');
      }
    } catch (e) {
      Alert.alert('Connection Error', `Could not reach ${API_BASE}. Make sure your Django server is running and accessible.`);
    } finally {
      setLoading(false);
    }
  }

  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#7c3aed" />

      <View style={styles.header}>
        <View style={styles.logoCircle}>
          <Text style={styles.logoIcon}>🛡️</Text>
        </View>
        <Text style={styles.appName}>SheSafe</Text>
        <Text style={styles.tagline}>Women Safety & Emergency SOS</Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Welcome Back</Text>

        <TextInput
          style={styles.input}
          placeholder="Username or Email"
          placeholderTextColor="#a39cae"
          value={username}
          onChangeText={setUsername}
          autoCapitalize="none"
          autoCorrect={false}
        />
        <TextInput
          style={styles.input}
          placeholder="Password"
          placeholderTextColor="#a39cae"
          value={password}
          onChangeText={setPassword}
          secureTextEntry
        />

        <TouchableOpacity style={styles.loginBtn} onPress={handleLogin} disabled={loading}>
          {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.loginBtnText}>Login</Text>}
        </TouchableOpacity>

        <TouchableOpacity onPress={() => navigation.navigate('Register')}>
          <Text style={styles.switchText}>
            Don't have an account? <Text style={styles.switchLink}>Register</Text>
          </Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#7c3aed', justifyContent: 'center' },
  header: { alignItems: 'center', marginBottom: 28 },
  logoCircle: {
    width: 84, height: 84, borderRadius: 42,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center', alignItems: 'center', marginBottom: 12,
  },
  logoIcon: { fontSize: 42 },
  appName: { fontSize: 34, fontWeight: '800', color: '#fff', letterSpacing: 1 },
  tagline: { fontSize: 13, color: 'rgba(255,255,255,0.8)', marginTop: 4 },
  card: {
    backgroundColor: '#fff', marginHorizontal: 24,
    borderRadius: 24, padding: 26,
    shadowColor: '#000', shadowOpacity: 0.15, shadowRadius: 20, elevation: 10,
  },
  cardTitle: { fontSize: 22, fontWeight: '700', color: '#1e1b2e', marginBottom: 18 },
  input: {
    borderWidth: 1.5, borderColor: '#e9e3f0', borderRadius: 12,
    paddingHorizontal: 16, paddingVertical: 12,
    fontSize: 15, color: '#1e1b2e', marginBottom: 14,
  },
  loginBtn: {
    backgroundColor: '#7c3aed', borderRadius: 14,
    paddingVertical: 14, alignItems: 'center', marginTop: 4, marginBottom: 16,
  },
  loginBtnText: { color: '#fff', fontSize: 16, fontWeight: '700' },
  switchText: { textAlign: 'center', color: '#6b7280', fontSize: 13 },
  switchLink: { color: '#7c3aed', fontWeight: '700' },
});
