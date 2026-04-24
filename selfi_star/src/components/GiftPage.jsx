import { useState, useEffect } from 'react';
import { Gift, Send, X } from 'lucide-react';
import api from '../api';
import { useTheme } from '../contexts/ThemeContext';

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

export default function GiftPage({ username, onClose }) {
  const { colors: T } = useTheme();
  const [gifts, setGifts] = useState([]);
  const [selectedGift, setSelectedGift] = useState(null);
  const [quantity, setQuantity] = useState(1);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [loading, setLoading] = useState(false);
  const [loadingGifts, setLoadingGifts] = useState(true);
  const [message, setMessage] = useState('');
  const [success, setSuccess] = useState(false);
  const [coinBalance, setCoinBalance] = useState(0);

  useEffect(() => {
    loadGifts();
    loadCoinBalance();
  }, []);

  const loadGifts = async () => {
    try {
      const response = await api.request('/gifts/');
      const giftsData = response.results || response;
      console.log('Loaded gifts:', giftsData);
      setGifts(giftsData);
    } catch (error) {
      console.error('Error loading gifts:', error);
      // Fallback to default gifts if API fails
      const defaultGifts = [
        { id: 1, name: 'Rose', description: 'A beautiful red rose', coin_value: 10, rarity: 'common', category: 'flowers' },
        { id: 2, name: 'Heart', description: 'A heart symbol', coin_value: 20, rarity: 'common', category: 'hearts' },
        { id: 3, name: 'Medal', description: 'A gold medal', coin_value: 50, rarity: 'rare', category: 'special' },
        { id: 4, name: 'Diamond', description: 'A sparkling diamond', coin_value: 100, rarity: 'epic', category: 'gems' },
        { id: 5, name: 'Teddy Bear', description: 'A cute teddy bear', coin_value: 30, rarity: 'common', category: 'animals' },
      ];
      console.log('Using default gifts:', defaultGifts);
      setGifts(defaultGifts);
    } finally {
      setLoadingGifts(false);
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

  const handleSendGift = async () => {
    if (!username || !selectedGift) return;
    
    const totalCost = selectedGift.coin_value * quantity;
    if (totalCost > coinBalance) {
      alert(`Insufficient coins. You need ${totalCost} coins but have ${coinBalance}.`);
      return;
    }

    setLoading(true);
    try {
      await api.request('/gifts/send/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          gift_id: selectedGift.id,
          recipient_username: username,
          quantity: quantity,
          message: message,
        }),
      });
      setSuccess(true);
      setTimeout(() => {
        setSuccess(false);
        onClose?.();
      }, 2000);
    } catch (err) {
      console.error('Gift send error:', err);
      alert(err?.error || 'Failed to send gift');
    } finally {
      setLoading(false);
    }
  };

  if (loadingGifts) {
    return (
      <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 10000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
        <div style={{ background: T?.cardBg || '#fff', borderRadius: 20, padding: 40, textAlign: 'center' }}>
          <div style={{ fontSize: 24, color: T?.txt || '#000' }}>Loading gifts...</div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 10000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
      <div style={{ background: T?.cardBg || '#fff', borderRadius: 20, padding: 24, maxWidth: 500, width: '100%', maxHeight: '90vh', overflowY: 'auto', boxShadow: '0 20px 60px rgba(0,0,0,0.3)' }}>
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <Gift size={24} color={T?.pri || '#000'} />
            <div style={{ fontSize: 18, fontWeight: 700, color: T?.txt || '#000' }}>Send Gift</div>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4, color: T?.sub || '#666' }}>
            <X size={20} />
          </button>
        </div>

        {/* Recipient */}
        <div style={{ marginBottom: 20 }}>
          <div style={{ fontSize: 12, color: T?.sub || '#666', marginBottom: 6 }}>To</div>
          <div style={{ fontSize: 16, fontWeight: 600, color: T?.txt || '#000', padding: '10px 14px', background: T?.bg || '#f5f5f5', borderRadius: 10 }}>
            @{username}
          </div>
        </div>

        {/* Coin Balance */}
        <div style={{ marginBottom: 20, padding: '12px 16px', background: T?.bg || '#f5f5f5', borderRadius: 10, display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{ fontSize: 14, color: T?.sub || '#666' }}>Your Balance:</div>
          <div style={{ fontSize: 18, fontWeight: 700, color: T?.pri || '#000' }}>{coinBalance} coins</div>
        </div>

        {success ? (
          <div style={{ textAlign: 'center', padding: 40 }}>
            <div style={{ fontSize: 48, marginBottom: 16 }}>🎁</div>
            <div style={{ fontSize: 18, fontWeight: 700, color: T?.txt || '#000', marginBottom: 8 }}>Gift Sent!</div>
            <div style={{ fontSize: 14, color: T?.sub || '#666' }}>Your gift has been sent successfully</div>
          </div>
        ) : (
          <>
            {/* Category Filter */}
            <div style={{ marginBottom: 20 }}>
              <div style={{ fontSize: 12, color: T?.sub || '#666', marginBottom: 10 }}>Category</div>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                {categories.map(cat => (
                  <button
                    key={cat}
                    onClick={() => setSelectedCategory(cat)}
                    style={{
                      padding: '8px 16px',
                      borderRadius: 20,
                      border: `1px solid ${selectedCategory === cat ? (T?.pri || '#000') : T?.border || '#e0e0e0'}`,
                      background: selectedCategory === cat ? (T?.pri || '#000') : T?.bg || '#f5f5f5',
                      color: selectedCategory === cat ? '#fff' : T?.txt || '#000',
                      fontSize: 13,
                      fontWeight: 600,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 6,
                    }}
                  >
                    {cat !== 'all' && CATEGORY_ICONS[cat]} {cat.charAt(0).toUpperCase() + cat.slice(1)}
                  </button>
                ))}
              </div>
            </div>

            {/* Gift Selection */}
            <div style={{ marginBottom: 20 }}>
              <div style={{ fontSize: 12, color: T?.sub || '#666', marginBottom: 10 }}>Select Gift</div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12, maxHeight: 200, overflowY: 'auto' }}>
                {filteredGifts.map(gift => (
                  <button
                    key={gift.id}
                    onClick={() => { setSelectedGift(gift); setQuantity(1); }}
                    style={{
                      padding: 12,
                      borderRadius: 12,
                      border: `2px solid ${selectedGift?.id === gift.id ? (T?.pri || '#000') : T?.border || '#e0e0e0'}`,
                      background: selectedGift?.id === gift.id ? (T?.pri || '#000') + '10' : T?.bg || '#f5f5f5',
                      cursor: 'pointer',
                      transition: 'all 0.2s',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      gap: 8,
                    }}
                  >
                    <div style={{ fontSize: 32, display: 'flex', alignItems: 'center', justifyContent: 'center', height: 48, width: 48 }}>
                      {gift.image_url ? (
                        <img src={gift.image_url} alt={gift.name} style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
                      ) : (
                        CATEGORY_ICONS[gift.category] || '🎁'
                      )}
                    </div>
                    <div style={{ fontSize: 12, fontWeight: 600, color: T?.txt || '#000', textAlign: 'center' }}>{gift.name}</div>
                    <div style={{ fontSize: 14, fontWeight: 700, color: T?.pri || '#000' }}>{gift.coin_value} coins</div>
                  </button>
                ))}
              </div>
            </div>

            {/* Quantity */}
            {selectedGift && (
              <div style={{ marginBottom: 20 }}>
                <div style={{ fontSize: 12, color: T?.sub || '#666', marginBottom: 10 }}>Quantity</div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <button
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                    style={{
                      padding: '8px 16px',
                      borderRadius: 8,
                      border: `1px solid ${T?.border || '#e0e0e0'}`,
                      background: T?.bg || '#f5f5f5',
                      color: T?.txt || '#000',
                      fontSize: 18,
                      fontWeight: 700,
                      cursor: 'pointer',
                    }}
                  >
                    -
                  </button>
                  <div style={{ fontSize: 18, fontWeight: 700, color: T?.txt || '#000', minWidth: 40, textAlign: 'center' }}>{quantity}</div>
                  <button
                    onClick={() => setQuantity(quantity + 1)}
                    style={{
                      padding: '8px 16px',
                      borderRadius: 8,
                      border: `1px solid ${T?.border || '#e0e0e0'}`,
                      background: T?.bg || '#f5f5f5',
                      color: T?.txt || '#000',
                      fontSize: 18,
                      fontWeight: 700,
                      cursor: 'pointer',
                    }}
                  >
                    +
                  </button>
                </div>
                <div style={{ fontSize: 14, color: T?.pri || '#000', fontWeight: 700, marginTop: 8 }}>
                  Total: {selectedGift.coin_value * quantity} coins
                </div>
              </div>
            )}

            {/* Message */}
            <div style={{ marginBottom: 20 }}>
              <div style={{ fontSize: 12, color: T?.sub || '#666', marginBottom: 6 }}>Add a message (optional)</div>
              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Write a nice message..."
                rows={3}
                style={{
                  width: '100%',
                  padding: '10px 14px',
                  borderRadius: 10,
                  border: `1px solid ${T?.border || '#e0e0e0'}`,
                  background: T?.bg || '#f5f5f5',
                  color: T?.txt || '#000',
                  fontSize: 14,
                  resize: 'none',
                }}
              />
            </div>

            {/* Send Button */}
            <button
              onClick={handleSendGift}
              disabled={loading || !selectedGift}
              style={{
                width: '100%',
                padding: '12px',
                borderRadius: 10,
                border: 'none',
                background: T?.pri || '#000',
                color: '#fff',
                fontSize: 16,
                fontWeight: 700,
                cursor: loading || !selectedGift ? 'not-allowed' : 'pointer',
                opacity: loading || !selectedGift ? 0.5 : 1,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 8,
              }}
            >
              {loading ? 'Sending...' : (
                <>
                  <Send size={18} />
                  Send Gift ({selectedGift ? `${selectedGift.coin_value * quantity} coins` : 'Select a gift'})
                </>
              )}
            </button>
          </>
        )}
      </div>
    </div>
  );
}
