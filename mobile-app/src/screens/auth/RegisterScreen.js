import React, { useState, useEffect } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  KeyboardAvoidingView, Platform, Alert, ActivityIndicator,
  ScrollView, StatusBar, Image,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../contexts/AuthContext';
import api from '../../api';

const GOLD = '#C8B56A';
const BG   = '#0B0B0C';
const CARD = '#121214';
const BORDER = '#2A2A2E';
const GOLD_BORDER = 'rgba(200,181,106,0.3)';

const ethioLogo = require('../../image/Ethio telecom Logo PNG format.png');
const flipLogo  = require('../../image/final_logo.png');

export default function RegisterScreen({ navigation }) {
  const [step, setStep]           = useState(1); // 1=form, 2=otp
  const [username, setUsername]   = useState('');
  const [email, setEmail]         = useState('');
  const [phone, setPhone]         = useState('');
  const [password, setPassword]   = useState('');
  const [confirm, setConfirm]     = useState('');
  const [otp, setOtp]             = useState('');
  const [devCode, setDevCode]     = useState('');
  const [verifiedPhone, setVerifiedPhone] = useState('');
  const [showPwd, setShowPwd]     = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading]     = useState(false);
  const [error, setError]         = useState('');
  const [resendTimer, setResendTimer] = useState(0);
  const { register } = useAuth();

  useEffect(() => {
    if (resendTimer <= 0) return;
    const t = setTimeout(() => setResendTimer(r => r - 1), 1000);
    return () => clearTimeout(t);
  }, [resendTimer]);

  const handleSendOtp = async () => {
    setError('');
    if (!username) { setError('Please enter a username'); return; }
    if (!email)    { setError('Please enter your email'); return; }
    if (!phone)    { setError('Please enter your phone number'); return; }
    if (!/^\d{6}$/.test(password)) { setError('Password must be exactly 6 digits'); return; }
    if (password !== confirm) { setError('Passwords do not match'); return; }
    setLoading(true);
    try {
      const res = await api.sendPhoneOtp(phone);
      setVerifiedPhone(res.phone);
      setResendTimer(60);
      if (res.dev_code) setDevCode(res.dev_code);
      setStep(2);
    } catch (e) {
      setError(e?.message || 'Failed to send OTP. Check your phone number.');
    } finally { setLoading(false); }
  };

  const handleVerifyAndRegister = async () => {
    setError('');
    if (otp.length !== 6) { setError('Enter the 6-digit code'); return; }
    setLoading(true);
    try {
      await api.verifyPhoneOtp(verifiedPhone, otp);
      await register(username, email, password, '', '');
    } catch (e) {
      setError(e?.message || 'Invalid code or registration failed.');
    } finally { setLoading(false); }
  };

  const Field = ({ label, icon, children }) => (
    <View style={{ marginBottom: 14 }}>
      <Text style={s.label}>{label}</Text>
      <View style={s.inputRow}>
        <Ionicons name={icon} size={17} color={GOLD} style={s.inputIcon} />
        {children}
      </View>
    </View>
  );

  return (
    <KeyboardAvoidingView style={s.container} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <StatusBar barStyle="light-content" backgroundColor={BG} />
      <ScrollView contentContainerStyle={s.scroll} showsVerticalScrollIndicator={false}>

        {/* Logos */}
        <View style={s.logosRow}>
          <Image source={ethioLogo} style={s.logoLeft}  resizeMode="contain" />
          <Image source={flipLogo}  style={s.logoRight} resizeMode="contain" />
        </View>

        {/* Step indicator */}
        <View style={s.stepRow}>
          <View style={[s.stepDot, step === 1 && s.stepDotActive, step > 1 && s.stepDotDone]} />
          <View style={[s.stepLine, step > 1 && s.stepLineDone]} />
          <View style={[s.stepDot, step === 2 && s.stepDotActive]} />
        </View>

        {/* Card */}
        <View style={s.card}>

          {/* STEP 1: Form */}
          {step === 1 && (
            <>
              <View style={s.titleArea}>
                <Text style={{ fontSize: 32, marginBottom: 8 }}>📱</Text>
                <Text style={s.title}>Create Account</Text>
                <Text style={s.subtitle}>Fill in your details to get started</Text>
              </View>

              {!!error && <View style={s.errorBox}><Text style={s.errorText}>⚠️ {error}</Text></View>}

              <Field label="USERNAME *" icon="person-outline">
                <TextInput style={s.input} placeholder="Choose a unique username" placeholderTextColor="#71717A"
                  value={username} onChangeText={t => setUsername(t.toLowerCase().replace(/\s/g, ''))} autoCapitalize="none" />
              </Field>
              <Field label="EMAIL *" icon="mail-outline">
                <TextInput style={s.input} placeholder="your@email.com" placeholderTextColor="#71717A"
                  value={email} onChangeText={setEmail} keyboardType="email-address" autoCapitalize="none" />
              </Field>
              <Field label="PHONE NUMBER *" icon="call-outline">
                <TextInput style={s.input} placeholder="09XXXXXXXX or +251XXXXXXXXX" placeholderTextColor="#71717A"
                  value={phone} onChangeText={setPhone} keyboardType="phone-pad" />
              </Field>
              <Field label="6-DIGIT PIN *" icon="lock-closed-outline">
                <TextInput style={[s.input, { flex: 1 }]} placeholder="••••••" placeholderTextColor="#71717A"
                  value={password} onChangeText={t => setPassword(t.replace(/\D/g, '').slice(0, 6))}
                  secureTextEntry={!showPwd} keyboardType="number-pad" maxLength={6} />
                <TouchableOpacity onPress={() => setShowPwd(!showPwd)} style={s.eyeBtn}>
                  <Ionicons name={showPwd ? 'eye-off-outline' : 'eye-outline'} size={17} color={GOLD} />
                </TouchableOpacity>
              </Field>
              <Field label="CONFIRM PIN *" icon="lock-closed-outline">
                <TextInput style={[s.input, { flex: 1 }]} placeholder="••••••" placeholderTextColor="#71717A"
                  value={confirm} onChangeText={t => setConfirm(t.replace(/\D/g, '').slice(0, 6))}
                  secureTextEntry={!showConfirm} keyboardType="number-pad" maxLength={6} />
                <TouchableOpacity onPress={() => setShowConfirm(!showConfirm)} style={s.eyeBtn}>
                  <Ionicons name={showConfirm ? 'eye-off-outline' : 'eye-outline'} size={17} color={GOLD} />
                </TouchableOpacity>
              </Field>

              <TouchableOpacity style={[s.btn, loading && { opacity: 0.7 }]} onPress={handleSendOtp} disabled={loading} activeOpacity={0.85}>
                {loading ? <ActivityIndicator color="#000" /> : <Text style={s.btnText}>Send OTP →</Text>}
              </TouchableOpacity>
            </>
          )}

          {/* STEP 2: OTP */}
          {step === 2 && (
            <>
              <View style={s.titleArea}>
                <Text style={{ fontSize: 32, marginBottom: 8 }}>🔐</Text>
                <Text style={s.title}>Verify Code</Text>
                <Text style={s.subtitle}>Code sent to {verifiedPhone}</Text>
              </View>

              {!!error && <View style={s.errorBox}><Text style={s.errorText}>⚠️ {error}</Text></View>}

              {/* DEV MODE: show OTP */}
              {!!devCode && (
                <View style={s.devBox}>
                  <Text style={s.devText}>🧪 DEV — Your OTP: <Text style={{ fontSize: 20, letterSpacing: 4 }}>{devCode}</Text></Text>
                </View>
              )}

              <Text style={s.label}>6-DIGIT CODE</Text>
              <View style={s.inputRow}>
                <Ionicons name="keypad-outline" size={17} color={GOLD} style={s.inputIcon} />
                <TextInput style={[s.input, { flex: 1, letterSpacing: 8, fontSize: 18 }]}
                  placeholder="• • • • • •" placeholderTextColor="#71717A"
                  value={otp} onChangeText={t => setOtp(t.replace(/\D/g, '').slice(0, 6))}
                  keyboardType="number-pad" maxLength={6} />
              </View>

              <TouchableOpacity style={[s.btn, loading && { opacity: 0.7 }]} onPress={handleVerifyAndRegister} disabled={loading || otp.length < 6} activeOpacity={0.85}>
                {loading ? <ActivityIndicator color="#000" /> : <Text style={s.btnText}>Verify & Register 🚀</Text>}
              </TouchableOpacity>

              <View style={s.resendRow}>
                <TouchableOpacity onPress={() => { setStep(1); setOtp(''); setError(''); setDevCode(''); }} style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                  <Ionicons name="chevron-back" size={14} color={GOLD} />
                  <Text style={{ color: GOLD, fontSize: 13 }}>Go back</Text>
                </TouchableOpacity>
                {resendTimer > 0 ? (
                  <Text style={{ color: '#71717A', fontSize: 12 }}>Resend in {resendTimer}s</Text>
                ) : (
                  <TouchableOpacity onPress={handleSendOtp}>
                    <Text style={{ color: GOLD, fontSize: 13, fontWeight: '700' }}>Resend OTP</Text>
                  </TouchableOpacity>
                )}
              </View>
            </>
          )}

          {/* Login link */}
          <TouchableOpacity onPress={() => navigation.navigate('Login')} style={[s.linkRow, { marginTop: 8 }]}>
            <Text style={s.linkText}>Already have an account? </Text>
            <Text style={s.link}>Login</Text>
          </TouchableOpacity>
        </View>

      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: BG },
  scroll: { flexGrow: 1, padding: 20 },
  logosRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20, marginTop: 40 },
  logoLeft:  { width: 100, height: 50 },
  logoRight: { width: 100, height: 50 },
  stepRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, marginBottom: 24 },
  stepDot: { width: 12, height: 12, borderRadius: 6, backgroundColor: BORDER, borderWidth: 2, borderColor: BORDER },
  stepDotActive: { backgroundColor: GOLD, borderColor: GOLD },
  stepDotDone: { backgroundColor: GOLD, borderColor: GOLD },
  stepLine: { width: 48, height: 2, backgroundColor: BORDER, borderRadius: 1 },
  stepLineDone: { backgroundColor: GOLD },
  card: { backgroundColor: CARD, borderRadius: 18, padding: 24, borderWidth: 1, borderColor: GOLD_BORDER },
  titleArea: { alignItems: 'center', marginBottom: 20 },
  title:    { fontSize: 22, fontWeight: '900', color: GOLD },
  subtitle: { fontSize: 13, color: GOLD, opacity: 0.8, marginTop: 4, textAlign: 'center' },
  errorBox: { backgroundColor: '#2D1010', borderWidth: 1, borderColor: '#EF4444', borderRadius: 8, padding: 10, marginBottom: 14 },
  errorText: { color: '#EF4444', fontSize: 13, fontWeight: '600' },
  devBox: { backgroundColor: '#1A2A1A', borderWidth: 1.5, borderColor: '#22C55E', borderRadius: 10, padding: 12, marginBottom: 14, alignItems: 'center' },
  devText: { color: '#22C55E', fontSize: 13, fontWeight: '700' },
  label: { fontSize: 12, fontWeight: '700', color: GOLD, marginBottom: 7, letterSpacing: 0.5 },
  inputRow: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: BG, borderRadius: 10,
    borderWidth: 1.5, borderColor: BORDER,
    paddingHorizontal: 14, height: 50,
  },
  inputIcon: { marginRight: 10 },
  input: { flex: 1, fontSize: 15, color: '#F5F5F7' },
  eyeBtn: { padding: 4 },
  btn: {
    backgroundColor: GOLD, borderRadius: 10,
    height: 50, justifyContent: 'center', alignItems: 'center', marginTop: 8, marginBottom: 8,
  },
  btnText: { color: '#000', fontSize: 15, fontWeight: '800' },
  resendRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 12, marginBottom: 8 },
  linkRow: { flexDirection: 'row', justifyContent: 'center' },
  linkText: { fontSize: 13, color: '#A1A1AA' },
  link: { fontSize: 13, color: GOLD, fontWeight: '700' },
});
