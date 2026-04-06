import { useState, useEffect } from 'react';
import { Gift, Coins, Flame, Calendar, RotateCw, Sparkles, CheckCircle, X } from 'lucide-react';
import api from '../../api';

// Gamification Dashboard Component
export function GamificationDashboard({ userId, theme }) {
  const [status, setStatus] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showSpinModal, setShowSpinModal] = useState(false);
  const [showGiftModal, setShowGiftModal] = useState(false);
  const [spinning, setSpinning] = useState(false);
  const [spinResult, setSpinResult] = useState(null);

  useEffect(() => {
    loadStatus();
  }, []);

  const loadStatus = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await api.request('/gamification/status/');
      setStatus(response);
    } catch (err) {
      console.error('Failed to load gamification status:', err);
      
      // Better error messages
      if (err.message?.includes('401') || err.message?.includes('Unauthorized')) {
        setError('Please log in to access gamification features');
      } else if (err.message?.includes('403') || err.message?.includes('Forbidden')) {
        setError('Access denied. Please check your account status.');
      } else {
        setError(err.message || 'Failed to load gamification data');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSpin = async () => {
    if (spinning) return;
    setSpinning(true);
    try {
      const response = await api.request('/gamification/spin/', { method: 'POST' });
      setSpinResult(response);
      setStatus(prev => ({
        ...prev,
        coins: { ...prev.coins, balance: response.new_balance },
        spin: { ...prev.spin, can_spin: false, spins_total: response.spins_total }
      }));
    } catch (error) {
      console.error('Spin failed:', error);
    } finally {
      setSpinning(false);
    }
  };

  const handleClaimLogin = async () => {
    try {
      const response = await api.request('/gamification/login-bonus/', { method: 'POST' });
      setStatus(prev => ({
        ...prev,
        coins: { ...prev.coins, balance: response.new_balance },
        login_streak: { ...prev.login_streak, bonus_available: false, current: response.login_streak }
      }));
    } catch (error) {
      console.error('Claim failed:', error);
    }
  };

  if (loading) return <div style={{ padding: 20, textAlign: 'center', color: theme.sub }}>Loading gamification...</div>;
  
  if (error) return (
    <div style={{ padding: 20, textAlign: 'center' }}>
      <div style={{ fontSize: 32, marginBottom: 8 }}>⚠️</div>
      <div style={{ color: theme.red, fontSize: 14, marginBottom: 12 }}>
        {error}
      </div>
      <div style={{ fontSize: 12, color: theme.sub, marginBottom: 12 }}>
        Make sure you're logged in and the gamification system is active
      </div>
      <button 
        onClick={loadStatus}
        style={{
          padding: '10px 20px',
          borderRadius: 8,
          border: 'none',
          background: theme.pri,
          color: 'white',
          cursor: 'pointer',
          fontSize: 14
        }}
      >
        Retry
      </button>
    </div>
  );
  
  if (!status) return (
    <div style={{ padding: 20, textAlign: 'center', color: theme.sub }}>
      <div style={{ fontSize: 32, marginBottom: 8 }}>🎮</div>
      <div>Gamification data not available</div>
    </div>
  );

  return (
    <div style={{ padding: '20px 0' }}>
      {/* Coins & Streak Header */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
        gap: 12,
        marginBottom: 24
      }}>
        <StatCard
          icon={<Coins size={24} color={theme.pri} />}
          value={status.coins.balance}
          label="Coins"
          theme={theme}
          accent={theme.pri}
        />
        <StatCard
          icon={<Flame size={24} color="#EF4444" />}
          value={status.login_streak.current}
          label="Day Streak"
          theme={theme}
          accent="#EF4444"
        />
        <StatCard
          icon={<Calendar size={24} color="#3B82F6" />}
          value={status.login_streak.longest}
          label="Best Streak"
          theme={theme}
          accent="#3B82F6"
        />
        <StatCard
          icon={<Gift size={24} color="#8B5CF6" />}
          value={status.gifts.received_today}
          label="Gifts Today"
          theme={theme}
          accent="#8B5CF6"
        />
      </div>

      {/* Action Buttons */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16 }}>
        {/* Daily Spin */}
        <ActionCard
          title="Daily Spin"
          subtitle={status.spin.can_spin ? "Spin for free coins!" : "Come back tomorrow"}
          icon={<RotateCw size={32} color={status.spin.can_spin ? theme.pri : theme.sub} />}
          disabled={!status.spin.can_spin}
          onClick={() => setShowSpinModal(true)}
          theme={theme}
          highlight={status.spin.can_spin}
        />

        {/* Login Bonus */}
        <ActionCard
          title="Login Bonus"
          subtitle={status.login_streak.bonus_available 
            ? `Day ${status.login_streak.current + 1}: +${status.login_streak.next_bonus.coins} coins`
            : "Already claimed today"
          }
          icon={<CheckCircle size={32} color={status.login_streak.bonus_available ? "#10B981" : theme.sub} />}
          disabled={!status.login_streak.bonus_available}
          onClick={handleClaimLogin}
          theme={theme}
          highlight={status.login_streak.bonus_available}
        />

        {/* Send Gift */}
        <ActionCard
          title="Send Gift"
          subtitle={`${10 - status.gifts.sent_today} gifts remaining today`}
          icon={<Gift size={32} color="#8B5CF6" />}
          disabled={status.gifts.sent_today >= 10}
          onClick={() => setShowGiftModal(true)}
          theme={theme}
        />
      </div>

      {/* Spin Modal */}
      {showSpinModal && (
        <SpinModal
          theme={theme}
          onClose={() => {
            setShowSpinModal(false);
            setSpinResult(null);
          }}
          onSpin={handleSpin}
          spinning={spinning}
          result={spinResult}
          canSpin={status.spin.can_spin}
          rewards={status.spin.rewards_preview}
        />
      )}

      {/* Gift Modal */}
      {showGiftModal && (
        <GiftModal
          theme={theme}
          onClose={() => setShowGiftModal(false)}
          onSuccess={loadStatus}
          coins={status.coins.balance}
        />
      )}
    </div>
  );
}

