import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  KeyboardAvoidingView, Platform, Alert, ActivityIndicator,
  ScrollView, StatusBar, Image,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../contexts/AuthContext';

const GOLD     = '#F9E08B';
const BG       = '#1a1a1a';
const INPUT_BG = '#2a2a2a';

const ethioLogo = require('../../image/Ethio telecom Logo PNG format.png');
const flipLogo  = require('../../image/final_logo.png');

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

  const Field = ({ label, icon, placeholder, value, onChangeText, keyboardType, autoCapitalize, secure, showToggle, onToggle, show }) => (
    <View>
      <Text style={styles.label}>{label}</Text>
      <View style={styles.inputWrapper}>
        <Ionicons name={icon} size={18} color={GOLD} style={styles.inputIcon} />
        <TextInput
          style={[styles.input, { flex: 1 }]}
          placeholder={placeholder}
          placeholderTextColor="#666"
          value={value}
          onChangeText={onChangeText}
          keyboardType={keyboardType || 'default'}
          autoCapitalize={autoCapitalize || 'sentences'}
          secureTextEntry={secure && !show}
        />
        {showToggle && (
          <TouchableOpacity onPress={onToggle} style={styles.eyeBtn}>
            <Ionicons name={show ? 'eye-off-outline' : 'eye-outline'} size={18} color={GOLD} />
          </TouchableOpacity>
        )}
      </View>
    </View>
  );

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
          <Text style={styles.title}>Create Account</Text>
          <Text style={styles.subtitle}>Join Flip Star today</Text>
        </View>

        {/* Form */}
        <View style={styles.form}>
          <Field label="USERNAME *"   icon="person-outline"  placeholder="Enter your username" value={username}  onChangeText={setUsername}  autoCapitalize="none" />
          <Field label="EMAIL *"      icon="mail-outline"    placeholder="Enter your email"    value={email}     onChangeText={setEmail}     keyboardType="email-address" autoCapitalize="none" />
          <Field label="FIRST NAME"   icon="text-outline"    placeholder="First name"          value={firstName} onChangeText={setFirstName} />
          <Field label="LAST NAME"    icon="text-outline"    placeholder="Last name"           value={lastName}  onChangeText={setLastName} />
          <Field label="PASSWORD *"   icon="lock-closed-outline" placeholder="••••••"         value={password}  onChangeText={setPassword}
            secure showToggle onToggle={() => setShowPass(!showPass)} show={showPass} />

          <TouchableOpacity style={[styles.btn, loading && { opacity: 0.7 }]} onPress={handleRegister} disabled={loading} activeOpacity={0.85}>
            {loading ? <ActivityIndicator color="#000" /> : <Text style={styles.btnText}>Create Account</Text>}
          </TouchableOpacity>

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
  container: { flex: 1, backgroundColor: BG },
  scroll: { flexGrow: 1 },

  logosRow: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingTop: 52, paddingBottom: 4,
  },
  logoLeft:  { width: 148, height: 40, marginLeft: 12 },
  logoRight: { width: 148, height: 40, marginRight: 4 },

  titleArea: { alignItems: 'center', paddingVertical: 28, marginTop: 24 },
  title:    { fontSize: 26, fontWeight: '800', color: GOLD },
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
  input: { fontSize: 15, color: GOLD },
  eyeBtn: { padding: 4 },

  btn: {
    borderRadius: 14, height: 54,
    justifyContent: 'center', alignItems: 'center',
    marginTop: 4, marginBottom: 24,
    backgroundColor: GOLD,
  },
  btnText: { color: '#000', fontSize: 16, fontWeight: '800' },

  linkRow: { flexDirection: 'row', justifyContent: 'center' },
  linkText: { fontSize: 14, color: '#888' },
  link: { fontSize: 14, color: GOLD, fontWeight: '700' },
});

