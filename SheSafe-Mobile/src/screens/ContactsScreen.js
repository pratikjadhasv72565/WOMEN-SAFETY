import React, { useState, useEffect } from 'react';
import {
  View, Text, FlatList, TouchableOpacity, StyleSheet,
  TextInput, Alert, Modal, ActivityIndicator, StatusBar
} from 'react-native';
import { API_BASE } from '../config';

export default function ContactsScreen() {
  const [contacts, setContacts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [form, setForm] = useState({ name: '', phone: '', relationship: 'family', is_primary: false });
  const [saving, setSaving] = useState(false);

  useEffect(() => { fetchContacts(); }, []);

  async function fetchContacts() {
    setLoading(true);
    try {
      const resp = await fetch(`${API_BASE}/contacts/data/`, {
        credentials: 'include',
        headers: { 'X-Requested-With': 'XMLHttpRequest' },
      });
      const data = await resp.json();
      if (data.success) setContacts(data.contacts);
    } catch (e) {
      console.log('Error loading contacts:', e);
    } finally {
      setLoading(false);
    }
  }

  async function getCsrf() {
    try {
      const r = await fetch(`${API_BASE}/accounts/csrf/`, { credentials: 'include' });
      const d = await r.json();
      return d.csrfToken;
    } catch (e) {
      return '';
    }
  }

  async function addContact() {
    if (!form.name.trim() || !form.phone.trim()) {
      Alert.alert('Missing Fields', 'Name and Phone number are required.');
      return;
    }
    setSaving(true);
    try {
      const csrf = await getCsrf();
      const formData = new FormData();
      formData.append('name', form.name.trim());
      formData.append('phone', form.phone.trim());
      formData.append('relationship', form.relationship);
      if (form.is_primary) formData.append('is_primary', 'on');

      await fetch(`${API_BASE}/contacts/add/`, {
        method: 'POST',
        headers: { 'X-CSRFToken': csrf, 'X-Requested-With': 'XMLHttpRequest' },
        body: formData,
        credentials: 'include',
      });
      setShowAddModal(false);
      setForm({ name: '', phone: '', relationship: 'family', is_primary: false });
      fetchContacts();
    } catch (e) {
      Alert.alert('Error', 'Could not add contact. Please check your connection.');
    } finally {
      setSaving(false);
    }
  }

  async function deleteContact(id, name) {
    Alert.alert('Remove Contact', `Delete ${name} from your trusted safety contacts?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete', style: 'destructive', onPress: async () => {
          try {
            const csrf = await getCsrf();
            await fetch(`${API_BASE}/contacts/delete/${id}/`, {
              method: 'POST',
              headers: { 'X-CSRFToken': csrf, 'X-Requested-With': 'XMLHttpRequest' },
              credentials: 'include',
            });
            fetchContacts();
          } catch (e) {
            Alert.alert('Error', 'Could not delete contact.');
          }
        }
      }
    ]);
  }

  function ContactItem({ item }) {
    return (
      <View style={styles.contactCard}>
        <View style={[styles.avatar, item.is_primary && styles.avatarPrimary]}>
          <Text style={styles.avatarText}>{item.name[0].toUpperCase()}</Text>
        </View>
        <View style={{ flex: 1 }}>
          <View style={styles.nameRow}>
            <Text style={styles.contactName}>{item.name}</Text>
            {item.is_primary && (
              <View style={styles.primaryBadge}>
                <Text style={styles.primaryBadgeText}>★ Primary</Text>
              </View>
            )}
          </View>
          <Text style={styles.contactPhone}>{item.phone}</Text>
          <Text style={styles.contactRel}>{item.relationship}</Text>
        </View>
        <TouchableOpacity onPress={() => deleteContact(item.id, item.name)} style={styles.deleteBtn}>
          <Text style={styles.deleteBtnText}>🗑️</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#7c3aed" />

      <View style={styles.header}>
        <Text style={styles.headerTitle}>Trusted Guardians</Text>
        <TouchableOpacity style={styles.addBtn} onPress={() => setShowAddModal(true)}>
          <Text style={styles.addBtnText}>+ Add</Text>
        </TouchableOpacity>
      </View>

      {loading ? (
        <ActivityIndicator size="large" color="#7c3aed" style={{ marginTop: 60 }} />
      ) : contacts.length === 0 ? (
        <View style={styles.emptyState}>
          <Text style={styles.emptyIcon}>👥</Text>
          <Text style={styles.emptyTitle}>No Guardians Added Yet</Text>
          <Text style={styles.emptySub}>Add family members or close friends who will be called & alerted automatically during emergencies.</Text>
          <TouchableOpacity style={styles.emptyBtn} onPress={() => setShowAddModal(true)}>
            <Text style={styles.emptyBtnText}>+ Add First Guardian</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={contacts}
          keyExtractor={item => String(item.id)}
          renderItem={({ item }) => <ContactItem item={item} />}
          contentContainerStyle={{ padding: 16, gap: 12 }}
          refreshing={loading}
          onRefresh={fetchContacts}
        />
      )}

      {/* Add Contact Modal */}
      <Modal visible={showAddModal} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalBox}>
            <Text style={styles.modalTitle}>Add Trusted Contact</Text>

            <TextInput
              style={styles.input}
              placeholder="Full Name (e.g. Rahul Sharma)"
              placeholderTextColor="#a39cae"
              value={form.name}
              onChangeText={v => setForm({ ...form, name: v })}
            />
            <TextInput
              style={styles.input}
              placeholder="Mobile Number (10 digits)"
              placeholderTextColor="#a39cae"
              value={form.phone}
              onChangeText={v => setForm({ ...form, phone: v })}
              keyboardType="phone-pad"
            />

            <Text style={styles.inputLabel}>Relationship</Text>
            <View style={styles.relRow}>
              {['family', 'friend', 'colleague', 'other'].map(rel => (
                <TouchableOpacity
                  key={rel}
                  style={[styles.relChip, form.relationship === rel && styles.relChipActive]}
                  onPress={() => setForm({ ...form, relationship: rel })}>
                  <Text style={[styles.relChipText, form.relationship === rel && styles.relChipTextActive]}>
                    {rel.charAt(0).toUpperCase() + rel.slice(1)}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <TouchableOpacity
              style={[styles.primaryToggle, form.is_primary && styles.primaryToggleActive]}
              onPress={() => setForm({ ...form, is_primary: !form.is_primary })}>
              <Text style={[styles.primaryToggleText, form.is_primary && styles.primaryToggleTextActive]}>
                {form.is_primary ? '★ Primary Contact (Default for SOS)' : '☆ Set as Primary Contact'}
              </Text>
            </TouchableOpacity>

            <View style={styles.modalBtns}>
              <TouchableOpacity style={styles.cancelBtn} onPress={() => setShowAddModal(false)}>
                <Text style={styles.cancelBtnText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.saveBtn} onPress={addContact} disabled={saving}>
                {saving ? <ActivityIndicator color="#fff" /> : <Text style={styles.saveBtnText}>Save Contact</Text>}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f2f8' },
  header: {
    backgroundColor: '#7c3aed', paddingTop: 52, paddingBottom: 20,
    paddingHorizontal: 22, flexDirection: 'row',
    justifyContent: 'space-between', alignItems: 'center',
  },
  headerTitle: { fontSize: 22, fontWeight: '800', color: '#fff' },
  addBtn: { backgroundColor: 'rgba(255,255,255,0.2)', paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20 },
  addBtnText: { color: '#fff', fontWeight: '700', fontSize: 14 },

  contactCard: {
    backgroundColor: '#fff', borderRadius: 18, padding: 16,
    flexDirection: 'row', alignItems: 'center', gap: 12,
    shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 8, elevation: 3,
  },
  avatar: {
    width: 48, height: 48, borderRadius: 24,
    backgroundColor: '#ddd6fe', justifyContent: 'center', alignItems: 'center',
  },
  avatarPrimary: { backgroundColor: '#7c3aed' },
  avatarText: { fontSize: 20, fontWeight: '700', color: '#fff' },
  nameRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 2 },
  contactName: { fontSize: 16, fontWeight: '700', color: '#1e1b2e' },
  primaryBadge: { backgroundColor: '#fef3c7', borderRadius: 8, paddingHorizontal: 8, paddingVertical: 2 },
  primaryBadgeText: { fontSize: 11, fontWeight: '700', color: '#92400e' },
  contactPhone: { fontSize: 13, color: '#6b7280' },
  contactRel: { fontSize: 12, color: '#a39cae', textTransform: 'capitalize' },
  deleteBtn: { padding: 8 },
  deleteBtnText: { fontSize: 20 },

  emptyState: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 36 },
  emptyIcon: { fontSize: 56, marginBottom: 14 },
  emptyTitle: { fontSize: 20, fontWeight: '700', color: '#1e1b2e', marginBottom: 8 },
  emptySub: { fontSize: 14, color: '#6b7280', textAlign: 'center', marginBottom: 24, lineHeight: 20 },
  emptyBtn: { backgroundColor: '#7c3aed', borderRadius: 14, paddingHorizontal: 24, paddingVertical: 13 },
  emptyBtnText: { color: '#fff', fontWeight: '700', fontSize: 15 },

  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalBox: {
    backgroundColor: '#fff', borderTopLeftRadius: 28, borderTopRightRadius: 28,
    padding: 26, paddingBottom: 40,
  },
  modalTitle: { fontSize: 20, fontWeight: '800', color: '#1e1b2e', marginBottom: 18 },
  input: {
    borderWidth: 1.5, borderColor: '#e9e3f0', borderRadius: 12,
    paddingHorizontal: 16, paddingVertical: 12,
    fontSize: 14, color: '#1e1b2e', marginBottom: 12,
  },
  inputLabel: { fontSize: 13, fontWeight: '600', color: '#6b7280', marginBottom: 8 },
  relRow: { flexDirection: 'row', gap: 8, marginBottom: 14, flexWrap: 'wrap' },
  relChip: {
    borderWidth: 1.5, borderColor: '#e9e3f0', borderRadius: 20,
    paddingHorizontal: 14, paddingVertical: 7,
  },
  relChipActive: { backgroundColor: '#7c3aed', borderColor: '#7c3aed' },
  relChipText: { fontSize: 13, color: '#6b7280', fontWeight: '600' },
  relChipTextActive: { color: '#fff' },
  primaryToggle: {
    borderWidth: 1.5, borderColor: '#e9e3f0', borderRadius: 12,
    padding: 13, alignItems: 'center', marginBottom: 18,
  },
  primaryToggleActive: { backgroundColor: '#fef3c7', borderColor: '#fbbf24' },
  primaryToggleText: { fontSize: 14, color: '#6b7280', fontWeight: '600' },
  primaryToggleTextActive: { color: '#92400e' },
  modalBtns: { flexDirection: 'row', gap: 12 },
  cancelBtn: {
    flex: 1, borderWidth: 1.5, borderColor: '#e9e3f0',
    borderRadius: 14, paddingVertical: 13, alignItems: 'center',
  },
  cancelBtnText: { color: '#6b7280', fontWeight: '700', fontSize: 15 },
  saveBtn: { flex: 1, backgroundColor: '#7c3aed', borderRadius: 14, paddingVertical: 13, alignItems: 'center' },
  saveBtnText: { color: '#fff', fontWeight: '700', fontSize: 15 },
});
