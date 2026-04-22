import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  ScrollView, 
  Switch, 
  Alert, 
  TextInput,
  ActivityIndicator,
  Modal,
  Platform,
  StatusBar
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '../contexts/AuthContext';
import api from '../api';

const BRAND_GOLD = '#DA9B2A';
const T = {
  bg: '#F5F5F4',
  card: '#FFFFFF',
  text: '#1C1917',
  sub: '#78716C',
  border: '#E7E5E4',
  danger: '#EF4444',
  success: '#10B981',
};

export default function SettingsScreen({ navigation }) {
  const insets = useSafeAreaInsets();
  const { user, logout } = useAuth();
  const [loading, setLoading] = useState(false);

  // States for toggles
  const [notifications, setNotifications] = useState({
    likes: true,
    comments: true,
    follows: true,
    messages: true,
  });
  const [privacy, setPrivacy] = useState({
    privateAccount: false,
    showActivity: true,
  });
  const [isDarkMode, setIsDarkMode] = useState(false);

  // States for Password Modal
  const [showPassModal, setShowPassModal] = useState(false);
  const [passForm, setPassForm] = useState({ current: '', new: '', confirm: '' });

  useEffect(() => {
    // Initial fetch if needed, though we can assume defaults or sync with API later
  }, []);

  const handleToggleNotification = async (key) => {
    const newVal = !notifications[key];
    setNotifications(prev => ({ ...prev, [key]: newVal }));
    try {
      await api.updateNotificationSettings({ [key]: newVal });
    } catch (err) {
      console.error('Failed to update notifications:', err);
      setNotifications(prev => ({ ...prev, [key]: !newVal })); // Revert
    }
  };

  const handleTogglePrivacy = async (key) => {
    const newVal = !privacy[key];
    setPrivacy(prev => ({ ...prev, [key]: newVal }));
    try {
      await api.updatePrivacySettings({ [key]: newVal });
    } catch (err) {
      console.error('Failed to update privacy:', err);
      setPrivacy(prev => ({ ...prev, [key]: !newVal })); // Revert
    }
  };

  const handleChangePassword = async () => {
    if (!passForm.current || !passForm.new || !passForm.confirm) {
      Alert.alert('Error', 'Please fill all fields');
      return;
    }
    if (passForm.new !== passForm.confirm) {
      Alert.alert('Error', 'Passwords do not match');
      return;
    }
    if (passForm.new.length < 8) {
      Alert.alert('Error', 'Password must be at least 8 characters');
      return;
    }

    setLoading(true);
    try {
      await api.changePassword({
        old_password: passForm.current,
        new_password: passForm.new
      });
      Alert.alert('Success', 'Password changed successfully');
      setShowPassModal(false);
      setPassForm({ current: '', new: '', confirm: '' });
    } catch (err) {
      Alert.alert('Error', 'Failed to change password. Check your current password.');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteAccount = () => {
    Alert.alert(
      'Delete Account',
      'Are you sure? This action is permanent and cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Delete', 
          style: 'destructive',
          onPress: async () => {
            try {
              await api.deleteAccount();
              logout();
            } catch (err) {
              Alert.alert('Error', 'Failed to delete account');
            }
          }
        },
      ]
    );
  };

  const handleDownloadData = async () => {
    try {
      await api.downloadData();
      Alert.alert('Success', 'Your data request has been received. You will receive an email with the download link shortly.');
    } catch (err) {
      Alert.alert('Error', 'Failed to request data download');
    }
  };

  const SettingRow = ({ icon, title, subtitle, type = 'chevron', value, onToggle, onPress, color = T.text }) => (
    <TouchableOpacity 
      style={styles.row} 
      onPress={onPress} 
      disabled={type === 'switch'}
      activeOpacity={0.7}
    >
      <View style={styles.rowLeft}>
        <View style={[styles.iconBox, { backgroundColor: color + '10' }]}>
          <Ionicons name={icon} size={22} color={color} />
        </View>
        <View style={styles.textColumn}>
          <Text style={[styles.rowTitle, { color }]}>{title}</Text>
          {!!subtitle && <Text style={styles.rowSub}>{subtitle}</Text>}
        </View>
      </View>
      {type === 'switch' ? (
        <Switch 
          value={value} 
          onValueChange={onToggle}
          trackColor={{ false: '#D1D5DB', true: BRAND_GOLD }}
          thumbColor={'#fff'}
        />
      ) : (
        <Ionicons name="chevron-forward" size={20} color={T.sub} />
      )}
    </TouchableOpacity>
  );

  return (
    <View style={[styles.root, { paddingTop: insets.top }]}>
      <StatusBar translucent backgroundColor="transparent" barStyle="dark-content" />
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Ionicons name="chevron-back" size={28} color={T.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Settings</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false}>
        <View style={styles.profileSummary}>
          <View style={styles.avatarLarge}>
            <Text style={styles.avatarInitial}>{user?.username?.[0]?.toUpperCase() || 'U'}</Text>
          </View>
          <Text style={styles.profileName}>@{user?.username}</Text>
          <Text style={styles.profileEmail}>{user?.email}</Text>
        </View>

        <Text style={styles.sectionLabel}>Account</Text>
        <View style={styles.sectionCard}>
          <SettingRow 
            icon="person-outline" 
            title="Edit Profile" 
            subtitle="Change your bio, photo, and more"
            onPress={() => navigation.navigate('EditProfile')}
          />
          <SettingRow 
            icon="lock-closed-outline" 
            title="Change Password" 
            onPress={() => setShowPassModal(true)}
          />
          <SettingRow 
            icon="cloud-download-outline" 
            title="Download Data" 
            subtitle="Get a copy of your FlipStar data"
            onPress={handleDownloadData}
          />
        </View>

        <Text style={styles.sectionLabel}>Notifications</Text>
        <View style={styles.sectionCard}>
          <SettingRow 
            icon="heart-outline" 
            title="Likes" 
            type="switch"
            value={notifications.likes}
            onToggle={() => handleToggleNotification('likes')}
          />
          <SettingRow 
            icon="chatbubble-outline" 
            title="Comments" 
            type="switch"
            value={notifications.comments}
            onToggle={() => handleToggleNotification('comments')}
          />
          <SettingRow 
            icon="people-outline" 
            title="Follows" 
            type="switch"
            value={notifications.follows}
            onToggle={() => handleToggleNotification('follows')}
          />
        </View>

        <Text style={styles.sectionLabel}>Privacy</Text>
        <View style={styles.sectionCard}>
          <SettingRow 
            icon="eye-off-outline" 
            title="Private Account" 
            subtitle="Only people you approve can see your posts"
            type="switch"
            value={privacy.privateAccount}
            onToggle={() => handleTogglePrivacy('privateAccount')}
          />
          <SettingRow 
            icon="pulse-outline" 
            title="Activity Status" 
            subtitle="Show when you're active"
            type="switch"
            value={privacy.showActivity}
            onToggle={() => handleTogglePrivacy('showActivity')}
          />
        </View>

        <Text style={styles.sectionLabel}>Appearance & Language</Text>
        <View style={styles.sectionCard}>
          <SettingRow 
            icon="moon-outline" 
            title="Dark Mode" 
            type="switch"
            value={isDarkMode}
            onToggle={() => setIsDarkMode(!isDarkMode)}
          />
          <SettingRow 
            icon="globe-outline" 
            title="Language" 
            subtitle="English (US)"
          />
        </View>

        <Text style={styles.sectionLabel}>Support</Text>
        <View style={styles.sectionCard}>
          <SettingRow icon="help-circle-outline" title="Help Center" />
          <SettingRow icon="shield-checkmark-outline" title="Privacy Policy" />
          <SettingRow icon="document-text-outline" title="Terms of Service" />
        </View>

        <Text style={styles.sectionLabel}>Danger Zone</Text>
        <View style={styles.sectionCard}>
          <SettingRow 
            icon="trash-outline" 
            title="Delete Account" 
            color={T.danger}
            onPress={handleDeleteAccount}
          />
        </View>

        <TouchableOpacity style={styles.logoutBtn} onPress={logout}>
          <Ionicons name="log-out-outline" size={22} color={T.danger} />
          <Text style={styles.logoutText}>Log Out</Text>
        </TouchableOpacity>

        <View style={styles.footer}>
          <Text style={styles.version}>FlipStar v1.0.0</Text>
          <Text style={styles.copyright}>© 2024 FlipStar Inc.</Text>
        </View>
      </ScrollView>

      {/* Change Password Modal */}
      <Modal visible={showPassModal} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Change Password</Text>
              <TouchableOpacity onPress={() => setShowPassModal(false)}>
                <Ionicons name="close" size={24} color={T.text} />
              </TouchableOpacity>
            </View>

            <View style={styles.modalBody}>
              <Text style={styles.inputLabel}>Current Password</Text>
              <TextInput 
                style={styles.input}
                secureTextEntry
                placeholder="Required"
                value={passForm.current}
                onChangeText={v => setPassForm({...passForm, current: v})}
              />

              <Text style={styles.inputLabel}>New Password</Text>
              <TextInput 
                style={styles.input}
                secureTextEntry
                placeholder="Min 8 characters"
                value={passForm.new}
                onChangeText={v => setPassForm({...passForm, new: v})}
              />

              <Text style={styles.inputLabel}>Confirm New Password</Text>
              <TextInput 
                style={styles.input}
                secureTextEntry
                placeholder="Repeat new password"
                value={passForm.confirm}
                onChangeText={v => setPassForm({...passForm, confirm: v})}
              />

              <TouchableOpacity 
                style={[styles.saveBtn, loading && { opacity: 0.7 }]}
                onPress={handleChangePassword}
                disabled={loading}
              >
                {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.saveBtnText}>Update Password</Text>}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: T.bg },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: T.border,
  },
  headerTitle: { fontSize: 20, fontWeight: '800', color: T.text },
  backBtn: { padding: 4 },
  scroll: { flex: 1 },
  profileSummary: {
    alignItems: 'center',
    paddingVertical: 32,
    backgroundColor: '#fff',
    marginBottom: 8,
  },
  avatarLarge: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: BRAND_GOLD,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
    shadowColor: BRAND_GOLD,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  avatarInitial: { fontSize: 32, fontWeight: '800', color: '#fff' },
  profileName: { fontSize: 20, fontWeight: '800', color: T.text, marginBottom: 4 },
  profileEmail: { fontSize: 14, color: T.sub },
  sectionLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: T.sub,
    textTransform: 'uppercase',
    marginTop: 24,
    marginBottom: 8,
    marginLeft: 20,
    letterSpacing: 1,
  },
  sectionCard: {
    backgroundColor: '#fff',
    marginHorizontal: 12,
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: T.border,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F5F5F4',
  },
  rowLeft: { flexDirection: 'row', alignItems: 'center', flex: 1 },
  iconBox: { width: 40, height: 40, borderRadius: 12, alignItems: 'center', justifyContent: 'center', marginRight: 14 },
  textColumn: { flex: 1 },
  rowTitle: { fontSize: 16, fontWeight: '600' },
  rowSub: { fontSize: 12, color: T.sub, marginTop: 2 },
  logoutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    marginTop: 32,
    padding: 18,
    backgroundColor: '#fff',
    marginHorizontal: 12,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: T.border,
  },
  logoutText: { color: T.danger, fontSize: 16, fontWeight: '800' },
  footer: { alignItems: 'center', paddingVertical: 40 },
  version: { fontSize: 12, color: T.sub, fontWeight: '600' },
  copyright: { fontSize: 10, color: T.sub + '80', marginTop: 4 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalContent: { backgroundColor: '#fff', borderTopLeftRadius: 32, borderTopRightRadius: 32, paddingBottom: Platform.OS === 'ios' ? 40 : 20 },
  modalHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 24, borderBottomWidth: 1, borderBottomColor: T.border },
  modalTitle: { fontSize: 20, fontWeight: '800', color: T.text },
  modalBody: { padding: 24 },
  inputLabel: { fontSize: 14, fontWeight: '700', color: T.text, marginBottom: 8, marginTop: 16 },
  input: { backgroundColor: T.bg, borderRadius: 12, padding: 16, fontSize: 16, color: T.text, borderWidth: 1, borderColor: T.border },
  saveBtn: { backgroundColor: BRAND_GOLD, borderRadius: 14, padding: 18, alignItems: 'center', marginTop: 32 },
  saveBtnText: { color: '#fff', fontSize: 16, fontWeight: '800' },
});
