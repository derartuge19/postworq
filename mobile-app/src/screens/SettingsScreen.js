import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Switch } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '../contexts/AuthContext';

const BRAND_GOLD = '#DA9B2A';

export default function SettingsScreen({ navigation }) {
  const insets = useSafeAreaInsets();
  const { logout } = useAuth();
  const [isDarkMode, setIsDarkMode] = React.useState(false);
  const [pushEnabled, setPushEnabled] = React.useState(true);

  const SettingItem = ({ icon, title, value, onValueChange, type = 'chevron', onPress, color = '#000' }) => (
    <TouchableOpacity 
      style={styles.item} 
      onPress={onPress}
      disabled={type === 'switch'}
    >
      <View style={styles.itemLeft}>
        <View style={[styles.iconWrap, { backgroundColor: color + '15' }]}>
          <Ionicons name={icon} size={20} color={color} />
        </View>
        <Text style={[styles.itemTitle, { color }]}>{title}</Text>
      </View>
      {type === 'switch' ? (
        <Switch 
          value={value} 
          onValueChange={onValueChange}
          trackColor={{ false: '#ddd', true: BRAND_GOLD }}
        />
      ) : (
        <Ionicons name="chevron-forward" size={20} color="#ccc" />
      )}
    </TouchableOpacity>
  );

  return (
    <View style={[styles.root, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color="#000" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Settings</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView style={styles.content}>
        <Text style={styles.sectionTitle}>Account</Text>
        <SettingItem 
          icon="person-outline" 
          title="Edit Profile" 
          onPress={() => navigation.navigate('EditProfile')} 
        />
        <SettingItem 
          icon="notifications-outline" 
          title="Push Notifications" 
          type="switch"
          value={pushEnabled}
          onValueChange={setPushEnabled}
        />
        
        <Text style={styles.sectionTitle}>Preferences</Text>
        <SettingItem 
          icon="moon-outline" 
          title="Dark Mode" 
          type="switch"
          value={isDarkMode}
          onValueChange={setIsDarkMode}
        />
        <SettingItem icon="language-outline" title="Language" />
        
        <Text style={styles.sectionTitle}>Support</Text>
        <SettingItem icon="help-circle-outline" title="Help Center" />
        <SettingItem icon="shield-checkmark-outline" title="Privacy Policy" />
        <SettingItem icon="document-text-outline" title="Terms of Service" />

        <TouchableOpacity style={styles.logoutBtn} onPress={logout}>
          <Ionicons name="log-out-outline" size={20} color="#FF3B30" />
          <Text style={styles.logoutText}>Log Out</Text>
        </TouchableOpacity>

        <View style={styles.footer}>
          <Text style={styles.version}>FlipStar v1.0.0</Text>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#fff' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#eee',
  },
  headerTitle: { fontSize: 18, fontWeight: '800', color: '#000' },
  backBtn: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  content: { flex: 1 },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#999',
    textTransform: 'uppercase',
    marginTop: 24,
    marginBottom: 8,
    marginLeft: 16,
  },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    backgroundColor: '#fff',
  },
  itemLeft: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  iconWrap: { width: 36, height: 36, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  itemTitle: { fontSize: 16, fontWeight: '500' },
  logoutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginTop: 40,
    marginBottom: 20,
    padding: 16,
  },
  logoutText: { color: '#FF3B30', fontSize: 16, fontWeight: '700' },
  footer: { alignItems: 'center', paddingBottom: 40 },
  version: { fontSize: 12, color: '#ccc' },
});
