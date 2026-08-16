import React, { useState, useEffect, useRef } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, ScrollView,
  Alert, StatusBar, Animated, Linking, Vibration, RefreshControl
} from 'react-native';
import * as Location from 'expo-location';
import * as SMS from 'expo-sms';
import { API_BASE } from '../config';

export default function HomeScreen({ username, onLogout }) {
  const [primaryContact, setPrimaryContact] = useState(null);
  const [sosStatus, setSosStatus] = useState('');
  const [sosActive, setSosActive] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const pulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    loadPrimaryContact();
    startPulse();
  }, []);

  function startPulse() {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 1.08, duration: 800, useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 1, duration: 800, useNativeDriver: true }),
      ])
    ).start();
  }

  async function loadPrimaryContact() {
    try {
      const resp = await fetch(`${API_BASE}/contacts/data/`, {
        credentials: 'include',
        headers: { 'X-Requested-With': 'XMLHttpRequest' },
      });
      const data = await resp.json();
      if (data.success && data.contacts) {
        const primary = data.contacts.find(c => c.is_primary) || data.contacts[0];
        setPrimaryContact(primary || null);
      }
    } catch (e) {
      console.log('Error loading contacts:', e);
    }
  }

  async function onRefresh() {
    setRefreshing(true);
    await loadPrimaryContact();
    setRefreshing(false);
  }

  async function handleSOS() {
    if (!primaryContact) {
      Alert.alert(
        '⚠️ No Primary Contact',
        'Please add a trusted contact first in the Contacts tab.',
        [{ text: 'OK' }]
      );
      return;
    }

    setSosActive(true);
    Vibration.vibrate([0, 500, 200, 500]);
    setSosStatus('🚨 Activating Emergency SOS...');

    // 1. Immediately initiate Phone Call to Primary Contact
    const cleanPhone = primaryContact.phone.replace(/[\s\-\(\)]/g, '');
    Linking.openURL(`tel:${cleanPhone}`);

    // 2. Request GPS Location in background and compose emergency SMS
    setSosStatus('📍 Fetching live GPS location...');
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      let mapUrl = '';
      let lat = null;
      let lng = null;

      if (status === 'granted') {
        const loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.High });
        lat = loc.coords.latitude;
        lng = loc.coords.longitude;
        mapUrl = `https://maps.google.com/?q=${lat},${lng}`;
        setSosStatus('📍 GPS coordinates captured! Sending SMS...');
      } else {
        setSosStatus('📵 Location permission not granted. Sending alert SMS...');
      }

      // 3. Auto-send SMS to Primary Contact
      const smsAvailable = await SMS.isAvailableAsync();
      if (smsAvailable) {
        const emergencyMsg = mapUrl
          ? `🚨 EMERGENCY SOS 🚨\nHi ${primaryContact.name}, ${username} is in DANGER and needs your IMMEDIATE help!\n\n📍 LIVE LOCATION:\n${mapUrl}\n\nPlease call ${username} right now!\n\n-- Sent via SheSafe`
          : `🚨 EMERGENCY SOS 🚨\nHi ${primaryContact.name}, ${username} is in DANGER and needs your IMMEDIATE help!\n\nPlease call ${username} RIGHT NOW!\n\n-- Sent via SheSafe`;

        await SMS.sendSMSAsync([cleanPhone], emergencyMsg);
        setSosStatus('✅ Emergency SMS dispatched to ' + primaryContact.name);
      } else {
        // Fallback to sms: URI if expo-sms is not directly supported
        const bodyText = encodeURIComponent(
          mapUrl
            ? `🚨 EMERGENCY SOS 🚨\nHi ${primaryContact.name}, ${username} is in DANGER! Live Location: ${mapUrl}`
            : `🚨 EMERGENCY SOS 🚨\nHi ${primaryContact.name}, ${username} is in DANGER!`
        );
        Linking.openURL(`sms:${cleanPhone}?body=${bodyText}`);
      }

      // 4. Log alert to backend server
      logSOSToBackend(lat, lng);

    } catch (e) {
      setSosStatus('⚠️ Alert initiated. Check SMS & dialer.');
    }
  }

  async function logSOSToBackend(lat, lng) {
    try {
      const form = new FormData();
      if (lat !== null && lng !== null) {
        form.append('latitude', lat);
        form.append('longitude', lng);
      }
      await fetch(`${API_BASE}/contacts/sos/`, {
        method: 'POST',
        headers: { 'X-Requested-With': 'XMLHttpRequest' },
        body: form,
        credentials: 'include',
      });
    } catch (_) {}
  }

  function cancelSOS() {
    setSosActive(false);
    setSosStatus('');
    Vibration.cancel();
  }

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
    >
      <StatusBar barStyle="light-content" backgroundColor="#7c3aed" />

      {/* Top Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.greeting}>Hello, {username} 👋</Text>
          <Text style={styles.subGreeting}>SheSafe Protection Active</Text>
        </View>
        <TouchableOpacity onPress={onLogout} style={styles.logoutBtn}>
          <Text style={styles.logoutText}>Logout</Text>
        </TouchableOpacity>
      </View>

      {/* Primary Contact Card */}
      {primaryContact ? (
        <View style={styles.contactCard}>
          <View style={styles.contactAvatarCircle}>
            <Text style={styles.contactAvatarText}>{primaryContact.name[0].toUpperCase()}</Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.contactLabel}>Primary Contact</Text>
            <Text style={styles.contactName}>{primaryContact.name}</Text>
            <Text style={styles.contactPhone}>{primaryContact.phone}</Text>
          </View>
          <TouchableOpacity
            onPress={() => Linking.openURL(`tel:${primaryContact.phone.replace(/[\s\-\(\)]/g, '')}`)}
            style={styles.callChip}>
            <Text style={styles.callChipText}>📞 Direct Call</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <View style={styles.noContactCard}>
          <Text style={styles.noContactText}>⚠️ No Primary Contact Configured</Text>
          <Text style={styles.noContactSub}>Swipe to Contacts tab to add your guardian for instant SOS.</Text>
        </View>
      )}

      {/* SOS Button Section */}
      <View style={styles.sosSection}>
        <Text style={styles.sosLabel}>🚨 ONE-TAP EMERGENCY SOS</Text>
        <Animated.View style={[styles.sosRing, { transform: [{ scale: pulseAnim }] }]}>
          <TouchableOpacity
            style={styles.sosBtn}
            onPress={handleSOS}
            activeOpacity={0.85}>
            <Text style={styles.sosBtnText}>SOS</Text>
            <Text style={styles.sosBtnSub}>TAP TO ALERT</Text>
          </TouchableOpacity>
        </Animated.View>

        {sosStatus ? (
          <View style={styles.statusBox}>
            <Text style={styles.statusText}>{sosStatus}</Text>
            {sosActive && (
              <TouchableOpacity onPress={cancelSOS} style={{ marginTop: 8 }}>
                <Text style={styles.cancelText}>Dismiss Status</Text>
              </TouchableOpacity>
            )}
          </View>
        ) : (
          <Text style={styles.sosHelpText}>
            Calls & sends SMS with live GPS location directly to your guardian.
          </Text>
        )}
      </View>

      {/* Emergency Quick Hotlines */}
      <View style={styles.quickSection}>
        <Text style={styles.quickSectionTitle}>National Emergency Helplines</Text>
        <View style={styles.quickRow}>
          <TouchableOpacity style={styles.quickCard} onPress={() => Linking.openURL('tel:112')}>
            <Text style={styles.quickIcon}>🚨</Text>
            <Text style={styles.quickLabel}>National Emergency</Text>
            <Text style={styles.quickNum}>112</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.quickCard} onPress={() => Linking.openURL('tel:181')}>
            <Text style={styles.quickIcon}>👩</Text>
            <Text style={styles.quickLabel}>Women Helpline</Text>
            <Text style={styles.quickNum}>181</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.quickCard} onPress={() => Linking.openURL('tel:100')}>
            <Text style={styles.quickIcon}>👮</Text>
            <Text style={styles.quickLabel}>Police</Text>
            <Text style={styles.quickNum}>100</Text>
          </TouchableOpacity>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f2f8' },
  content: { paddingBottom: 36 },
  header: {
    backgroundColor: '#7c3aed', paddingTop: 52, paddingBottom: 22,
    paddingHorizontal: 22, flexDirection: 'row',
    alignItems: 'center', justifyContent: 'space-between',
  },
  greeting: { fontSize: 22, fontWeight: '800', color: '#fff' },
  subGreeting: { fontSize: 13, color: 'rgba(255,255,255,0.78)', marginTop: 2 },
  logoutBtn: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: 14, paddingVertical: 7, borderRadius: 20,
  },
  logoutText: { color: '#fff', fontWeight: '600', fontSize: 13 },

  contactCard: {
    backgroundColor: '#fff', marginHorizontal: 16, marginTop: 16, borderRadius: 18, padding: 16,
    flexDirection: 'row', alignItems: 'center', gap: 12,
    shadowColor: '#7c3aed', shadowOpacity: 0.08, shadowRadius: 10, elevation: 4,
  },
  contactAvatarCircle: {
    width: 48, height: 48, borderRadius: 24,
    backgroundColor: '#7c3aed', justifyContent: 'center', alignItems: 'center',
  },
  contactAvatarText: { color: '#fff', fontSize: 20, fontWeight: '700' },
  contactLabel: { fontSize: 11, color: '#9ca3af', fontWeight: '600', textTransform: 'uppercase' },
  contactName: { fontSize: 16, fontWeight: '700', color: '#1e1b2e' },
  contactPhone: { fontSize: 13, color: '#6b7280', marginTop: 2 },
  callChip: {
    backgroundColor: '#f0fdf4', borderRadius: 12,
    paddingHorizontal: 12, paddingVertical: 8, borderWidth: 1, borderColor: '#bbf7d0',
  },
  callChipText: { color: '#16a34a', fontWeight: '700', fontSize: 13 },
  noContactCard: {
    backgroundColor: '#fff7ed', marginHorizontal: 16, marginTop: 16, borderRadius: 18, padding: 16,
    borderWidth: 1.5, borderColor: '#fed7aa',
  },
  noContactText: { fontSize: 15, fontWeight: '700', color: '#9a3412' },
  noContactSub: { fontSize: 12, color: '#c2410c', marginTop: 4 },

  sosSection: { alignItems: 'center', paddingVertical: 28 },
  sosLabel: { fontSize: 12, color: '#6b7280', fontWeight: '800', marginBottom: 20, letterSpacing: 1 },
  sosRing: {
    width: 190, height: 190, borderRadius: 95,
    backgroundColor: 'rgba(220,38,38,0.12)',
    justifyContent: 'center', alignItems: 'center',
  },
  sosBtn: {
    width: 154, height: 154, borderRadius: 77,
    backgroundColor: '#dc2626',
    justifyContent: 'center', alignItems: 'center',
    shadowColor: '#dc2626', shadowOpacity: 0.55, shadowRadius: 22, elevation: 14,
  },
  sosBtnText: { fontSize: 40, fontWeight: '900', color: '#fff', letterSpacing: 2 },
  sosBtnSub: { fontSize: 11, color: 'rgba(255,255,255,0.85)', marginTop: 2, fontWeight: '700', letterSpacing: 1 },
  sosHelpText: { fontSize: 12, color: '#6b7280', textAlign: 'center', marginTop: 16, marginHorizontal: 32 },
  statusBox: {
    marginTop: 18, backgroundColor: '#fff', borderRadius: 14,
    paddingHorizontal: 20, paddingVertical: 12, marginHorizontal: 28, alignItems: 'center',
    shadowColor: '#000', shadowOpacity: 0.08, shadowRadius: 8, elevation: 3,
  },
  statusText: { fontSize: 14, fontWeight: '600', color: '#1e1b2e', textAlign: 'center' },
  cancelText: { color: '#dc2626', fontWeight: '700', fontSize: 13 },

  quickSection: { marginTop: 8, paddingHorizontal: 16 },
  quickSectionTitle: { fontSize: 14, fontWeight: '700', color: '#374151', marginBottom: 12, marginLeft: 4 },
  quickRow: { flexDirection: 'row', gap: 10 },
  quickCard: {
    flex: 1, backgroundColor: '#fff', borderRadius: 16, padding: 14,
    alignItems: 'center', shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 8, elevation: 3,
  },
  quickIcon: { fontSize: 24, marginBottom: 4 },
  quickLabel: { fontSize: 11, color: '#6b7280', textAlign: 'center', marginBottom: 2 },
  quickNum: { fontSize: 17, fontWeight: '800', color: '#7c3aed' },
});
