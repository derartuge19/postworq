import { useState, useEffect } from 'react';
import { Gift, Coins, Flame, Calendar, RotateCw, Sparkles, CheckCircle, X, TrendingUp, Target } from 'lucide-react';
import api from '../../api';

// Mobile App Style Gamification Bar
export function GamificationBar({ userId, theme }) {
  const [status, setStatus] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeModal, setActiveModal] = useState(null);
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

  if (loading) return <div style={{ padding: '12px 16px', textAlign: 'center', color: theme.sub }}>Loading...</div>;
  
  if (error) return (
    <div style={{ 
      padding: '12px 16px', 
      background: theme.red + '10', 
      borderRadius: 12, 
      margin: '0 16px 12px',
      textAlign: 'center',
      border: `1px solid ${theme.red}20`
    }}>
      <div style={{ fontSize: 12, color: theme.red, marginBottom: 8 }}>{error}</div>
      <button 
        onClick={loadStatus}
        style={{
          padding: '6px 12px',
          borderRadius: 6,
          border: 'none',
          background: theme.pri,
          color: 'white',
          cursor: 'pointer',
          fontSize: 12
        }}
      >
        Retry
      </button>
    </div>
  );

  if (!status) return null;

  return (
    <div style={{ 
      background: 'linear-gradient(135deg, #FFF8F0 0%, #FFFFFF 100%)',
      borderRadius: 16,
      margin: '0 16px 16px',
      padding: '16px',
      border: `2px solid ${theme.pri}20`,
      boxShadow: '0 4px 12px rgba(218, 155, 42, 0.1)'
    }}>
      {/* Header */}
      <div style={{ 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'space-between',
        marginBottom: 16
      }}>
        <div style={{ 
          display: 'flex', 
          alignItems: 'center', 
          gap: 8,
          fontSize: 16,
          fontWeight: 700,
          color: theme.txt
        }}>
          <span style={{ fontSize: 20 }}>🎮</span>
          Gamification Hub
        </div>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: 4,
          padding: '4px 8px',
          background: theme.pri + '15',
          borderRadius: 20,
          fontSize: 12,
          color: theme.pri,
          fontWeight: 600
        }}>
          <Flame size={14} />
          {status.login_streak.current} day streak
        </div>
      </div>

      {/* Icon Bar */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(4, 1fr)',
        gap: 12,
        marginBottom: 16
      }}>
        <GameIcon
          icon={<Coins size={20} />}
          value={status.coins.balance}
          label="Coins"
          color={theme.pri}
          onClick={() => setActiveModal('coins')}
        />
        <GameIcon
          icon={<Flame size={20} />}
          value={status.login_streak.current}
          label="Streak"
          color="#EF4444"
          onClick={() => setActiveModal('streak')}
        />
        <GameIcon
          icon={<Target size={20} />}
          value={status.spin.can_spin ? '✓' : '✗'}
          label="Spin"
          color={status.spin.can_spin ? theme.pri : theme.sub}
          onClick={() => status.spin.can_spin && setActiveModal('spin')}
          disabled={!status.spin.can_spin}
        />
        <GameIcon
          icon={<Gift size={20} />}
          value={status.gifts.received_today}
          label="Gifts"
          color="#8B5CF6"
          onClick={() => setActiveModal('gift')}
        />
      </div>

      {/* Quick Actions */}
      <div style={{
        display: 'flex',
        gap: 8,
        justifyContent: 'space-between'
      }}>
        {status.spin.can_spin && (
          <QuickButton
            icon={<RotateCw size={16} />}
            label="Daily Spin"
            color={theme.pri}
            onClick={() => setActiveModal('spin')}
          />
        )}
        {status.login_streak.bonus_available && (
          <QuickButton
            icon={<CheckCircle size={16} />}
            label={`Day ${status.login_streak.current + 1} Bonus`}
            color="#10B981"
            onClick={handleClaimLogin}
          />
        )}
        <QuickButton
          icon={<Gift size={16} />}
          label="Send Gift"
          color="#8B5CF6"
          onClick={() => setActiveModal('gift')}
        />
      </div>

      {/* Modals */}
      {activeModal === 'spin' && (
        <SpinModal
          theme={theme}
          onClose={() => setActiveModal(null)}
          onSpin={handleSpin}
          spinning={spinning}
          result={spinResult}
          canSpin={status.spin.can_spin}
          rewards={status.spin.rewards_preview}
        />
      )}

      {activeModal === 'gift' && (
        <GiftModal
          theme={theme}
          onClose={() => setActiveModal(null)}
          onSuccess={loadStatus}
          coins={status.coins.balance}
        />
      )}

      {activeModal === 'coins' && (
        <CoinsModal
          theme={theme}
          onClose={() => setActiveModal(null)}
          coins={status.coins}
        />
      )}

      {activeModal === 'streak' && (
        <StreakModal
          theme={theme}
          onClose={() => setActiveModal(null)}
          streak={status.login_streak}
          onClaim={handleClaimLogin}
        />
      )}
    </div>
  );
}

