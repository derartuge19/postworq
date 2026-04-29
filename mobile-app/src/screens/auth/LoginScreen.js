import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  KeyboardAvoidingView, Platform, Alert, ActivityIndicator,
  StatusBar, Image, ScrollView, Modal,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import api from '../../api';

const GOLD = '#F9E08B';
const BG   = '#1a1a1a';
const INPUT_BG = '#2a2a2a';
const CARD_BG = '#1A1A1A';

const ethioLogo = require('../../image/Ethio telecom Logo PNG format.png');
const flipLogo  = require('../../image/final_logo.png');

const FAQ_ITEMS = [
  { q: "What is FlipStar?", a: "FlipStar is an Ethiopian social video platform where you can share short videos, join campaigns, win prizes, and earn coins." },
  { q: "How do I earn coins?", a: "You earn coins by posting videos, daily login streaks, receiving gifts from followers, and winning campaigns." },
  { q: "How do I join a campaign?", a: "Go to the Campaigns tab, browse active campaigns, and submit your video entry. Winners are chosen by votes or judges." },
  { q: "Is FlipStar free?", a: "Yes! FlipStar is completely free. Premium features like extra campaign entries are available for purchase." },
  { q: "Who can register?", a: "Anyone with an Ethiopian phone number (+251) can register. You'll verify your number with an OTP code." },
  { q: "How do I reset my password?", a: "Tap 'Forgot password?' on the login screen. A 6-digit reset code will be sent to your registered email address." },
];

const TERMS = `TERMS & CONDITIONS — FlipStar

1. ELIGIBILITY
You must have a valid Ethiopian phone number to register.

2. CONTENT
You are responsible for all content you post. No harmful, offensive or illegal content is allowed.

3. COINS & PRIZES
Coins have no cash value unless explicitly redeemable in a campaign. Prize delivery is subject to campaign rules.

4. PRIVACY
Your phone number is used only for verification. It will never be shared with third parties.

5. ACCOUNT SECURITY
Your 6-digit PIN is your responsibility. Do not share it. FlipStar staff will never ask for your PIN.

6. TERMINATION
Accounts violating these terms may be suspended or permanently banned.

7. CHANGES
FlipStar reserves the right to update these terms at any time. Continued use constitutes acceptance.

Contact: support@flipstar.app`;

