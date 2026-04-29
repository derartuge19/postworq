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
  SafeAreaView,
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
  const [selectedTier, setSelectedTier] = useState(null);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState('onevas');
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    loadSubscriptionData();
  }, []);

  const loadSubscriptionData = async () => {
    try {
      setLoading(true);
      const [tiersData, subscriptionData] = await Promise.all([
        api.request('/subscriptions/tiers/active/'),
        api.request('/subscriptions/'),
      ]);
      setTiers(Array.isArray(tiersData) ? tiersData : []);
      setCurrentSubscription(subscriptionData);
    } catch (error) {
      console.error('Error loading subscription data:', error);
      Alert.alert('Error', 'Failed to load subscription data');
    } finally {
      setLoading(false);
    }
  };

  const handleSubscribe = (tier) => {
    setSelectedTier(tier);
    setShowPaymentModal(true);
  };

  const handlePayment = async () => {
    if (!selectedTier) return;

    setProcessing(true);
    try {
      const response = await api.request('/subscriptions/subscribe/', {
        method: 'POST',
        body: JSON.stringify({
          tier_id: selectedTier.id,
          payment_method: paymentMethod,
        }),
      });

      if (response.status === 'success' || response.status === 'pending') {
        Alert.alert(
          'Success',
          response.message || 'Subscription initiated successfully',
          [{ text: 'OK', onPress: () => {
            setShowPaymentModal(false);
            loadSubscriptionData();
          }}]
        );
      } else {
        Alert.alert('Error', response.error || 'Failed to subscribe');
      }
    } catch (error) {
      console.error('Subscription error:', error);
      Alert.alert('Error', 'Failed to process subscription');
    } finally {
      setProcessing(false);
    }
  };

  const handleUnsubscribe = async () => {
    Alert.alert(
      'Cancel Subscription',
      'Are you sure you want to cancel your subscription?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Unsubscribe',
          style: 'destructive',
          onPress: async () => {
            try {
              await api.request('/subscriptions/unsubscribe/', {
                method: 'POST',
              });
              Alert.alert('Success', 'Subscription cancelled successfully');
              loadSubscriptionData();
            } catch (error) {
              Alert.alert('Error', 'Failed to cancel subscription');
            }
          },
        },
      ]
    );
  };

  const renderTierCard = (tier) => {
    const isSelected = selectedTier?.id === tier.id;
    const isCurrent = currentSubscription?.tier?.name === tier.name;

    return (
      <TouchableOpacity
        key={tier.id}
        style={[styles.tierCard, isSelected && styles.selectedTier, isCurrent && styles.currentTier]}
        onPress={() => handleSubscribe(tier)}
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
          disabled={isCurrent}
        >
          <Text style={styles.subscribeButtonText}>
            {isCurrent ? 'Subscribed' : 'Subscribe'}
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
            <TouchableOpacity onPress={handleUnsubscribe}>
              <Text style={styles.unsubscribeText}>Cancel</Text>
            </TouchableOpacity>
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

      {/* Payment Modal */}
      <Modal
        visible={showPaymentModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowPaymentModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Choose Payment Method</Text>
            
            <Text style={styles.selectedTierText}>
              {selectedTier?.name} - {selectedTier?.price_etb} ETB
            </Text>

            {selectedTier?.price_coins && (
              <TouchableOpacity
                style={[
                  styles.paymentOption,
                  paymentMethod === 'coins' && styles.selectedPayment
                ]}
                onPress={() => setPaymentMethod('coins')}
              >
                <Ionicons 
                  name="cash" 
                  size={24} 
                  color={paymentMethod === 'coins' ? BRAND_GOLD : '#666'} 
                />
                <View style={styles.paymentOptionText}>
                  <Text style={styles.paymentOptionTitle}>Coins</Text>
                  <Text style={styles.paymentOptionSub}>{selectedTier.price_coins} coins</Text>
                </View>
                {paymentMethod === 'coins' && (
                  <Ionicons name="checkmark-circle" size={24} color={BRAND_GOLD} />
                )}
              </TouchableOpacity>
            )}

            <TouchableOpacity
              style={[
                styles.paymentOption,
                paymentMethod === 'onevas' && styles.selectedPayment
              ]}
              onPress={() => setPaymentMethod('onevas')}
            >
              <Ionicons 
                name="phone-portrait" 
                size={24} 
                color={paymentMethod === 'onevas' ? BRAND_GOLD : '#666'} 
              />
              <View style={styles.paymentOptionText}>
                <Text style={styles.paymentOptionTitle}>Onevas Airtime</Text>
                <Text style={styles.paymentOptionSub}>Pay via airtime</Text>
              </View>
              {paymentMethod === 'onevas' && (
                <Ionicons name="checkmark-circle" size={24} color={BRAND_GOLD} />
              )}
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.paymentOption,
                paymentMethod === 'telebirr' && styles.selectedPayment
              ]}
              onPress={() => setPaymentMethod('telebirr')}
            >
              <Ionicons 
                name="card" 
                size={24} 
                color={paymentMethod === 'telebirr' ? BRAND_GOLD : '#666'} 
              />
              <View style={styles.paymentOptionText}>
                <Text style={styles.paymentOptionTitle}>Telebirr</Text>
                <Text style={styles.paymentOptionSub}>Mobile payment</Text>
              </View>
              {paymentMethod === 'telebirr' && (
                <Ionicons name="checkmark-circle" size={24} color={BRAND_GOLD} />
              )}
            </TouchableOpacity>

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, styles.cancelButton]}
                onPress={() => setShowPaymentModal(false)}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, styles.confirmButton]}
                onPress={handlePayment}
                disabled={processing}
              >
                {processing ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <Text style={styles.confirmButtonText}>Subscribe</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
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
  unsubscribeText: {
    color: '#FF5722',
    fontSize: 14,
    fontWeight: 'bold',
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
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 16,
  },
  tierCard: {
    backgroundColor: '#1a1a1a',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  selectedTier: {
    borderColor: BRAND_GOLD,
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
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
  },
  currentBadge: {
    backgroundColor: '#4CAF50',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  currentBadgeText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  tierPrice: {
    fontSize: 24,
    fontWeight: 'bold',
    color: BRAND_GOLD,
    marginBottom: 4,
  },
  tierCoinPrice: {
    fontSize: 14,
    color: '#888',
    marginBottom: 8,
  },
  tierDescription: {
    fontSize: 14,
    color: '#aaa',
    marginBottom: 12,
  },
  featuresList: {
    marginBottom: 16,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  featureText: {
    color: '#ccc',
    marginLeft: 8,
    fontSize: 14,
  },
  subscribeButton: {
    backgroundColor: BRAND_GOLD,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  disabledButton: {
    backgroundColor: '#4CAF50',
  },
  subscribeButtonText: {
    color: '#000',
    fontSize: 16,
    fontWeight: 'bold',
  },
  infoSection: {
    backgroundColor: '#1a1a1a',
    borderRadius: 12,
    padding: 16,
    marginTop: 8,
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 12,
  },
  infoText: {
    color: '#ccc',
    fontSize: 14,
    marginBottom: 8,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    backgroundColor: '#1a1a1a',
    borderRadius: 16,
    padding: 20,
    width: '100%',
    maxWidth: 400,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 16,
    textAlign: 'center',
  },
  selectedTierText: {
    fontSize: 16,
    color: BRAND_GOLD,
    textAlign: 'center',
    marginBottom: 20,
  },
  paymentOption: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#2a2a2a',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  selectedPayment: {
    borderColor: BRAND_GOLD,
  },
  paymentOptionText: {
    flex: 1,
    marginLeft: 12,
  },
  paymentOptionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#fff',
  },
  paymentOptionSub: {
    fontSize: 14,
    color: '#888',
  },
  modalButtons: {
    flexDirection: 'row',
    marginTop: 20,
    gap: 12,
  },
  modalButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
  },
  cancelButton: {
    backgroundColor: '#333',
  },
  cancelButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  confirmButton: {
    backgroundColor: BRAND_GOLD,
  },
  confirmButtonText: {
    color: '#000',
    fontSize: 16,
    fontWeight: 'bold',
  },
});
