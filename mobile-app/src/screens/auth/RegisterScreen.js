import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  KeyboardAvoidingView, Platform, Alert, ActivityIndicator,
  ScrollView, StatusBar,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../contexts/AuthContext';

const BRAND = { pri: '#DA9B2A', bg: '#fff', txt: '#1a1a1a', sub: '#888', border: '#f0e6d0' };

export default function RegisterScreen({ navigation }) {
  const [username, setUsername]   = useState('');
  const [email, setEmail]         = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName]   = useState('');
  const [password, setPassword]   = useState('');
  const [showPass, setShowPass]   = useState(false);
  const [loading, setLoading]     = useState(false);
  const { register } = useAuth();

  const handleRegister = async () => {
    if (!username || !email || !password) { Alert.alert('Error', 'Please fill in all required fields'); return; }
    setLoading(true);
    try { await register(username, email, password, firstName, lastName); }
    catch (e) { Alert.alert('Registration Failed', e.message || 'Something went wrong'); }
    finally { setLoading(false); }
  };

  const Field = ({ icon, placeholder, value, onChangeText, keyboardType, autoCapitalize, secure, showToggle, onToggle, show }) => (
    <View style={styles.inputWrapper}>
      <Ionicons name={icon} size={18} color={BRAND.pri} style={styles.inputIcon} />
      <TextInput
        style={[styles.input, { flex: 1 }]}
        placeholder={placeholder}
        placeholderTextColor={BRAND.sub}
        value={value}
        onChangeText={onChangeText}
        keyboardType={keyboardType || 'default'}
        autoCapitalize={autoCapitalize || 'sentences'}
        secureTextEntry={secure && !show}
      />
      {showToggle && (
        <TouchableOpacity onPress={onToggle} style={styles.eyeBtn}>
          <Ionicons name={show ? 'eye-off-outline' : 'eye-outline'} size={18} color={BRAND.sub} />
        </TouchableOpacity>
      )}
    </View>
  );

  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <StatusBar barStyle="dark-content" backgroundColor={BRAND.bg} />
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>

        {/* Logo area */}
        <View style={styles.logoArea}>
          <View style={styles.logoCircle}>
            <Ionicons name="star" size={32} color="#fff" />
          </View>
          <Text style={styles.title}>Create Account</Text>
          <Text style={styles.subtitle}>Join Flip Star today</Text>
        </View>

        {/* Form */}
        <View style={styles.form}>
          <Field icon="person-outline"   placeholder="Username *"   value={username}   onChangeText={setUsername}   autoCapitalize="none" />
          <Field icon="mail-outline"     placeholder="Email *"      value={email}      onChangeText={setEmail}      keyboardType="email-address" autoCapitalize="none" />
          <Field icon="text-outline"     placeholder="First Name"   value={firstName}  onChangeText={setFirstName} />
          <Field icon="text-outline"     placeholder="Last Name"    value={lastName}   onChangeText={setLastName} />
          <Field
            icon="lock-closed-outline" placeholder="Password *" value={password} onChangeText={setPassword}
            secure showToggle onToggle={() => setShowPass(!showPass)} show={showPass}
          />

          <TouchableOpacity style={[styles.btn, loading && { opacity: 0.7 }]} onPress={handleRegister} disabled={loading} activeOpacity={0.85}>
            {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.btnText}>Create Account</Text>}
          </TouchableOpacity>

          <View style={styles.divider}>
            <View style={styles.dividerLine} />
            <Text style={styles.dividerText}>or</Text>
            <View style={styles.dividerLine} />
          </View>

          <TouchableOpacity onPress={() => navigation.navigate('Login')} style={styles.linkRow}>
            <Text style={styles.linkText}>Already have an account? </Text>
            <Text style={styles.link}>Login</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: BRAND.bg },
  scroll: { flexGrow: 1 },

  logoArea: { alignItems: 'center', paddingTop: 60, paddingBottom: 28 },
  logoCircle: {
    width: 72, height: 72, borderRadius: 36,
    backgroundColor: BRAND.pri, justifyContent: 'center', alignItems: 'center',
    marginBottom: 14,
    shadowColor: BRAND.pri, shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.35, shadowRadius: 16, elevation: 10,
  },
  title: { fontSize: 26, fontWeight: '800', color: BRAND.txt, letterSpacing: 0.5 },
  subtitle: { fontSize: 14, color: BRAND.sub, marginTop: 4 },

  form: { paddingHorizontal: 28, paddingBottom: 40 },

  inputWrapper: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: '#fdf8f0', borderRadius: 14,
    borderWidth: 1.5, borderColor: BRAND.border,
    paddingHorizontal: 14, marginBottom: 12, height: 52,
  },
  inputIcon: { marginRight: 10 },
  input: { fontSize: 15, color: BRAND.txt },
  eyeBtn: { padding: 4 },

  btn: {
    backgroundColor: BRAND.pri, borderRadius: 14,
    height: 54, justifyContent: 'center', alignItems: 'center',
    marginTop: 8, marginBottom: 20,
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
