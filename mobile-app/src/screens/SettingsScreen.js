import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Switch, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '../contexts/AuthContext';
import api from '../api';

const GOLD = '#C8B56A';
const BG = '#0D0D0D';
const CARD = '#1A1A1A';
const BORDER = '#262626';

function SettingRow({ icon, label, value, onPress, isSwitch, switchValue, onSwitch, danger, chevron = true }) {
  return (
    <TouchableOpacity style={styles.row} onPress={onPress} disabled={isSwitch} activeOpacity={0.7}>
      <View style={[styles.rowIcon, { backgroundColor: danger ? '#2D1010' : CARD }]}>
        <Ionicons name={icon} size={18} color={danger ? '#EF4444' : GOLD} />
      </View>
      <Text style={[styles.rowLabel, danger && { color: '#EF4444' }]}>{label}</Text>
      <View style={{ marginLeft: 'auto', flexDirection: 'row', alignItems: 'center', gap: 8 }}>
        {value && <Text style={styles.rowValue}>{value}</Text>}
        {isSwitch && <Switch value={switchValue} onValueChange={onSwitch} trackColor={{ true: GOLD }} thumbColor="#fff" />}
        {!isSwitch && chevron && <Ionicons name="chevron-forward" size={16} color="#555" />}
      </View>
    </TouchableOpacity>
  );
}

function Section({ title, children }) {
  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{title}</Text>
      <View style={styles.sectionCard}>{children}</View>
    </View>
  );
}

export default function SettingsScreen({ navigation }) {
  const insets = useSafeAreaInsets();
  const { user, logout } = useAuth();
  const [pushNotifs, setPushNotifs] = useState(true);

  const handleDeleteAccount = () => {
    Alert.alert('Delete Account', 'This action is permanent and cannot be undone. All your data will be deleted.', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: async () => {
        try {
          await api.request('/profile/delete/', { method: 'DELETE' });
          logout();
        } catch { Alert.alert('Error', 'Failed to delete account'); }
      }},
    ]);
  };

  const handleLogout = () => {
    Alert.alert('Logout', 'Are you sure?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Logout', style: 'destructive', onPress: logout },
    ]);
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="chevron-back" size={24} color={GOLD} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Settings</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        <Section title="Account">
          <SettingRow icon="person-outline" label="Edit Profile" onPress={() => navigation.navigate('EditProfile')} />
          <SettingRow icon="crown-outline" label="Subscription" onPress={() => navigation.navigate('Subscription')} />
          <SettingRow icon="wallet-outline" label="Wallet" onPress={() => navigation.navigate('Wallet')} />
          <SettingRow icon="lock-closed-outline" label="Change Password" onPress={() => Alert.alert('Coming Soon')} />
        </Section>

        <Section title="Notifications">
          <SettingRow icon="notifications-outline" label="Push Notifications" isSwitch switchValue={pushNotifs} onSwitch={setPushNotifs} />
        </Section>

        <Section title="Privacy">
          <SettingRow icon="eye-outline" label="Privacy Settings" onPress={() => Alert.alert('Coming Soon')} />
          <SettingRow icon="shield-outline" label="Blocked Users" onPress={() => Alert.alert('Coming Soon')} />
        </Section>

        <Section title="Support">
          <SettingRow icon="help-circle-outline" label="Help Center" onPress={() => Alert.alert('Coming Soon')} />
          <SettingRow icon="document-text-outline" label="Terms & Conditions" onPress={() => Alert.alert('Coming Soon')} />
          <SettingRow icon="shield-checkmark-outline" label="Privacy Policy" onPress={() => Alert.alert('Coming Soon')} />
          <SettingRow icon="information-circle-outline" label="App Version" value="1.0.0" chevron={false} />
        </Section>

        <Section title="Danger Zone">
          <SettingRow icon="log-out-outline" label="Logout" onPress={handleLogout} danger />
          <SettingRow icon="trash-outline" label="Delete Account" onPress={handleDeleteAccount} danger />
        </Section>

        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: BG },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: BORDER },
  headerTitle: { fontSize: 17, fontWeight: '700', color: '#fff' },
  section: { marginTop: 24, paddingHorizontal: 16 },
  sectionTitle: { fontSize: 12, fontWeight: '700', color: '#666', textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 8 },
  sectionCard: { backgroundColor: CARD, borderRadius: 14, borderWidth: 1, borderColor: BORDER, overflow: 'hidden' },
  row: { flexDirection: 'row', alignItems: 'center', padding: 14, borderBottomWidth: 1, borderBottomColor: BORDER + '80' },
  rowIcon: { width: 34, height: 34, borderRadius: 8, justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  rowLabel: { fontSize: 15, color: '#fff', fontWeight: '500' },
  rowValue: { fontSize: 13, color: '#666' },
});
