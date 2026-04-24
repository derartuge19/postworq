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
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import api from '../api';
import config from '../config';
import { useAuth } from '../contexts/AuthContext';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');
const BRAND_GOLD = '#DA9B2A';

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
      const response = await api.request('/coins/balance/');
      setCoinBalance(response.coins || 0);
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
    
    setSending(true);
    try {
      await api.request('/gift-transactions/', {
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
      alert('Failed to send gift. Please try again.');
    } finally {
      setSending(false);
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
          <Ionicons name="arrow-back" size={24} color="#000" />
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
  coinBalanceContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  coinBalance: {
    marginLeft: 4,
    fontSize: 14,
    fontWeight: '600',
    color: BRAND_GOLD,
  },
  recipientInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#f9f9f9',
  },
  recipientLabel: {
    fontSize: 14,
    color: '#666',
    marginRight: 8,
  },
  recipientName: {
    fontSize: 16,
    fontWeight: '600',
    color: BRAND_GOLD,
  },
  categoryTabs: {
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  categoryTabsContent: {
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  categoryTab: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginRight: 8,
    borderRadius: 20,
    backgroundColor: '#f5f5f5',
  },
  categoryTabSelected: {
    backgroundColor: BRAND_GOLD,
  },
  categoryTabText: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
  },
  categoryTabTextSelected: {
    color: '#fff',
    fontWeight: '600',
  },
  giftGrid: {
    padding: 16,
  },
  giftItem: {
    width: (SCREEN_WIDTH - 64) / 4,
    margin: 4,
    padding: 8,
    borderRadius: 12,
    backgroundColor: '#f9f9f9',
    alignItems: 'center',
  },
  giftItemSelected: {
    backgroundColor: '#fff5e6',
    borderWidth: 2,
    borderColor: BRAND_GOLD,
  },
  giftImageContainer: {
    width: 60,
    height: 60,
    borderRadius: 12,
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  giftImageContainerSelected: {
    backgroundColor: BRAND_GOLD + '20',
  },
  giftImage: {
    width: 50,
    height: 50,
  },
  giftPlaceholder: {
    width: 60,
    height: 60,
    justifyContent: 'center',
    alignItems: 'center',
  },
  giftName: {
    fontSize: 12,
    fontWeight: '600',
    color: '#000',
    textAlign: 'center',
    marginBottom: 4,
  },
  giftPriceContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  giftPrice: {
    fontSize: 12,
    fontWeight: '600',
    color: BRAND_GOLD,
    marginLeft: 2,
  },
  rarityBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
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
    shadowColor: '#000',
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
    backgroundColor: '#fff',
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
    color: '#000',
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
    color: '#000',
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
    color: '#000',
    marginBottom: 12,
  },
  quantityControls: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#f5f5f5',
    borderRadius: 12,
    padding: 4,
  },
  quantityButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 8,
  },
  quantityValue: {
    fontSize: 18,
    fontWeight: '600',
    color: '#000',
  },
  messageContainer: {
    marginBottom: 20,
  },
  messageLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#000',
    marginBottom: 12,
  },
  messageInput: {
    backgroundColor: '#f5f5f5',
    borderRadius: 12,
    padding: 16,
    fontSize: 14,
    color: '#000',
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
    color: '#000',
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
    backgroundColor: '#ccc',
  },
  sendButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});
