import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  ScrollView,
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
const BRAND_GOLD = '#DA9B2A';

// ─────────────────────────────────────────────────────────────
// Components: Modal Header
// ─────────────────────────────────────────────────────────────
const ModalHeader = ({ title, onClose }) => (
  <View style={styles.modalHeader}>
    <Text style={styles.modalTitle}>{title}</Text>
    <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
      <Ionicons name="close" size={24} color="#78716C" />
    </TouchableOpacity>
  </View>
);

// ─────────────────────────────────────────────────────────────
// Components: Coins Modal
// ─────────────────────────────────────────────────────────────
const CoinsModal = ({ coins, onClose }) => (
  <View style={styles.modalContent}>
    <ModalHeader title="💰 Coin Balance" onClose={onClose} />
    <ScrollView contentContainerStyle={styles.scrollPadding}>
      <View style={styles.balanceHero}>
        <Text style={styles.heroEmoji}>🪙</Text>
        <Text style={styles.heroAmount}>{coins?.balance?.total ?? coins?.balance ?? 0}</Text>
        <Text style={styles.heroLabel}>Total Balance</Text>
      </View>
      
      <View style={styles.statsGrid}>
        <View style={[styles.statBox, { backgroundColor: '#10B98112', borderColor: '#10B98125' }]}>
          <Text style={styles.statEmoji}>🎁</Text>
          <Text style={[styles.statValue, { color: '#10B981' }]}>{coins?.balance?.earned ?? coins?.earned_total ?? 0}</Text>
          <Text style={styles.statLabel}>Earned</Text>
        </View>
        <View style={[styles.statBox, { backgroundColor: '#8B5CF612', borderColor: '#8B5CF625' }]}>
          <Text style={styles.statEmoji}>�</Text>
          <Text style={[styles.statValue, { color: '#8B5CF6' }]}>{coins?.balance?.purchased ?? 0}</Text>
          <Text style={styles.statLabel}>Purchased</Text>
        </View>
      </View>
      
      <View style={styles.tipBox}>
        <Text style={styles.tipText}>
          💡 Earned coins come from activities (login, posts, likes). Purchased coins are bought and can be used for gifting.
        </Text>
      </View>
    </ScrollView>
  </View>
);

