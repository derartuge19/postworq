import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import api from '../api';

const BRAND_GOLD = '#DA9B2A';

export default function WalletScreen({ navigation }) {
  const insets = useSafeAreaInsets();
  const [balance, setBalance] = useState(null);
  const [packages, setPackages] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadWalletData();
  }, []);

  const loadWalletData = async () => {
    try {
      const [balanceData, packagesData] = await Promise.all([
        api.getWalletBalance(),
        api.getCoinPackages(),
      ]);
      setBalance(balanceData);
      setPackages(packagesData.results || packagesData);
    } catch (error) {
      console.error('Error loading wallet data:', error);
      Alert.alert('Error', 'Failed to load wallet data');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <View style={[styles.container, { paddingTop: insets.top }, styles.centered]}>
        <ActivityIndicator size="large" color={BRAND_GOLD} />
      </View>
    );
  }

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color="#000" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Wallet</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView style={styles.content}>
        {/* Balance Card */}
        <View style={styles.balanceCard}>
          <Text style={styles.balanceLabel}>Total Balance</Text>
          <Text style={styles.balanceAmount}>{balance?.balance?.total || balance?.balance || 0} coins</Text>
          
          <View style={styles.balanceBreakdown}>
            <View style={styles.balanceItem}>
              <View style={[styles.balanceIcon, { backgroundColor: '#10B98120' }]}>
                <Text style={styles.balanceIconText}>🎁</Text>
              </View>
              <View>
                <Text style={styles.balanceItemLabel}>Earned</Text>
                <Text style={styles.balanceItemValue}>{balance?.balance?.earned || balance?.earned_total || 0}</Text>
              </View>
            </View>
            <View style={styles.balanceItem}>
              <View style={[styles.balanceIcon, { backgroundColor: '#8B5CF620' }]}>
                <Text style={styles.balanceIconText}>💳</Text>
              </View>
              <View>
                <Text style={styles.balanceItemLabel}>Purchased</Text>
                <Text style={styles.balanceItemValue}>{balance?.balance?.purchased || 0}</Text>
              </View>
            </View>
          </View>
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
              <TouchableOpacity key={pkg.id} style={styles.packageCard}>
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
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
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
    borderBottomColor: '#f0f0f0',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#000',
  },
  content: {
    flex: 1,
    padding: 16,
  },
  balanceCard: {
    backgroundColor: BRAND_GOLD,
    borderRadius: 16,
    padding: 20,
    marginBottom: 24,
  },
  balanceLabel: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.8)',
    marginBottom: 4,
  },
  balanceAmount: {
    fontSize: 36,
    fontWeight: '800',
    color: '#fff',
    marginBottom: 16,
  },
  balanceBreakdown: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  balanceItem: {
    alignItems: 'center',
  },
  balanceIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  balanceIconText: {
    fontSize: 24,
  },
  balanceItemLabel: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.7)',
    marginBottom: 2,
  },
  balanceItemValue: {
    fontSize: 16,
    fontWeight: '700',
    color: '#fff',
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#000',
    marginBottom: 4,
  },
  sectionSubtitle: {
    fontSize: 14,
    color: '#666',
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
    color: '#000',
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
    color: '#000',
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
    color: '#000',
    marginBottom: 4,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#666',
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
});
