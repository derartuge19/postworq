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
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import api from '../api';

const { width } = Dimensions.get('window');
const BRAND_GOLD = '#C8B56A';

export default function SubscriptionScreen({ navigation }) {
  const insets = useSafeAreaInsets();
  const [tiers, setTiers] = useState([]);
  const [currentSubscription, setCurrentSubscription] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedTier, setSelectedTier] = useState(null);

  useEffect(() => {
    loadSubscriptionData();
  }, []);

  const loadSubscriptionData = async () => {
    try {
      setLoading(true);
      const [tiersData, subscriptionData] = await Promise.all([
        api.getSubscriptionTiers().catch(() => []),
        api.getSubscription().catch(() => null),
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

  const handleUnsubscribe = async () => {
    Alert.alert(
      'Cancel Subscription',
      'Are you sure you want to cancel your subscription? You will lose access to premium features at the end of your current billing period.',
      [
        {
          text: 'Keep Subscription',
          style: 'cancel',
        },
        {
          text: 'Cancel Subscription',
          style: 'destructive',
          onPress: async () => {
            try {
              await api.unsubscribe();
              Alert.alert('Success', 'Subscription cancelled successfully');
              loadSubscriptionData(); // Refresh data
            } catch (error) {
              console.error('Unsubscribe error:', error);
              Alert.alert('Error', 'Failed to cancel subscription');
            }
          },
        },
      ]
    );
  };

  const getFallbackTiers = () => [
    {
      id: 1,
      name: 'Basic',
      duration_type: 'daily',
      price_etb: 3,
      price_coins: null,
      description: '24 hours access',
      features: ['Ad-free experience', 'HD videos', 'Basic support'],
      popular: false,
      icon: '⚡',
      color: '#FF6B6B'
    },
    {
      id: 2,
      name: 'Premium',
      duration_type: 'weekly',
      price_etb: 20,
      price_coins: null,
      description: '7 days access',
      features: ['Everything in Basic', 'Priority support', 'Exclusive content', 'Early access'],
      popular: true,
      icon: '👑',
      color: '#4ECDC4'
    },
    {
      id: 3,
      name: 'Pro',
      duration_type: 'monthly',
      price_etb: 70,
      price_coins: null,
      description: '30 days access',
      features: ['Everything in Premium', 'Advanced features', 'Personal manager', 'Custom themes'],
      popular: false,
      icon: '💎',
      color: '#45B7D1'
    }
  ];

  const getTierIcon = (durationType) => {
    switch (durationType) {
      case 'daily': return 'time-outline';
      case 'weekly': return 'flash-outline';
      case 'monthly': return 'crown';
      case 'ondemand': return 'cash-outline';
      default: return 'crown';
    }
  };

  const renderTierCard = (tier, index) => {
    const isCurrent = currentSubscription?.tier?.name === tier.name;
    const isSelected = selectedTier?.id === tier.id;

    return (
      <TouchableOpacity
        key={tier.id}
        onPress={() => setSelectedTier(tier)}
        activeOpacity={0.8}
        style={[
          styles.tierCard,
          isSelected && styles.selectedTierCard,
          tier.popular && styles.popularTierCard
        ]}
      >
        {tier.popular && (
          <View style={styles.popularBadge}>
            <Text style={styles.popularBadgeText}>Most Popular</Text>
          </View>
        )}
        
        <View style={styles.tierHeader}>
          <View style={[styles.tierIconContainer, { backgroundColor: tier.color + '20' }]}>
            <Text style={styles.tierIcon}>{tier.icon}</Text>
          </View>
          {isCurrent && (
            <View style={styles.activeBadge}>
              <Ionicons name="checkmark-circle" size={16} color="#4CAF50" />
              <Text style={styles.activeBadgeText}>Active</Text>
            </View>
          )}
        </View>

        <Text style={styles.tierName}>{tier.name}</Text>
        <Text style={styles.tierDescription}>{tier.description}</Text>
        
        <View style={styles.priceContainer}>
          <Text style={styles.tierPrice}>{tier.price_etb}</Text>
          <Text style={styles.currency}>ETB</Text>
        </View>

        <View style={styles.featuresList}>
          {tier.features?.slice(0, 3).map((feature, idx) => (
            <View key={idx} style={styles.featureItem}>
              <Ionicons name="checkmark" size={14} color={BRAND_GOLD} />
              <Text style={styles.featureText}>{feature}</Text>
            </View>
          ))}
        </View>
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
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="chevron-back" size={24} color="#C8B56A" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Choose Your Plan</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Hero Section */}
        <View style={styles.heroSection}>
          <LinearGradient
            colors={['#C8B56A', '#E6C96A']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.heroGradient}
          >
            <Text style={styles.heroIcon}>✨</Text>
            <Text style={styles.heroTitle}>Unlock Premium</Text>
            <Text style={styles.heroSubtitle}>Get access to exclusive features and content</Text>
          </LinearGradient>
        </View>

        {/* Current Status */}
        {currentSubscription && (
          <View style={styles.statusContainer}>
            {currentSubscription.status === 'active' && (
              <View style={styles.statusCard}>
                <Ionicons name="crown" size={20} color="#4CAF50" />
                <Text style={styles.statusText}>Premium Active</Text>
                <TouchableOpacity onPress={handleUnsubscribe} style={styles.cancelButton}>
                  <Text style={styles.cancelButtonText}>Cancel</Text>
                </TouchableOpacity>
              </View>
            )}
            {currentSubscription.status === 'trial' && (
              <View style={styles.statusCard}>
                <Ionicons name="time" size={20} color={BRAND_GOLD} />
                <Text style={styles.statusText}>
                  Free Trial - {currentSubscription.days_remaining || 0} days left
                </Text>
              </View>
            )}
          </View>
        )}

        {/* Subscription Tiers */}
        <View style={styles.tiersContainer}>
          {tiers.map((tier, index) => renderTierCard(tier, index))}
        </View>

        {/* Subscribe Button */}
        {selectedTier && (
          <TouchableOpacity
            style={styles.subscribeButton}
            onPress={() => handleSubscribe(selectedTier)}
          >
            <LinearGradient
              colors={['#C8B56A', '#E6C96A']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.subscribeGradient}
            >
              <Ionicons name="send" size={20} color="#000" />
              <Text style={styles.subscribeButtonText}>Subscribe via SMS</Text>
            </LinearGradient>
          </TouchableOpacity>
        )}

        {/* Benefits Section */}
        <View style={styles.benefitsSection}>
          <Text style={styles.benefitsTitle}>Why Go Premium?</Text>
          <View style={styles.benefitsList}>
            {[
              { icon: '🚫', title: 'Ad-Free Experience', desc: 'Enjoy content without interruptions' },
              { icon: '🎥', title: 'HD Quality', desc: 'Watch videos in high definition' },
              { icon: '⚡', title: 'Priority Support', desc: 'Get help when you need it' },
              { icon: '🎁', title: 'Exclusive Content', desc: 'Access premium features first' }
            ].map((benefit, index) => (
              <View key={index} style={styles.benefitItem}>
                <Text style={styles.benefitIcon}>{benefit.icon}</Text>
                <View style={styles.benefitContent}>
                  <Text style={styles.benefitTitle}>{benefit.title}</Text>
                  <Text style={styles.benefitDesc}>{benefit.desc}</Text>
                </View>
              </View>
            ))}
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0B0B0C',
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
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#2A2A2E',
  },
  backButton: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#F5F5F7',
  },
  content: {
    flex: 1,
  },
  heroSection: {
    margin: 20,
    marginBottom: 16,
    borderRadius: 16,
    overflow: 'hidden',
  },
  heroGradient: {
    padding: 20,
    alignItems: 'center',
  },
  heroIcon: {
    fontSize: 32,
    marginBottom: 8,
  },
  heroTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: '#000',
    marginBottom: 6,
  },
  heroSubtitle: {
    fontSize: 14,
    color: '#1a1a1a',
    textAlign: 'center',
    fontWeight: '500',
  },
  statusContainer: {
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  statusCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#121214',
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#2A2A2E',
  },
  statusText: {
    flex: 1,
    marginLeft: 12,
    fontSize: 14,
    fontWeight: '600',
    color: '#F5F5F7',
  },
  cancelButton: {
    backgroundColor: '#EF4444',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  cancelButtonText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  tiersContainer: {
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  tierCard: {
    backgroundColor: '#121214',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderWidth: 2,
    borderColor: '#2A2A2E',
  },
  selectedTierCard: {
    borderColor: BRAND_GOLD,
    backgroundColor: 'rgba(200,181,106,0.05)',
  },
  popularTierCard: {
    borderColor: '#4ECDC4',
    backgroundColor: 'rgba(78,205,196,0.05)',
  },
  popularBadge: {
    position: 'absolute',
    top: -1,
    right: 20,
    backgroundColor: '#4ECDC4',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
    zIndex: 1,
  },
  popularBadgeText: {
    color: '#000',
    fontSize: 12,
    fontWeight: '700',
  },
  tierHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  tierIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tierIcon: {
    fontSize: 24,
  },
  activeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(76,175,80,0.1)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    gap: 4,
  },
  activeBadgeText: {
    color: '#4CAF50',
    fontSize: 12,
    fontWeight: '600',
  },
  tierName: {
    fontSize: 20,
    fontWeight: '800',
    color: '#F5F5F7',
    marginBottom: 3,
  },
  tierDescription: {
    fontSize: 13,
    color: '#A1A1AA',
    marginBottom: 12,
  },
  priceContainer: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginBottom: 16,
  },
  tierPrice: {
    fontSize: 30,
    fontWeight: '900',
    color: BRAND_GOLD,
  },
  currency: {
    fontSize: 16,
    fontWeight: '600',
    color: BRAND_GOLD,
    marginLeft: 4,
  },
  featuresList: {
    gap: 6,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  featureText: {
    fontSize: 13,
    color: '#F5F5F7',
    fontWeight: '500',
  },
  subscribeButton: {
    marginHorizontal: 20,
    marginBottom: 20,
    borderRadius: 16,
    overflow: 'hidden',
  },
  subscribeGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    gap: 8,
  },
  subscribeButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#000',
  },
  benefitsSection: {
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
  benefitsTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#F5F5F7',
    marginBottom: 20,
    textAlign: 'center',
  },
  benefitsList: {
    gap: 16,
  },
  benefitItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#121214',
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#2A2A2E',
  },
  benefitIcon: {
    fontSize: 24,
    marginRight: 16,
  },
  benefitContent: {
    flex: 1,
  },
  benefitTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#F5F5F7',
    marginBottom: 4,
  },
  benefitDesc: {
    fontSize: 14,
    color: '#A1A1AA',
  },
});