function StatCard({ icon, value, label, theme, accent }) {
  return (
    <div style={{
      background: theme.card,
      borderRadius: 12,
      padding: 16,
      display: 'flex',
      alignItems: 'center',
      gap: 12,
      border: `1px solid ${theme.border}`
    }}>
      <div style={{
        width: 48,
        height: 48,
        borderRadius: 12,
        background: accent + '15',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }}>
        {icon}
      </div>
      <div>
        <div style={{ fontSize: 24, fontWeight: 700, color: theme.txt }}>{value}</div>
        <div style={{ fontSize: 12, color: theme.sub }}>{label}</div>
      </div>
    </div>
  );
}

function ActionCard({ title, subtitle, icon, disabled, onClick, theme, highlight }) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      style={{
        background: theme.card,
        border: `2px solid ${disabled ? theme.border : highlight ? theme.pri : theme.border}`,
        borderRadius: 16,
        padding: 20,
        display: 'flex',
        alignItems: 'center',
        gap: 16,
        cursor: disabled ? 'not-allowed' : 'pointer',
        opacity: disabled ? 0.6 : 1,
        width: '100%',
        textAlign: 'left',
        transition: 'all 0.2s',
        boxShadow: highlight ? `0 4px 12px ${theme.pri}30` : 'none'
      }}
    >
      <div style={{
        width: 56,
        height: 56,
        borderRadius: 14,
        background: highlight ? theme.pri + '15' : theme.bg,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexShrink: 0
      }}>
        {icon}
      </div>
      <div>
        <div style={{ fontSize: 16, fontWeight: 600, color: theme.txt, marginBottom: 4 }}>
          {title}
        </div>
        <div style={{ fontSize: 13, color: disabled ? theme.sub : highlight ? theme.pri : theme.sub }}>
          {subtitle}
        </div>
      </div>
    </button>
  );
}