function GameIcon({ icon, value, label, color, onClick, disabled }) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      style={{
        background: disabled ? '#F5F5F5' : color + '10',
        border: disabled ? '1px solid #E5E5E5' : `2px solid ${color}30`,
        borderRadius: 12,
        padding: '12px 8px',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 4,
        cursor: disabled ? 'not-allowed' : 'pointer',
        transition: 'all 0.2s',
        opacity: disabled ? 0.6 : 1,
        minWidth: 0
      }}
    >
      <div style={{ color: disabled ? '#999' : color }}>
        {icon}
      </div>
      <div style={{ 
        fontSize: 14, 
        fontWeight: 700, 
        color: disabled ? '#999' : '#333' 
      }}>
        {value}
      </div>
      <div style={{ 
        fontSize: 10, 
        color: disabled ? '#999' : '#666',
        textTransform: 'uppercase',
        letterSpacing: '0.5px'
      }}>
        {label}
      </div>
    </button>
  );
}

function QuickButton({ icon, label, color, onClick }) {
  return (
    <button
      onClick={onClick}
      style={{
        flex: 1,
        background: color + '15',
        border: `1px solid ${color}30`,
        borderRadius: 8,
        padding: '8px 12px',
        display: 'flex',
        alignItems: 'center',
        gap: 6,
        cursor: 'pointer',
        transition: 'all 0.2s',
        fontSize: 12,
        color: color,
        fontWeight: 600
      }}
    >
      {icon}
      {label}
    </button>
  );
}

function CoinsModal({ theme, onClose, coins }) {
  return (
    <MobileModal theme={theme} onClose={onClose} title="💰 Coins Balance">
      <div style={{ textAlign: 'center', padding: '20px 0' }}>
        <div style={{ fontSize: 64, marginBottom: 16 }}>🪙</div>
        <div style={{ fontSize: 32, fontWeight: 700, color: theme.pri, marginBottom: 8 }}>
          {coins.balance}
        </div>
        <div style={{ fontSize: 14, color: theme.sub, marginBottom: 24 }}>
          Current Balance
        </div>
        
        <div style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: 16,
          marginBottom: 24
        }}>
          <div style={{
            background: '#10B98110',
            padding: 12,
            borderRadius: 8,
            textAlign: 'center'
          }}>
            <div style={{ fontSize: 20, fontWeight: 700, color: '#10B981' }}>
              {coins.earned_total}
            </div>
            <div style={{ fontSize: 11, color: theme.sub }}>Total Earned</div>
          </div>
          <div style={{
            background: '#EF444410',
            padding: 12,
            borderRadius: 8,
            textAlign: 'center'
          }}>
            <div style={{ fontSize: 20, fontWeight: 700, color: '#EF4444' }}>
              {coins.spent_total}
            </div>
            <div style={{ fontSize: 11, color: theme.sub }}>Total Spent</div>
          </div>
        </div>
      </div>
    </MobileModal>
  );
}

