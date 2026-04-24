import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  KeyboardAvoidingView, Platform, Alert, ActivityIndicator,
  StatusBar,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../contexts/AuthContext';

const BRAND = { pri: '#DA9B2A', bg: '#fff', txt: '#1a1a1a', sub: '#888', border: '#f0e6d0' };

export default function LoginScreen({ navigation }) {
  const [username, setUsername]     = useState('');
  const [password, setPassword]     = useState('');
  const [showPass, setShowPass]     = useState(false);
  const [loading, setLoading]       = useState(false);
  const { login } = useAuth();

  const handleLogin = async () => {
    if (!username || !password) { Alert.alert('Error', 'Please fill in all fields'); return; }
    setLoading(true);
    try { await login(username, password); }
    catch (e) { Alert.alert('Login Failed', e.message || 'Invalid credentials'); }
    finally { setLoading(false); }
  };

  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <StatusBar barStyle="dark-content" backgroundColor={BRAND.bg} />

      {/* Logo area */}
      <View style={styles.logoArea}>
        <View style={styles.logoCircle}>
          <Ionicons name="star" size={36} color="#fff" />
        </View>
        <Text style={styles.title}>Flip Star</Text>
        <Text style={styles.subtitle}>Welcome back!</Text>
      </View>

      {/* Form */}
      <View style={styles.form}>
        {/* Username */}
        <View style={styles.inputWrapper}>
          <Ionicons name="person-outline" size={18} color={BRAND.pri} style={styles.inputIcon} />
          <TextInput
            style={styles.input}
            placeholder="Username"
            placeholderTextColor={BRAND.sub}
            value={username}
            onChangeText={setUsername}
            autoCapitalize="none"
          />
        </View>

        {/* Password */}
        <View style={styles.inputWrapper}>
          <Ionicons name="lock-closed-outline" size={18} color={BRAND.pri} style={styles.inputIcon} />
          <TextInput
            style={[styles.input, { flex: 1 }]}
            placeholder="Password"
            placeholderTextColor={BRAND.sub}
            value={password}
            onChangeText={setPassword}
            secureTextEntry={!showPass}
          />
          <TouchableOpacity onPress={() => setShowPass(!showPass)} style={styles.eyeBtn}>
            <Ionicons name={showPass ? 'eye-off-outline' : 'eye-outline'} size={18} color={BRAND.sub} />
          </TouchableOpacity>
        </View>

        {/* Login button */}
        <TouchableOpacity style={[styles.btn, loading && { opacity: 0.7 }]} onPress={handleLogin} disabled={loading} activeOpacity={0.85}>
          {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.btnText}>Login</Text>}
        </TouchableOpacity>

        {/* Divider */}
        <View style={styles.divider}>
          <View style={styles.dividerLine} />
          <Text style={styles.dividerText}>or</Text>
          <View style={styles.dividerLine} />
        </View>

        {/* Register link */}
        <TouchableOpacity onPress={() => navigation.navigate('Register')} style={styles.linkRow}>
          <Text style={styles.linkText}>Don't have an account? </Text>
          <Text style={styles.link}>Register</Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: BRAND.bg },
  logoArea: { flex: 1, justifyContent: 'flex-end', alignItems: 'center', paddingBottom: 32 },
  logoCircle: {
    width: 80, height: 80, borderRadius: 40,
    backgroundColor: BRAND.pri, justifyContent: 'center', alignItems: 'center',
    marginBottom: 16,
    shadowColor: BRAND.pri, shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.35, shadowRadius: 16, elevation: 10,
  },
  title: { fontSize: 30, fontWeight: '800', color: BRAND.txt, letterSpacing: 0.5 },
  subtitle: { fontSize: 15, color: BRAND.sub, marginTop: 4 },

  form: { flex: 1.2, padding: 28, paddingTop: 8 },

  inputWrapper: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: '#fdf8f0', borderRadius: 14,
    borderWidth: 1.5, borderColor: BRAND.border,
    paddingHorizontal: 14, marginBottom: 14, height: 54,
  },
  inputIcon: { marginRight: 10 },
  input: { flex: 1, fontSize: 15, color: BRAND.txt },
  eyeBtn: { padding: 4 },

  btn: {
    backgroundColor: BRAND.pri, borderRadius: 14,
    height: 54, justifyContent: 'center', alignItems: 'center',
    marginTop: 4, marginBottom: 20,
    shadowColor: BRAND.pri, shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35, shadowRadius: 12, elevation: 8,
  },
  btnText: { color: '#fff', fontSize: 16, fontWeight: '700', letterSpacing: 0.5 },

  divider: { flexDirection: 'row', alignItems: 'center', marginBottom: 20 },
  dividerLine: { flex: 1, height: 1, backgroundColor: BRAND.border },
  dividerText: { marginHorizontal: 12, color: BRAND.sub, fontSize: 13 },

  linkRow: { flexDirection: 'row', justifyContent: 'center' },
  linkText: { fontSize: 14, color: BRAND.sub },
  link: { fontSize: 14, color: BRAND.pri, fontWeight: '700' },
});
