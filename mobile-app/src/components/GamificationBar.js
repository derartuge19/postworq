import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  TextInput,
  ActivityIndicator,
  Dimensions,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import api from '../api';

const { width, height } = Dimensions.get('window');
const BRAND_GOLD = '#F9E08B';

// ─────────────────────────────────────────────────────────────
// Components: Modal Header
// ─────────────────────────────────────────────────────────────
const ModalHeader = ({ title, onClose }) => (
  <View style={styles.modalHeader}>
    <Text style={styles.modalTitle}>{title}</Text>
    <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
      <Ionicons name="close" size={20} color="#F9E08B" />
    </TouchableOpacity>
  </View>
);

// ─────────────────────────────────────────────────────────────
// Components: Coins Modal
// ─────────────────────────────────────────────────────────────
const CoinsModal = ({ coins, onClose }) => (
  <View style={styles.modalContent}>
    <ModalHeader title="💰 Coin Balance" onClose={onClose} />
    <View style={styles.scrollPadding}>
      <View style={[styles.balanceHero, { backgroundColor: '#F9E08B' }]}>
        <Text style={styles.heroEmoji}>🪙</Text>
        <Text style={[styles.heroAmount, { color: '#000' }]}>{coins?.balance?.total ?? coins?.balance ?? 0}</Text>
        <Text style={[styles.heroLabel, { color: 'rgba(0,0,0,0.75)' }]}>Total Balance</Text>
      </View>

      <View style={styles.statsGrid}>
        <View style={[styles.statBox, { backgroundColor: '#10B98112', borderColor: '#10B98125' }]}>
          <Text style={styles.statEmoji}>🎁</Text>
          <Text style={[styles.statValue, { color: '#10B981' }]}>{coins?.balance?.earned ?? coins?.earned_total ?? 0}</Text>
          <Text style={styles.statLabel}>Earned</Text>
        </View>
        <View style={[styles.statBox, { backgroundColor: '#8B5CF612', borderColor: '#8B5CF625' }]}>
          <Text style={styles.statEmoji}>💳</Text>
          <Text style={[styles.statValue, { color: '#8B5CF6' }]}>{coins?.balance?.purchased ?? 0}</Text>
          <Text style={styles.statLabel}>Purchased</Text>
        </View>
      </View>

      <View style={styles.tipBox}>
        <Text style={styles.tipText}>
          💡 Earned coins come from activities (login, posts, likes). Purchased coins are bought and can be used for gifting.
        </Text>
      </View>
    </View>
  </View>
);

