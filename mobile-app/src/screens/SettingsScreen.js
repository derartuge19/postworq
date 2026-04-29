import React, { useState, useEffect, useCallback } from 'react';
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
import * as SecureStore from 'expo-secure-store';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import { useLanguage } from '../contexts/LanguageContext';
import api from '../api';

export default function SettingsScreen({ navigation }) {
  const insets = useSafeAreaInsets();
  const { user, logout } = useAuth();
  const { isDarkMode, toggleDarkMode, colors: T } = useTheme();
  const { language, changeLanguage, t } = useLanguage();
  
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);

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
    allowMessages: true,
  });

  // States for Modals
  const [showPassModal, setShowPassModal] = useState(false);
  const [showLangModal, setShowLangModal] = useState(false);
  const [passForm, setPassForm] = useState({ current: '', new: '', confirm: '' });

  const fetchSettings = useCallback(async () => {
    try {
      setFetching(true);
      const [notifs, priv] = await Promise.all([
        api.getNotificationPrefs().catch(() => ({})),
        api.getPrivacySettings().catch(() => ({}))
      ]);
      
      if (notifs && Object.keys(notifs).length > 0) {
        setNotifications(prev => ({ ...prev, ...notifs }));
      } else {
        const savedNotifs = await SecureStore.getItemAsync('notificationSettings');
        if (savedNotifs) setNotifications(JSON.parse(savedNotifs));
      }
      if (priv && Object.keys(priv).length > 0) {
        setPrivacy(prev => ({ ...prev, ...priv }));
      } else {
        const savedPriv = await SecureStore.getItemAsync('privacySettings');
        if (savedPriv) setPrivacy(JSON.parse(savedPriv));
      }
    } catch (err) {
      console.error('Failed to fetch settings:', err);
    } finally {
      setFetching(false);
    }
  }, []);

  useEffect(() => {
    fetchSettings();
  }, [fetchSettings]);

  const handleToggleNotification = async (key) => {
    const newVal = !notifications[key];
    const nextNotifs = { ...notifications, [key]: newVal };
    setNotifications(nextNotifs);
    try {
      await api.updateNotificationSettings({ [key]: newVal });
      await SecureStore.setItemAsync('notificationSettings', JSON.stringify(nextNotifs));
    } catch (err) {
      setNotifications(prev => ({ ...prev, [key]: !newVal }));
    }
  };

  const handleTogglePrivacy = async (key) => {
    const newVal = !privacy[key];
    const nextPrivacy = { ...privacy, [key]: newVal };
    setPrivacy(nextPrivacy);
    try {
      await api.updatePrivacySettings({ [key]: newVal });
      await SecureStore.setItemAsync('privacySettings', JSON.stringify(nextPrivacy));
    } catch (err) {
      setPrivacy(prev => ({ ...prev, [key]: !newVal }));
    }
  };

  const handleChangePassword = async () => {
    if (!passForm.current || !passForm.new || !passForm.confirm) {
      Alert.alert(t('error'), 'Please fill all fields');
      return;
    }
    if (passForm.new !== passForm.confirm) {
      Alert.alert(t('error'), t('passwordMismatch'));
      return;
    }
    setLoading(true);
    try {
      await api.changePassword({
        old_password: passForm.current,
        new_password: passForm.new
      });
      Alert.alert(t('success'), t('passwordChanged'));
      setShowPassModal(false);
      setPassForm({ current: '', new: '', confirm: '' });
    } catch (err) {
      Alert.alert(t('error'), t('passwordChangeFailed'));
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadData = async () => {
    try {
      await api.downloadData();
      Alert.alert(t('success'), t('downloadEmail'));
    } catch (err) {
      Alert.alert(t('error'), 'Failed to request data download');
    }
  };

  const handleDeleteAccount = () => {
    Alert.alert(
      t('deleteAccount'),
      t('deleteWarning'),
      [
        { text: t('cancel'), style: 'cancel' },
        { 
          text: t('deleteAccount'), 
          style: 'destructive',
          onPress: async () => {
            try {
              await api.deleteAccount();
              logout();
            } catch (err) {
              Alert.alert(t('error'), 'Failed to delete account');
            }
          }
        },
      ]
    );
  };

  const SettingRow = ({ icon, title, subtitle, type = 'chevron', value, onToggle, onPress, color = T.text }) => (
    <TouchableOpacity 
      style={[styles.row, { borderBottomColor: T.border }]} 
      onPress={onPress} 
      disabled={type === 'switch'}
      activeOpacity={0.7}
    >
      <View style={styles.rowLeft}>
        <View style={[styles.iconBox, { backgroundColor: color + '15' }]}>
          <Ionicons name={icon} size={20} color={color} />
        </View>
        <View style={styles.textColumn}>
          <Text style={[styles.rowTitle, { color: T.text }]}>{title}</Text>
          {!!subtitle && <Text style={[styles.rowSub, { color: T.sub }]}>{subtitle}</Text>}
        </View>
      </View>
      {type === 'switch' ? (
        <Switch 
          value={value} 
          onValueChange={onToggle}
          trackColor={{ false: '#3F3F46', true: T.pri }}
          thumbColor={'#fff'}
        />
      ) : (
        <Ionicons name="chevron-forward" size={18} color={T.sub} />
      )}
    </TouchableOpacity>
  );

  if (fetching) {
    return (
      <View style={[styles.root, { backgroundColor: T.bg, justifyContent: 'center' }]}>
        <ActivityIndicator size="large" color={T.pri} />
      </View>
    );
  }

  return (
    <View style={[styles.root, { backgroundColor: T.bg, paddingTop: insets.top }]}>
      <StatusBar barStyle={isDarkMode ? 'light-content' : 'dark-content'} />
      
      <View style={[styles.header, { backgroundColor: T.card, borderBottomColor: T.border }]}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Ionicons name="chevron-back" size={28} color={T.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: T.text }]}>{t('settings')}</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false}>
        {/* User Card */}
        <View style={[styles.profileSummary, { backgroundColor: T.card }]}>
          <View style={[styles.avatarLarge, { backgroundColor: T.pri }]}>
            <Text style={styles.avatarInitial}>{user?.username?.[0]?.toUpperCase() || 'U'}</Text>
          </View>
          <Text style={[styles.profileName, { color: T.text }]}>@{user?.username}</Text>
          <Text style={[styles.profileEmail, { color: T.sub }]}>{user?.email}</Text>
        </View>

        {/* Sections */}
        <Text style={[styles.sectionLabel, { color: T.sub }]}>{t('account')}</Text>
        <View style={[styles.sectionCard, { backgroundColor: T.card, borderColor: T.border }]}>
          <SettingRow 
            icon="person-outline" 
            title={t('editProfile')} 
            subtitle="Change bio and photo"
            onPress={() => navigation.navigate('EditProfile')}
          />
          <SettingRow 
            icon="lock-closed-outline" 
            title={t('changePassword')} 
            onPress={() => setShowPassModal(true)}
          />
          <SettingRow 
            icon="cloud-download-outline" 
            title={t('downloadData')} 
            subtitle={t('downloadDataDesc')}
            onPress={handleDownloadData}
          />
        </View>

        <Text style={[styles.sectionLabel, { color: T.sub }]}>{t('notificationsSettings')}</Text>
        <View style={[styles.sectionCard, { backgroundColor: T.card, borderColor: T.border }]}>
          <SettingRow icon="heart-outline" title={t('likes')} type="switch" value={notifications.likes} onToggle={() => handleToggleNotification('likes')} />
          <SettingRow icon="chatbubble-outline" title={t('comments')} type="switch" value={notifications.comments} onToggle={() => handleToggleNotification('comments')} />
          <SettingRow icon="people-outline" title={t('follows')} type="switch" value={notifications.follows} onToggle={() => handleToggleNotification('follows')} />
          <SettingRow icon="mail-outline" title={t('messages')} type="switch" value={notifications.messages} onToggle={() => handleToggleNotification('messages')} />
        </View>

        <Text style={[styles.sectionLabel, { color: T.sub }]}>{t('privacy')}</Text>
        <View style={[styles.sectionCard, { backgroundColor: T.card, borderColor: T.border }]}>
          <SettingRow 
            icon="eye-off-outline" 
            title={t('privateAccount')} 
            subtitle={t('privateAccountDesc')} 
            type="switch" 
            value={privacy.privateAccount} 
            onToggle={() => handleTogglePrivacy('privateAccount')} 
          />
          <SettingRow 
            icon="pulse-outline" 
            title={t('showActivity')} 
            subtitle={t('showActivityDesc')} 
            type="switch" 
            value={privacy.showActivity} 
            onToggle={() => handleTogglePrivacy('showActivity')} 
          />
        </View>

        <Text style={[styles.sectionLabel, { color: T.sub }]}>{t('appearance')}</Text>
        <View style={[styles.sectionCard, { backgroundColor: T.card, borderColor: T.border }]}>
          <SettingRow 
            icon={isDarkMode ? "moon" : "sunny-outline"} 
            title={t('darkMode')} 
            type="switch" 
            value={isDarkMode} 
            onToggle={toggleDarkMode} 
          />
          <SettingRow 
            icon="globe-outline" 
            title={t('language')} 
            subtitle={language === 'en' ? 'English' : 'አማርኛ'} 
            onPress={() => setShowLangModal(true)}
          />
        </View>

        <Text style={[styles.sectionLabel, { color: T.sub }]}>{t('help')}</Text>
        <View style={[styles.sectionCard, { backgroundColor: T.card, borderColor: T.border }]}>
          <SettingRow icon="help-circle-outline" title={t('helpCenter')} onPress={() => Alert.alert('Help', 'Contact support@flipstar.com')} />
          <SettingRow icon="shield-checkmark-outline" title={t('privacyPolicy')} />
          <SettingRow icon="document-text-outline" title={t('termsOfService')} />
        </View>

        <Text style={[styles.sectionLabel, { color: T.sub }]}>{t('dangerZone')}</Text>
        <View style={[styles.sectionCard, { backgroundColor: T.card, borderColor: T.border }]}>
          <SettingRow 
            icon="trash-outline" 
            title={t('deleteAccount')} 
            color={T.danger}
            onPress={handleDeleteAccount}
          />
        </View>

        <TouchableOpacity style={[styles.logoutBtn, { backgroundColor: T.card, borderColor: T.border }]} onPress={logout}>
          <Ionicons name="log-out-outline" size={22} color={T.danger} />
          <Text style={[styles.logoutText, { color: T.danger }]}>{t('logout')}</Text>
        </TouchableOpacity>

        <View style={styles.footer}>
          <Text style={[styles.version, { color: T.sub }]}>{t('version')} 1.0.0</Text>
          <Text style={[styles.copyright, { color: T.sub + '80' }]}>© 2024 FlipStar Inc.</Text>
        </View>
        <View style={{ height: 40 }} />
      </ScrollView>

      {/* Language Modal */}
      <Modal visible={showLangModal} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: T.card }]}>
            <View style={[styles.modalHeader, { borderBottomColor: T.border }]}>
              <Text style={[styles.modalTitle, { color: T.text }]}>{t('chooseLanguage')}</Text>
              <TouchableOpacity onPress={() => setShowLangModal(false)}>
                <Ionicons name="close" size={24} color={T.text} />
              </TouchableOpacity>
            </View>
            <View style={styles.modalBody}>
              <TouchableOpacity 
                style={[styles.langOption, language === 'en' && styles.langOptionActive]} 
                onPress={() => { changeLanguage('en'); setShowLangModal(false); }}
              >
                <Text style={[styles.langText, { color: T.text }, language === 'en' && styles.langTextActive]}>English</Text>
                {language === 'en' && <Ionicons name="checkmark" size={20} color={T.pri} />}
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.langOption, language === 'am' && styles.langOptionActive]} 
                onPress={() => { changeLanguage('am'); setShowLangModal(false); }}
              >
                <Text style={[styles.langText, { color: T.text }, language === 'am' && styles.langTextActive]}>አማርኛ (Amharic)</Text>
                {language === 'am' && <Ionicons name="checkmark" size={20} color={T.pri} />}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Password Modal */}
      <Modal visible={showPassModal} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: T.card }]}>
            <View style={[styles.modalHeader, { borderBottomColor: T.border }]}>
              <Text style={[styles.modalTitle, { color: T.text }]}>{t('changePassword')}</Text>
              <TouchableOpacity onPress={() => setShowPassModal(false)}>
                <Ionicons name="close" size={24} color={T.text} />
              </TouchableOpacity>
            </View>
            <View style={styles.modalBody}>
              <Text style={[styles.inputLabel, { color: T.text }]}>{t('currentPassword')}</Text>
              <TextInput style={[styles.input, { backgroundColor: T.bg, borderColor: T.border, color: T.text }]} secureTextEntry value={passForm.current} onChangeText={v => setPassForm({...passForm, current: v})} />
              
              <Text style={[styles.inputLabel, { color: T.text }]}>{t('newPassword')}</Text>
              <TextInput style={[styles.input, { backgroundColor: T.bg, borderColor: T.border, color: T.text }]} secureTextEntry value={passForm.new} onChangeText={v => setPassForm({...passForm, new: v})} />
              
              <Text style={[styles.inputLabel, { color: T.text }]}>{t('confirmPassword')}</Text>
              <TextInput style={[styles.input, { backgroundColor: T.bg, borderColor: T.border, color: T.text }]} secureTextEntry value={passForm.confirm} onChangeText={v => setPassForm({...passForm, confirm: v})} />

              <TouchableOpacity style={[styles.saveBtn, { backgroundColor: T.pri }, loading && { opacity: 0.7 }]} onPress={handleChangePassword} disabled={loading}>
                {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.saveBtnText}>{t('updatePassword')}</Text>}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  headerTitle: { fontSize: 18, fontWeight: '800' },
  backBtn: { padding: 4 },
  scroll: { flex: 1 },
  profileSummary: {
    alignItems: 'center',
    paddingVertical: 32,
    marginBottom: 8,
  },
  avatarLarge: {
    width: 86,
    height: 86,
    borderRadius: 43,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
    shadowcolor: '#C8B56A',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 5,
  },
  avatarInitial: { fontSize: 34, fontWeight: '800', color: '#fff' },
  profileName: { fontSize: 20, fontWeight: '800', marginBottom: 4 },
  profileEmail: { fontSize: 14 },
  sectionLabel: {
    fontSize: 12,
    fontWeight: '700',
    textTransform: 'uppercase',
    marginTop: 24,
    marginBottom: 8,
    marginLeft: 20,
    letterSpacing: 1.2,
  },
  sectionCard: {
    marginHorizontal: 16,
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 1,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderBottomWidth: 1,
  },
  rowLeft: { flexDirection: 'row', alignItems: 'center', flex: 1 },
  iconBox: { width: 38, height: 38, borderRadius: 10, alignItems: 'center', justifyContent: 'center', marginRight: 14 },
  textColumn: { flex: 1 },
  rowTitle: { fontSize: 15, fontWeight: '600' },
  rowSub: { fontSize: 12, marginTop: 2 },
  logoutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    marginTop: 32,
    padding: 18,
    marginHorizontal: 16,
    borderRadius: 16,
    borderWidth: 1,
  },
  logoutText: { fontSize: 16, fontWeight: '800' },
  footer: { alignItems: 'center', paddingVertical: 40 },
  version: { fontSize: 12, fontWeight: '600' },
  copyright: { fontSize: 10, marginTop: 4 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'flex-end' },
  modalContent: { borderTopLeftRadius: 32, borderTopRightRadius: 32, paddingBottom: Platform.OS === 'ios' ? 40 : 20 },
  modalHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 24, borderBottomWidth: 1 },
  modalTitle: { fontSize: 20, fontWeight: '800' },
  modalBody: { padding: 24 },
  langOption: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 18, paddingHorizontal: 4 },
  langText: { fontSize: 16, fontWeight: '600' },
  langTextActive: { color: '#C8B56A' },
  inputLabel: { fontSize: 14, fontWeight: '700', marginBottom: 8, marginTop: 16 },
  input: { borderRadius: 12, padding: 16, fontSize: 16, borderWidth: 1 },
  saveBtn: { borderRadius: 14, padding: 18, alignItems: 'center', marginTop: 32 },
  saveBtnText: { color: '#fff', fontSize: 16, fontWeight: '800' },
});




