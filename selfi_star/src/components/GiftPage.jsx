import { useState, useEffect } from 'react';
import { Gift, Send, X } from 'lucide-react';
import api from '../api';
import { useTheme } from '../contexts/ThemeContext';

const GIFT_AMOUNTS = [10, 25, 50, 100, 200, 500];

export default function GiftPage({ username, onClose }) {
  const { colors: T } = useTheme();
  const [selectedAmount, setSelectedAmount] = useState(50);
  const [customAmount, setCustomAmount] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [success, setSuccess] = useState(false);

  const handleSendGift = async () => {
    if (!username) return;
    
    const amount = customAmount ? parseFloat(customAmount) : selectedAmount;
    if (!amount || amount <= 0) {
      alert('Please enter a valid gift amount');
      return;
    }

    setLoading(true);
    try {
      await api.request('/gamification/gift/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          recipient_username: username,
          amount: Math.round(amount),
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

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 10000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
      <div style={{ background: T?.cardBg || '#fff', borderRadius: 20, padding: 24, maxWidth: 400, width: '100%', boxShadow: '0 20px 60px rgba(0,0,0,0.3)' }}>
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

        {success ? (
          <div style={{ textAlign: 'center', padding: 40 }}>
            <div style={{ fontSize: 48, marginBottom: 16 }}>🎁</div>
            <div style={{ fontSize: 18, fontWeight: 700, color: T?.txt || '#000', marginBottom: 8 }}>Gift Sent!</div>
            <div style={{ fontSize: 14, color: T?.sub || '#666' }}>Your gift has been sent successfully</div>
          </div>
        ) : (
          <>
            {/* Amount Selection */}
            <div style={{ marginBottom: 20 }}>
              <div style={{ fontSize: 12, color: T?.sub || '#666', marginBottom: 10 }}>Select Amount</div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8 }}>
                {GIFT_AMOUNTS.map((amount) => (
                  <button
                    key={amount}
                    onClick={() => { setSelectedAmount(amount); setCustomAmount(''); }}
                    style={{
                      padding: '12px 8px',
                      borderRadius: 10,
                      border: `2px solid ${selectedAmount === amount && !customAmount ? (T?.pri || '#000') : T?.border || '#e0e0e0'}`,
                      background: selectedAmount === amount && !customAmount ? (T?.pri || '#000') + '10' : T?.bg || '#f5f5f5',
                      color: T?.txt || '#000',
                      fontWeight: 600,
                      cursor: 'pointer',
                      transition: 'all 0.2s',
                    }}
                  >
                    ${amount}
                  </button>
                ))}
              </div>
            </div>

            {/* Custom Amount */}
            <div style={{ marginBottom: 20 }}>
              <div style={{ fontSize: 12, color: T?.sub || '#666', marginBottom: 6 }}>Or enter custom amount</div>
              <input
                type="number"
                value={customAmount}
                onChange={(e) => { setCustomAmount(e.target.value); setSelectedAmount(0); }}
                placeholder="Enter amount"
                style={{
                  width: '100%',
                  padding: '10px 14px',
                  borderRadius: 10,
                  border: `1px solid ${T?.border || '#e0e0e0'}`,
                  background: T?.bg || '#f5f5f5',
                  color: T?.txt || '#000',
                  fontSize: 14,
                }}
              />
            </div>

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
              disabled={loading}
              style={{
                width: '100%',
                padding: '12px',
                borderRadius: 10,
                border: 'none',
                background: T?.pri || '#000',
                color: '#fff',
                fontSize: 16,
                fontWeight: 700,
                cursor: loading ? 'not-allowed' : 'pointer',
                opacity: loading ? 0.5 : 1,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 8,
              }}
            >
              {loading ? 'Sending...' : (
                <>
                  <Send size={18} />
                  Send Gift
                </>
              )}
            </button>
          </>
        )}
      </div>
    </div>
  );
}
