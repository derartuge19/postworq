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
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { LinearGradient } from 'expo-linear-gradient';
import api from '../api';

const { width } = Dimensions.get('window');
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
const CYAN_COLOR = '#C8B56A';

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
  const [activeTab, setActiveTab] = useState('overview');
  const [transactions, setTransactions] = useState([]);
  const [withdrawals, setWithdrawals] = useState([]);

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

  const handleTabChange = (tab) => {
    setActiveTab(tab);
    if (tab === 'transactions' && transactions.length === 0) loadTransactions();
    if (tab === 'withdrawals' && withdrawals.length === 0) loadWithdrawals();
  };

  const loadTransactions = async () => {
    try {
      const data = await api.request('/wallet/transactions/?page_size=50');
      setTransactions(data.results || []);
    } catch (err) {
      console.error('Transactions load failed:', err);
    }
  };

  const loadWithdrawals = async () => {
    try {
      const data = await api.request('/wallet/withdrawals/');
      setWithdrawals(data.results || []);
    } catch (err) {
      console.error('Withdrawals load failed:', err);
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
          <Ionicons name="chevron-back" size={24} color={CYAN_COLOR} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Wallet</Text>
        <TouchableOpacity onPress={() => loadWalletData(false)}>
          {refreshing
            ? <ActivityIndicator size="small" color={BRAND_GOLD} />
            : <Ionicons name="refresh" size={22} color={CYAN_COLOR} />}
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content} contentContainerStyle={{ paddingBottom: insets.bottom + 20 }}>
        {/* Hero Balance Card */}
        <View style={styles.heroSection}>
          <LinearGradient
            colors={['#C8B56A', '#E6C96A', '#F4D03F']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.balanceCard}
          >
            {/* Decorative elements */}
            <View style={styles.decorativeCircle1} />
            <View style={styles.decorativeCircle2} />
            <View style={styles.decorativeCircle3} />
            
            <View style={styles.balanceHeader}>
              <View style={styles.walletIconContainer}>
                <Ionicons name="wallet" size={24} color="#000" />
              </View>
              <Text style={styles.balanceLabel}>My Wallet</Text>
            </View>
            
            <Text style={styles.balanceAmount}>{balance?.balance?.total ?? 0}</Text>
            <Text style={styles.coinLabel}>💰 Coins</Text>
            
            <View style={styles.balanceBreakdown}>
              <View style={styles.balanceBucket}>
                <View style={styles.bucketIconContainer}>
                  <Text style={styles.bucketIcon}>⭐</Text>
                </View>
                <Text style={styles.balanceBucketValue}>{balance?.balance?.earned ?? balance?.earned_total ?? 0}</Text>
                <Text style={styles.balanceBucketLabel}>Earned</Text>
              </View>
              
              <View style={styles.divider} />
              
              <View style={styles.balanceBucket}>
                <View style={styles.bucketIconContainer}>
                  <Text style={styles.bucketIcon}>💎</Text>
                </View>
                <Text style={styles.balanceBucketValue}>{balance?.balance?.purchased ?? 0}</Text>
                <Text style={styles.balanceBucketLabel}>Purchased</Text>
              </View>
            </View>
          </LinearGradient>
        </View>

        {/* Quick Actions */}
        <View style={styles.quickActions}>
          <TouchableOpacity style={styles.quickActionCard} onPress={() => setShowTopUpModal(true)}>
            <LinearGradient
              colors={['#4ECDC4', '#44A08D']}
              style={styles.quickActionGradient}
            >
              <Ionicons name="add-circle" size={28} color="#fff" />
              <Text style={styles.quickActionText}>Buy Coins</Text>
            </LinearGradient>
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.quickActionCard} onPress={() => Alert.alert('Coming Soon', 'Withdrawal feature coming soon')}>
            <LinearGradient
              colors={['#667eea', '#764ba2']}
              style={styles.quickActionGradient}
            >
              <Ionicons name="arrow-up-circle" size={28} color="#fff" />
              <Text style={styles.quickActionText}>Withdraw</Text>
            </LinearGradient>
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.quickActionCard} onPress={() => handleTabChange('transactions')}>
            <LinearGradient
              colors={['#f093fb', '#f5576c']}
              style={styles.quickActionGradient}
            >
              <Ionicons name="receipt" size={28} color="#fff" />
              <Text style={styles.quickActionText}>History</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>

        {/* Tab navigation */}
        <View style={styles.tabBar}>
          {['overview', 'transactions', 'withdrawals'].map((tab) => (
            <TouchableOpacity
              key={tab}
              onPress={() => handleTabChange(tab)}
              style={styles.tab}
            >
              <Text style={[styles.tabText, activeTab === tab && styles.tabTextActive]}>
                {tab.charAt(0).toUpperCase() + tab.slice(1)}
              </Text>
              {activeTab === tab && <View style={styles.tabIndicator} />}
            </TouchableOpacity>
          ))}
        </View>

        {/* Tab content */}
        <View style={styles.tabContent}>
          {activeTab === 'overview' && (
            <View>
              <Text style={styles.sectionTitle}>Recent Activity</Text>
              {transactions.length === 0 ? (
                <Text style={styles.emptyText}>No recent transactions</Text>
              ) : (
                transactions.slice(0, 5).map((tx) => (
                  <View key={tx.id} style={styles.transactionItem}>
                    <Text style={styles.transactionType}>{tx.type_display || tx.type}</Text>
                    <Text style={styles.transactionAmount}>
                      {tx.is_credit ? '+' : '-'}{tx.coins}
                    </Text>
                  </View>
                ))
              )}
            </View>
          )}
          {activeTab === 'transactions' && (
            <View>
              <Text style={styles.sectionTitle}>All Transactions</Text>
              {transactions.length === 0 ? (
                <Text style={styles.emptyText}>No transactions yet</Text>
              ) : (
                transactions.map((tx) => (
                  <View key={tx.id} style={styles.transactionItem}>
                    <View>
                      <Text style={styles.transactionType}>{tx.type_display || tx.type}</Text>
                      <Text style={styles.transactionDate}>{tx.created_at}</Text>
                    </View>
                    <Text style={[styles.transactionAmount, tx.is_credit ? styles.credit : styles.debit]}>
                      {tx.is_credit ? '+' : '-'}{tx.coins}
                    </Text>
                  </View>
                ))
              )}
            </View>
          )}
          {activeTab === 'withdrawals' && (
            <View>
              <Text style={styles.sectionTitle}>Withdrawals</Text>
              {withdrawals.length === 0 ? (
                <Text style={styles.emptyText}>No withdrawals yet</Text>
              ) : (
                withdrawals.map((w) => (
                  <View key={w.id} style={styles.withdrawalItem}>
                    <Text style={styles.withdrawalStatus}>{w.status}</Text>
                    <Text style={styles.withdrawalAmount}>{w.coin_amount} coins → {w.net_birr} ETB</Text>
                  </View>
                ))
              )}
            </View>
          )}
        </View>

        {/* Coin Packages - only show on overview tab */}
        {activeTab === 'overview' && (
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
                {/* Decorative gradient overlay */}
                <View style={styles.packageCardOverlay} />
                
                <View style={styles.packageInfo}>
                  <View style={styles.packageIconContainer}>
                    <Text style={styles.packageIcon}>💰</Text>
                  </View>
                  <View>
                    <Text style={styles.packageName}>{pkg.name}</Text>
                    <Text style={styles.packageCoins}>{pkg.coin_amount} coins</Text>
                    {pkg.bonus_coins > 0 && (
                      <Text style={styles.packageBonus}>+{pkg.bonus_coins} bonus ✨</Text>
                    )}
                  </View>
                </View>
                
                <View style={styles.packagePrice}>
                  <Text style={styles.packagePriceText}>{pkg.price_etb} ETB</Text>
                  {pkg.is_featured && (
                    <View style={styles.featuredBadge}>
                      <Text style={styles.featuredText}>🔥 Popular</Text>
                    </View>
                  )}
                </View>
              </TouchableOpacity>
            ))
          )}
        </View>
        )}

        {/* Info - only show on overview tab */}
        {activeTab === 'overview' && (
          <View style={styles.infoBox}>
            <Ionicons name="information-circle" size={20} color={BRAND_GOLD} />
            <Text style={styles.infoText}>
              Only purchased coins can be used for gifting. Earned coins from activities cannot be gifted.
            </Text>
          </View>
        )}
      </ScrollView>

      {/* Telebirr Payment Modal */}
      <Modal visible={showTopUpModal} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <TouchableOpacity onPress={() => setShowTopUpModal(false)}>
                <Ionicons name="close" size={24} color="#F5F5F7" />
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
    borderBottomColor: CYAN_COLOR,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: CYAN_COLOR,
  },
  content: {
    flex: 1,
  },
  balanceCard: {
    margin: 16,
    padding: 24,
    borderRadius: 20,
    position: 'relative',
    overflow: 'hidden',
  },
  decorativeCircle1: {
    position: 'absolute',
    top: -30,
    right: -30,
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  decorativeCircle2: {
    position: 'absolute',
    bottom: -20,
    left: -20,
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
  },
  decorativeCircle3: {
    position: 'absolute',
    top: 50,
    left: -10,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
  },
  walletIconContainer: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 8,
    padding: 6,
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
    fontWeight: '600',
  },
  balanceAmount: {
    fontSize: 42,
    fontWeight: 800,
    color: '#fff',
    marginTop: 4,
    marginBottom: 4,
  },
  coinLabel: {
    fontSize: 14,
    color: '#fff',
    fontWeight: '500',
    opacity: 0.9,
  },
  bucketIconContainer: {
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    borderRadius: 6,
    padding: 4,
    alignSelf: 'flex-start',
    marginBottom: 4,
  },
  bucketIcon: {
    fontSize: 12,
  },
  divider: {
    width: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    marginHorizontal: 8,
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
  heroSection: {
    marginBottom: 8,
  },
  quickActions: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    gap: 12,
    marginBottom: 20,
  },
  quickActionCard: {
    flex: 1,
    borderRadius: 16,
    overflow: 'hidden',
  },
  quickActionGradient: {
    padding: 16,
    alignItems: 'center',
    gap: 8,
  },
  quickActionText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
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
  tabBar: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#333',
    paddingHorizontal: 16,
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
  },
  tabText: {
    fontSize: 14,
    color: '#78716C',
    fontWeight: 500,
    textTransform: 'capitalize',
  },
  tabTextActive: {
    color: BRAND_GOLD,
    fontWeight: 700,
  },
  tabIndicator: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 2,
    backgroundColor: BRAND_GOLD,
  },
  tabContent: {
    padding: 16,
  },
  transactionItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#333',
  },
  transactionType: {
    fontSize: 14,
    fontWeight: 600,
    color: '#F5F5F7',
  },
  transactionDate: {
    fontSize: 12,
    color: '#78716C',
  },
  transactionAmount: {
    fontSize: 15,
    fontWeight: 700,
    color: '#F5F5F7',
  },
  credit: {
    color: '#10B981',
  },
  debit: {
    color: '#EF4444',
  },
  withdrawalItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#333',
  },
  withdrawalStatus: {
    fontSize: 14,
    fontWeight: 600,
    color: '#F5F5F7',
  },
  withdrawalAmount: {
    fontSize: 14,
    fontWeight: 700,
    color: BRAND_GOLD,
  },
  section: {
    marginBottom: 24,
    paddingHorizontal: 16,
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
    backgroundColor: '#1A1A1A',
    borderRadius: 16,
    padding: 20,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#333',
    position: 'relative',
    overflow: 'hidden',
  },
  packageCardOverlay: {
    position: 'absolute',
    top: 0,
    right: 0,
    width: 60,
    height: 60,
    backgroundColor: 'rgba(200, 181, 106, 0.05)',
    borderRadius: 30,
    transform: [{ translateX: 20 }, { translateY: -20 }],
  },
  packageInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  packageIconContainer: {
    backgroundColor: 'rgba(200, 181, 106, 0.1)',
    borderRadius: 12,
    padding: 8,
    marginRight: 12,
  },
  packageIcon: {
    fontSize: 20,
  },
  packageName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#F5F5F7',
    marginBottom: 4,
  },
  packageCoins: {
    fontSize: 20,
    fontWeight: '700',
    color: BRAND_GOLD,
    marginBottom: 2,
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
    color: '#F5F5F7',
  },
  featuredBadge: {
    backgroundColor: BRAND_GOLD,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    marginTop: 4,
  },
  featuredText: {
    fontSize: 10,
    color: '#000',
    fontWeight: '700',
  },
  emptyState: {
    backgroundColor: '#1A1A1A',
    borderRadius: 16,
    padding: 32,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#333',
  },
  emptyText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#F5F5F7',
    marginBottom: 4,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#78716C',
    textAlign: 'center',
  },
  infoBox: {
    flexDirection: 'row',
    backgroundColor: '#1A1A1A',
    borderRadius: 12,
    padding: 16,
    alignItems: 'flex-start',
    gap: 12,
    marginHorizontal: 16,
    borderWidth: 1,
    borderColor: '#333',
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
    backgroundColor: '#0B0B0C',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    paddingBottom: 40,
    borderTopWidth: 1,
    borderTopColor: '#333',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 24,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#F5F5F7',
  },
  selectedPackagePreview: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1A1A1A',
    borderRadius: 16,
    padding: 16,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: '#333',
  },
  packagePreviewIcon: {
    backgroundColor: 'rgba(200, 181, 106, 0.1)',
    borderRadius: 12,
    padding: 12,
    marginRight: 16,
  },
  packagePreviewInfo: {
    flex: 1,
  },
  packagePreviewName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#F5F5F7',
    marginBottom: 2,
  },
  packagePreviewCoins: {
    fontSize: 14,
    fontWeight: '700',
    color: BRAND_GOLD,
  },
  packagePreviewBonus: {
    fontSize: 12,
    color: '#10B981',
    fontWeight: '600',
  },
  packagePreviewPrice: {
    fontSize: 18,
    fontWeight: '700',
    color: '#F5F5F7',
  },
  formGroup: {
    marginBottom: 24,
  },
  formLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#F5F5F7',
    marginBottom: 8,
  },
  textInput: {
    borderWidth: 1,
    borderColor: '#333',
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    color: '#F5F5F7',
    backgroundColor: '#1A1A1A',
  },
  payButton: {
    backgroundColor: BRAND_GOLD,
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  payButtonDisabled: {
    backgroundColor: '#333',
  },
  payButtonText: {
    color: '#000',
    fontSize: 16,
    fontWeight: '700',
  },
  packageCardSelected: {
    borderColor: BRAND_GOLD,
    borderWidth: 2,
    backgroundColor: 'rgba(200, 181, 106, 0.05)',
  },
});





