import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, ScrollView,
  ActivityIndicator, Alert, Linking,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import api from '../api';

const GOLD = '#C8B56A';
const BG = '#0D0D0D';
const CARD = '#1A1A1A';
const BORDER = '#262626';

const FALLBACK_TIERS = [
  { id: 1, name: 'Daily', duration_type: 'daily', price_etb: 3, description: 'Access for 24 hours', features: ['Full access for 24 hours', 'Ad-free experience', 'HD quality videos'], emoji: '⚡' },
  { id: 2, name: 'Weekly', duration_type: 'weekly', price_etb: 20, description: 'Access for 7 days', features: ['Full access for 7 days', 'Ad-free experience', 'HD quality videos'], emoji: '🌟' },
  { id: 3, name: 'Monthly', duration_type: 'monthly', price_etb: 70, description: 'Access for 30 days', features: ['Full access for 30 days', 'Ad-free experience', 'HD quality videos'], emoji: '👑' },
  { id: 4, name: 'OnDemand', duration_type: 'ondemand', price_etb: 10, price_coins: 100, description: 'Pay per use with coins', features: ['Flexible payment', 'No recurring charges', 'Use coins as needed'], emoji: '💎' },
];

export default function SubscriptionScreen({ navigation }) {
  const insets = useSafeAreaInsets();
  const [tiers, setTiers] = useState(FALLBACK_TIERS);
  const [currentSub, setCurrentSub] = useState(null);
  const [loading, setLoading] = useState(false);
  const [selectedTier, setSelectedTier] = useState(null);

  useEffect(() => { loadData(); }, []);

  const loadData = async () => {
    try {
      const [tiersData, subData] = await Promise.all([
        api.request('/subscriptions/tiers/active/').catch(() => []),
        api.request('/subscriptions/').catch(() => null),
      ]);
      if (Array.isArray(tiersData) && tiersData.length > 0) setTiers(tiersData);
      setCurrentSub(subData);
    } catch {}
  };

  const handleSubscribe = (tier) => {
    const codeMap = { daily: 'A', weekly: 'B', monthly: 'C', ondemand: 'D' };
    const code = codeMap[tier.duration_type] || 'A';
    const smsUrl = `sms:9286?body=${encodeURIComponent(code)}`;
    Linking.openURL(smsUrl).catch(() => Alert.alert('Error', 'Could not open SMS app'));
  };

  const isActive = currentSub?.status === 'active';

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="chevron-back" size={24} color={GOLD} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Premium</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: insets.bottom + 20 }}>
        {/* Hero */}
        <LinearGradient colors={['#1A1200', '#2A1E00', '#0D0D0D']} style={styles.hero}>
          <Text style={styles.heroIcon}>👑</Text>
          <Text style={styles.heroTitle}>FlipStar Premium</Text>
          <Text style={styles.heroSub}>Unlock the full experience</Text>
          {isActive && (
            <View style={styles.activeBadge}>
              <Ionicons name="checkmark-circle" size={16} color="#10B981" />
              <Text style={styles.activeBadgeText}>Active until {new Date(currentSub.end_date).toLocaleDateString()}</Text>
            </View>
          )}
        </LinearGradient>

        {/* Benefits */}
        <View style={styles.benefits}>
          {[
            { icon: 'videocam', text: 'HD quality videos' },
            { icon: 'ban', text: 'Ad-free experience' },
            { icon: 'star', text: 'Exclusive content' },
            { icon: 'trophy', text: 'Campaign priority' },
          ].map((b, i) => (
            <View key={i} style={styles.benefitItem}>
              <View style={styles.benefitIcon}>
                <Ionicons name={b.icon} size={18} color={GOLD} />
              </View>
              <Text style={styles.benefitText}>{b.text}</Text>
            </View>
          ))}
        </View>

        {/* Tiers */}
        <Text style={styles.sectionTitle}>Choose Your Plan</Text>
        {tiers.map((tier, i) => {
          const isSelected = selectedTier?.id === tier.id;
          const isCurrent = currentSub?.tier?.id === tier.id && isActive;
          return (
            <TouchableOpacity
              key={tier.id}
              style={[styles.tierCard, isSelected && styles.tierCardSelected, isCurrent && styles.tierCardCurrent]}
              onPress={() => setSelectedTier(tier)}
              activeOpacity={0.85}
            >
              {isCurrent && (
                <View style={styles.currentBadge}>
                  <Text style={styles.currentBadgeText}>Current Plan</Text>
                </View>
              )}
              <View style={styles.tierHeader}>
                <Text style={styles.tierEmoji}>{tier.emoji || ['⚡', '🌟', '👑', '💎'][i] || '⭐'}</Text>
                <View style={{ flex: 1, marginLeft: 12 }}>
                  <Text style={styles.tierName}>{tier.name}</Text>
                  <Text style={styles.tierDesc}>{tier.description}</Text>
                </View>
                <View style={{ alignItems: 'flex-end' }}>
                  <Text style={styles.tierPrice}>{tier.price_etb} ETB</Text>
                  {tier.price_coins && <Text style={styles.tierCoins}>{tier.price_coins} coins</Text>}
                </View>
              </View>
              <View style={styles.tierFeatures}>
                {(tier.features || []).map((f, fi) => (
                  <View key={fi} style={styles.featureRow}>
                    <Ionicons name="checkmark-circle" size={14} color="#10B981" />
                    <Text style={styles.featureText}>{f}</Text>
                  </View>
                ))}
              </View>
              <TouchableOpacity
                style={[styles.subscribeBtn, isCurrent && styles.subscribeBtnDisabled]}
                onPress={() => handleSubscribe(tier)}
                disabled={isCurrent}
              >
                <Text style={styles.subscribeBtnText}>
                  {isCurrent ? 'Active' : `Subscribe via SMS`}
                </Text>
              </TouchableOpacity>
            </TouchableOpacity>
          );
        })}

        <View style={styles.smsInfo}>
          <Ionicons name="information-circle" size={18} color={GOLD} />
          <Text style={styles.smsInfoText}>
            Send SMS to 9286 with code A (Daily), B (Weekly), C (Monthly), or D (OnDemand) to subscribe via Ethio Telecom.
          </Text>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: BG },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: BORDER },
  headerTitle: { fontSize: 18, fontWeight: '700', color: GOLD },
  hero: { padding: 32, alignItems: 'center', marginBottom: 8 },
  heroIcon: { fontSize: 48, marginBottom: 12 },
  heroTitle: { fontSize: 26, fontWeight: '900', color: GOLD, marginBottom: 6 },
  heroSub: { fontSize: 14, color: '#aaa', textAlign: 'center' },
  activeBadge: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: '#0D2D1A', paddingHorizontal: 14, paddingVertical: 6, borderRadius: 20, marginTop: 12 },
  activeBadgeText: { color: '#10B981', fontSize: 13, fontWeight: '600' },
  benefits: { flexDirection: 'row', flexWrap: 'wrap', paddingHorizontal: 16, gap: 10, marginBottom: 20 },
  benefitItem: { flexDirection: 'row', alignItems: 'center', gap: 8, width: '47%', backgroundColor: CARD, borderRadius: 12, padding: 12, borderWidth: 1, borderColor: BORDER },
  benefitIcon: { width: 32, height: 32, borderRadius: 16, backgroundColor: GOLD + '20', justifyContent: 'center', alignItems: 'center' },
  benefitText: { fontSize: 12, color: '#ddd', fontWeight: '500', flex: 1 },
  sectionTitle: { fontSize: 16, fontWeight: '700', color: GOLD, paddingHorizontal: 16, marginBottom: 12 },
  tierCard: { marginHorizontal: 16, marginBottom: 14, backgroundColor: CARD, borderRadius: 18, padding: 18, borderWidth: 1.5, borderColor: BORDER, position: 'relative' },
  tierCardSelected: { borderColor: GOLD, backgroundColor: GOLD + '08' },
  tierCardCurrent: { borderColor: '#10B981', backgroundColor: '#0D2D1A20' },
  currentBadge: { position: 'absolute', top: -10, right: 16, backgroundColor: '#10B981', paddingHorizontal: 10, paddingVertical: 3, borderRadius: 10 },
  currentBadgeText: { color: '#fff', fontSize: 11, fontWeight: '700' },
  tierHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  tierEmoji: { fontSize: 28 },
  tierName: { fontSize: 17, fontWeight: '800', color: '#fff' },
  tierDesc: { fontSize: 12, color: '#888', marginTop: 2 },
  tierPrice: { fontSize: 18, fontWeight: '800', color: GOLD },
  tierCoins: { fontSize: 12, color: '#888', marginTop: 2 },
  tierFeatures: { gap: 6, marginBottom: 14 },
  featureRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  featureText: { fontSize: 13, color: '#ccc' },
  subscribeBtn: { backgroundColor: GOLD, borderRadius: 12, padding: 13, alignItems: 'center' },
  subscribeBtnDisabled: { backgroundColor: '#333' },
  subscribeBtnText: { color: '#000', fontWeight: '800', fontSize: 14 },
  smsInfo: { flexDirection: 'row', backgroundColor: CARD, borderRadius: 12, padding: 14, marginHorizontal: 16, gap: 10, borderWidth: 1, borderColor: BORDER, marginTop: 4 },
  smsInfoText: { flex: 1, fontSize: 12, color: '#888', lineHeight: 18 },
});