function StreakModal({ theme, onClose, streak, onClaim }) {
  return (
    <MobileModal theme={theme} onClose={onClose} title="🔥 Login Streak">
      <div style={{ textAlign: 'center', padding: '20px 0' }}>
        <div style={{ fontSize: 64, marginBottom: 16 }}>🔥</div>
        <div style={{ fontSize: 32, fontWeight: 700, color: '#EF4444', marginBottom: 8 }}>
          {streak.current} Days
        </div>
        <div style={{ fontSize: 14, color: theme.sub, marginBottom: 16 }}>
          Current Streak
        </div>
        
        <div style={{
          background: '#F59E0B10',
          padding: 16,
          borderRadius: 12,
          marginBottom: 20
        }}>
          <div style={{ fontSize: 16, fontWeight: 600, color: theme.txt, marginBottom: 8 }}>
            Best Streak: {streak.longest} days
          </div>
          <div style={{ fontSize: 12, color: theme.sub }}>
            Keep logging in daily to maintain your streak!
          </div>
        </div>

        {streak.bonus_available && (
          <button
            onClick={() => {
              onClaim();
              onClose();
            }}
            style={{
              width: '100%',
              padding: 14,
              borderRadius: 10,
              border: 'none',
              background: '#10B981',
              color: 'white',
              fontSize: 16,
              fontWeight: 600,
              cursor: 'pointer'
            }}
          >
            Claim Day {streak.current + 1} Bonus
          </button>
        )}
      </div>
    </MobileModal>
  );
}

function MobileModal({ theme, onClose, title, children }) {
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
        background: 'white',
        borderRadius: 20,
        padding: 24,
        maxWidth: 400,
        width: '100%',
        maxHeight: '80vh',
        overflow: 'auto'
      }} onClick={e => e.stopPropagation()}>
        <div style={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center',
          marginBottom: 20
        }}>
          <h2 style={{ margin: 0, fontSize: 20, color: theme.txt }}>{title}</h2>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer' }}>
            <X size={24} color={theme.sub} />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

// Reuse existing SpinModal and GiftModal but adapt styling
function SpinModal({ theme, onClose, onSpin, spinning, result, canSpin, rewards }) {
  const [rotation, setRotation] = useState(0);

  const handleSpinClick = () => {
    if (!canSpin || spinning) return;
    const randomRotation = 1440 + Math.random() * 1440;
    setRotation(prev => prev + randomRotation);
    onSpin();
  };

  return (
    <MobileModal theme={theme} onClose={onClose} title="🎰 Daily Spin">
      {!result ? (
        <>
          <div style={{
            width: 200,
            height: 200,
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
            <div style={{
              position: 'absolute',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              width: 50,
              height: 50,
              borderRadius: '50%',
              background: 'white',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 2px 10px rgba(0,0,0,0.2)'
            }}>
              <Sparkles size={24} color={theme.pri} />
            </div>
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
        <div style={{ textAlign: 'center', padding: '20px 0' }}>
          <div style={{ fontSize: 64, marginBottom: 16 }}>
            {result.reward.emoji}
          </div>
          <div style={{ fontSize: 24, fontWeight: 700, color: theme.pri, marginBottom: 8 }}>
            {result.reward.label}
          </div>
          <div style={{ fontSize: 16, color: theme.txt, marginBottom: 16 }}>
            +{result.coins_earned} coins added!
          </div>
          <div style={{ fontSize: 14, color: theme.sub, marginBottom: 20 }}>
            New balance: <strong>{result.new_balance}</strong> coins
          </div>
          <button
            onClick={onClose}
            style={{
              width: '100%',
              padding: 14,
              borderRadius: 10,
              border: 'none',
              background: theme.pri,
              color: 'white',
              fontSize: 16,
              cursor: 'pointer'
            }}
          >
            Awesome!
          </button>
        </div>
      )}
    </MobileModal>
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
    <MobileModal theme={theme} onClose={onClose} title="🎁 Send Gift">
      {result ? (
        <div style={{ textAlign: 'center', padding: '20px 0' }}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>🎉</div>
          <div style={{ fontSize: 16, color: theme.txt, marginBottom: 8 }}>
            Gift sent to {result.recipient.username}!
          </div>
          <div style={{ color: theme.sub }}>{result.amount} coins</div>
        </div>
      ) : (
        <div>
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
        </div>
      )}
    </MobileModal>
  );
}
