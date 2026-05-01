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

  return (
    <View style={styles.container}>
      <ScrollView 
        style={{ flex: 1 }} 
        contentContainerStyle={{ paddingBottom: insets.bottom + 20 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => loadAll(true)} tintColor={GOLD} />}
      >
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Rewards</Text>
        </View>

        <View style={styles.section}>
          <View style={styles.balanceCard}>
            <Text style={styles.balanceLabel}>Your Coins</Text>
            <Text style={styles.balanceValue}>{coins}</Text>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Daily Streak</Text>
          <View style={styles.streakCard}>
            <Text style={styles.streakLabel}>Current Streak</Text>
            <Text style={styles.streakValue}>{streak} days</Text>
            {bonusAvailable && (
              <TouchableOpacity 
                style={styles.claimBtn} 
                onPress={claimBonus}
                disabled={claimingBonus}
              >
                {claimingBonus ? <ActivityIndicator color="#000" size="small" /> : <Text style={styles.claimBtnText}>Claim Bonus</Text>}
              </TouchableOpacity>
            )}
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Spin Wheel</Text>
          <View style={styles.spinCard}>
            <Animated.View style={{ transform: [{ rotate: spinRotate }] }}>
              <View style={styles.wheel}>
                <Text style={styles.wheelText}>🎰</Text>
              </View>
            </Animated.View>
            <TouchableOpacity 
              style={[styles.spinBtn, !canSpin && styles.spinBtnDisabled]}
              onPress={doSpin}
              disabled={!canSpin || spinning}
            >
              {spinning ? <ActivityIndicator color="#000" size="small" /> : <Text style={styles.spinBtnText}>Spin</Text>}
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Quests</Text>
          {quests.map(q => (
            <View key={q.id} style={styles.questItem}>
              <Text style={styles.questTitle}>{q.title}</Text>
              <Text style={styles.questReward}>{q.coins || q.points || 0} coins</Text>
            </View>
          ))}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: BG },
  centered: { justifyContent: 'center', alignItems: 'center' },
  header: { padding: 20, paddingTop: 20 },
  headerTitle: { fontSize: 28, fontWeight: '800', color: '#fff' },
  section: { paddingHorizontal: 16, marginBottom: 24 },
  sectionTitle: { fontSize: 18, fontWeight: '700', color: '#fff', marginBottom: 12 },
  balanceCard: { backgroundColor: CARD, borderRadius: 16, padding: 20, alignItems: 'center', borderWidth: 1, borderColor: BORDER },
  balanceLabel: { fontSize: 14, color: '#888', marginBottom: 8 },
  balanceValue: { fontSize: 36, fontWeight: '800', color: GOLD },
  streakCard: { backgroundColor: CARD, borderRadius: 16, padding: 20, borderWidth: 1, borderColor: BORDER },
  streakLabel: { fontSize: 14, color: '#888', marginBottom: 8 },
  streakValue: { fontSize: 32, fontWeight: '700', color: '#fff' },
  claimBtn: { backgroundColor: GOLD, paddingVertical: 12, paddingHorizontal: 24, borderRadius: 8, marginTop: 16, alignItems: 'center' },
  claimBtnText: { fontSize: 16, fontWeight: '700', color: '#000' },
  spinCard: { backgroundColor: CARD, borderRadius: 16, padding: 20, alignItems: 'center', borderWidth: 1, borderColor: BORDER },
  wheel: { width: 120, height: 120, borderRadius: 60, backgroundColor: '#1a1a2e', justifyContent: 'center', alignItems: 'center', borderWidth: 4, borderColor: GOLD },
  wheelText: { fontSize: 48 },
  spinBtn: { backgroundColor: GOLD, paddingVertical: 12, paddingHorizontal: 32, borderRadius: 8, marginTop: 16, alignItems: 'center' },
  spinBtnDisabled: { backgroundColor: '#333' },
  spinBtnText: { fontSize: 16, fontWeight: '700', color: '#000' },
  questItem: { backgroundColor: CARD, borderRadius: 12, padding: 16, marginBottom: 12, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderWidth: 1, borderColor: BORDER },
  questTitle: { fontSize: 15, fontWeight: '600', color: '#fff', flex: 1 },
  questReward: { fontSize: 14, fontWeight: '700', color: GOLD },
});