// ─────────────────────────────────────────────────────────────
// Components: Streak Modal
// ─────────────────────────────────────────────────────────────
const StreakModal = ({ streak, onClaim, onClose }) => {
  const [claiming, setClaiming] = useState(false);
  const [claimed, setClaimed] = useState(false);

  const cur = streak?.current ?? 0;

  // Get real calendar days starting from today going back 6 days
  const getRealDays = () => {
    const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const today = new Date();
    const days = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(today.getDate() - i);
      days.push({
        name: dayNames[d.getDay()],
        date: d.getDate(),
        isToday: i === 0,
        isPast: i > 0,
      });
    }
    return days;
  };
  const realDays = getRealDays();

  const handleClaim = async () => {
    setClaiming(true);
    try {
      await onClaim();
      setClaimed(true);
    } catch (e) {
      console.error(e);
    } finally {
      setClaiming(false);
    }
  };

  return (
    <View style={styles.modalContent}>
      <ModalHeader title="🔥 Login Streak" onClose={onClose} />
      <View style={styles.scrollPadding}>
        <View style={[styles.balanceHero, { backgroundColor: '#F9E08B', borderBottomWidth: 0 }]}>
          <Text style={styles.heroEmoji}>🔥</Text>
          <Text style={[styles.heroAmount, { color: '#000' }]}>{cur}</Text>
          <Text style={[styles.heroLabel, { color: 'rgba(0,0,0,0.75)' }]}>Day Streak</Text>
          {(streak?.longest ?? 0) > 0 && (
            <Text style={styles.bestStreak}>Best: {streak.longest} days 🏆</Text>
          )}
        </View>

        {/* 7-day progress - real calendar days */}
        <View style={styles.streakDaysContainer}>
          {realDays.map((day, i) => {
            const daysFromEnd = 6 - i;
            const active = daysFromEnd < cur && daysFromEnd > 0;
            const isToday = day.isToday;
            return (
              <View key={i} style={styles.streakDayItem}>
                <View style={[
                  styles.streakDayCircle,
                  active && styles.streakDayCircleActive,
                  isToday && styles.streakDayCircleToday,
                  !active && !isToday && styles.streakDayCircleInactive
                ]}>
                  <Text style={[
                    styles.streakDayText,
                    active && styles.streakDayTextActive,
                    isToday && styles.streakDayTextToday,
                    !active && !isToday && styles.streakDayTextInactive
                  ]}>
                    {active ? '✓' : day.date}
                  </Text>
                </View>
                <Text style={[
                  styles.streakDayName,
                  active && styles.streakDayNameActive,
                  isToday && styles.streakDayNameToday,
                  !active && !isToday && styles.streakDayNameInactive
                ]}>
                  {day.name}
                </Text>
              </View>
            );
          })}
        </View>

        {streak?.bonus_available && !claimed ? (
          <TouchableOpacity
            style={[styles.claimBtn, { backgroundColor: '#F9E08B' }]}
            onPress={handleClaim}
            disabled={claiming}
          >
            {claiming ? (
              <ActivityIndicator color="#000" />
            ) : (
              <Text style={[styles.claimBtnText, { color: '#000' }]}>🎁 Claim +{streak.next_bonus?.coins ?? 0} Coins</Text>
            )}
          </TouchableOpacity>
        ) : claimed ? (
          <View style={styles.claimedBox}>
            <Text style={styles.claimedText}>✅ Bonus Claimed!</Text>
          </View>
        ) : (
          <View style={styles.noBonusBox}>
            <Text style={styles.noBonusText}>Come back tomorrow for your next bonus 🌙</Text>
          </View>
        )}
      </View>
    </View>
  );
};

