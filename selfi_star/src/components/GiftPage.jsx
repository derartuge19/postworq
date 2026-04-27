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

export default function GiftPage({ username, onClose, onShowWallet }) {
  const { colors: T } = useTheme();
  const [gifts, setGifts] = useState([
    { id: 1, name: 'Rose', description: 'A beautiful red rose', coin_value: 10, rarity: 'common', category: 'flowers' },
    { id: 2, name: 'Heart', description: 'A heart symbol', coin_value: 20, rarity: 'common', category: 'hearts' },
    { id: 3, name: 'Medal', description: 'A gold medal', coin_value: 50, rarity: 'rare', category: 'special' },
    { id: 4, name: 'Diamond', description: 'A sparkling diamond', coin_value: 100, rarity: 'epic', category: 'gems' },
    { id: 5, name: 'Teddy Bear', description: 'A cute teddy bear', coin_value: 30, rarity: 'common', category: 'animals' },
  ]);
  const [selectedGift, setSelectedGift] = useState(null);
  const [quantity, setQuantity] = useState(1);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [success, setSuccess] = useState(false);
  const [coinBalance, setCoinBalance] = useState(0);
  const [showRechargeDialog, setShowRechargeDialog] = useState(false);
  const [rechargeError, setRechargeError] = useState(null);
  const [showTelebirrPayment, setShowTelebirrPayment] = useState(false);
  const [telebirrPaymentUrl, setTelebirrPaymentUrl] = useState(null);

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
      // Keep using default gifts if API fails
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

  const handleSendGift = async () => {
    if (!username || !selectedGift) return;

    const totalCost = selectedGift.coin_value * quantity;
    if (totalCost > coinBalance) {
      // Show recharge dialog with automatic Telebirr payment option
      setRechargeError({
        needs_recharge: true,
        required_coins: totalCost,
        current_purchased_coins: coinBalance,
        current_earned_coins: 0,
      });
      setShowRechargeDialog(true);
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
      const errorData = err.response?.data || err;

      if (errorData.needs_recharge) {
        setRechargeError(errorData);
        setShowRechargeDialog(true);
      } else {
        alert(errorData.error || 'Failed to send gift');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleTelebirrPayment = async (packageId, phoneNumber) => {
    try {
      const response = await api.request('/wallet/telebirr/initiate/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          package_id: packageId,
          phone_number: phoneNumber,
        }),
      });

      if (response.success && response.payment_url) {
        // Redirect to Telebirr payment page
        setTelebirrPaymentUrl(response.payment_url);
        setShowTelebirrPayment(true);
        window.open(response.payment_url, '_blank');
      } else {
        alert(response.error || 'Payment initiation failed');
      }
    } catch (error) {
      console.error('Telebirr payment error:', error);
      alert('Payment initiation failed. Please try again.');
    }
  };

  // surface = one step above the modal card so inset elements are always visible
  const card = T?.cardBg || '#1A1A1A';
  const surface = T?.border || '#333';
  const txt = T?.txt || '#fff';
  const sub = T?.sub || '#999';
  const pri = T?.pri || '#DA9B2A';
  const border = T?.border || '#333';

  const inputStyle = {
    width: '100%',
    padding: '12px 14px',
    borderRadius: 10,
    border: `1.5px solid ${border}`,
    background: surface,
    color: txt,
    fontSize: 14,
    outline: 'none',
    boxSizing: 'border-box',
  };

  const secondaryBtn = {
    flex: 1,
    padding: '12px',
    borderRadius: 10,
    border: `1.5px solid ${border}`,
    background: surface,
    color: txt,
    fontSize: 14,
    fontWeight: 600,
    cursor: 'pointer',
  };

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.72)', zIndex: 10000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
      <div style={{ background: card, borderRadius: 20, padding: 24, maxWidth: 500, width: '100%', maxHeight: '90vh', overflowY: 'auto', boxShadow: '0 24px 64px rgba(0,0,0,0.6)', border: `1px solid ${border}` }}>
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <Gift size={24} color={pri} />
            <div style={{ fontSize: 18, fontWeight: 700, color: txt }}>Send Gift</div>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4, color: sub }}>
            <X size={20} />
          </button>
        </div>

        {/* Recipient */}
        <div style={{ marginBottom: 16 }}>
          <div style={{ fontSize: 12, color: sub, marginBottom: 6, fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.5 }}>To</div>
          <div style={{ fontSize: 15, fontWeight: 600, color: txt, padding: '10px 14px', background: surface, borderRadius: 10, border: `1px solid ${border}` }}>
            @{username}
          </div>
        </div>

        {/* Coin Balance */}
        <div style={{ marginBottom: 20, padding: '12px 16px', background: `${pri}18`, borderRadius: 10, border: `1px solid ${pri}40`, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ fontSize: 14, color: sub }}>Your Balance</div>
          <div style={{ fontSize: 18, fontWeight: 800, color: pri }}>🪙 {coinBalance}</div>
        </div>

        {success ? (
          <div style={{ textAlign: 'center', padding: 40 }}>
            <div style={{ fontSize: 48, marginBottom: 16 }}>🎁</div>
            <div style={{ fontSize: 18, fontWeight: 700, color: txt, marginBottom: 8 }}>Gift Sent!</div>
            <div style={{ fontSize: 14, color: sub }}>Your gift has been sent successfully</div>
          </div>
        ) : (
          <>
            {/* Category Filter */}
            <div style={{ marginBottom: 16 }}>
              <div style={{ fontSize: 12, color: sub, marginBottom: 8, fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.5 }}>Category</div>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                {categories.map(cat => (
                  <button
                    key={cat}
                    onClick={() => setSelectedCategory(cat)}
                    style={{
                      padding: '7px 14px',
                      borderRadius: 20,
                      border: `1.5px solid ${selectedCategory === cat ? pri : border}`,
                      background: selectedCategory === cat ? `${pri}22` : surface,
                      color: selectedCategory === cat ? pri : txt,
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
            <div style={{ marginBottom: 16 }}>
              <div style={{ fontSize: 12, color: sub, marginBottom: 8, fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.5 }}>Select Gift</div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10, maxHeight: 210, overflowY: 'auto' }}>
                {filteredGifts.map(gift => (
                  <button
                    key={gift.id}
                    onClick={() => { setSelectedGift(gift); setQuantity(1); }}
                    style={{
                      padding: 12,
                      borderRadius: 12,
                      border: `2px solid ${selectedGift?.id === gift.id ? pri : border}`,
                      background: selectedGift?.id === gift.id ? `${pri}22` : surface,
                      cursor: 'pointer',
                      transition: 'all 0.15s',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      gap: 6,
                    }}
                  >
                    <div style={{ fontSize: 30, display: 'flex', alignItems: 'center', justifyContent: 'center', height: 44, width: 44 }}>
                      {gift.image_url ? (
                        <img src={gift.image_url} alt={gift.name} style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
                      ) : (
                        CATEGORY_ICONS[gift.category] || '🎁'
                      )}
                    </div>
                    <div style={{ fontSize: 11, fontWeight: 600, color: txt, textAlign: 'center' }}>{gift.name}</div>
                    <div style={{ fontSize: 13, fontWeight: 700, color: pri }}>{gift.coin_value}🪙</div>
                  </button>
                ))}
              </div>
            </div>

            {/* Quantity */}
            {selectedGift && (
              <div style={{ marginBottom: 16 }}>
                <div style={{ fontSize: 12, color: sub, marginBottom: 8, fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.5 }}>Quantity</div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <button
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                    style={{ width: 40, height: 40, borderRadius: 8, border: `1.5px solid ${border}`, background: surface, color: txt, fontSize: 20, fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                  >−</button>
                  <div style={{ flex: 1, textAlign: 'center', fontSize: 20, fontWeight: 800, color: txt }}>{quantity}</div>
                  <button
                    onClick={() => setQuantity(quantity + 1)}
                    style={{ width: 40, height: 40, borderRadius: 8, border: `1.5px solid ${border}`, background: surface, color: txt, fontSize: 20, fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                  >+</button>
                </div>
                <div style={{ fontSize: 14, color: pri, fontWeight: 700, marginTop: 8, textAlign: 'center' }}>
                  Total: 🪙 {selectedGift.coin_value * quantity} coins
                </div>
              </div>
            )}

            {/* Message */}
            <div style={{ marginBottom: 20 }}>
              <div style={{ fontSize: 12, color: sub, marginBottom: 6, fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.5 }}>Message (optional)</div>
              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Write a nice message..."
                rows={3}
                style={{ ...inputStyle, resize: 'none' }}
              />
            </div>

            {/* Send Button */}
            <button
              onClick={handleSendGift}
              disabled={loading || !selectedGift}
              style={{
                width: '100%',
                padding: '14px',
                borderRadius: 12,
                border: 'none',
                background: loading || !selectedGift ? border : pri,
                color: loading || !selectedGift ? sub : '#fff',
                fontSize: 16,
                fontWeight: 700,
                cursor: loading || !selectedGift ? 'not-allowed' : 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 8,
                transition: 'background 0.2s',
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

        {/* Recharge Dialog */}
        {showRechargeDialog && rechargeError && (
          <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.82)', zIndex: 20000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
            <div style={{ background: card, borderRadius: 20, padding: 28, maxWidth: 440, width: '100%', boxShadow: '0 24px 64px rgba(0,0,0,0.7)', border: `1px solid ${border}` }}>
              <div style={{ fontSize: 44, textAlign: 'center', marginBottom: 12 }}>💰</div>
              <div style={{ fontSize: 20, fontWeight: 700, color: txt, marginBottom: 10, textAlign: 'center' }}>Insufficient Coins</div>

              {/* Info box */}
              <div style={{ background: surface, border: `1px solid ${border}`, borderRadius: 12, padding: '14px 16px', marginBottom: 20, fontSize: 14, color: txt, lineHeight: 1.7 }}>
                <div>Need: <strong style={{ color: pri }}>🪙 {rechargeError.required_coins}</strong></div>
                <div>Balance: <strong style={{ color: sub }}>🪙 {rechargeError.current_purchased_coins} purchased</strong></div>
                <div style={{ fontSize: 12, color: sub, marginTop: 6 }}>Only purchased coins can be used to send gifts.</div>
              </div>

              {/* Phone Number Input */}
              <div style={{ marginBottom: 16 }}>
                <label style={{ fontSize: 12, color: sub, marginBottom: 6, display: 'block', fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.5 }}>Phone for Telebirr</label>
                <input
                  type="tel"
                  placeholder="+251 9xx xxx xxx"
                  id="telebirr-phone"
                  style={inputStyle}
                />
              </div>

              {/* Quick Coin Package Options */}
              <div style={{ marginBottom: 20 }}>
                <div style={{ fontSize: 12, color: sub, marginBottom: 8, fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.5 }}>Quick Recharge</div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                  {[
                    { coins: 100, etb: 10, pkgId: 1 },
                    { coins: 500, etb: 50, pkgId: 2 },
                  ].map(pkg => (
                    <button
                      key={pkg.pkgId}
                      onClick={() => {
                        const phone = document.getElementById('telebirr-phone')?.value;
                        if (!phone) { alert('Please enter your phone number'); return; }
                        handleTelebirrPayment(pkg.pkgId, phone);
                      }}
                      style={{
                        padding: '14px 12px',
                        borderRadius: 10,
                        border: `1.5px solid ${border}`,
                        background: surface,
                        color: txt,
                        fontSize: 14,
                        fontWeight: 700,
                        cursor: 'pointer',
                        textAlign: 'center',
                        lineHeight: 1.4,
                      }}
                    >
                      🪙 {pkg.coins}<br />
                      <span style={{ fontSize: 12, color: sub, fontWeight: 500 }}>{pkg.etb} ETB</span>
                    </button>
                  ))}
                </div>
              </div>

              <div style={{ display: 'flex', gap: 10 }}>
                <button onClick={() => setShowRechargeDialog(false)} style={secondaryBtn}>
                  Cancel
                </button>
                <button
                  onClick={() => { setShowRechargeDialog(false); onShowWallet?.(); }}
                  style={{ flex: 1, padding: '12px', borderRadius: 10, border: 'none', background: pri, color: '#fff', fontSize: 14, fontWeight: 700, cursor: 'pointer' }}
                >
                  Open Wallet
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
