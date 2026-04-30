import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView, Modal, Image } from 'react-native';
import { useAuth } from '../../contexts/AuthContext';

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

export default function RegisterScreen({ navigation }) {
  const [step, setStep] = useState(1); // 1=form, 2=otp
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [otp, setOtp] = useState('');
  const [devCode, setDevCode] = useState('');
  const [verifiedPhone, setVerifiedPhone] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [modal, setModal] = useState(null); // 'faq' | 'terms'
  const [faqOpen, setFaqOpen] = useState(null);
  const [resendTimer, setResendTimer] = useState(0);
  const { register } = useAuth();

  const handleSendOtp = async () => {
    setError('');
    if (!fullName) { setError("Please enter your full name"); return; }
    if (!phone) { setError("Please enter your phone number"); return; }
    if (!/^\d{6}$/.test(password)) { setError("Password must be exactly 6 digits"); return; }
    if (password !== confirm) { setError("Passwords do not match"); return; }
    
    setLoading(true);
    try {
      // For demo purposes, simulate OTP sent
      setVerifiedPhone(phone);
      setDevCode("123456"); // Demo OTP code
      setResendTimer(60);
      setStep(2);
    } catch (e) {
      setError(e.message || "Failed to send OTP. Check your phone number.");
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyAndRegister = async () => {
    setError('');
    if (otp.length !== 6) { setError("Enter the 6-digit code"); return; }
    setLoading(true);
    
    try {
      // For demo, accept any 6-digit code
      await handleRegister();
    } catch (e) {
      setError(e.message || "Invalid code or registration failed.");
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async () => {
    try {
      await register({
        fullName,
        phone,
        password,
        first_name: fullName.split(' ')[0],
        last_name: fullName.split(' ').slice(1).join(' '),
      });
    } catch (e) {
      setError(e.message || 'Registration failed. Please try again.');
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

      <View style={styles.content}>
        {/* Logos */}
        <View style={styles.logoContainer}>
          <Image 
            source={require('../../image/Ethio telecom Logo PNG format.png')} 
            style={styles.logoImage}
            resizeMode="contain"
          />
          <Image 
            source={require('../../image/final_logo.png')} 
            style={styles.logoImage}
            resizeMode="contain"
          />
        </View>

        {/* Step indicator */}
        <View style={styles.stepIndicator}>
          <View style={[styles.stepDot, step === 1 && styles.stepDotActive]} />
          <View style={[styles.stepLine, step > 1 && styles.stepLineActive]} />
          <View style={[styles.stepDot, step === 2 && styles.stepDotActive]} />
        </View>

        {/* Card */}
        <View style={styles.card}>
          {/* Step 1: Registration Form */}
          {step === 1 && (
            <>
              <View style={styles.header}>
                <Text style={styles.icon}>📱</Text>
                <Text style={styles.title}>Create Account</Text>
                <Text style={styles.subtitle}>Fill in your details to get started</Text>
              </View>

              {error ? <Text style={styles.error}>⚠️ {error}</Text> : null}

              {/* Full Name field */}
              <View style={styles.inputContainer}>
                <Text style={styles.label}>Full Name *</Text>
                <View style={styles.inputWrapper}>
                  <Text style={styles.inputIcon}>👤</Text>
                  <TextInput
                    style={styles.textInput}
                    value={fullName}
                    onChangeText={setFullName}
                    placeholder="Enter your full name"
                    placeholderTextColor="#666"
                  />
                </View>
              </View>

              {/* Phone Number field */}
              <View style={styles.inputContainer}>
                <Text style={styles.label}>Phone Number *</Text>
                <View style={styles.inputWrapper}>
                  <Text style={styles.inputIcon}>📱</Text>
                  <TextInput
                    style={styles.textInput}
                    value={phone}
                    onChangeText={setPhone}
                    placeholder="09XXXXXXXX or +251XXXXXXXXX"
                    placeholderTextColor="#666"
                    keyboardType="phone-pad"
                  />
                </View>
              </View>

              {/* Password field */}
              <View style={styles.inputContainer}>
                <Text style={styles.label}>6-Digit PIN *</Text>
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

              {/* Confirm Password field */}
              <View style={styles.inputContainer}>
                <Text style={styles.label}>Confirm PIN *</Text>
                <View style={styles.inputWrapper}>
                  <Text style={styles.inputIcon}>🔒</Text>
                  <TextInput
                    style={styles.textInput}
                    value={confirm}
                    onChangeText={setConfirm}
                    placeholder="••••••"
                    placeholderTextColor="#666"
                    secureTextEntry={!showConfirm}
                    maxLength={6}
                    keyboardType="numeric"
                  />
                  <TouchableOpacity onPress={() => setShowConfirm(!showConfirm)} style={styles.eyeButton}>
                    <Text style={styles.eyeText}>{showConfirm ? '👁️' : '👁️‍🗨️'}</Text>
                  </TouchableOpacity>
                </View>
              </View>

              <TouchableOpacity 
                style={[styles.button, loading && styles.buttonDisabled]}
                onPress={handleSendOtp}
                disabled={loading}
              >
                <Text style={styles.buttonText}>
                  {loading ? 'Sending...' : 'Send OTP →'}
                </Text>
              </TouchableOpacity>
            </>
          )}

          {/* Step 2: OTP Verification */}
          {step === 2 && (
            <>
              <View style={styles.header}>
                <Text style={styles.icon}>🔐</Text>
                <Text style={styles.title}>Verify Code</Text>
                <Text style={styles.subtitle}>
                  Code sent to <Text style={styles.phoneHighlight}>{verifiedPhone}</Text>
                </Text>
              </View>

              {error ? <Text style={styles.error}>⚠️ {error}</Text> : null}

              {/* DEV MODE: show OTP on page */}
              {devCode && (
                <View style={styles.devCodeContainer}>
                  <Text style={styles.devCodeText}>
                    🧪 DEV MODE — Your OTP code is: <Text style={styles.devCodeNumber}>{devCode}</Text>
                  </Text>
                </View>
              )}

              {/* OTP Input */}
              <View style={styles.otpContainer}>
                {[0, 1, 2, 3, 4, 5].map((index) => (
                  <TextInput
                    key={index}
                    style={styles.otpInput}
                    value={otp[index] || ''}
                    onChangeText={(text) => {
                      const newOtp = otp.split('');
                      newOtp[index] = text.slice(-1);
                      setOtp(newOtp.join(''));
                    }}
                    keyboardType="numeric"
                    maxLength={1}
                    textAlign="center"
                    secureTextEntry
                  />
                ))}
              </View>

              <TouchableOpacity 
                style={[styles.button, loading && styles.buttonDisabled]}
                onPress={handleVerifyAndRegister}
                disabled={loading || otp.length < 6}
              >
                <Text style={styles.buttonText}>
                  {loading ? 'Verifying...' : 'Verify & Register 🚀'}
                </Text>
              </TouchableOpacity>

              <View style={styles.otpFooter}>
                <TouchableOpacity onPress={() => { setStep(1); setOtp(''); setError(''); setDevCode(''); }}>
                  <Text style={styles.backLink}>← Go back</Text>
                </TouchableOpacity>
                {resendTimer > 0 ? (
                  <Text style={styles.resendText}>Resend in {resendTimer}s</Text>
                ) : (
                  <TouchableOpacity onPress={handleSendOtp}>
                    <Text style={styles.resendLink}>Resend OTP</Text>
                  </TouchableOpacity>
                )}
              </View>
            </>
          )}

          {/* Footer */}
          <View style={styles.signupContainer}>
            <Text style={styles.signupText}>Already have an account? </Text>
            <TouchableOpacity onPress={() => navigation.navigate('Login')}>
              <Text style={styles.signupLink}>Log in</Text>
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
    marginBottom: 8,
    borderRadius: 12,
    padding: 10,
    backgroundColor: '#1A1A1A',
  },
  logoImage: {
    width: 100,
    height: 50,
  },
  stepIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginBottom: 28,
  },
  stepDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#262626',
  },
  stepDotActive: {
    backgroundColor: '#F9E08B',
  },
  stepLine: {
    width: 48,
    height: 2,
    backgroundColor: '#262626',
    borderRadius: 1,
  },
  stepLineActive: {
    backgroundColor: '#F9E08B',
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
  icon: {
    fontSize: 36,
    marginBottom: 8,
  },
  title: {
    fontSize: 22,
    fontWeight: '900',
    color: '#F9E08B',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 13,
    color: '#F9E08B',
    textAlign: 'center',
  },
  phoneHighlight: {
    color: '#fff',
    fontWeight: 'bold',
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
  devCodeContainer: {
    padding: 12,
    backgroundColor: '#1A2A1A',
    borderWidth: 2,
    borderColor: '#22C55E',
    borderRadius: 10,
    marginBottom: 16,
  },
  devCodeText: {
    color: '#22C55E',
    fontSize: 14,
    fontWeight: '700',
    textAlign: 'center',
  },
  devCodeNumber: {
    fontSize: 22,
    letterSpacing: 4,
  },
  otpContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
    marginBottom: 24,
  },
  otpInput: {
    width: 40,
    height: 50,
    backgroundColor: '#1A1A1A',
    borderWidth: 1.5,
    borderColor: '#262626',
    borderRadius: 10,
    fontSize: 20,
    color: '#fff',
    textAlign: 'center',
  },
  otpFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  backLink: {
    color: '#F9E08B',
    fontSize: 13,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  resendText: {
    color: '#666',
    fontSize: 12,
  },
  resendLink: {
    color: '#F9E08B',
    fontSize: 13,
    fontWeight: '700',
  },
  signupContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 4,
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
});