function SpinModal({ theme, onClose, onSpin, spinning, result, canSpin, rewards }) {
  const [rotation, setRotation] = useState(0);

  const handleSpinClick = () => {
    if (!canSpin || spinning) return;
    const randomRotation = 1440 + Math.random() * 1440; // 4-8 full rotations
    setRotation(prev => prev + randomRotation);
    onSpin();
  };

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      background: 'rgba(0,0,0,0.7)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000,
      padding: 20
    }} onClick={onClose}>
      <div style={{
        background: theme.card,
        borderRadius: 24,
        padding: 32,
        maxWidth: 400,
        width: '100%',
        textAlign: 'center'
      }} onClick={e => e.stopPropagation()}>
        <div style={{ marginBottom: 24 }}>
          <h2 style={{ margin: '0 0 8px 0', color: theme.txt, fontSize: 24 }}>
            Daily Spin 🎰
          </h2>
          <p style={{ margin: 0, color: theme.sub, fontSize: 14 }}>
            {result ? 'Congratulations!' : 'Spin the wheel to win coins!'}
          </p>
        </div>

        {!result ? (
          <>
            {/* Wheel Visual */}
            <div style={{
              width: 280,
              height: 280,
              margin: '0 auto 24px',
              position: 'relative'
            }}>
              <div style={{
                width: '100%',
                height: '100%',
                borderRadius: '50%',
                background: `conic-gradient(
                  ${theme.pri} 0deg 60deg,
                  #3B82F6 60deg 120deg,
                  #10B981 120deg 180deg,
                  #F59E0B 180deg 240deg,
                  #EF4444 240deg 300deg,
                  #8B5CF6 300deg 360deg
                )`,
                transform: `rotate(${rotation}deg)`,
                transition: spinning ? 'transform 3s cubic-bezier(0.23, 1, 0.32, 1)' : 'none',
                boxShadow: '0 4px 20px rgba(0,0,0,0.2)'
              }} />
              {/* Pointer */}
              <div style={{
                position: 'absolute',
                top: -10,
                left: '50%',
                transform: 'translateX(-50%)',
                width: 0,
                height: 0,
                borderLeft: '15px solid transparent',
                borderRight: '15px solid transparent',
                borderTop: '30px solid ' + theme.txt
              }} />
              {/* Center */}
              <div style={{
                position: 'absolute',
                top: '50%',
                left: '50%',
                transform: 'translate(-50%, -50%)',
                width: 60,
                height: 60,
                borderRadius: '50%',
                background: theme.card,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 2px 10px rgba(0,0,0,0.2)'
              }}>
                <Sparkles size={28} color={theme.pri} />
              </div>
            </div>

            {/* Rewards Preview */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(3, 1fr)',
              gap: 8,
              marginBottom: 24
            }}>
              {rewards?.slice(0, 6).map((reward, idx) => (
                <div key={idx} style={{
                  background: theme.bg,
                  borderRadius: 8,
                  padding: 8,
                  fontSize: 12,
                  color: theme.sub
                }}>
                  <div style={{ fontSize: 20, marginBottom: 4 }}>{reward.emoji}</div>
                  {reward.label}
                </div>
              ))}
            </div>

            <button
              onClick={handleSpinClick}
              disabled={!canSpin || spinning}
              style={{
                width: '100%',
                padding: 16,
                borderRadius: 12,
                border: 'none',
                background: canSpin ? theme.pri : theme.border,
                color: canSpin ? 'white' : theme.sub,
                fontSize: 18,
                fontWeight: 600,
                cursor: canSpin ? 'pointer' : 'not-allowed'
              }}
            >
              {spinning ? 'Spinning...' : canSpin ? 'SPIN!' : 'Already Spun Today'}
            </button>
          </>
        ) : (
          <div style={{
            padding: '40px 20px',
            background: `linear-gradient(135deg, ${theme.pri}15, ${theme.pri}05)`,
            borderRadius: 16,
            marginBottom: 20
          }}>
            <div style={{ fontSize: 64, marginBottom: 16 }}>
              {result.reward.emoji}
            </div>
            <div style={{ fontSize: 28, fontWeight: 700, color: theme.pri, marginBottom: 8 }}>
              {result.reward.label}
            </div>
            <div style={{ fontSize: 16, color: theme.txt, marginBottom: 16 }}>
              +{result.coins_earned} coins added!
            </div>
            <div style={{ fontSize: 14, color: theme.sub }}>
              New balance: <strong>{result.new_balance}</strong> coins
            </div>
          </div>
        )}

        {result && (
          <button
            onClick={onClose}
            style={{
              width: '100%',
              padding: 14,
              borderRadius: 10,
              border: `1px solid ${theme.border}`,
              background: 'white',
              color: theme.txt,
              fontSize: 16,
              cursor: 'pointer'
            }}
          >
            Awesome!
          </button>
        )}
      </div>
    </div>
  );
}