function ForgotModal({ visible, onClose }) {
  const [fpStep, setFpStep] = useState(1);
  const [fpEmail, setFpEmail] = useState('');
  const [fpCode, setFpCode] = useState('');
  const [fpPwd, setFpPwd] = useState('');
  const [fpConfirm, setFpConfirm] = useState('');
  const [showPwd, setShowPwd] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [msg, setMsg] = useState('');

  const sendCode = async () => {
    setError('');
    setMsg('');
    if (!fpEmail) { setError('Enter your email'); return; }
    setLoading(true);
    try {
      await api.forgotPasswordRequest(fpEmail);
      setMsg('Reset code sent! Check your email.');
      setFpStep(2);
    } catch (e) { setError(e?.message || 'Failed to send code'); }
    finally { setLoading(false); }
  };

  const confirmReset = async () => {
    setError('');
    setMsg('');
    if (fpCode.length !== 6) { setError('Enter the 6-digit code from your email'); return; }
    if (!/^\d{6}$/.test(fpPwd)) { setError('New password must be exactly 6 digits'); return; }
    if (fpPwd !== fpConfirm) { setError('Passwords do not match'); return; }
    setLoading(true);
    try {
      await api.forgotPasswordConfirm(fpEmail, fpCode, fpPwd);
      setFpStep(3);
    } catch (e) { setError(e?.message || 'Invalid or expired code'); }
    finally { setLoading(false); }
  };

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
      <View style={styles.modalContainer}>
        <View style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>
              {fpStep === 1 ? 'Forgot Password' : fpStep === 2 ? 'Enter Reset Code' : 'Password Reset!'}
            </Text>
            <TouchableOpacity onPress={onClose}>
              <Ionicons name="close" size={22} color={GOLD} />
            </TouchableOpacity>
          </View>
          {error && <View style={styles.errorBox}><Text style={styles.errorText}>⚠️ {error}</Text></View>}
          {msg && <View style={styles.successBox}><Text style={styles.successText}>{msg}</Text></View>}

          {fpStep === 1 && (
            <>
              <Text style={styles.modalDesc}>Enter the email you registered with. A 6-digit reset code will be sent to it.</Text>
              <TextInput
                style={styles.modalInput}
                placeholder="your@email.com"
                placeholderTextColor="#666"
                value={fpEmail}
                onChangeText={setFpEmail}
                keyboardType="email-address"
                autoCapitalize="none"
              />
              <TouchableOpacity style={[styles.modalBtn, loading && { opacity: 0.7 }]} onPress={sendCode} disabled={loading}>
                {loading ? <ActivityIndicator color="#000" /> : <Text style={styles.modalBtnText}>Send Reset Code</Text>}
              </TouchableOpacity>
            </>
          )}

          {fpStep === 2 && (
            <>
              <Text style={styles.modalDesc}>Enter the 6-digit code sent to <Text style={styles.highlight}>{fpEmail}</Text> and your new 6-digit PIN.</Text>
              <TextInput
                style={styles.modalInput}
                placeholder="6-digit code from email"
                placeholderTextColor="#666"
                value={fpCode}
                onChangeText={(t) => setFpCode(t.replace(/\D/g, '').slice(0, 6))}
                keyboardType="number-pad"
                maxLength={6}
              />
              <View style={styles.inputWrapper}>
                <TextInput
                  style={[styles.modalInput, { flex: 1 }]}
                  placeholder="New 6-digit PIN"
                  placeholderTextColor="#666"
                  value={fpPwd}
                  onChangeText={(t) => setFpPwd(t.replace(/\D/g, '').slice(0, 6))}
                  keyboardType="number-pad"
                  maxLength={6}
                  secureTextEntry={!showPwd}
                />
                <TouchableOpacity onPress={() => setShowPwd(!showPwd)} style={styles.eyeBtn}>
                  <Ionicons name={showPwd ? 'eye-off-outline' : 'eye-outline'} size={16} color={GOLD} />
                </TouchableOpacity>
              </View>
              <TextInput
                style={styles.modalInput}
                placeholder="Confirm new PIN"
                placeholderTextColor="#666"
                value={fpConfirm}
                onChangeText={(t) => setFpConfirm(t.replace(/\D/g, '').slice(0, 6))}
                keyboardType="number-pad"
                maxLength={6}
                secureTextEntry
              />
              <TouchableOpacity style={[styles.modalBtn, loading && { opacity: 0.7 }]} onPress={confirmReset} disabled={loading}>
                {loading ? <ActivityIndicator color="#000" /> : <Text style={styles.modalBtnText}>Reset Password</Text>}
              </TouchableOpacity>
              <TouchableOpacity onPress={() => { setFpStep(1); setFpCode(''); setError(''); setMsg(''); }} style={styles.backBtn}>
                <Ionicons name="chevron-back" size={14} color={GOLD} /> Back
              </TouchableOpacity>
            </>
          )}

          {fpStep === 3 && (
            <View style={styles.successContainer}>
              <Text style={styles.successEmoji}>✅</Text>
              <Text style={styles.successTitle}>Password Reset!</Text>
              <Text style={styles.successDesc}>You can now log in with your new PIN.</Text>
              <TouchableOpacity style={styles.modalBtn} onPress={onClose}>
                <Text style={styles.modalBtnText}>Go to Login</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      </View>
    </Modal>
  );
}

function FaqModal({ visible, onClose }) {
  const [open, setOpen] = useState(null);
  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
      <View style={styles.modalContainer}>
        <View style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>FAQ</Text>
            <TouchableOpacity onPress={onClose}>
              <Ionicons name="close" size={22} color={GOLD} />
            </TouchableOpacity>
          </View>
          {FAQ_ITEMS.map((item, i) => (
            <View key={i} style={styles.faqItem}>
              <TouchableOpacity onPress={() => setOpen(open === i ? null : i)} style={styles.faqQuestion}>
                <Text style={styles.faqQuestionText}>{item.q}</Text>
                <Ionicons name={open === i ? 'chevron-up' : 'chevron-down'} size={16} color={GOLD} />
              </TouchableOpacity>
              {open === i && <Text style={styles.faqAnswer}>{item.a}</Text>}
            </View>
          ))}
        </View>
      </View>
    </Modal>
  );
}

