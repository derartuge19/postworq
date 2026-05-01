import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, Alert, Animated, RefreshControl, Dimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import api from '../api';

const { width } = Dimensions.get('window');
const GOLD = '#C8B56A', BG = '#0B0B0C', CARD = '#161616', BORDER = '#242424';

function n(val, key) { if (val == null) return 0; if (typeof val === 'object') return val[key] ?? val.current ?? val.balance ?? 0; return Number(val) || 0; }

const STREAK_DAYS = [1,2,3,4,5,6,7].map((d,i) => ({ day: d, coins: [5,10,15,20,30,40,50][i] }));

export default function GamificationScreen({ navigation }) {
  const insets = useSafeAreaInsets();
  const [status, setStatus] = useState(null);
  const [quests, setQuests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [claimingBonus, setClaimingBonus] = useState(false);
  const [spinning, setSpinning] = useState(false);
  const spinAnim = useRef(new Animated.Value(0)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    loadAll();
    Animated.loop(Animated.sequence([
      Animated.timing(pulseAnim, { toValue: 1.06, duration: 800, useNativeDriver: true }),
      Animated.timing(pulseAnim, { toValue: 1, duration: 800, useNativeDriver: true }),
    ])).start();
  }, []);

  const loadAll = async (silent = false) => {
    if (!silent) setLoading(true); else setRefreshing(true);
    const [s, q] = await Promise.all([
      api.request('/gamification/status/').catch(() => null),
      api.request('/quests/').catch(() => []),
    ]);
    setStatus(s); setQuests(Array.isArray(q) ? q : (q?.results || []));
    setLoading(false); setRefreshing(false);
  };

  const claimBonus = async () => {
    setClaimingBonus(true);
    try {
      const res = await api.request('/gamification/login-bonus/', { method: 'POST' });
      Alert.alert('Bonus Claimed!', 'You earned ' + (res.coins_earned || res.coins || 0) + ' coins!');
      loadAll(true);
    } catch (e) { Alert.alert('Error', e?.message || 'Could not claim.'); }
    finally { setClaimingBonus(false); }
  };

  const doSpin = async () => {
    if (spinning) return; setSpinning(true);
    Animated.timing(spinAnim, { toValue: 3, duration: 1200, useNativeDriver: true }).start();
    try {
      const res = await api.request('/gamification/perform-spin/', { method: 'POST' });
      setTimeout(() => { Alert.alert('You won!', (res.coins_won || res.coins || 0) + ' coins!'); loadAll(true); }, 1300);
    } catch (e) { Alert.alert('Error', e?.message || 'Could not spin.'); }
    finally { setTimeout(() => { setSpinning(false); spinAnim.setValue(0); }, 1300); }
  };

  const spinRotate = spinAnim.interpolate({ inputRange: [0, 3], outputRange: ['0deg', '1080deg'] });

  if (loading) return <View style={[styles.container, styles.centered]}><ActivityIndicator size='large' color={GOLD} /></View>;

  const coins = n(status?.coins, 'balance');
  const streak = n(status?.login_streak, 'current');
  const longest = n(status?.login_streak, 'longest');
  const bonusAvailable = status?.login_streak?.bonus_available ?? false;
  const canSpin = status?.spin?.can_spin ?? false;
  const points = n(status?.points, 'balance');
  const nextBonus = status?.login_streak?.next_bonus?.coins ?? 0;

