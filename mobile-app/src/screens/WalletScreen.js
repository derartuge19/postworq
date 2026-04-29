import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Alert,
  Modal,
  TextInput,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { LinearGradient } from 'expo-linear-gradient';
import api from '../api';

const CACHE_KEY = 'wallet_cache';
const CACHE_TTL = 60 * 1000; // 1 minute

async function readCache() {
  try {
    const raw = await AsyncStorage.getItem(CACHE_KEY);
    if (!raw) return null;
    const { ts, balance, packages } = JSON.parse(raw);
    if (Date.now() - ts > CACHE_TTL) return null;
    return { balance, packages: Array.isArray(packages) ? packages : [] };
  } catch { return null; }
}

async function writeCache(balance, packages) {
  try {
    await AsyncStorage.setItem(CACHE_KEY, JSON.stringify({ ts: Date.now(), balance, packages }));
  } catch {}
}

const BRAND_GOLD = '#C8B56A';

export default function WalletScreen({ navigation }) {
  const insets = useSafeAreaInsets();
  const [balance, setBalance] = useState(null);
  const [packages, setPackages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedPackage, setSelectedPackage] = useState(null);
  const [phoneNumber, setPhoneNumber] = useState('');
  const [showTopUpModal, setShowTopUpModal] = useState(false);
  const [loadingPayment, setLoadingPayment] = useState(false);

  useEffect(() => {
    initLoad();
  }, []);

  const initLoad = async () => {
    const cached = await readCache();
    if (cached) {
      setBalance(cached.balance);
      setPackages(Array.isArray(cached.packages) ? cached.packages : []);
      setLoading(false);
      loadWalletData(true); // silent background refresh
    } else {
      loadWalletData(false);
    }
  };

  const loadWalletData = async (silent = false) => {
    try {
      if (!silent) setLoading(true);
      else setRefreshing(true);
      const [balanceData, packagesData] = await Promise.all([
        api.getWalletBalance(),
        api.getCoinPackages(),
      ]);
      const pkgs = Array.isArray(packagesData?.results) ? packagesData.results : Array.isArray(packagesData) ? packagesData : [];
      setBalance(balanceData);
      setPackages(pkgs);
      writeCache(balanceData, pkgs);
    } catch (error) {
      console.error('Error loading wallet data:', error);
      if (!silent) Alert.alert('Error', 'Failed to load wallet data');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleTelebirrPayment = async () => {
    if (!selectedPackage || !phoneNumber) {
      Alert.alert('Error', 'Please select a package and enter your phone number');
      return;
    }

    setLoadingPayment(true);
    try {
      const response = await api.request('/wallet/telebirr/initiate/', {
        method: 'POST',
        body: JSON.stringify({
          package_id: selectedPackage.id,
          phone_number: phoneNumber,
        }),
      });

      if (response.success && response.payment_url) {
        Alert.alert(
          'Payment Initiated',
          'Telebirr payment page opened. Complete the payment to add coins.',
          [
            {
              text: 'OK',
              onPress: () => {
                setShowTopUpModal(false);
                loadWalletData();
              },
            },
          ]
        );
      } else {
        Alert.alert('Error', response.error || 'Payment initiation failed');
      }
    } catch (error) {
      console.error('Telebirr payment error:', error);
      Alert.alert('Error', 'Payment initiation failed. Please try again.');
    } finally {
      setLoadingPayment(false);
    }
  };

  if (loading) {
    return (
      <View style={[styles.container, { paddingTop: insets.top }]}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Ionicons name="chevron-back" size={24} color="#C8B56A" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Wallet</Text>
          <View style={{ width: 24 }} />
        </View>
        {/* Skeleton */}
        <View style={{ padding: 16 }}>
          {[1, 2, 3].map(i => (
            <View key={i} style={styles.skeletonCard} />
          ))}
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="chevron-back" size={24} color="#C8B56A" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Wallet</Text>
        <TouchableOpacity onPress={() => loadWalletData(false)}>
          {refreshing
            ? <ActivityIndicator size="small" color={BRAND_GOLD} />
            : <Ionicons name="refresh" size={22} color="#C8B56A" />}
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content}>
        {/* Balance Card - matches web app gradient design */}
        <LinearGradient
          colors={['#C8B56A', '#6366F1']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.balanceCard}
        >
          <View style={styles.balanceHeader}>
            <Ionicons name="wallet" size={16} color="#fff" />
            <Text style={styles.balanceLabel}>Total Balance</Text>
          </View>
          <Text style={styles.balanceAmount}>{balance?.balance?.total || balance?.balance || 0}</Text>
          <Text style={styles.balanceSubtext}>
            ≈ {((balance?.balance?.total || balance?.balance || 0) / (balance?.config?.coins_per_birr || 10)).toFixed(2)} ETB (Birr)
          </Text>

          {/* Two-bucket breakdown */}
          <View style={styles.balanceBreakdown}>
            <View style={styles.balanceBucket}>
              <Text style={styles.balanceBucketLabel}>Earned</Text>
              <Text style={styles.balanceBucketValue}>{balance?.balance?.earned || balance?.earned_total || 0}</Text>
              <Text style={styles.balanceBucketSub}>Withdrawable to Birr</Text>
            </View>
            <View style={styles.balanceBucket}>
              <Text style={styles.balanceBucketLabel}>Purchased</Text>
              <Text style={styles.balanceBucketValue}>{balance?.balance?.purchased || 0}</Text>
              <Text style={styles.balanceBucketSub}>For gifts & boosts</Text>
            </View>
          </View>
        </LinearGradient>

        {/* Action buttons */}
        <View style={styles.actionButtons}>
          <TouchableOpacity style={styles.actionButtonPrimary} onPress={() => setShowTopUpModal(true)}>
            <Ionicons name="arrow-down" size={18} color="#000" />
            <Text style={styles.actionButtonTextPrimary}>Buy Coins</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionButtonSecondary} onPress={() => Alert.alert('Coming Soon', 'Withdrawal feature coming soon')}>
            <Ionicons name="arrow-up" size={18} color="#C8B56A" />
            <Text style={styles.actionButtonTextSecondary}>Withdraw to Birr</Text>
          </TouchableOpacity>
        </View>

        {/* Coin Packages */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Purchase Coins</Text>
          <Text style={styles.sectionSubtitle}>Get more coins to send gifts and boost posts</Text>

          {packages.length === 0 ? (
            <View style={styles.emptyState}>
              <Text style={styles.emptyText}>No coin packages available</Text>
              <Text style={styles.emptySubtext}>Contact support to purchase coins</Text>
            </View>
          ) : (
            packages.map((pkg) => (
              <TouchableOpacity
                key={pkg.id}
                style={[styles.packageCard, selectedPackage?.id === pkg.id && styles.packageCardSelected]}
                onPress={() => {
                  setSelectedPackage(pkg);
                  setShowTopUpModal(true);
                }}
              >
                <View>
                  <Text style={styles.packageName}>{pkg.name}</Text>
                  <Text style={styles.packageCoins}>{pkg.coin_amount} coins</Text>
                  {pkg.bonus_coins > 0 && (
                    <Text style={styles.packageBonus}>+{pkg.bonus_coins} bonus</Text>
                  )}
                </View>
                <View style={styles.packagePrice}>
                  <Text style={styles.packagePriceText}>{pkg.price_etb} ETB</Text>
                  {pkg.is_featured && (
                    <View style={styles.featuredBadge}>
                      <Text style={styles.featuredText}>Popular</Text>
                    </View>
                  )}
                </View>
              </TouchableOpacity>
            ))
          )}
        </View>

        {/* Info */}
        <View style={styles.infoBox}>
          <Ionicons name="information-circle" size={20} color={BRAND_GOLD} />
          <Text style={styles.infoText}>
            Only purchased coins can be used for gifting. Earned coins from activities cannot be gifted.
          </Text>
        </View>
      </ScrollView>

      {/* Telebirr Payment Modal */}
      <Modal visible={showTopUpModal} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <TouchableOpacity onPress={() => setShowTopUpModal(false)}>
                <Ionicons name="close" size={24} color="#000" />
              </TouchableOpacity>
              <Text style={styles.modalTitle}>Buy Coins with Telebirr</Text>
              <View style={{ width: 24 }} />
            </View>

            {selectedPackage && (
              <View style={styles.selectedPackagePreview}>
                <View style={styles.packagePreviewIcon}>
                  <Ionicons name="cash" size={32} color={BRAND_GOLD} />
                </View>
                <View style={styles.packagePreviewInfo}>
                  <Text style={styles.packagePreviewName}>{selectedPackage.name}</Text>
                  <Text style={styles.packagePreviewCoins}>{selectedPackage.coin_amount} coins</Text>
                  {selectedPackage.bonus_coins > 0 && (
                    <Text style={styles.packagePreviewBonus}>+{selectedPackage.bonus_coins} bonus</Text>
                  )}
                </View>
                <Text style={styles.packagePreviewPrice}>{selectedPackage.price_etb} ETB</Text>
              </View>
            )}

            <View style={styles.formGroup}>
              <Text style={styles.formLabel}>Phone Number (for Telebirr)</Text>
              <TextInput
                style={styles.textInput}
                placeholder="+251 9xx xxx xxx"
                value={phoneNumber}
                onChangeText={setPhoneNumber}
                keyboardType="phone-pad"
              />
            </View>

            <TouchableOpacity
              style={[styles.payButton, (!selectedPackage || !phoneNumber) && styles.payButtonDisabled]}
              onPress={handleTelebirrPayment}
              disabled={!selectedPackage || !phoneNumber || loadingPayment}
            >
              {loadingPayment ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.payButtonText}>
                  {selectedPackage ? `Pay ${selectedPackage.price_etb} ETB via Telebirr` : 'Select a package'}
                </Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0B0B0C',
  },
  centered: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#1A1A1A',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#C8B56A',
  },
  content: {
    flex: 1,
  },
  balanceCard: {
    margin: 16,
    padding: 24,
    borderRadius: 20,
  },
  balanceHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    opacity: 0.9,
    marginBottom: 4,
  },
  balanceLabel: {
    fontSize: 13,
    color: '#fff',
  },
  balanceAmount: {
    fontSize: 42,
    fontWeight: 800,
    color: '#fff',
    marginTop: 4,
    marginBottom: 4,
  },
  balanceSubtext: {
    fontSize: 13,
    color: '#fff',
    opacity: 0.9,
  },
  balanceBreakdown: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 20,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.2)',
  },
  balanceBucket: {
    flex: 1,
  },
  balanceBucketLabel: {
    fontSize: 11,
    color: '#fff',
    opacity: 0.85,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  balanceBucketValue: {
    fontSize: 22,
    fontWeight: 700,
    color: '#fff',
    marginTop: 2,
  },
  balanceBucketSub: {
    fontSize: 11,
    color: '#fff',
    opacity: 0.8,
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 10,
    paddingHorizontal: 16,
  },
  actionButtonPrimary: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    padding: 12,
    borderRadius: 10,
    backgroundColor: BRAND_GOLD,
  },
  actionButtonTextPrimary: {
    fontSize: 14,
    fontWeight: 700,
    color: '#000',
  },
  actionButtonSecondary: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    padding: 12,
    borderRadius: 10,
    backgroundColor: '#1A1A1A',
    borderWidth: 1.5,
    borderColor: '#333',
  },
  actionButtonTextSecondary: {
    fontSize: 14,
    fontWeight: 700,
    color: BRAND_GOLD,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#C8B56A',
    marginBottom: 4,
  },
  sectionSubtitle: {
    fontSize: 14,
    color: '#C8B56A',
    marginBottom: 12,
  },
  packageCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#f9f9f9',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  packageName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#C8B56A',
  },
  packageCoins: {
    fontSize: 20,
    fontWeight: '700',
    color: BRAND_GOLD,
  },
  packageBonus: {
    fontSize: 12,
    color: '#10B981',
    fontWeight: '600',
  },
  packagePrice: {
    alignItems: 'flex-end',
  },
  packagePriceText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#C8B56A',
  },
  featuredBadge: {
    backgroundColor: BRAND_GOLD,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
    marginTop: 4,
  },
  featuredText: {
    fontSize: 10,
    color: '#fff',
    fontWeight: '600',
  },
  emptyState: {
    backgroundColor: '#f9f9f9',
    borderRadius: 12,
    padding: 32,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#C8B56A',
    marginBottom: 4,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#C8B56A',
    textAlign: 'center',
  },
  infoBox: {
    flexDirection: 'row',
    backgroundColor: '#FFF8F0',
    borderRadius: 12,
    padding: 12,
    alignItems: 'flex-start',
    gap: 12,
  },
  infoText: {
    flex: 1,
    fontSize: 13,
    color: '#78716C',
    lineHeight: 18,
  },
  skeletonCard: {
    height: 80,
    borderRadius: 14,
    backgroundColor: '#1A1A1A',
    marginBottom: 12,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    paddingBottom: 40,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#000',
  },
  modalSubtitle: {
    fontSize: 14,
    color: '#666',
    marginBottom: 16,
  },
  phoneInput: {
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 10,
    padding: 12,
    fontSize: 14,
    marginBottom: 16,
  },
  modalButton: {
    backgroundColor: BRAND_GOLD,
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 12,
  },
  modalButtonDisabled: {
    backgroundColor: '#ccc',
  },
  payButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  packageCardSelected: {
    borderColor: BRAND_GOLD,
    borderWidth: 2,
  },
});