function TermsModal({ visible, onClose }) {
  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
      <View style={styles.modalContainer}>
        <View style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Terms & Conditions</Text>
            <TouchableOpacity onPress={onClose}>
              <Ionicons name="close" size={22} color={GOLD} />
            </TouchableOpacity>
          </View>
          <Text style={styles.termsText}>{TERMS}</Text>
        </View>
      </View>
    </Modal>
  );
}

export default function LoginScreen({ navigation }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [modal, setModal] = useState(null);

  const handleLogin = async () => {
    if (!username || !password) { setError('Please fill in all fields'); return; }
    if (password.length !== 6) { setError('PIN must be 6 digits'); return; }
    setError('');
    setLoading(true);
    try {
      const res = await api.login(username, password);
      await api.setAuthToken(res.token);
      if (res.user) {
        updateUser(res.user);
      }
      navigation.replace('MainTabs');
    } catch (e) {
      setError('Invalid credentials. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <StatusBar barStyle="light-content" backgroundColor={BG} />
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>

        {/* Logos */}
        <View style={styles.logosRow}>
          <Image source={ethioLogo} style={styles.logoLeft} resizeMode="contain" />
          <Image source={flipLogo} style={styles.logoRight} resizeMode="contain" />
        </View>

        {/* Card */}
        <View style={styles.card}>
          <View style={styles.titleArea}>
            <Text style={styles.title}>Welcome Back!</Text>
            <Text style={styles.subtitle}>Log in to continue to FLIPSTAR</Text>
          </View>

          {/* Form */}
          {error && <View style={styles.errorBox}><Text style={styles.errorText}>⚠️ {error}</Text></View>}

          <Text style={styles.label}>USERNAME</Text>
          <View style={styles.inputWrapper}>
            <Ionicons name="person-outline" size={18} color={GOLD} style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              placeholder="Enter your username"
              placeholderTextColor="#666"
              value={username}
              onChangeText={setUsername}
              autoCapitalize="none"
            />
          </View>

          <Text style={styles.label}>6-Digit PIN</Text>
          <View style={styles.inputWrapper}>
            <Ionicons name="lock-closed-outline" size={18} color={GOLD} style={styles.inputIcon} />
            <TextInput
              style={[styles.input, { flex: 1 }]}
              placeholder="••••••"
              placeholderTextColor="#666"
              value={password}
              onChangeText={(t) => setPassword(t.replace(/\D/g, '').slice(0, 6))}
              secureTextEntry={!showPass}
              keyboardType="number-pad"
              maxLength={6}
            />
            <TouchableOpacity onPress={() => setShowPass(!showPass)} style={styles.eyeBtn}>
              <Ionicons name={showPass ? 'eye-off-outline' : 'eye-outline'} size={18} color={GOLD} />
            </TouchableOpacity>
          </View>

          <TouchableOpacity onPress={() => setModal('forgot')} style={styles.forgotRow}>
            <Text style={styles.forgotText}>Forgot password?</Text>
          </TouchableOpacity>

          <TouchableOpacity style={[styles.btn, loading && { opacity: 0.7 }]} onPress={handleLogin} disabled={loading}>
            {loading ? <ActivityIndicator color="#000" /> : <Text style={styles.btnText}>Log In</Text>}
          </TouchableOpacity>

          <TouchableOpacity onPress={() => navigation.navigate('Register')} style={styles.linkRow}>
            <Text style={styles.linkText}>Don't have an account? </Text>
            <Text style={styles.link}>Sign up free</Text>
          </TouchableOpacity>
        </View>

        {/* Footer links */}
        <View style={styles.footer}>
          <TouchableOpacity onPress={() => setModal('faq')}>
            <Text style={styles.footerLink}>FAQ</Text>
          </TouchableOpacity>
          <Text style={styles.footerSeparator}>|</Text>
          <TouchableOpacity onPress={() => setModal('terms')}>
            <Text style={styles.footerLink}>Terms & Conditions</Text>
          </TouchableOpacity>
        </View>

      </ScrollView>

      <ForgotModal visible={modal === 'forgot'} onClose={() => setModal(null)} />
      <FaqModal visible={modal === 'faq'} onClose={() => setModal(null)} />
      <TermsModal visible={modal === 'terms'} onClose={() => setModal(null)} />
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: BG },
  scroll: { flexGrow: 1 },

  logosRow: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingTop: 52, paddingBottom: 4,
  },
  logoLeft:  { width: 148, height: 40, marginLeft: 12 },
  logoRight: { width: 148, height: 40, marginRight: 4 },

  card: {
    backgroundColor: CARD_BG, borderRadius: 18, padding: 24,
    borderWidth: 1, borderColor: '#F9E08B30', marginHorizontal: 16,
  },

  titleArea: { alignItems: 'center', marginBottom: 24 },
  title:    { fontSize: 26, fontWeight: '900', color: GOLD, marginBottom: 4 },
  subtitle: { fontSize: 13, color: GOLD },

  errorBox: {
    padding: 10, backgroundColor: '#2D1010', borderWidth: 1, borderColor: '#EF4444',
    borderRadius: 8, marginBottom: 16,
  },
  errorText: { color: '#EF4444', fontSize: 13, fontWeight: '600' },
  successBox: {
    padding: 10, backgroundColor: '#1A2A1A', borderWidth: 1, borderColor: '#22C55E',
    borderRadius: 8, marginBottom: 16,
  },
  successText: { color: '#22C55E', fontSize: 13 },

  label: { fontSize: 12, fontWeight: '700', color: GOLD, marginBottom: 8, letterSpacing: 0.5 },

  inputWrapper: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: CARD_BG, borderRadius: 10,
    borderWidth: 1.5, borderColor: '#262626',
    paddingHorizontal: 14, marginBottom: 16, height: 54,
  },
  inputIcon: { marginRight: 10 },
  input: { flex: 1, fontSize: 15, color: GOLD },
  eyeBtn: { padding: 4 },

  forgotRow: { alignItems: 'flex-end', marginBottom: 20, marginTop: -8 },
  forgotText: { color: GOLD, fontSize: 12, fontWeight: '700' },

  btn: {
    borderRadius: 10, height: 54,
    justifyContent: 'center', alignItems: 'center',
    marginBottom: 16,
    backgroundColor: GOLD,
  },
  btnText: { color: '#000', fontSize: 15, fontWeight: '800' },

  linkRow: { flexDirection: 'row', justifyContent: 'center' },
  linkText: { fontSize: 13, color: '#666' },
  link: { fontSize: 13, color: GOLD, fontWeight: '700' },

  footer: {
    flexDirection: 'row', justifyContent: 'center', alignItems: 'center',
    gap: 24, marginTop: 20, paddingBottom: 20,
  },
  footerLink: { color: GOLD, fontSize: 13, fontWeight: '600' },
  footerSeparator: { color: '#262626' },

  // Modal styles
  modalContainer: {
    flex: 1, backgroundColor: 'rgba(0,0,0,0.85)', justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#111', borderRadius: 18, padding: 24,
    maxHeight: '88vh',
  },
  modalHeader: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    marginBottom: 20,
  },
  modalTitle: { fontSize: 20, fontWeight: '900', color: GOLD },
  modalDesc: { fontSize: 13, color: GOLD, marginBottom: 16 },
  modalInput: {
    width: '100%', padding: 12, backgroundColor: CARD_BG, borderWidth: 1.5,
    borderColor: '#262626', borderRadius: 10, fontSize: 14, color: '#fff',
    marginBottom: 12,
  },
  modalBtn: {
    borderRadius: 10, height: 54, justifyContent: 'center', alignItems: 'center',
    backgroundColor: GOLD,
  },
  modalBtnText: { color: '#000', fontSize: 15, fontWeight: '800' },
  backBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    marginTop: 12, alignSelf: 'center',
  },
  highlight: { color: '#fff', fontWeight: '700' },
  successContainer: { alignItems: 'center', paddingVertical: 20 },
  successEmoji: { fontSize: 48, marginBottom: 12 },
  successTitle: { fontSize: 18, fontWeight: '800', color: GOLD, marginBottom: 8 },
  successDesc: { fontSize: 13, color: GOLD, marginBottom: 24 },
  faqItem: { borderBottomWidth: 1, borderBottomColor: '#262626', marginBottom: 2 },
  faqQuestion: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingVertical: 14,
  },
  faqQuestionText: { fontSize: 14, fontWeight: '700', color: '#fff', flex: 1 },
  faqAnswer: { fontSize: 13, color: GOLD, paddingBottom: 14, lineHeight: 20 },
  termsText: { fontSize: 12, color: GOLD, lineHeight: 20 },
});

