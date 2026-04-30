import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView, Modal, Image } from 'react-native';
import { useAuth } from '../../contexts/AuthContext';
import api from '../../api';

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

export default function LoginScreen({ navigation }) {
  const [phoneNumber, setPhoneNumber] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [modal, setModal] = useState(null); // 'forgot' | 'faq' | 'terms'
  const [faqOpen, setFaqOpen] = useState(null);
  const { login } = useAuth();

  const handleLogin = async () => {
    if (!phoneNumber || !password) {
      setError('Please fill in all fields');
      return;
    }
    
    setError('');
    setLoading(true);
    
    try {
      await login(phoneNumber, password);
    } catch (e) {
      setError(e.message || 'Invalid credentials. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.scrollContent}>
      {/* FAQ Modal */}
      <Modal visible={modal === 'faq'} animationType="slide" presentationStyle="pageSheet">
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>FAQ</Text>
            <TouchableOpacity onPress={() => setModal(null)}>
              <Text style={styles.closeButton}>✕</Text>
            </TouchableOpacity>
          </View>
          {FAQ_ITEMS.map((item, i) => (
            <View key={i} style={styles.faqItem}>
              <TouchableOpacity 
                onPress={() => setFaqOpen(faqOpen === i ? null : i)}
                style={styles.faqQuestion}
              >
                <Text style={styles.faqQuestionText}>{item.q}</Text>
                <Text style={styles.faqToggle}>{faqOpen === i ? '−' : '+'}</Text>
              </TouchableOpacity>
              {faqOpen === i && <Text style={styles.faqAnswer}>{item.a}</Text>}
            </View>
          ))}
        </View>
      </Modal>

      {/* Terms Modal */}
      <Modal visible={modal === 'terms'} animationType="slide" presentationStyle="pageSheet">
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Terms & Conditions</Text>
            <TouchableOpacity onPress={() => setModal(null)}>
              <Text style={styles.closeButton}>✕</Text>
            </TouchableOpacity>
          </View>
          <ScrollView style={styles.termsContent}>
            <Text style={styles.termsText}>{TERMS}</Text>
          </ScrollView>
        </View>
      </Modal>

      {/* Forgot Password Modal */}
      <Modal visible={modal === 'forgot'} animationType="slide" presentationStyle="pageSheet">
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Forgot Password</Text>
            <TouchableOpacity onPress={() => setModal(null)}>
              <Text style={styles.closeButton}>✕</Text>
            </TouchableOpacity>
          </View>
          <Text style={styles.forgotDescription}>Enter your email to receive a password reset code.</Text>
          <TextInput
            style={styles.input}
            placeholder="your@email.com"
            placeholderTextColor="#666"
            keyboardType="email-address"
            autoCapitalize="none"
          />
          <TouchableOpacity style={styles.button}>
            <Text style={styles.buttonText}>Send Reset Code</Text>
          </TouchableOpacity>
        </View>
      </Modal>

      <View style={styles.content}>
        {/* Logos */}
        <View style={styles.logoContainer}>
          <Image 
            source={require('../../../assets/ethio-logo.png')} 
            style={styles.logoImage}
            resizeMode="contain"
          />
          <Image 
            source={require('../../../assets/flipstar-logo.png')} 
            style={styles.logoImage}
            resizeMode="contain"
          />
        </View>

        {/* Card */}
        <View style={styles.card}>
          <View style={styles.header}>
            <Text style={styles.title}>Welcome Back!</Text>
            <Text style={styles.subtitle}>Log in to continue to FLIPSTAR</Text>
          </View>

          {error ? <Text style={styles.error}>⚠️ {error}</Text> : null}

          {/* Phone Number field */}
          <View style={styles.inputContainer}>
            <Text style={styles.label}>Phone Number</Text>
            <View style={styles.inputWrapper}>
              <Text style={styles.inputIcon}>📱</Text>
              <TextInput
                style={styles.textInput}
                value={phoneNumber}
                onChangeText={setPhoneNumber}
                placeholder="09XXXXXXXX or +251XXXXXXXXX"
                placeholderTextColor="#666"
                keyboardType="phone-pad"
              />
            </View>
          </View>

          {/* Password field */}
          <View style={styles.inputContainer}>
            <Text style={styles.label}>6-Digit PIN</Text>
            <View style={styles.inputWrapper}>
              <Text style={styles.inputIcon}>🔒</Text>
              <TextInput
                style={styles.textInput}
                value={password}
                onChangeText={setPassword}
                placeholder="••••••"
                placeholderTextColor="#666"
                secureTextEntry={!showPassword}
                maxLength={6}
                keyboardType="numeric"
              />
              <TouchableOpacity onPress={() => setShowPassword(!showPassword)} style={styles.eyeButton}>
                <Text style={styles.eyeText}>{showPassword ? '👁️' : '👁️‍🗨️'}</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Forgot password */}
          <TouchableOpacity onPress={() => setModal('forgot')}>
            <Text style={styles.forgotLink}>Forgot password?</Text>
          </TouchableOpacity>

          {/* Submit button */}
          <TouchableOpacity 
            style={[styles.button, loading && styles.buttonDisabled]}
            onPress={handleLogin}
            disabled={loading}
          >
            <Text style={styles.buttonText}>
              {loading ? 'Logging in...' : 'Log In'}
            </Text>
          </TouchableOpacity>

          {/* Sign up link */}
          <View style={styles.signupContainer}>
            <Text style={styles.signupText}>Don't have an account? </Text>
            <TouchableOpacity onPress={() => navigation.navigate('Register')}>
              <Text style={styles.signupLink}>Sign up free</Text>
            </TouchableOpacity>
          </View>
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
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0D0D0D',
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: 20,
  },
  content: {
    maxWidth: 420,
    width: '100%',
    alignSelf: 'center',
  },
  logoContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
    borderRadius: 12,
    padding: 10,
    backgroundColor: 'linear-gradient(to right, #ffffff, #888888, #000000)',
  },
  logoImage: {
    width: 100,
    height: 50,
  },
  card: {
    backgroundColor: '#1A1A1A',
    borderRadius: 18,
    padding: 24,
    borderWidth: 1,
    borderColor: '#F9E08B30',
  },
  header: {
    alignItems: 'center',
    marginBottom: 24,
  },
  title: {
    fontSize: 26,
    fontWeight: '900',
    color: '#F9E08B',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 13,
    color: '#F9E08B',
  },
  error: {
    color: '#EF4444',
    fontSize: 13,
    fontWeight: '600',
    marginBottom: 16,
    textAlign: 'center',
    padding: 10,
    backgroundColor: '#2D1010',
    borderWidth: 1,
    borderColor: '#EF4444',
    borderRadius: 8,
  },
  inputContainer: {
    marginBottom: 16,
  },
  label: {
    fontSize: 12,
    fontWeight: '700',
    color: '#F9E08B',
    marginBottom: 7,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  inputWrapper: {
    position: 'relative',
  },
  inputIcon: {
    position: 'absolute',
    left: 14,
    top: '50%',
    transform: [{ translateY: -10 }],
    color: '#F9E08B',
    fontSize: 17,
  },
  textInput: {
    width: '100%',
    padding: 13,
    paddingLeft: 46,
    paddingRight: 46,
    backgroundColor: '#1A1A1A',
    borderWidth: 1.5,
    borderColor: '#262626',
    borderRadius: 10,
    fontSize: 15,
    color: '#fff',
  },
  eyeButton: {
    position: 'absolute',
    right: 14,
    top: '50%',
    transform: [{ translateY: -10 }],
  },
  eyeText: {
    color: '#F9E08B',
    fontSize: 17,
  },
  forgotLink: {
    color: '#F9E08B',
    fontSize: 12,
    fontWeight: '700',
    textAlign: 'right',
    marginBottom: 20,
  },
  button: {
    width: '100%',
    padding: 14,
    backgroundColor: '#F9E08B',
    borderWidth: 0,
    borderRadius: 10,
    marginBottom: 16,
  },
  buttonDisabled: {
    backgroundColor: '#3A3A3A',
  },
  buttonText: {
    color: '#000',
    fontSize: 15,
    fontWeight: '800',
    textAlign: 'center',
  },
  signupContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  signupText: {
    color: '#666',
    fontSize: 13,
  },
  signupLink: {
    color: '#F9E08B',
    fontSize: 13,
    fontWeight: '700',
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 24,
    marginTop: 20,
    paddingBottom: 20,
  },
  footerLink: {
    color: '#F9E08B',
    fontSize: 13,
    fontWeight: '600',
  },
  footerSeparator: {
    color: '#262626',
    fontSize: 13,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: '#111',
    borderTopLeftRadius: 18,
    borderTopRightRadius: 18,
    padding: 24,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '900',
    color: '#F9E08B',
  },
  closeButton: {
    color: '#F9E08B',
    fontSize: 22,
    fontWeight: 'bold',
  },
  faqItem: {
    borderBottomWidth: 1,
    borderBottomColor: '#262626',
    marginBottom: 2,
  },
  faqQuestion: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 14,
  },
  faqQuestionText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#fff',
    flex: 1,
  },
  faqToggle: {
    fontSize: 16,
    color: '#F9E08B',
  },
  faqAnswer: {
    fontSize: 13,
    color: '#F9E08B',
    paddingBottom: 14,
    lineHeight: 20,
  },
  termsContent: {
    flex: 1,
  },
  termsText: {
    fontSize: 12,
    color: '#F9E08B',
    lineHeight: 20,
    fontFamily: 'monospace',
  },
  forgotDescription: {
    fontSize: 13,
    color: '#F9E08B',
    marginBottom: 16,
  },
});
