import React, { useState, useEffect, useRef } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  KeyboardAvoidingView, Platform, Alert, ActivityIndicator,
  ScrollView, StatusBar, Image, Animated,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import api from '../../api';
import { useAuth } from '../../contexts/AuthContext';

const GOLD     = '#F9E08B';
const BG       = '#1a1a1a';
const INPUT_BG = '#2a2a2a';

const ethioLogo = require('../../image/Ethio telecom Logo PNG format.png');
const flipLogo  = require('../../image/final_logo.png');

export default function RegisterScreen({ navigation }) {
  const { updateUser } = useAuth();
  const [step, setStep] = useState(1); // 1=phone, 2=otp, 3=account
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [verifiedPhone, setVerifiedPhone] = useState('');
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [resendTimer, setResendTimer] = useState(0);

  const otpRefs = useRef([]);
  const fadeAnim = useRef(new Animated.Value(1)).current;
  const slideAnim = useRef(new Animated.Value(0)).current;

  // Countdown for resend
  useEffect(() => {
    if (resendTimer <= 0) return;
    const timer = setTimeout(() => setResendTimer(r => r - 1), 1000);
    return () => clearTimeout(timer);
  }, [resendTimer]);

  // Animate step transitions
  useEffect(() => {
    fadeAnim.setValue(0);
    slideAnim.setValue(20);
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }),
    ]).start();
  }, [step]);

  // Step 1: Send OTP
  const handleSendOtp = async () => {
    setError('');
    if (!phone) { setError('Please enter your phone number'); return; }
    setLoading(true);
    try {
      const res = await api.sendPhoneOTP(phone);
      setVerifiedPhone(res.phone);
      setStep(2);
      setResendTimer(60);
      if (res.dev_code) setError(`DEV MODE — Your code is: ${res.dev_code}`);
    } catch (e) {
      setError(e?.message || 'Failed to send OTP. Check your phone number.');
    } finally {
      setLoading(false);
    }
  };

  // Step 2: Verify OTP
  const handleVerifyOtp = async () => {
    setError('');
    if (otp.length !== 6) { setError('Enter the 6-digit code'); return; }
    setLoading(true);
    try {
      await api.verifyPhoneOTP(verifiedPhone, otp);
      setStep(3);
    } catch (e) {
      setError(e?.message || 'Invalid or expired code');
    } finally {
      setLoading(false);
    }
  };

  // Step 3: Create Account
  const handleRegister = async () => {
    setError('');
    if (!username) { setError('Please choose a username'); return; }
    if (!/^\d{6}$/.test(password)) { setError('Password must be exactly 6 digits (numbers only)'); return; }
    if (password !== confirmPassword) { setError('Passwords do not match'); return; }
    setLoading(true);
    try {
      const res = await api.registerWithPhone(verifiedPhone, username, password, email);
      await api.setAuthToken(res.token);
      if (res.user) {
        updateUser(res.user);
      }
      Alert.alert('Success', 'Account created successfully!', [
        { text: 'OK', onPress: () => {} }
      ]);
    } catch (e) {
      console.error('Registration error:', e);
      let errorMsg = 'Registration failed. Please try again.';
      if (e?.message) {
        errorMsg = e.message;
      }
      setError(errorMsg);
      Alert.alert('Registration Error', errorMsg);
    } finally {
      setLoading(false);
    }
  };

  const handleOtpChange = (index, value) => {
    const newOtp = otp.split('');
    newOtp[index] = value;
    setOtp(newOtp.join(''));
    if (value && index < 5) {
      otpRefs.current[index + 1]?.focus();
    }
  };

  const handleOtpKeyPress = (index, key) => {
    if (key === 'Backspace' && !otp[index] && index > 0) {
      otpRefs.current[index - 1]?.focus();
    }
  };

  const StepDot = ({ active, done }) => (
    <View style={[
      styles.stepDot,
      active && styles.stepDotActive,
      done && styles.stepDotDone
    ]}>
      {done && <Text style={styles.stepDotText}>✓</Text>}
    </View>
  );

  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <StatusBar barStyle="light-content" backgroundColor={BG} />
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>

        {/* Logos */}
        <View style={styles.logosRow}>
          <Image source={ethioLogo} style={styles.logoLeft} resizeMode="contain" />
          <Image source={flipLogo} style={styles.logoRight} resizeMode="contain" />
        </View>

        {/* Step indicator */}
        <View style={styles.stepIndicator}>
          <StepDot active={step === 1} done={step > 1} />
          <View style={[styles.stepLine, step > 1 && styles.stepLineActive]} />
          <StepDot active={step === 2} done={step > 2} />
          <View style={[styles.stepLine, step > 2 && styles.stepLineActive]} />
          <StepDot active={step === 3} done={false} />
        </View>

        {/* Card */}
        <View style={styles.card}>

          {/* Error message */}
          {error && !error.startsWith('DEV') && (
            <View style={styles.errorBox}>
              <Text style={styles.errorText}>⚠️ {error}</Text>
            </View>
          )}
          {error.startsWith('DEV') && (
            <View style={styles.devCodeBox}>
              <Text style={styles.devCodeText}>{error}</Text>
            </View>
          )}

          <Animated.View style={{
            opacity: fadeAnim,
            transform: [{ translateY: slideAnim }],
          }}>
          {/* Step 1: Phone */}
          {step === 1 && (
            <>
              <View style={styles.stepHeader}>
                <Text style={styles.stepEmoji}>📱</Text>
                <Text style={styles.stepTitle}>Enter Your Phone</Text>
                <Text style={styles.stepSubtitle}>Ethiopian number — an OTP will be sent via SMS</Text>
              </View>
              
              <View style={styles.field}>
                <Text style={styles.label}>Phone Number</Text>
                <View style={styles.inputWrapper}>
                  <Ionicons name="call-outline" size={18} color={GOLD} style={styles.inputIcon} />
                  <TextInput
                    style={styles.input}
                    placeholder="09XXXXXXXX or +251XXXXXXXXX"
                    placeholderTextColor="#666"
                    value={phone}
                    onChangeText={setPhone}
                    keyboardType="phone-pad"
                    autoCapitalize="none"
                  />
                </View>
              </View>

              <TouchableOpacity style={[styles.btn, loading && { opacity: 0.7 }]} onPress={handleSendOtp} disabled={loading}>
                {loading ? <ActivityIndicator color="#000" /> : <Text style={styles.btnText}>Send OTP →</Text>}
              </TouchableOpacity>
            </>
          )}

          {/* Step 2: OTP */}
          {step === 2 && (
            <>
              <View style={styles.stepHeader}>
                <Text style={styles.stepEmoji}>🔐</Text>
                <Text style={styles.stepTitle}>Verify Code</Text>
                <Text style={styles.stepSubtitle}>Code sent to <Text style={styles.highlight}>{verifiedPhone}</Text></Text>
              </View>

              <View style={styles.otpContainer}>
                {[0, 1, 2, 3, 4, 5].map((index) => (
                  <TextInput
                    key={index}
                    ref={ref => otpRefs.current[index] = ref}
                    style={styles.otpInput}
                    value={otp[index] || ''}
                    onChangeText={(value) => handleOtpChange(index, value)}
                    onKeyPress={({ nativeEvent }) => handleOtpKeyPress(index, nativeEvent.key)}
                    keyboardType="number-pad"
                    maxLength={1}
                    textAlign="center"
                  />
                ))}
              </View>

              <TouchableOpacity style={[styles.btn, loading && { opacity: 0.7 }]} onPress={handleVerifyOtp} disabled={loading || otp.length < 6}>
                {loading ? <ActivityIndicator color="#000" /> : <Text style={styles.btnText}>Verify Code →</Text>}
              </TouchableOpacity>

              <View style={styles.otpActions}>
                <TouchableOpacity onPress={() => { setStep(1); setOtp(''); setError(''); }}>
                  <Text style={styles.link}>← Change number</Text>
                </TouchableOpacity>
                {resendTimer > 0 ? (
                  <Text style={styles.resendText}>Resend in {resendTimer}s</Text>
                ) : (
                  <TouchableOpacity onPress={handleSendOtp}>
                    <Text style={styles.link}>Resend OTP</Text>
                  </TouchableOpacity>
                )}
              </View>
            </>
          )}

          {/* Step 3: Account */}
          {step === 3 && (
            <>
              <View style={styles.stepHeader}>
                <Ionicons name="checkmark-circle" size={36} color={GOLD} />
                <Text style={styles.stepTitle}>Create Account</Text>
                <Text style={styles.stepSubtitle}>Phone verified ✓ — choose your username & PIN</Text>
              </View>

              <View style={styles.field}>
                <Text style={styles.label}>Username</Text>
                <View style={styles.inputWrapper}>
                  <Ionicons name="person-outline" size={18} color={GOLD} style={styles.inputIcon} />
                  <TextInput
                    style={styles.input}
                    placeholder="Choose a unique username"
                    placeholderTextColor="#666"
                    value={username}
                    onChangeText={(value) => setUsername(value.toLowerCase().replace(/\s/g, ''))}
                    autoCapitalize="none"
                  />
                </View>
              </View>

              <View style={styles.field}>
                <Text style={styles.label}>Email (optional)</Text>
                <View style={styles.inputWrapper}>
                  <Ionicons name="mail-outline" size={18} color={GOLD} style={styles.inputIcon} />
                  <TextInput
                    style={styles.input}
                    placeholder="your@email.com"
                    placeholderTextColor="#666"
                    value={email}
                    onChangeText={setEmail}
                    keyboardType="email-address"
                    autoCapitalize="none"
                  />
                </View>
              </View>

              <View style={styles.field}>
                <Text style={styles.label}>6-Digit PIN Password</Text>
                <View style={styles.inputWrapper}>
                  <Ionicons name="lock-closed-outline" size={18} color={GOLD} style={styles.inputIcon} />
                  <TextInput
                    style={[styles.input, { flex: 1 }]}
                    placeholder="••••••"
                    placeholderTextColor="#666"
                    value={password}
                    onChangeText={(value) => setPassword(value.replace(/\D/g, '').slice(0, 6))}
                    keyboardType="number-pad"
                    maxLength={6}
                    secureTextEntry={!showPassword}
                  />
                  <TouchableOpacity onPress={() => setShowPassword(!showPassword)} style={styles.eyeBtn}>
                    <Ionicons name={showPassword ? 'eye-off-outline' : 'eye-outline'} size={18} color={GOLD} />
                  </TouchableOpacity>
                </View>
              </View>

              <View style={styles.field}>
                <Text style={styles.label}>Confirm PIN</Text>
                <View style={styles.inputWrapper}>
                  <Ionicons name="lock-closed-outline" size={18} color={GOLD} style={styles.inputIcon} />
                  <TextInput
                    style={[styles.input, { flex: 1 }]}
                    placeholder="••••••"
                    placeholderTextColor="#666"
                    value={confirmPassword}
                    onChangeText={(value) => setConfirmPassword(value.replace(/\D/g, '').slice(0, 6))}
                    keyboardType="number-pad"
                    maxLength={6}
                    secureTextEntry={!showConfirm}
                  />
                  <TouchableOpacity onPress={() => setShowConfirm(!showConfirm)} style={styles.eyeBtn}>
                    <Ionicons name={showConfirm ? 'eye-off-outline' : 'eye-outline'} size={18} color={GOLD} />
                  </TouchableOpacity>
                </View>
              </View>

              <Text style={styles.passwordHint}>Password must be exactly 6 digits (e.g. 123456)</Text>

              <TouchableOpacity style={[styles.btn, loading && { opacity: 0.7 }]} onPress={handleRegister} disabled={loading}>
                {loading ? <ActivityIndicator color="#000" /> : <Text style={styles.btnText}>Create Account 🚀</Text>}
              </TouchableOpacity>
            </>
          )}
          </Animated.View>

          {/* Footer */}
          <View style={styles.footer}>
            <Text style={styles.footerText}>Already have an account? </Text>
            <TouchableOpacity onPress={() => navigation.navigate('Login')}>
              <Text style={styles.footerLink}>Log in</Text>
            </TouchableOpacity>
          </View>
        </View>

      </ScrollView>
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

  stepIndicator: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 8, marginVertical: 24,
  },
  stepDot: {
    width: 10, height: 10, borderRadius: 5, backgroundColor: '#262626',
  },
  stepDotActive: {
    width: 22, height: 22, borderRadius: 11, backgroundColor: GOLD,
  },
  stepDotDone: {
    width: 22, height: 22, borderRadius: 11, backgroundColor: GOLD,
  },
  stepDotText: {
    color: '#000', fontSize: 11, fontWeight: '700',
  },
  stepLine: {
    width: 32, height: 2, backgroundColor: '#262626', borderRadius: 1,
  },
  stepLineActive: {
    backgroundColor: GOLD,
  },

  card: {
    backgroundColor: INPUT_BG, borderRadius: 18, padding: 24,
    borderWidth: 1, borderColor: '#F9E08B30', marginHorizontal: 16,
  },

  errorBox: {
    padding: 11, backgroundColor: '#2D1010', borderWidth: 1, borderColor: '#EF4444',
    borderRadius: 8, marginBottom: 16,
  },
  errorText: { color: '#EF4444', fontSize: 13, fontWeight: '600' },
  devCodeBox: {
    padding: 10, backgroundColor: '#1A2A1A', borderWidth: 1, borderColor: '#22C55E',
    borderRadius: 8, marginBottom: 16, alignItems: 'center',
  },
  devCodeText: { color: '#22C55E', fontSize: 13, fontWeight: '700' },

  stepHeader: { alignItems: 'center', marginBottom: 20 },
  stepEmoji: { fontSize: 36, marginBottom: 8 },
  stepTitle: { fontSize: 22, fontWeight: '900', color: GOLD, marginBottom: 4 },
  stepSubtitle: { fontSize: 13, color: GOLD },
  highlight: { color: '#fff', fontWeight: '700' },

  field: { marginBottom: 16 },
  label: { fontSize: 12, fontWeight: '700', color: GOLD, marginBottom: 8, letterSpacing: 0.5 },

  inputWrapper: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: '#1A1A1A', borderRadius: 10,
    borderWidth: 1.5, borderColor: '#262626',
    paddingHorizontal: 14, height: 54,
  },
  inputIcon: { marginRight: 10 },
  input: { fontSize: 15, color: GOLD, flex: 1 },
  eyeBtn: { padding: 4 },

  otpContainer: {
    flexDirection: 'row', gap: 10, justifyContent: 'center',
    marginVertical: 24,
  },
  otpInput: {
    width: 46, height: 54, borderRadius: 10, textAlign: 'center',
    fontSize: 22, fontWeight: '800', color: '#fff',
    backgroundColor: '#1A1A1A',
    borderWidth: 2, borderColor: '#262626',
  },

  btn: {
    borderRadius: 10, height: 54,
    justifyContent: 'center', alignItems: 'center',
    marginTop: 4, marginBottom: 16,
    backgroundColor: GOLD,
  },
  btnText: { color: '#000', fontSize: 15, fontWeight: '800' },

  otpActions: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
  },
  link: { color: GOLD, fontSize: 13, fontWeight: '700' },
  resendText: { color: '#666', fontSize: 12 },

  passwordHint: {
    fontSize: 11, color: '#666', marginBottom: 16, marginTop: -8,
  },

  footer: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center' },
  footerText: { fontSize: 13, color: '#666' },
  footerLink: { fontSize: 13, color: GOLD, fontWeight: '700' },
});

