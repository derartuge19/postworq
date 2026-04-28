import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  KeyboardAvoidingView, Platform, Alert, ActivityIndicator,
  StatusBar, Image, ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../contexts/AuthContext';

const GOLD = '#F9E08B';
const BG   = '#1a1a1a';
const CARD = '#222222';
const INPUT_BG = '#2a2a2a';

const ethioLogo = require('../../image/Ethio telecom Logo PNG format.png');
const flipLogo  = require('../../image/final_logo.png');

export default function LoginScreen({ navigation }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading]   = useState(false);
  const { login } = useAuth();

  const handleLogin = async () => {
    if (!username || !password) { Alert.alert('Error', 'Please fill in all fields'); return; }
    if (password.length !== 6) { Alert.alert('Error', 'PIN must be 6 digits'); return; }
    setLoading(true);
    try { await login(username, password); }
    catch (e) { Alert.alert('Login Failed', e.message || 'Invalid credentials'); }
    finally { setLoading(false); }
  };

  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <StatusBar barStyle="light-content" backgroundColor={BG} />
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>

        {/* Logos */}
        <View style={styles.logosRow}>
          <Image source={ethioLogo} style={styles.logoLeft}  resizeMode="contain" />
          <Image source={flipLogo}  style={styles.logoRight} resizeMode="contain" />
        </View>

        {/* Title */}
        <View style={styles.titleArea}>
          <Text style={styles.title}>Welcome Back!</Text>
          <Text style={styles.subtitle}>Log in to continue to FLIPSTAR</Text>
        </View>

        {/* Form */}
        <View style={styles.form}>
          <Text style={styles.label}>PHONE NUMBER</Text>
          <View style={styles.inputWrapper}>
            <Ionicons name="call-outline" size={18} color={GOLD} style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              placeholder="Enter your phone number"
              placeholderTextColor="#666"
              value={username}
              onChangeText={setUsername}
              autoCapitalize="none"
              keyboardType="phone-pad"
            />
          </View>

          <Text style={styles.label}>6-DIGIT PIN</Text>
          <View style={styles.inputWrapper}>
            <Ionicons name="lock-closed-outline" size={18} color={GOLD} style={styles.inputIcon} />
            <TextInput
              style={[styles.input, { flex: 1 }]}
              placeholder="••••••"
              placeholderTextColor="#666"
              value={password}
              onChangeText={(t) => setPassword(t.slice(0, 6))}
              secureTextEntry={!showPass}
              keyboardType="number-pad"
              maxLength={6}
            />
            <TouchableOpacity onPress={() => setShowPass(!showPass)} style={styles.eyeBtn}>
              <Ionicons name={showPass ? 'eye-off-outline' : 'eye-outline'} size={18} color={GOLD} />
            </TouchableOpacity>
          </View>

          <TouchableOpacity style={styles.forgotRow}>
            <Text style={styles.forgotText}>Forgot password?</Text>
          </TouchableOpacity>

          <TouchableOpacity style={[styles.btn, loading && { opacity: 0.7 }]} onPress={handleLogin} disabled={loading} activeOpacity={0.85}>
            {loading ? <ActivityIndicator color="#000" /> : <Text style={styles.btnText}>Log In</Text>}
          </TouchableOpacity>

          <TouchableOpacity onPress={() => navigation.navigate('Register')} style={styles.linkRow}>
            <Text style={styles.linkText}>Don't have an account? </Text>
            <Text style={styles.link}>Sign up free</Text>
          </TouchableOpacity>
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

  titleArea: { alignItems: 'center', paddingVertical: 28, marginTop: 24 },
  title:    { fontSize: 28, fontWeight: '800', color: GOLD },
  subtitle: { fontSize: 14, color: GOLD, opacity: 0.7, marginTop: 6 },

  form: { paddingHorizontal: 24, paddingBottom: 40 },

  label: { fontSize: 12, fontWeight: '700', color: GOLD, marginBottom: 8, letterSpacing: 1 },

  inputWrapper: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: INPUT_BG, borderRadius: 12,
    borderWidth: 1, borderColor: '#333',
    paddingHorizontal: 14, marginBottom: 20, height: 54,
  },
  inputIcon: { marginRight: 10 },
  input: { flex: 1, fontSize: 15, color: GOLD },
  eyeBtn: { padding: 4 },

  forgotRow: { alignItems: 'flex-end', marginBottom: 24, marginTop: -8 },
  forgotText: { color: GOLD, fontSize: 14, fontWeight: '700' },

  btn: {
    borderRadius: 14, height: 54,
    justifyContent: 'center', alignItems: 'center',
    marginBottom: 24,
    background: GOLD,
    backgroundColor: GOLD,
  },
  btnText: { color: '#000', fontSize: 16, fontWeight: '800' },

  linkRow: { flexDirection: 'row', justifyContent: 'center' },
  linkText: { fontSize: 14, color: '#888' },
  link: { fontSize: 14, color: GOLD, fontWeight: '700' },
});

