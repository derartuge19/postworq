import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { useAuth } from '../../contexts/AuthContext';
import api from '../../api';

export default function LoginScreen({ navigation }) {
  const [phoneNumber, setPhoneNumber] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
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
    <View style={styles.container}>
      <Text style={styles.title}>Welcome Back!</Text>
      <Text style={styles.subtitle}>Log in to continue to FLIPSTAR</Text>
      
      {error ? <Text style={styles.error}>{error}</Text> : null}
      
      <View style={styles.inputContainer}>
        <Text style={styles.label}>Phone Number</Text>
        <TextInput
          style={styles.input}
          value={phoneNumber}
          onChangeText={setPhoneNumber}
          placeholder="09XXXXXXXX or +251XXXXXXXXX"
          placeholderTextColor="#666"
          keyboardType="phone-pad"
        />
      </View>
      
      <View style={styles.inputContainer}>
        <Text style={styles.label}>6-Digit PIN</Text>
        <TextInput
          style={styles.input}
          value={password}
          onChangeText={setPassword}
          placeholder="••••••"
          placeholderTextColor="#666"
          secureTextEntry
          maxLength={6}
          keyboardType="numeric"
        />
      </View>
      
      <TouchableOpacity 
        style={[styles.button, loading && styles.buttonDisabled]}
        onPress={handleLogin}
        disabled={loading}
      >
        <Text style={styles.buttonText}>
          {loading ? 'Logging in...' : 'Log In'}
        </Text>
      </TouchableOpacity>
      
      <TouchableOpacity onPress={() => navigation.navigate('Register')}>
        <Text style={styles.linkText}>Don't have an account? Sign up free</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0D0D0D',
    padding: 20,
    justifyContent: 'center',
  },
  title: {
    fontSize: 26,
    fontWeight: '900',
    color: '#F9E08B',
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 13,
    color: '#F9E08B',
    marginBottom: 24,
    textAlign: 'center',
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
  input: {
    width: '100%',
    padding: 13,
    backgroundColor: '#1A1A1A',
    borderWidth: 1.5,
    borderColor: '#262626',
    borderRadius: 10,
    fontSize: 15,
    color: '#fff',
  },
  button: {
    width: '100%',
    padding: 14,
    backgroundColor: 'linear-gradient(to bottom, #D4AF37 0%, #F9E08B 50%, #B8860B 100%)',
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
  linkText: {
    color: '#F9E08B',
    fontSize: 13,
    fontWeight: '700',
    textAlign: 'center',
  },
  error: {
    color: '#EF4444',
    fontSize: 13,
    fontWeight: '600',
    marginBottom: 16,
    textAlign: 'center',
  },
});
