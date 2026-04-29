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
const BRAND_GOLD = '#D4AF37';

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
  rare: '#3B82F6',
  epic: '#8B5CF6',
  legendary: '#F59E0B',
};

export default function GiftSelectorScreen({ route, navigation }) {
  const { recipientId, recipientUsername, reelId } = route.params || {};
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  
  const [gifts, setGifts] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedGift, setSelectedGift] = useState(null);
  const [quantity, setQuantity] = useState(1);
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(true);
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
      setGifts(response.results || response);
    } catch (error) {
      console.error('Error loading gifts:', error);
    } finally {
      setLoading(false);
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
        <View style={{ fontSize: 24, height: 32, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          {item.image_url ? (
            <Image
              source={{ uri: item.image_url }}
              style={{ width: 28, height: 28 }}
              resizeMode="contain"
            />
          ) : (
            <Text style={{ fontSize: 28 }}>{CATEGORY_ICONS[item.category] || '🎁'}</Text>
          )}
        </View>
        <Text style={styles.giftPrice}>{item.coin_value}🪙</Text>
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
          {category !== 'all' && CATEGORY_ICONS[category]} {category.charAt(0).toUpperCase() + category.slice(1)}
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
        <View style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <Text style={{ fontSize: 28 }}>💰</Text>
            <View>
              <Text style={styles.modalTitle}>Insufficient Coins</Text>
              <Text style={styles.modalSubtitle}>
                Need 🪙 {rechargeError?.required_coins} · Have 🪙 {rechargeError?.current_purchased_coins}
              </Text>
            </View>
          </View>

          <TextInput
            style={styles.phoneInput}
            placeholder="Phone for Telebirr (+251 9xx xxx xxx)"
            value={phoneNumber}
            onChangeText={setPhoneNumber}
            keyboardType="phone-pad"
            placeholderTextColor="#78716C"
          />

          <View style={styles.packageGrid}>
            {[
              { coins: 100, etb: 10, pkgId: 1 },
              { coins: 500, etb: 50, pkgId: 2 },
            ].map(pkg => (
              <TouchableOpacity
                key={pkg.pkgId}
                style={styles.packageButton}
                onPress={() => {
                  if (!phoneNumber) {
                    Alert.alert('Error', 'Please enter your phone number');
                    return;
                  }
                  handleTelebirrPayment(pkg.pkgId, phoneNumber);
                }}
              >
                <Text style={styles.packageButtonText}>🪙 {pkg.coins}</Text>
                <Text style={styles.packageButtonSub}>· {pkg.etb} ETB</Text>
              </TouchableOpacity>
            ))}
          </View>

          <View style={styles.rechargeActions}>
            <TouchableOpacity
              style={[styles.rechargeActionButton, styles.rechargeActionSecondary]}
              onPress={() => setShowRechargeModal(false)}
            >
              <Text style={styles.rechargeActionText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.rechargeActionButton, styles.rechargeActionPrimary]}
              onPress={() => {
                setShowRechargeModal(false);
                navigation.navigate('Wallet');
              }}
            >
              <Text style={styles.rechargeActionText}>Open Wallet</Text>
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
      {/* Compact Header - matches web app */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="close" size={18} color="#D4AF37" />
        </TouchableOpacity>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, flex: 1 }}>
          <Ionicons name="gift" size={18} color="#D4AF37" />
          <Text style={styles.headerTitle}>
            Gift to <Text style={{ color: BRAND_GOLD }}>@{recipientUsername || 'User'}</Text>
          </Text>
        </View>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
          <Text style={styles.coinBalance}>🪙 {coinBalance}</Text>
        </View>
      </View>

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

      {/* Quantity + Message inline row when gift selected */}
      {selectedGift && (
        <View style={styles.selectedGiftSection}>
          <View style={styles.selectedGiftInfo}>
            <Text style={styles.selectedGiftName}>{selectedGift.name}</Text>
            <View style={styles.quantitySelector}>
              <TouchableOpacity onPress={() => setQuantity(Math.max(1, quantity - 1))} style={styles.qtyBtn}>
                <Text style={styles.qtyBtnText}>−</Text>
              </TouchableOpacity>
              <Text style={styles.qtyText}>{quantity}</Text>
              <TouchableOpacity onPress={() => setQuantity(quantity + 1)} style={styles.qtyBtn}>
                <Text style={styles.qtyBtnText}>+</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      )}

      {/* Message input */}
      {selectedGift && (
        <View style={styles.messageSection}>
          <TextInput
            style={styles.messageInput}
            value={message}
            onChangeText={setMessage}
            placeholder="Add a message (optional)..."
            placeholderTextColor="#78716C"
          />
        </View>
      )}

      {/* Send Button */}
      {selectedGift && (
        <TouchableOpacity
          style={[styles.sendButton, sending && styles.sendButtonDisabled]}
          onPress={handleSend}
          disabled={sending}
        >
          {sending ? (
            <ActivityIndicator color="#000" />
          ) : (
            <Text style={styles.sendButtonText}>
              Send · 🪙 {selectedGift.coin_value * quantity}
            </Text>
          )}
        </TouchableOpacity>
      )}

      {renderRechargeModal()}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0D0D0D',
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
  },
  headerTitle: {
    fontSize: 15,
    fontWeight: 700,
    color: '#F5F5F7',
  },
  coinBalance: {
    fontSize: 13,
    fontWeight: 700,
    color: BRAND_GOLD,
  },
  categoryTabs: {
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  categoryTabsContent: {
    gap: 6,
  },
  categoryTab: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 14,
    backgroundColor: '#1A1A1A',
  },
  categoryTabSelected: {
    backgroundColor: 'rgba(218,155,42,0.13)',
    borderWidth: 1,
    borderColor: BRAND_GOLD,
  },
  categoryTabText: {
    fontSize: 11,
    color: '#F5F5F7',
    fontWeight: 600,
  },
  categoryTabTextSelected: {
    color: BRAND_GOLD,
  },
  giftGrid: {
    padding: 16,
    gap: 6,
  },
  giftItem: {
    padding: 8,
    borderRadius: 10,
    backgroundColor: '#1A1A1A',
    alignItems: 'center',
    gap: 2,
  },
  giftItemSelected: {
    backgroundColor: 'rgba(218,155,42,0.13)',
    borderWidth: 1.5,
    borderColor: BRAND_GOLD,
  },
  giftPrice: {
    fontSize: 11,
    fontWeight: 700,
    color: BRAND_GOLD,
  },
  selectedGiftSection: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: '#1A1A1A',
    margin: 16,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#333',
  },
  selectedGiftInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  selectedGiftName: {
    fontSize: 13,
    color: '#F5F5F7',
    fontWeight: 600,
  },
  quantitySelector: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  qtyBtn: {
    width: 28,
    height: 28,
    borderRadius: 6,
    backgroundColor: '#0D0D0D',
    borderWidth: 1,
    borderColor: '#333',
    alignItems: 'center',
    justifyContent: 'center',
  },
  qtyBtnText: {
    fontSize: 16,
    fontWeight: 700,
    color: '#F5F5F7',
  },
  qtyText: {
    minWidth: 20,
    textAlign: 'center',
    fontSize: 14,
    fontWeight: 700,
    color: '#F5F5F7',
  },
  messageSection: {
    paddingHorizontal: 16,
    marginBottom: 10,
  },
  messageInput: {
    backgroundColor: '#1A1A1A',
    borderWidth: 1.5,
    borderColor: '#333',
    borderRadius: 10,
    padding: 12,
    fontSize: 13,
    color: '#F5F5F7',
  },
  sendButton: {
    marginHorizontal: 16,
    marginBottom: 16,
    padding: 12,
    borderRadius: 10,
    backgroundColor: BRAND_GOLD,
    alignItems: 'center',
  },
  sendButtonDisabled: {
    backgroundColor: '#333',
  },
  sendButtonText: {
    color: '#000',
    fontSize: 14,
    fontWeight: 700,
  },
  giftName: {
    fontSize: 12,
    color: '#1C1917',
    marginBottom: 4,
  },
  giftPriceContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  giftPrice: {
    fontSize: 14,
    fontWeight: 700,
    color: BRAND_GOLD,
  },
  rarityBadge: {
    position: 'absolute',
    top: 4,
    right: 4,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  rarityText: {
    fontSize: 8,
    color: '#fff',
    fontWeight: 600,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.82)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  modalContent: {
    backgroundColor: '#1A1A1A',
    borderRadius: 16,
    padding: 18,
    width: '100%',
    maxWidth: 380,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 12,
  },
  modalTitle: {
    fontSize: 15,
    fontWeight: 700,
    color: '#F5F5F7',
  },
  modalSubtitle: {
    fontSize: 12,
    color: '#78716C',
  },
  phoneInput: {
    backgroundColor: '#0D0D0D',
    borderWidth: 1.5,
    borderColor: '#333',
    borderRadius: 10,
    padding: 10,
    fontSize: 13,
    color: '#F5F5F7',
    marginBottom: 10,
  },
  packageGrid: {
    flexDirection: 'row',
    gap: 6,
    marginBottom: 12,
  },
  packageButton: {
    flex: 1,
    padding: 10,
    borderRadius: 8,
    backgroundColor: '#1A1A1A',
    borderWidth: 1.5,
    borderColor: '#333',
    alignItems: 'center',
  },
  packageButtonText: {
    fontSize: 13,
    fontWeight: 700,
    color: '#F5F5F7',
  },
  packageButtonSub: {
    fontSize: 11,
    color: '#78716C',
    fontWeight: 500,
  },
  rechargeActions: {
    flexDirection: 'row',
    gap: 8,
  },
  rechargeActionButton: {
    flex: 1,
    padding: 10,
    borderRadius: 10,
    alignItems: 'center',
  },
  rechargeActionPrimary: {
    backgroundColor: BRAND_GOLD,
  },
  rechargeActionSecondary: {
    backgroundColor: '#1A1A1A',
    borderWidth: 1.5,
    borderColor: '#333',
  },
  rechargeActionText: {
    fontSize: 13,
    fontWeight: 700,
    color: '#000',
  },
  loadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    alignItems: 'center',
    justifyContent: 'center',
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
    shadowColor: '#D4AF37',
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
    color: '#D4AF37',
    marginBottom: 8,
  },
  rechargeSubtitle: {
    fontSize: 14,
    color: '#D4AF37',
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
    color: '#D4AF37',
    marginBottom: 8,
  },
  textInput: {
    backgroundColor: '#121214',
    borderRadius: 12,
    padding: 16,
    fontSize: 14,
    color: '#D4AF37',
  },
  quickRechargeContainer: {
    marginBottom: 24,
  },
  quickRechargeTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#D4AF37',
    marginBottom: 12,
  },
  quickRechargeButton: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#f9f9f9',
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
    color: '#D4AF37',
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
    color: '#D4AF37',
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



