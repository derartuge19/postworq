import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  Image,
  Modal,
  Animated,
  Dimensions,
  ScrollView,
  TextInput,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import api from '../api';
import config from '../config';
import { useAuth } from '../contexts/AuthContext';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');
const BRAND_GOLD = '#C8B56A';

const CATEGORY_ICONS = {
  flowers: '🌹',
  hearts: '❤️',
  gems: '💎',
  special: '⭐',
  animals: '🐻',
  vehicles: '🚗',
};

const RARITY_COLORS = {
  common: '#A0A0A0',
  rare: '#C8B56A',
  epic: '#8B5CF6',
  legendary: '#F59E0B',
};

export default function GiftSelectorScreen({ route, navigation }) {
  const { recipientId, recipientUsername, reelId } = route.params || {};
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  
  const [gifts, setGifts] = useState([
    { id: 1, name: 'Rose', coin_value: 10, rarity: 'common', category: 'flowers' },
    { id: 2, name: 'Heart', coin_value: 20, rarity: 'common', category: 'hearts' },
    { id: 3, name: 'Medal', coin_value: 50, rarity: 'rare', category: 'special' },
    { id: 4, name: 'Diamond', coin_value: 100, rarity: 'epic', category: 'gems' },
    { id: 5, name: 'Teddy', coin_value: 30, rarity: 'common', category: 'animals' },
    { id: 6, name: 'Star', coin_value: 75, rarity: 'rare', category: 'special' },
    { id: 7, name: 'Crown', coin_value: 200, rarity: 'legendary', category: 'special' },
    { id: 8, name: 'Rocket', coin_value: 150, rarity: 'epic', category: 'vehicles' },
  ]);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedGift, setSelectedGift] = useState(null);
  const [quantity, setQuantity] = useState(1);
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [showSendModal, setShowSendModal] = useState(false);
  const [coinBalance, setCoinBalance] = useState(0);
  const [showRechargeModal, setShowRechargeModal] = useState(false);
  const [rechargeError, setRechargeError] = useState(null);
  const [phoneNumber, setPhoneNumber] = useState('');
  const [loadingPayment, setLoadingPayment] = useState(false);

  const scaleAnim = useRef(new Animated.Value(1)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    loadGifts();
    loadCoinBalance();
    
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 300,
      useNativeDriver: true,
    }).start();
  }, []);

  const loadGifts = async () => {
    try {
      const response = await api.request('/gifts/');
      const data = response.results || response;
      if (Array.isArray(data) && data.length > 0) setGifts(data);
    } catch (error) {
      // Keep default gifts on error
    }
  };

  const loadCoinBalance = async () => {
    try {
      const response = await api.request('/wallet/');
      setCoinBalance(response.balance?.purchased || 0);
    } catch (error) {
      console.error('Error loading coin balance:', error);
    }
  };

  const categories = ['all', ...new Set(gifts.map(g => g.category))];
  
  const filteredGifts = selectedCategory === 'all' 
    ? gifts 
    : gifts.filter(g => g.category === selectedCategory);

  const handleGiftPress = (gift) => {
    setSelectedGift(gift);
    setQuantity(1);
    
    Animated.sequence([
      Animated.timing(scaleAnim, {
        toValue: 0.9,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.timing(scaleAnim, {
        toValue: 1,
        duration: 100,
        useNativeDriver: true,
      }),
    ]).start();
  };

  const handleSend = async () => {
    if (!selectedGift) return;

    const totalCost = selectedGift.coin_value * quantity;
    if (totalCost > coinBalance) {
      // Show recharge modal with Telebirr options
      setRechargeError({
        needs_recharge: true,
        required_coins: totalCost,
        current_purchased_coins: coinBalance,
        current_earned_coins: 0,
      });
      setShowRechargeModal(true);
      return;
    }

    setSending(true);
    try {
      const response = await api.request('/gift-transactions/', {
        method: 'POST',
        body: JSON.stringify({
          gift_id: selectedGift.id,
          recipient_id: recipientId,
          reel_id: reelId,
          quantity: quantity,
          message: message,
        }),
      });

      setShowSendModal(false);
      navigation.goBack();
    } catch (error) {
      console.error('Error sending gift:', error);
      const errorData = error.message ? JSON.parse(error.message) : {};

      if (errorData.needs_recharge) {
        setRechargeError(errorData);
        setShowRechargeModal(true);
      } else {
        Alert.alert('Error', errorData.error || 'Failed to send gift. Please try again.');
      }
    } finally {
      setSending(false);
    }
  };

  const handleTelebirrPayment = async (packageId, phone) => {
    if (!phone) {
      Alert.alert('Error', 'Please enter your phone number');
      return;
    }

    setLoadingPayment(true);
    try {
      const response = await api.request('/wallet/telebirr/initiate/', {
        method: 'POST',
        body: JSON.stringify({
          package_id: packageId,
          phone_number: phone,
        }),
      });

      if (response.success && response.payment_url) {
        // Open Telebirr payment URL
        Alert.alert(
          'Payment Initiated',
          'Opening Telebirr payment page...',
          [
            {
              text: 'OK',
              onPress: () => {
                setShowRechargeModal(false);
                navigation.navigate('Wallet');
              },
            },
          ]
        );
        // Note: React Native can't directly open external URLs like web
        // You would need to use Linking.openURL or WebView
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

  const totalCost = selectedGift ? selectedGift.coin_value * quantity : 0;
  const canAfford = totalCost <= coinBalance;

  const renderGiftItem = ({ item, index }) => {
    const isSelected = selectedGift?.id === item.id;
    
    return (
      <TouchableOpacity
        style={[
          styles.giftItem,
          isSelected && styles.giftItemSelected,
        ]}
        onPress={() => handleGiftPress(item)}
        activeOpacity={0.7}
      >
        <Animated.View
          style={[
            styles.giftImageContainer,
            isSelected && styles.giftImageContainerSelected,
            { transform: [{ scale: isSelected ? scaleAnim : 1 }] },
          ]}
        >
          {item.image_url ? (
            <Image
              source={{ uri: item.image_url }}
              style={styles.giftImage}
              resizeMode="contain"
            />
          ) : (
            <View style={styles.giftPlaceholder}>
              <Text style={{ fontSize: 32 }}>{CATEGORY_ICONS[item.category] || '🎁'}</Text>
            </View>
          )}
        </Animated.View>
        
        <Text style={styles.giftName} numberOfLines={1}>
          {item.name}
        </Text>
        
        <View style={styles.giftPriceContainer}>
          <Ionicons name="cash" size={12} color={BRAND_GOLD} />
          <Text style={styles.giftPrice}>{item.coin_value}</Text>
        </View>
        
        <View style={[styles.rarityBadge, { backgroundColor: RARITY_COLORS[item.rarity] }]}>
          <Text style={styles.rarityText}>{item.rarity}</Text>
        </View>
      </TouchableOpacity>
    );
  };

  const renderCategoryTab = (category) => {
    const isSelected = selectedCategory === category;
    
    return (
      <TouchableOpacity
        key={category}
        style={[
          styles.categoryTab,
          isSelected && styles.categoryTabSelected,
        ]}
        onPress={() => setSelectedCategory(category)}
      >
        <Text style={[
          styles.categoryTabText,
          isSelected && styles.categoryTabTextSelected,
        ]}>
          {category === 'all' ? 'All' : CATEGORY_ICONS[category] || category}
        </Text>
      </TouchableOpacity>
    );
  };

  const renderSendModal = () => (
    <Modal
      visible={showSendModal}
      transparent
      animationType="slide"
      onRequestClose={() => setShowSendModal(false)}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={() => setShowSendModal(false)}>
              <Ionicons name="close" size={24} color="#000" />
            </TouchableOpacity>
            <Text style={styles.modalTitle}>Send Gift</Text>
            <View style={{ width: 24 }} />
          </View>

          {selectedGift && (
            <View style={styles.modalGiftPreview}>
              {selectedGift.image_url ? (
                <Image
                  source={{ uri: selectedGift.image_url }}
                  style={styles.modalGiftImage}
                  resizeMode="contain"
                />
              ) : (
                <Text style={{ fontSize: 60, marginBottom: 12 }}>{CATEGORY_ICONS[selectedGift.category] || '🎁'}</Text>
              )}
              <Text style={styles.modalGiftName}>{selectedGift.name}</Text>
              <View style={styles.modalGiftPrice}>
                <Ionicons name="cash" size={16} color={BRAND_GOLD} />
                <Text style={styles.modalGiftPriceText}>{selectedGift.coin_value} coins</Text>
              </View>
            </View>
          )}

          <View style={styles.quantityContainer}>
            <Text style={styles.quantityLabel}>Quantity</Text>
            <View style={styles.quantityControls}>
              <TouchableOpacity
                style={styles.quantityButton}
                onPress={() => setQuantity(Math.max(1, quantity - 1))}
              >
                <Ionicons name="remove" size={20} color="#000" />
              </TouchableOpacity>
              <Text style={styles.quantityValue}>{quantity}</Text>
              <TouchableOpacity
                style={styles.quantityButton}
                onPress={() => setQuantity(quantity + 1)}
              >
                <Ionicons name="add" size={20} color="#000" />
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.messageContainer}>
            <Text style={styles.messageLabel}>Message (optional)</Text>
            <TextInput
              style={styles.messageInput}
              placeholder="Add a message..."
              value={message}
              onChangeText={setMessage}
              maxLength={500}
              multiline
            />
          </View>

          <View style={styles.totalCostContainer}>
            <Text style={styles.totalCostLabel}>Total Cost</Text>
            <Text style={[
              styles.totalCostValue,
              !canAfford && styles.totalCostValueError,
            ]}>
              {totalCost} coins
            </Text>
          </View>

          <TouchableOpacity
            style={[
              styles.sendButton,
              !canAfford && styles.sendButtonDisabled,
            ]}
            onPress={handleSend}
            disabled={!canAfford || sending}
          >
            {sending ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.sendButtonText}>Send Gift</Text>
            )}
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );

  const renderRechargeModal = () => (
    <Modal
      visible={showRechargeModal}
      transparent
      animationType="fade"
      onRequestClose={() => setShowRechargeModal(false)}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.rechargeModalContent}>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={() => setShowRechargeModal(false)}>
              <Ionicons name="close" size={24} color="#000" />
            </TouchableOpacity>
            <Text style={styles.modalTitle}>Insufficient Coins</Text>
            <View style={{ width: 24 }} />
          </View>

          <View style={styles.rechargeInfo}>
            <Text style={styles.rechargeEmoji}>💰</Text>
            <Text style={styles.rechargeTitle}>Insufficient Purchased Coins</Text>
            <Text style={styles.rechargeSubtitle}>
              You need {rechargeError?.required_coins} purchased coins to send this gift.
            </Text>
            <Text style={styles.rechargeBalance}>
              Your current purchased coins: {rechargeError?.current_purchased_coins}
            </Text>
          </View>

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

          <View style={styles.quickRechargeContainer}>
            <Text style={styles.quickRechargeTitle}>Quick Recharge</Text>
            <TouchableOpacity
              style={styles.quickRechargeButton}
              onPress={() => handleTelebirrPayment(1, phoneNumber)}
              disabled={loadingPayment}
            >
              <Text style={styles.quickRechargeCoins}>100 Coins</Text>
              <Text style={styles.quickRechargePrice}>~10 ETB</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.quickRechargeButton}
              onPress={() => handleTelebirrPayment(2, phoneNumber)}
              disabled={loadingPayment}
            >
              <Text style={styles.quickRechargeCoins}>500 Coins</Text>
              <Text style={styles.quickRechargePrice}>~50 ETB</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.rechargeButtons}>
            <TouchableOpacity
              style={[styles.rechargeButton, styles.rechargeCancelButton]}
              onPress={() => setShowRechargeModal(false)}
            >
              <Text style={styles.rechargeCancelText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.rechargeButton, styles.rechargeWalletButton]}
              onPress={() => {
                setShowRechargeModal(false);
                navigation.navigate('Wallet');
              }}
            >
              <Text style={styles.rechargeWalletText}>More Options</Text>
            </TouchableOpacity>
          </View>

          {loadingPayment && (
            <View style={styles.loadingOverlay}>
              <ActivityIndicator size="large" color={BRAND_GOLD} />
            </View>
          )}
        </View>
      </View>
    </Modal>
  );

  if (loading) {
    return (
      <View style={[styles.container, styles.centered]}>
        <ActivityIndicator size="large" color={BRAND_GOLD} />
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
        <Text style={styles.headerTitle}>Send Gift</Text>
        <View style={styles.coinBalanceContainer}>
          <Ionicons name="cash" size={20} color={BRAND_GOLD} />
          <Text style={styles.coinBalance}>{coinBalance}</Text>
        </View>
      </View>

      {/* Recipient Info */}
      {recipientUsername && (
        <View style={styles.recipientInfo}>
          <Text style={styles.recipientLabel}>Sending to</Text>
          <Text style={styles.recipientName}>@{recipientUsername}</Text>
        </View>
      )}

      {/* Category Tabs */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.categoryTabs}
        contentContainerStyle={styles.categoryTabsContent}
      >
        {categories.map(renderCategoryTab)}
      </ScrollView>

      {/* Gift Grid */}
      <Animated.FlatList
        data={filteredGifts}
        renderItem={renderGiftItem}
        keyExtractor={(item) => item.id.toString()}
        numColumns={4}
        contentContainerStyle={styles.giftGrid}
        style={{ opacity: fadeAnim }}
      />

      {/* Send Button */}
      {selectedGift && (
        <TouchableOpacity
          style={styles.floatingSendButton}
          onPress={() => setShowSendModal(true)}
        >
          <Ionicons name="send" size={20} color="#fff" />
          <Text style={styles.floatingSendButtonText}>Send</Text>
        </TouchableOpacity>
      )}

      {renderSendModal()}
      {renderRechargeModal()}
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
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#2A2A2E',
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#C8B56A',
  },
  coinBalanceContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#121214',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#2A2A2E',
  },
  coinBalance: {
    marginLeft: 4,
    fontSize: 13,
    fontWeight: '700',
    color: BRAND_GOLD,
  },
  recipientInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: '#0B0B0C',
    borderBottomWidth: 1,
    borderBottomColor: '#2A2A2E',
  },
  recipientLabel: {
    fontSize: 13,
    color: '#A1A1AA',
    marginRight: 6,
  },
  recipientName: {
    fontSize: 14,
    fontWeight: '700',
    color: BRAND_GOLD,
  },
  categoryTabs: {
    borderBottomWidth: 1,
    borderBottomColor: '#2A2A2E',
  },
  categoryTabsContent: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    gap: 6,
  },
  categoryTab: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    marginRight: 6,
    borderRadius: 16,
    backgroundColor: '#121214',
    borderWidth: 1,
    borderColor: '#2A2A2E',
    height: 32,
    justifyContent: 'center',
  },
  categoryTabSelected: {
    backgroundColor: BRAND_GOLD,
    borderColor: BRAND_GOLD,
  },
  categoryTabText: {
    fontSize: 12,
    color: '#A1A1AA',
    fontWeight: '600',
  },
  categoryTabTextSelected: {
    color: '#000',
    fontWeight: '700',
  },
  giftGrid: {
    padding: 12,
  },
  giftItem: {
    width: (SCREEN_WIDTH - 56) / 4,
    margin: 3,
    padding: 8,
    borderRadius: 12,
    backgroundColor: '#121214',
    alignItems: 'center',
  },
  giftItemSelected: {
    backgroundColor: 'rgba(200,181,106,0.13)',
    borderWidth: 1.5,
    borderColor: BRAND_GOLD,
  },
  giftImageContainer: {
    width: 48,
    height: 48,
    borderRadius: 10,
    backgroundColor: '#0B0B0C',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 6,
  },
  giftImageContainerSelected: {
    backgroundColor: BRAND_GOLD + '20',
  },
  giftImage: {
    width: 40,
    height: 40,
  },
  giftPlaceholder: {
    width: 48,
    height: 48,
    justifyContent: 'center',
    alignItems: 'center',
  },
  giftName: {
    fontSize: 11,
    fontWeight: '600',
    color: '#F5F5F7',
    textAlign: 'center',
    marginBottom: 2,
  },
  giftPriceContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 3,
  },
  giftPrice: {
    fontSize: 11,
    fontWeight: '600',
    color: BRAND_GOLD,
    marginLeft: 2,
  },
  rarityBadge: {
    paddingHorizontal: 5,
    paddingVertical: 1,
    borderRadius: 6,
  },
  rarityText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#fff',
  },
  floatingSendButton: {
    position: 'absolute',
    bottom: 24,
    right: 16,
    backgroundColor: BRAND_GOLD,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 24,
    shadowcolor: '#C8B56A',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  floatingSendButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
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
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#C8B56A',
  },
  modalGiftPreview: {
    alignItems: 'center',
    marginBottom: 24,
  },
  modalGiftImage: {
    width: 80,
    height: 80,
    marginBottom: 12,
  },
  modalGiftName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#C8B56A',
    marginBottom: 4,
  },
  modalGiftPrice: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  modalGiftPriceText: {
    fontSize: 16,
    fontWeight: '600',
    color: BRAND_GOLD,
    marginLeft: 4,
  },
  quantityContainer: {
    marginBottom: 20,
  },
  quantityLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#C8B56A',
    marginBottom: 12,
  },
  quantityControls: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#121214',
    borderRadius: 12,
    padding: 4,
  },
  quantityButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#0B0B0C',
    borderRadius: 8,
  },
  quantityValue: {
    fontSize: 18,
    fontWeight: '600',
    color: '#C8B56A',
  },
  messageContainer: {
    marginBottom: 20,
  },
  messageLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#C8B56A',
    marginBottom: 12,
  },
  messageInput: {
    backgroundColor: '#121214',
    borderRadius: 12,
    padding: 16,
    fontSize: 14,
    color: '#C8B56A',
    minHeight: 80,
    textAlignVertical: 'top',
  },
  totalCostContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
  },
  totalCostLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#C8B56A',
  },
  totalCostValue: {
    fontSize: 20,
    fontWeight: '700',
    color: BRAND_GOLD,
  },
  totalCostValueError: {
    color: '#EF4444',
  },
  sendButton: {
    backgroundColor: BRAND_GOLD,
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  sendButtonDisabled: {
    backgroundColor: '#2A2A2E',
  },
  sendButtonText: {
    color: '#000',
    fontSize: 16,
    fontWeight: '700',
  },
  rechargeModalContent: {
    backgroundColor: '#0B0B0C',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    paddingBottom: 40,
    maxHeight: '80%',
  },
  rechargeInfo: {
    alignItems: 'center',
    marginBottom: 24,
  },
  rechargeEmoji: {
    fontSize: 48,
    marginBottom: 12,
  },
  rechargeTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#C8B56A',
    marginBottom: 8,
  },
  rechargeSubtitle: {
    fontSize: 14,
    color: '#C8B56A',
    textAlign: 'center',
    marginBottom: 8,
  },
  rechargeBalance: {
    fontSize: 16,
    fontWeight: '600',
    color: BRAND_GOLD,
  },
  formGroup: {
    marginBottom: 20,
  },
  formLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#C8B56A',
    marginBottom: 8,
  },
  textInput: {
    backgroundColor: '#121214',
    borderRadius: 12,
    padding: 16,
    fontSize: 14,
    color: '#C8B56A',
  },
  quickRechargeContainer: {
    marginBottom: 24,
  },
  quickRechargeTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#C8B56A',
    marginBottom: 12,
  },
  quickRechargeButton: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#121214',
    borderRadius: 12,
    padding: 16,
    marginBottom: 8,
  },
  quickRechargeCoins: {
    fontSize: 16,
    fontWeight: '700',
    color: BRAND_GOLD,
  },
  quickRechargePrice: {
    fontSize: 14,
    color: '#C8B56A',
  },
  rechargeButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  rechargeButton: {
    flex: 1,
    padding: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  rechargeCancelButton: {
    backgroundColor: '#121214',
  },
  rechargeCancelText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#C8B56A',
  },
  rechargeWalletButton: {
    backgroundColor: BRAND_GOLD,
  },
  rechargeWalletText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#fff',
  },
  loadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
  },
});