// ─────────────────────────────────────────────────────────────
// Components: Gift Modal
// ─────────────────────────────────────────────────────────────
const GiftModal = ({ coins, onClose, onRefresh }) => {
  const navigation = useNavigation();
  const [recipient, setRecipient] = useState('');
  const [amount, setAmount] = useState(10);
  const [message, setMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [done, setDone] = useState(false);

  const handleSend = async () => {
    if (!recipient.trim()) return;
    setSending(true);
    try {
      await api.sendGift(recipient, amount, message);
      setDone(true);
      onRefresh();
    } catch (e) {
      alert(e.message || 'Failed to send gift');
    } finally {
      setSending(false);
    }
  };

  if (done) {
    return (
      <View style={styles.modalContent}>
        <ModalHeader title="🎁 Gift Sent!" onClose={onClose} />
        <View style={styles.doneContainer}>
          <Text style={styles.doneEmoji}>🎉</Text>
          <Text style={[styles.doneTitle, { color: '#F9E08B' }]}>Gift Sent Successfully!</Text>
          <Text style={styles.doneSub}>You sent {amount} coins to @{recipient}</Text>
          <TouchableOpacity style={[styles.doneBtn, { backgroundColor: '#F9E08B' }]} onPress={onClose}>
            <Text style={[styles.doneBtnText, { color: '#000' }]}>Awesome! 🎊</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.modalContent}>
      <ModalHeader title="🎁 Send Coin Gift" onClose={onClose} />
      <View style={styles.scrollPadding}>
        <View style={styles.balanceRow}>
          <Text style={styles.balanceLabel}>Your balance</Text>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            <Text style={[styles.balanceValue, { color: '#F9E08B' }]}>🪙 {coins?.balance ?? 0}</Text>
            <TouchableOpacity
              onPress={() => { onClose(); navigation.navigate('Wallet'); }}
              style={[styles.topUpBtn, { borderColor: '#F9E08B' }]}
            >
              <Text style={[styles.topUpBtnText, { color: '#F9E08B' }]}>+ Top Up</Text>
            </TouchableOpacity>
          </View>
        </View>

        <Text style={styles.inputLabel}>Recipient Username</Text>
        <TextInput
          style={styles.input}
          value={recipient}
          onChangeText={setRecipient}
          placeholder="e.g. johndoe"
          autoCapitalize="none"
        />

        <Text style={styles.inputLabel}>Amount</Text>
        <View style={styles.amountPicker}>
          <TouchableOpacity onPress={() => setAmount(Math.max(1, amount - 5))} style={[styles.amtBtn, { borderColor: '#F9E08B' }]}>
            <Text style={[styles.amtBtnText, { color: '#F9E08B' }]}>−</Text>
          </TouchableOpacity>
          <Text style={[styles.amtText, { color: '#F9E08B' }]}>🪙 {amount}</Text>
          <TouchableOpacity onPress={() => setAmount(amount + 5)} style={[styles.amtBtn, { borderColor: '#F9E08B' }]}>
            <Text style={[styles.amtBtnText, { color: '#F9E08B' }]}>+</Text>
          </TouchableOpacity>
        </View>

        <Text style={styles.inputLabel}>Message (optional)</Text>
        <TextInput
          style={styles.input}
          value={message}
          onChangeText={setMessage}
          placeholder="Say something nice ✨"
        />

        <TouchableOpacity
          style={[styles.sendBtn, !recipient && styles.sendBtnDisabled, { backgroundColor: '#F9E08B' }]}
          onPress={handleSend}
          disabled={sending || !recipient}
        >
          {sending ? (
            <ActivityIndicator color="#000" />
          ) : (
            <Text style={[styles.sendBtnText, { color: '#000' }]}>🎁 Send {amount} Coins</Text>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
};

// ─────────────────────────────────────────────────────────────
// Main Component
// ─────────────────────────────────────────────────────────────
export default function GamificationBar({ userId, onShowWallet }) {
  const insets = useSafeAreaInsets();
  const [status, setStatus] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeModal, setActiveModal] = useState(null); // 'coins', 'streak', 'gift'

  useEffect(() => {
    loadStatus();
  }, []);

  const loadStatus = async () => {
    try {
      const res = await api.getGamificationStatus();
      setStatus(res);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleClaim = async () => {
    const res = await api.claimLoginBonus();
    loadStatus(); // refresh
    return res;
  };

  if (loading && !status) {
    return (
      <View style={styles.bar}>
        {[1, 2, 3].map(i => (
          <View key={i} style={styles.skeletonItem} />
        ))}
      </View>
    );
  }

  const { coins, login_streak, gifts } = status || {};

  return (
    <View style={styles.bar}>
      <TouchableOpacity style={styles.item} onPress={() => setActiveModal('coins')}>
        <View style={styles.iconCircle}>
          <Text style={styles.emoji}>🪙</Text>
        </View>
        <Text style={styles.value}>{coins?.balance ?? 0}</Text>
        <Text style={styles.label}>Coins</Text>
      </TouchableOpacity>
      
      <View style={styles.divider} />
      
      <TouchableOpacity style={styles.item} onPress={() => setActiveModal('streak')}>
        <View style={styles.iconCircle}>
          <Text style={styles.emoji}>🔥</Text>
        </View>
        <Text style={styles.value}>{login_streak?.current ?? 0}d</Text>
        <Text style={styles.label}>Streak</Text>
        {login_streak?.bonus_available && <View style={styles.badge} />}
      </TouchableOpacity>
      
      <View style={styles.divider} />
      
      <TouchableOpacity style={styles.item} onPress={() => setActiveModal('gift')}>
        <View style={styles.iconCircle}>
          <Text style={styles.emoji}>🎁</Text>
        </View>
        <Text style={styles.value}>{gifts?.received_today ?? 0}</Text>
        <Text style={styles.label}>Gifts</Text>
      </TouchableOpacity>

      {/* Modals */}
      <Modal
        visible={!!activeModal}
        transparent
        animationType="slide"
        onRequestClose={() => setActiveModal(null)}
      >
        <TouchableOpacity 
          style={styles.modalOverlay} 
          activeOpacity={1} 
          onPress={() => setActiveModal(null)}
        >
          <View style={[styles.modalContainer, { paddingBottom: Math.max(80, insets.bottom + 40) }]}>
            {activeModal === 'coins' && <CoinsModal coins={coins} onClose={() => setActiveModal(null)} />}
            {activeModal === 'streak' && <StreakModal streak={login_streak} onClaim={handleClaim} onClose={() => setActiveModal(null)} />}
            {activeModal === 'gift' && <GiftModal coins={coins} onClose={() => setActiveModal(null)} onRefresh={loadStatus} onShowWallet={onShowWallet} />}
          </View>
        </TouchableOpacity>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  bar: {
    flexDirection: 'row',
    backgroundColor: '#0D0D0D',
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: 'rgba(218,155,42,0.25)',
    paddingVertical: 4,
  },
  item: {
    flex: 1,
    alignItems: 'center',
    position: 'relative',
    paddingVertical: 12,
  },
  divider: {
    width: 1,
    height: '70%',
    backgroundColor: '#262626',
    alignSelf: 'center',
  },
  iconCircle: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: 'rgba(218,155,42,0.09)',
    borderWidth: 2.5,
    borderColor: 'rgba(218,155,42,0.25)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  emoji: { fontSize: 24 },
  value: { fontSize: 15, fontWeight: 800, color: '#FFFFFF', marginBottom: 2 },
  label: { fontSize: 10, color: '#C2994B', fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.5 },
  badge: {
    position: 'absolute',
    top: 6,
    right: '18%',
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#EF4444',
    borderWidth: 2,
    borderColor: '#fff',
  },
  skeletonItem: {
    flex: 1,
    height: 40,
    backgroundColor: '#1A1A1A',
    marginHorizontal: 10,
    borderRadius: 8,
  },

  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'flex-end',
  },
  modalContainer: {
    backgroundColor: '#0D0D0D',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: height * 0.8,
  },
  modalContent: {
    width: '100%',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    paddingBottom: 8,
  },
  modalTitle: { fontSize: 18, fontWeight: 700, color: '#F9E08B' },
  closeBtn: { 
    width: 32, 
    height: 32, 
    borderRadius: 16, 
    backgroundColor: 'rgba(249,224,139,0.1)', 
    borderWidth: 1,
    borderColor: 'rgba(249,224,139,0.2)',
    alignItems: 'center', 
    justifyContent: 'center' 
  },
  scrollPadding: { padding: 12 },
  
  balanceHero: {
    backgroundColor: 'linear-gradient(135deg, #F9E08B, #F59E0B)',
    borderRadius: 20,
    padding: 28,
    alignItems: 'center',
    marginBottom: 20,
  },
  heroEmoji: { fontSize: 56, marginBottom: 4 },
  heroAmount: { fontSize: 48, fontWeight: 900, color: '#000', lineHeight: 1 },
  heroLabel: { fontSize: 14, color: 'rgba(0,0,0,0.75)', marginTop: 4, fontWeight: 600 },
  bestStreak: { fontSize: 12, color: 'rgba(0,0,0,0.65)', marginTop: 6 },
  streakDaysContainer: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 20, paddingHorizontal: 4 },
  streakDayItem: { flexDirection: 'column', alignItems: 'center', gap: 4 },
  streakDayCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#F5F5F4',
    borderWidth: 2,
    borderColor: 'transparent',
    alignItems: 'center',
    justifyContent: 'center',
  },
  streakDayCircleActive: {
    backgroundColor: '#F9E08B',
    borderWidth: 0,
  },
  streakDayCircleToday: {
    borderColor: '#F9E08B',
    backgroundColor: 'rgba(249,224,139,0.1)',
  },
  streakDayCircleInactive: {
    backgroundColor: '#F5F5F4',
    borderColor: 'transparent',
  },
  streakDayText: { fontSize: 14, fontWeight: 700, color: '#A8A29E' },
  streakDayTextActive: { color: '#000' },
  streakDayTextToday: { color: '#F9E08B', fontSize: 12 },
  streakDayTextInactive: { color: '#A8A29E' },
  streakDayName: { fontSize: 10, color: '#A8A29E', fontWeight: 600 },
  streakDayNameActive: { color: '#F9E08B' },
  streakDayNameToday: { color: '#F9E08B' },
  streakDayNameInactive: { color: '#A8A29E' },
  
  statsGrid: { flexDirection: 'row', gap: 12, marginBottom: 20 },
  statBox: { flex: 1, borderRadius: 14, padding: 14, alignItems: 'center', borderWidth: 1.5 },
  statEmoji: { fontSize: 24, marginBottom: 4 },
  statValue: { fontSize: 22, fontWeight: 800 },
  statLabel: { fontSize: 11, color: '#78716C' },

  tipBox: { backgroundColor: 'rgba(139,92,246,0.08)', borderRadius: 12, padding: 12, borderWidth: 1, borderColor: 'rgba(139,92,246,0.15)' },
  tipText: { fontSize: 13, color: '#78716C', textAlign: 'center', lineHeight: 18 },
  
  claimBtn: { backgroundColor: '#10B981', borderRadius: 14, padding: 18, alignItems: 'center' },
  claimBtnText: { color: '#fff', fontSize: 16, fontWeight: '700' },
  claimedBox: { backgroundColor: '#ECFDF5', borderRadius: 14, padding: 18, alignItems: 'center' },
  claimedText: { color: '#10B981', fontWeight: '700', fontSize: 16 },
  noBonusBox: { backgroundColor: '#F5F5F4', borderRadius: 14, padding: 18, alignItems: 'center' },
  noBonusText: { color: '#78716C', fontSize: 14 },
  
  balanceRow: { flexDirection: 'row', justifyContent: 'space-between', backgroundColor: 'rgba(249,224,139,0.1)', borderRadius: 12, padding: 12, marginBottom: 16 },
  balanceLabel: { fontSize: 13, color: '#78716C' },
  balanceValue: { fontSize: 16, fontWeight: '800', color: '#F9E08B' },

  inputLabel: { fontSize: 14, fontWeight: '600', color: '#F9E08B', marginBottom: 8 },
  input: { backgroundColor: '#1A1A1A', borderColor: 'rgba(249,224,139,0.3)', borderWidth: 1.5, borderRadius: 12, padding: 14, fontSize: 15, marginBottom: 16, color: '#fff' },

  amountPicker: { flexDirection: 'row', alignItems: 'center', gap: 20, marginBottom: 16, justifyContent: 'center' },
  amtBtn: { width: 44, height: 44, borderRadius: 12, backgroundColor: '#1A1A1A', alignItems: 'center', justifyContent: 'center', borderWidth: 1.5, borderColor: 'rgba(249,224,139,0.3)' },
  amtBtnText: { fontSize: 24, fontWeight: '700', color: '#F9E08B' },
  amtText: { fontSize: 28, fontWeight: '900', color: '#F9E08B' },

  sendBtn: { backgroundColor: '#F9E08B', borderRadius: 14, padding: 16, alignItems: 'center', flexShrink: 0 },
  sendBtnDisabled: { opacity: 0.5 },
  sendBtnText: { color: '#000', fontSize: 16, fontWeight: '700' },

  doneContainer: { padding: 24, alignItems: 'center' },
  doneEmoji: { fontSize: 64, marginBottom: 12 },
  doneTitle: { fontSize: 20, fontWeight: '800', color: '#F9E08B', marginBottom: 8 },
  doneSub: { fontSize: 14, color: '#78716C', marginBottom: 24, textAlign: 'center' },
  doneBtn: { backgroundColor: '#F9E08B', borderRadius: 14, padding: 16, width: '100%', alignItems: 'center' },
  doneBtnText: { color: '#000', fontSize: 16, fontWeight: '700' },
  topUpBtn: { backgroundColor: 'rgba(249,224,139,0.1)', borderRadius: 8, paddingHorizontal: 10, paddingVertical: 4, borderWidth: 1, borderColor: '#F9E08B' },
  topUpBtnText: { color: '#F9E08B', fontSize: 12, fontWeight: '700' },
});