// ─────────────────────────────────────────────────────────────
// Components: Streak Modal
// ─────────────────────────────────────────────────────────────
const StreakModal = ({ streak, onClaim, onClose }) => {
  const [claiming, setClaiming] = useState(false);
  const [claimed, setClaimed] = useState(false);
  
  const cur = streak?.current ?? 0;
  
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
      <ScrollView contentContainerStyle={styles.scrollPadding}>
        <View style={[styles.balanceHero, { backgroundColor: '#EF4444', borderBottomWidth: 0 }]}>
          <Text style={styles.heroEmoji}>🔥</Text>
          <Text style={[styles.heroAmount, { color: '#fff' }]}>{cur}</Text>
          <Text style={[styles.heroLabel, { color: 'rgba(255,255,255,0.9)' }]}>Day Streak</Text>
        </View>
        
        {streak?.bonus_available && !claimed ? (
          <TouchableOpacity 
            style={styles.claimBtn} 
            onPress={handleClaim}
            disabled={claiming}
          >
            {claiming ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.claimBtnText}>🎁 Claim Day {cur + 1} Bonus!</Text>
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
      </ScrollView>
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
          <Text style={styles.doneTitle}>Gift Sent Successfully!</Text>
          <Text style={styles.doneSub}>You sent {amount} coins to @{recipient}</Text>
          <TouchableOpacity style={styles.doneBtn} onPress={onClose}>
            <Text style={styles.doneBtnText}>Awesome! 🎊</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.modalContent}>
      <ModalHeader title="🎁 Send Coin Gift" onClose={onClose} />
      <ScrollView contentContainerStyle={styles.scrollPadding}>
        <View style={styles.balanceRow}>
          <Text style={styles.balanceLabel}>Your balance</Text>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            <Text style={styles.balanceValue}>🪙 {coins?.balance ?? 0}</Text>
            <TouchableOpacity
              onPress={() => { onClose(); navigation.navigate('Wallet'); }}
              style={styles.topUpBtn}
            >
              <Text style={styles.topUpBtnText}>+ Top Up</Text>
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
          <TouchableOpacity onPress={() => setAmount(Math.max(1, amount - 5))} style={styles.amtBtn}>
            <Text style={styles.amtBtnText}>−</Text>
          </TouchableOpacity>
          <Text style={styles.amtText}>🪙 {amount}</Text>
          <TouchableOpacity onPress={() => setAmount(amount + 5)} style={styles.amtBtn}>
            <Text style={styles.amtBtnText}>+</Text>
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
          style={[styles.sendBtn, !recipient && styles.sendBtnDisabled]} 
          onPress={handleSend}
          disabled={sending || !recipient}
        >
          {sending ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.sendBtnText}>🎁 Send {amount} Coins</Text>
          )}
        </TouchableOpacity>
      </ScrollView>
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
        <Text style={styles.emoji}>🪙</Text>
        <Text style={styles.value}>{coins?.balance ?? 0}</Text>
        <Text style={styles.label}>Coins</Text>
      </TouchableOpacity>
      
      <View style={styles.divider} />
      
      <TouchableOpacity style={styles.item} onPress={() => setActiveModal('streak')}>
        <Text style={styles.emoji}>🔥</Text>
        <Text style={styles.value}>{login_streak?.current ?? 0}d</Text>
        <Text style={styles.label}>Streak</Text>
        {login_streak?.bonus_available && <View style={styles.badge} />}
      </TouchableOpacity>
      
      <View style={styles.divider} />
      
      <TouchableOpacity style={styles.item} onPress={() => setActiveModal('gift')}>
        <Text style={styles.emoji}>🎁</Text>
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
          <View style={[styles.modalContainer, { paddingBottom: insets.bottom + 20 }]}>
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
    backgroundColor: '#FFF8F0',
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: '#DA9B2A20',
    paddingVertical: 10,
    marginVertical: 4,
  },
  item: {
    flex: 1,
    alignItems: 'center',
    position: 'relative',
  },
  divider: {
    width: 1,
    height: '70%',
    backgroundColor: '#F0EDEB',
    alignSelf: 'center',
  },
  emoji: { fontSize: 24, marginBottom: 2 },
  value: { fontSize: 16, fontWeight: '800', color: '#1C1917' },
  label: { fontSize: 10, color: '#78716C', fontWeight: '600', textTransform: 'uppercase' },
  badge: {
    position: 'absolute',
    top: 4,
    right: '25%',
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#EF4444',
    borderWidth: 1.5,
    borderColor: '#fff',
  },
  skeletonItem: {
    flex: 1,
    height: 40,
    backgroundColor: '#F5F5F4',
    marginHorizontal: 10,
    borderRadius: 8,
  },

  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContainer: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: height * 0.85,
    paddingBottom: Platform.OS === 'ios' ? 40 : 20,
  },
  modalContent: {
    width: '100%',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#F5F5F4',
  },
  modalTitle: { fontSize: 18, fontWeight: '800', color: '#1C1917' },
  closeBtn: { width: 32, height: 32, borderRadius: 16, backgroundColor: '#F5F5F4', alignItems: 'center', justifyContent: 'center' },
  scrollPadding: { padding: 20 },
  
  balanceHero: {
    backgroundColor: BRAND_GOLD,
    borderRadius: 20,
    padding: 30,
    alignItems: 'center',
    marginBottom: 20,
  },
  heroEmoji: { fontSize: 50, marginBottom: 10 },
  heroAmount: { fontSize: 44, fontWeight: '900', color: '#fff' },
  heroLabel: { fontSize: 14, color: 'rgba(255,255,255,0.8)' },
  
  statsGrid: { flexDirection: 'row', gap: 12, marginBottom: 20 },
  statBox: { flex: 1, borderRadius: 14, padding: 16, alignItems: 'center', borderWidth: 1.5 },
  statEmoji: { fontSize: 24, marginBottom: 4 },
  statValue: { fontSize: 22, fontWeight: '800' },
  statLabel: { fontSize: 11, color: '#78716C' },
  
  tipBox: { backgroundColor: '#FFF8F0', borderRadius: 12, padding: 15 },
  tipText: { fontSize: 13, color: '#78716C', textAlign: 'center', lineHeight: 18 },
  
  claimBtn: { backgroundColor: '#10B981', borderRadius: 14, padding: 18, alignItems: 'center' },
  claimBtnText: { color: '#fff', fontSize: 16, fontWeight: '700' },
  claimedBox: { backgroundColor: '#ECFDF5', borderRadius: 14, padding: 18, alignItems: 'center' },
  claimedText: { color: '#10B981', fontWeight: '700', fontSize: 16 },
  noBonusBox: { backgroundColor: '#F5F5F4', borderRadius: 14, padding: 18, alignItems: 'center' },
  noBonusText: { color: '#78716C', fontSize: 14 },
  
  balanceRow: { flexDirection: 'row', justifyContent: 'space-between', backgroundColor: '#FFF8F0', borderRadius: 12, padding: 12, marginBottom: 16 },
  balanceLabel: { fontSize: 13, color: '#78716C' },
  balanceValue: { fontSize: 16, fontWeight: '800', color: BRAND_GOLD },
  
  inputLabel: { fontSize: 13, fontWeight: '600', color: '#78716C', marginBottom: 6 },
  input: { backgroundColor: '#fff', borderWeight: 1.5, borderColor: '#E7E5E4', borderWidth: 1.5, borderRadius: 12, padding: 14, fontSize: 15, marginBottom: 16 },
  
  amountPicker: { flexDirection: 'row', alignItems: 'center', gap: 20, marginBottom: 16, justifyContent: 'center' },
  amtBtn: { width: 44, height: 44, borderRadius: 12, backgroundColor: '#F5F5F4', alignItems: 'center', justifyContent: 'center', borderWidth: 1 },
  amtBtnText: { fontSize: 24, fontWeight: '700' },
  amtText: { fontSize: 28, fontWeight: '900', color: BRAND_GOLD },
  
  sendBtn: { backgroundColor: '#8B5CF6', borderRadius: 14, padding: 18, alignItems: 'center' },
  sendBtnDisabled: { opacity: 0.5 },
  sendBtnText: { color: '#fff', fontSize: 16, fontWeight: '700' },
  
  doneContainer: { padding: 40, alignItems: 'center' },
  doneEmoji: { fontSize: 64, marginBottom: 12 },
  doneTitle: { fontSize: 20, fontWeight: '800', color: '#1C1917', marginBottom: 8 },
  doneSub: { fontSize: 14, color: '#78716C', marginBottom: 30, textAlign: 'center' },
  doneBtn: { backgroundColor: '#8B5CF6', borderRadius: 14, padding: 16, width: '100%', alignItems: 'center' },
  doneBtnText: { color: '#fff', fontSize: 16, fontWeight: '700' },
  topUpBtn: { backgroundColor: BRAND_GOLD + '20', borderRadius: 8, paddingHorizontal: 10, paddingVertical: 4, borderWidth: 1, borderColor: BRAND_GOLD },
  topUpBtnText: { color: BRAND_GOLD, fontSize: 12, fontWeight: '700' },
});