function GiftModal({ theme, onClose, onSuccess, coins }) {
  const [recipient, setRecipient] = useState('');
  const [amount, setAmount] = useState(10);
  const [message, setMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');

  const handleSend = async () => {
    if (!recipient || amount < 1 || amount > coins) {
      setError('Invalid recipient or amount');
      return;
    }
    
    setSending(true);
    setError('');
    
    try {
      const response = await api.request('/gamification/gift/', {
        method: 'POST',
        body: JSON.stringify({
          recipient_id: recipient,
          amount: amount,
          message: message
        })
      });
      setResult(response);
      onSuccess();
    } catch (err) {
      setError(err.message || 'Failed to send gift');
    } finally {
      setSending(false);
    }
  };

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      background: 'rgba(0,0,0,0.7)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000,
      padding: 20
    }} onClick={onClose}>
      <div style={{
        background: theme.card,
        borderRadius: 20,
        padding: 24,
        maxWidth: 400,
        width: '100%'
      }} onClick={e => e.stopPropagation()}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
          <h2 style={{ margin: 0, color: theme.txt, fontSize: 20 }}>Send Coin Gift 🎁</h2>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer' }}>
            <X size={24} color={theme.sub} />
          </button>
        </div>

        {result ? (
          <div style={{ textAlign: 'center', padding: '20px 0' }}>
            <div style={{ fontSize: 48, marginBottom: 16 }}>🎉</div>
            <div style={{ fontSize: 18, color: theme.txt, marginBottom: 8 }}>
              Gift sent to {result.recipient.username}!
            </div>
            <div style={{ color: theme.sub }}>{result.amount} coins</div>
          </div>
        ) : (
          <>
            <div style={{ marginBottom: 16 }}>
              <label style={{ display: 'block', fontSize: 13, color: theme.sub, marginBottom: 6 }}>
                Your Balance
              </label>
              <div style={{ fontSize: 24, fontWeight: 600, color: theme.pri }}>
                {coins} coins
              </div>
            </div>

            <div style={{ marginBottom: 16 }}>
              <label style={{ display: 'block', fontSize: 13, color: theme.sub, marginBottom: 6 }}>
                Recipient User ID
              </label>
              <input
                type="text"
                value={recipient}
                onChange={e => setRecipient(e.target.value)}
                placeholder="Enter user ID"
                style={{
                  width: '100%',
                  padding: 12,
                  border: `1px solid ${theme.border}`,
                  borderRadius: 8,
                  fontSize: 14
                }}
              />
            </div>

            <div style={{ marginBottom: 16 }}>
              <label style={{ display: 'block', fontSize: 13, color: theme.sub, marginBottom: 6 }}>
                Amount (1-100)
              </label>
              <input
                type="number"
                value={amount}
                onChange={e => setAmount(parseInt(e.target.value) || 0)}
                min={1}
                max={100}
                style={{
                  width: '100%',
                  padding: 12,
                  border: `1px solid ${theme.border}`,
                  borderRadius: 8,
                  fontSize: 14
                }}
              />
            </div>

            <div style={{ marginBottom: 20 }}>
              <label style={{ display: 'block', fontSize: 13, color: theme.sub, marginBottom: 6 }}>
                Message (optional)
              </label>
              <input
                type="text"
                value={message}
                onChange={e => setMessage(e.target.value)}
                placeholder="Add a friendly message..."
                style={{
                  width: '100%',
                  padding: 12,
                  border: `1px solid ${theme.border}`,
                  borderRadius: 8,
                  fontSize: 14
                }}
              />
            </div>

            {error && (
              <div style={{ color: theme.red, fontSize: 13, marginBottom: 16 }}>
                {error}
              </div>
            )}

            <button
              onClick={handleSend}
              disabled={sending || !recipient || amount < 1 || amount > coins}
              style={{
                width: '100%',
                padding: 14,
                borderRadius: 10,
                border: 'none',
                background: theme.pri,
                color: 'white',
                fontSize: 16,
                fontWeight: 600,
                cursor: sending ? 'not-allowed' : 'pointer',
                opacity: sending ? 0.7 : 1
              }}
            >
              {sending ? 'Sending...' : `Send ${amount} Coins`}
            </button>
          </>
        )}
      </div>
    </div>
  );
}
