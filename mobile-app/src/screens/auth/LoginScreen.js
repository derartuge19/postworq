import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  KeyboardAvoidingView, Platform, Alert, ActivityIndicator,
  StatusBar, Image, ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useAuth } from '../../contexts/AuthContext';

const GOLD = '#C8B56A';
const BG   = '#0B0B0C';
const CARD = '#121214';
const BORDER = '#2A2A2E';
const GOLD_BORDER = 'rgba(200,181,106,0.3)';

const ethioLogo = require('../../image/Ethio telecom Logo PNG format.png');
const flipLogo  = require('../../image/final_logo.png');

export default function LoginScreen({ navigation }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPass, setShowPass]  = useState(false);
  const [loading, setLoading]    = useState(false);
  const [error, setError]        = useState('');
  const { login } = useAuth();

  const handleLogin = async () => {
    if (!username || !password) { setError('Please fill in all fields'); return; }
    setError('');
    setLoading(true);
    try { await login(username, password); }
    catch (e) { setError(e.message || 'Invalid credentials. Please try again.'); }
    finally { setLoading(false); }
  };

  return (
    <KeyboardAvoidingView style={s.container} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <StatusBar barStyle="light-content" backgroundColor={BG} />
      <ScrollView contentContainerStyle={s.scroll} showsVerticalScrollIndicator={false}>

        {/* Logos */}
        <LinearGradient
          colors={['#ffffff', '#888888', '#000000']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={s.logosRow}
        >
          <Image source={ethioLogo} style={s.logoLeft} resizeMode="contain" />
          <Image source={flipLogo}  style={s.logoRight} resizeMode="contain" />
        </LinearGradient>

        {/* Card */}
        <View style={s.card}>
          <View style={s.titleArea}>
            <Text style={s.title}>Welcome Back!</Text>
            <Text style={s.subtitle}>Log in to continue to FLIPSTAR</Text>
          </View>

          {/* Error */}
          {!!error && (
            <View style={s.errorBox}>
              <Text style={s.errorText}>⚠️ {error}</Text>
            </View>
          )}

          {/* Username */}
          <Text style={s.label}>USERNAME</Text>
          <View style={s.inputRow}>
            <Ionicons name="person-outline" size={17} color={GOLD} style={s.inputIcon} />
            <TextInput
              style={s.input}
              placeholder="Enter your username"
              placeholderTextColor="#71717A"
              value={username}
              onChangeText={setUsername}
              autoCapitalize="none"
            />
          </View>

          {/* Password */}
          <Text style={s.label}>6-DIGIT PIN</Text>
          <View style={s.inputRow}>
            <Ionicons name="lock-closed-outline" size={17} color={GOLD} style={s.inputIcon} />
            <TextInput
              style={[s.input, { flex: 1 }]}
              placeholder="••••••"
              placeholderTextColor="#71717A"
              value={password}
              onChangeText={(t) => setPassword(t.slice(0, 6))}
              secureTextEntry={!showPass}
              keyboardType="number-pad"
              maxLength={6}
            />
            <TouchableOpacity onPress={() => setShowPass(!showPass)} style={s.eyeBtn}>
              <Ionicons name={showPass ? 'eye-off-outline' : 'eye-outline'} size={17} color={GOLD} />
            </TouchableOpacity>
          </View>

          {/* Forgot */}
          <TouchableOpacity style={s.forgotRow}>
            <Text style={s.forgotText}>Forgot password?</Text>
          </TouchableOpacity>

          {/* Button */}
          <TouchableOpacity style={[s.btn, loading && { opacity: 0.7 }]} onPress={handleLogin} disabled={loading} activeOpacity={0.85}>
            {loading ? <ActivityIndicator color="#000" /> : <Text style={s.btnText}>Log In</Text>}
          </TouchableOpacity>

          {/* Sign up */}
          <TouchableOpacity onPress={() => navigation.navigate('Register')} style={s.linkRow}>
            <Text style={s.linkText}>Don't have an account? </Text>
            <Text style={s.link}>Sign up free</Text>
          </TouchableOpacity>
        </View>

      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: BG },
  scroll: { flexGrow: 1, padding: 20 },
  logosRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 32, marginTop: 40, borderRadius: 12, padding: 10 },
  logoLeft:  { width: 100, height: 50 },
  logoRight: { width: 100, height: 50 },
  card: { backgroundColor: CARD, borderRadius: 18, padding: 24, borderWidth: 1, borderColor: GOLD_BORDER },
  titleArea: { alignItems: 'center', marginBottom: 24 },
  title:    { fontSize: 24, fontWeight: '900', color: GOLD },
  subtitle: { fontSize: 13, color: GOLD, opacity: 0.8, marginTop: 4 },
  errorBox: { backgroundColor: '#2D1010', borderWidth: 1, borderColor: '#EF4444', borderRadius: 8, padding: 10, marginBottom: 16 },
  errorText: { color: '#EF4444', fontSize: 13, fontWeight: '600' },
  label: { fontSize: 12, fontWeight: '700', color: GOLD, marginBottom: 7, letterSpacing: 0.5 },
  inputRow: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: '#0B0B0C', borderRadius: 10,
    borderWidth: 1.5, borderColor: BORDER,
    paddingHorizontal: 14, height: 50, marginBottom: 16,
  },
  inputIcon: { marginRight: 10 },
  input: { flex: 1, fontSize: 15, color: '#F5F5F7' },
  eyeBtn: { padding: 4 },
  forgotRow: { alignItems: 'flex-end', marginBottom: 20, marginTop: -8 },
  forgotText: { color: GOLD, fontSize: 13, fontWeight: '700' },
  btn: {
    backgroundColor: GOLD, borderRadius: 10,
    height: 50, justifyContent: 'center', alignItems: 'center', marginBottom: 16,
  },
  btnText: { color: '#000', fontSize: 15, fontWeight: '800' },
  linkRow: { flexDirection: 'row', justifyContent: 'center' },
  linkText: { fontSize: 13, color: '#A1A1AA' },
  link: { fontSize: 13, color: GOLD, fontWeight: '700' },
});
