import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Alert,
  SafeAreaView,
  Linking,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import api from '../api';

const BRAND_GOLD = '#C8B56A';
const CYAN_COLOR = '#3B82F6';

export default function SubscriptionScreen({ navigation }) {
  const insets = useSafeAreaInsets();
  const [tiers, setTiers] = useState([]);
  const [currentSubscription, setCurrentSubscription] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadSubscriptionData();
  }, []);

  const loadSubscriptionData = async () => {
    try {
      setLoading(true);
      const [tiersData, subscriptionData] = await Promise.all([
        api.request('/subscriptions/tiers/active/').catch(() => []),
        api.request('/subscriptions/').catch(() => null),
      ]);
      setTiers(Array.isArray(tiersData) && tiersData.length > 0 ? tiersData : getFallbackTiers());
      setCurrentSubscription(subscriptionData);
    } catch (error) {
      console.error('Error loading subscription data:', error);
      setTiers(getFallbackTiers());
    } finally {
      setLoading(false);
    }
  };

  const handleSubscribe = (tier) => {
    // Get tier code for SMS
    const tierCode = tier.duration_type === 'daily' ? 'A' : 
                     tier.duration_type === 'weekly' ? 'B' : 
                     tier.duration_type === 'monthly' ? 'C' : 'D';
    
    // Open SMS app with pre-filled message
    const shortCode = '9286';
    const message = tierCode;
    
    // Use Linking to open SMS app
    const smsUrl = `sms:${shortCode}?body=${encodeURIComponent(message)}`;
    
    Linking.openURL(smsUrl).catch(err => {
      console.error('Error opening SMS:', err);
      Alert.alert('Error', 'Could not open SMS app');
    });
  };

  const getFallbackTiers = () => [
    {
      id: 1,
      name: 'Daily',
      duration_type: 'daily',
      price_etb: 3,
      price_coins: null,
      description: 'Access for 24 hours',
      features: ['Full access for 24 hours', 'Ad-free experience', 'HD quality videos']
    },
    {
      id: 2,
      name: 'Weekly',
      duration_type: 'weekly',
      price_etb: 20,
      price_coins: null,
      description: 'Access for 7 days',
      features: ['Full access for 7 days', 'Ad-free experience', 'HD quality videos', 'Priority support']
    },
    {
      id: 3,
      name: 'Monthly',
      duration_type: 'monthly',
      price_etb: 70,
      price_coins: null,
      description: 'Access for 30 days',
      features: ['Full access for 30 days', 'Ad-free experience', 'HD quality videos', 'Priority support', 'Exclusive content']
    },
    {
      id: 4,
      name: 'OnDemand',
      duration_type: 'ondemand',
      price_etb: 10,
      price_coins: 100,
      description: 'Pay per use with coins',
      features: ['Flexible payment', 'No recurring charges', 'Use coins as needed']
    }
  ];

  const renderTierCard = (tier) => {
    const isCurrent = currentSubscription?.tier?.name === tier.name;

    return (
      <TouchableOpacity
        key={tier.id}
        style={[styles.tierCard, isCurrent && styles.currentTier]}
        onPress={() => !isCurrent && handleSubscribe(tier)}
        disabled={isCurrent}
      >
        <View style={styles.tierHeader}>
          <Text style={styles.tierName}>{tier.name}</Text>
          {isCurrent && (
            <View style={styles.currentBadge}>
              <Text style={styles.currentBadgeText}>Current</Text>
            </View>
          )}
        </View>
        <Text style={styles.tierPrice}>{tier.price_etb} ETB</Text>
        {tier.price_coins && (
          <Text style={styles.tierCoinPrice}>or {tier.price_coins} coins</Text>
        )}
        <Text style={styles.tierDescription}>{tier.description}</Text>
        
        <View style={styles.featuresList}>
          {tier.features?.map((feature, index) => (
            <View key={index} style={styles.featureItem}>
              <Ionicons name="checkmark-circle" size={16} color={BRAND_GOLD} />
              <Text style={styles.featureText}>{feature}</Text>
            </View>
          ))}
        </View>

        <TouchableOpacity
          style={[styles.subscribeButton, isCurrent && styles.disabledButton]}
          onPress={() => !isCurrent && handleSubscribe(tier)}
          disabled={isCurrent}
        >
          <Text style={[styles.subscribeButtonText, isCurrent && styles.disabledButtonText]}>
            {isCurrent ? '✓ Subscribed' : '📱 Subscribe via SMS'}
          </Text>
        </TouchableOpacity>
      </TouchableOpacity>
    );
  };

  if (loading) {
    return (
      <SafeAreaView style={[styles.container, { paddingTop: insets.top }]}>
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color={BRAND_GOLD} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Subscription</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView style={styles.content}>
        {/* Current Subscription Status */}
        {currentSubscription && currentSubscription.status === 'trial' && (
          <View style={styles.trialBanner}>
            <Ionicons name="time" size={20} color={BRAND_GOLD} />
            <Text style={styles.trialText}>
              Free Trial - {currentSubscription.days_remaining || 0} days remaining
            </Text>
          </View>
        )}

        {currentSubscription && currentSubscription.status === 'active' && (
          <View style={styles.activeBanner}>
            <Ionicons name="checkmark-circle" size={20} color="#4CAF50" />
            <Text style={styles.activeText}>
              Active: {currentSubscription.tier?.name}
            </Text>
          </View>
        )}

        {currentSubscription && currentSubscription.status === 'no_subscription' && (
          <View style={styles.expiredBanner}>
            <Ionicons name="alert-circle" size={20} color="#FF5722" />
            <Text style={styles.expiredText}>No active subscription</Text>
          </View>
        )}

        {/* Subscription Tiers */}
        <Text style={styles.sectionTitle}>Choose Your Plan</Text>
        {tiers.map(renderTierCard)}

        {/* Info Section */}
        <View style={styles.infoSection}>
          <Text style={styles.infoTitle}>Subscription Benefits</Text>
          <Text style={styles.infoText}>
            • Access all premium features
          </Text>
          <Text style={styles.infoText}>
            • Ad-free experience
          </Text>
          <Text style={styles.infoText}>
            • HD quality videos
          </Text>
          <Text style={styles.infoText}>
            • Priority support
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  centerContainer: {
    flex: 1,
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
    borderBottomColor: '#333',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
  },
  content: {
    flex: 1,
    padding: 16,
  },
  trialBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(200, 181, 106, 0.1)',
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
  },
  trialText: {
    color: BRAND_GOLD,
    marginLeft: 8,
    fontSize: 14,
  },
  activeBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(76, 175, 80, 0.1)',
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
  },
  activeText: {
    color: '#4CAF50',
    marginLeft: 8,
    fontSize: 14,
    flex: 1,
  },
  expiredBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 87, 34, 0.1)',
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
  },
  expiredText: {
    color: '#FF5722',
    marginLeft: 8,
    fontSize: 14,
  },
  sectionTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: '#fff',
    marginBottom: 20,
  },
  tierCard: {
    backgroundColor: '#1a1a1a',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  currentTier: {
    borderColor: '#4CAF50',
  },
  tierHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  tierName: {
    fontSize: 24,
    fontWeight: '800',
    color: '#fff',
  },
  currentBadge: {
    backgroundColor: '#4CAF50',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 6,
  },
  currentBadgeText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
  },
  tierPrice: {
    fontSize: 32,
    fontWeight: '900',
    color: BRAND_GOLD,
    marginBottom: 6,
  },
  tierCoinPrice: {
    fontSize: 16,
    color: '#fff',
    marginBottom: 10,
    fontWeight: '600',
  },
  tierDescription: {
    fontSize: 16,
    color: '#ddd',
    marginBottom: 14,
    fontWeight: '500',
  },
  featuresList: {
    marginBottom: 16,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  featureText: {
    color: '#ddd',
    marginLeft: 10,
    fontSize: 16,
    fontWeight: '500',
  },
  subscribeButton: {
    backgroundColor: BRAND_GOLD,
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 12,
    alignItems: 'center',
    shadowColor: BRAND_GOLD,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  disabledButton: {
    backgroundColor: '#4CAF50',
    shadowOpacity: 0,
    elevation: 0,
  },
  subscribeButtonText: {
    color: '#000',
    fontSize: 18,
    fontWeight: '800',
  },
  infoSection: {
    backgroundColor: '#1a1a1a',
    borderRadius: 12,
    padding: 16,
    marginTop: 8,
  },
  infoTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#fff',
    marginBottom: 14,
  },
  infoText: {
    color: '#ddd',
    fontSize: 16,
    marginBottom: 10,
    fontWeight: '500',
  },
});
