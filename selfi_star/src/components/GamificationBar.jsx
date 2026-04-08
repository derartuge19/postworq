import { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';
import api from '../api';

/* ─── CONSTANTS ─────────────────────────────── */
const SPIN_SEGMENTS = [
  { label: '10 Coins',  emoji: '🪙', color: '#F59E0B', coins: 10 },
  { label: '25 Coins',  emoji: '💰', color: '#DA9B2A', coins: 25 },
  { label: '5 Coins',   emoji: '🪙', color: '#FCD34D', coins: 5  },
  { label: '50 Coins',  emoji: '🏆', color: '#EF4444', coins: 50 },
  { label: '15 Coins',  emoji: '🪙', color: '#F59E0B', coins: 15 },
  { label: '100 Coins', emoji: '💎', color: '#8B5CF6', coins: 100 },
  { label: '20 Coins',  emoji: '🪙', color: '#DA9B2A', coins: 20 },
  { label: 'XP Boost',  emoji: '⚡', color: '#10B981', coins: 0  },
];

/* ─── FULL-SCREEN MODAL WRAPPER ──────────────── */
function Modal({ onClose, children }) {
  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = ''; };
  }, []);
  return createPortal(
    <div onClick={onClose} style={{
      position:'fixed',top:0,left:0,right:0,bottom:0,
      background:'rgba(0,0,0,.6)',
      display:'flex',alignItems:'flex-end',justifyContent:'center',
      zIndex:99999,
    }}>
      <div onClick={e=>e.stopPropagation()} style={{
        background:'#fff',borderRadius:'24px 24px 0 0',
        width:'100%',maxWidth:480,maxHeight:'85vh',
        overflowY:'auto',padding:'8px 0 32px',
        boxShadow:'0 -8px 40px rgba(0,0,0,.25)'
      }}>
        <div style={{width:40,height:4,background:'#E7E5E4',borderRadius:4,margin:'12px auto 0'}}/>
        {children}
      </div>
    </div>,
    document.body
  );
}

function ModalHeader({ title, onClose }) {
  return (
    <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',padding:'16px 20px 8px'}}>
      <span style={{fontSize:18,fontWeight:800,color:'#1C1917'}}>{title}</span>
      <button onClick={onClose} style={{background:'#F5F5F4',border:'none',borderRadius:'50%',width:32,height:32,display:'flex',alignItems:'center',justifyContent:'center',cursor:'pointer'}}>
        <X size={16} color='#78716C'/>
      </button>
    </div>
  );
}

/* ─── COINS MODAL ────────────────────────────── */
function CoinsModal({ coins, onClose }) {
  return (
    <Modal onClose={onClose}>
      <ModalHeader title="💰 Coin Balance" onClose={onClose}/>
      <div style={{padding:'12px 20px'}}>
        <div style={{background:'linear-gradient(135deg,#DA9B2A,#F59E0B)',borderRadius:20,padding:'28px 20px',textAlign:'center',marginBottom:20}}>
          <div style={{fontSize:56,marginBottom:4}}>🪙</div>
          <div style={{fontSize:48,fontWeight:900,color:'#fff',lineHeight:1}}>{coins?.balance ?? 0}</div>
          <div style={{fontSize:14,color:'rgba(255,255,255,.85)',marginTop:4}}>Available Coins</div>
        </div>
        <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:12}}>
          {[
            {label:'Total Earned',value:coins?.earned_total??0,color:'#10B981',emoji:'📈'},
            {label:'Total Spent',value:coins?.spent_total??0,color:'#EF4444',emoji:'📉'},
          ].map(s=>(
            <div key={s.label} style={{background:s.color+'12',border:`1.5px solid ${s.color}25`,borderRadius:14,padding:'14px 16px',textAlign:'center'}}>
              <div style={{fontSize:24,marginBottom:4}}>{s.emoji}</div>
              <div style={{fontSize:22,fontWeight:800,color:s.color}}>{s.value}</div>
              <div style={{fontSize:11,color:'#78716C',marginTop:2}}>{s.label}</div>
            </div>
          ))}
        </div>
        <div style={{marginTop:16,background:'#FFF8F0',borderRadius:12,padding:'12px 16px',fontSize:13,color:'#78716C',textAlign:'center'}}>
          💡 Earn coins by spinning daily, receiving gifts, and logging in every day!
        </div>
      </div>
    </Modal>
  );
}

/* ─── STREAK MODAL ───────────────────────────── */
function StreakModal({ streak, onClaim, onClose }) {
  const [claimed, setClaimed] = useState(false);
  const days = ['M','T','W','T','F','S','S'];
  const cur = streak?.current ?? 0;

  const handleClaim = async () => {
    await onClaim();
    setClaimed(true);
  };

  return (
    <Modal onClose={onClose}>
      <ModalHeader title="🔥 Login Streak" onClose={onClose}/>
      <div style={{padding:'8px 20px 0'}}>
        <div style={{background:'linear-gradient(135deg,#EF4444,#F97316)',borderRadius:20,padding:'24px 20px',textAlign:'center',marginBottom:20}}>
          <div style={{fontSize:52}}>🔥</div>
          <div style={{fontSize:44,fontWeight:900,color:'#fff',lineHeight:1}}>{cur}</div>
          <div style={{fontSize:14,color:'rgba(255,255,255,.9)',marginTop:4}}>Day Streak</div>
          {(streak?.longest??0) > 0 && (
            <div style={{fontSize:12,color:'rgba(255,255,255,.75)',marginTop:6}}>Best: {streak.longest} days 🏆</div>
          )}
        </div>

        {/* 7-day progress dots */}
        <div style={{display:'flex',justifyContent:'space-between',marginBottom:20,padding:'0 4px'}}>
          {days.map((d,i)=>{
            const active = i < (cur % 7);
            const isToday = i === (cur % 7 === 0 ? 6 : (cur % 7) - 1);
            return (
              <div key={i} style={{display:'flex',flexDirection:'column',alignItems:'center',gap:4}}>
                <div style={{
                  width:36,height:36,borderRadius:'50%',
                  background: active ? 'linear-gradient(135deg,#EF4444,#F97316)' : '#F5F5F4',
                  border: isToday ? '2px solid #EF4444' : '2px solid transparent',
                  display:'flex',alignItems:'center',justifyContent:'center',
                  fontSize:16,boxShadow: active ? '0 2px 8px rgba(239,68,68,.35)' : 'none'
                }}>
                  {active ? '✓' : ''}
                </div>
                <span style={{fontSize:10,color: active ? '#EF4444' : '#A8A29E',fontWeight:600}}>{d}</span>
              </div>
            );
          })}
        </div>

        {(streak?.bonus_available && !claimed) ? (
          <button onClick={handleClaim} style={{
            width:'100%',padding:'16px',borderRadius:14,border:'none',
            background:'linear-gradient(135deg,#10B981,#059669)',
            color:'#fff',fontSize:17,fontWeight:700,cursor:'pointer',
            boxShadow:'0 4px 16px rgba(16,185,129,.4)'
          }}>
            🎁 Claim Day {cur + 1} Bonus!
          </button>
        ) : claimed ? (
          <div style={{textAlign:'center',padding:'16px',background:'#ECFDF5',borderRadius:14,color:'#10B981',fontWeight:700}}>
            ✅ Bonus Claimed!
          </div>
        ) : (
          <div style={{textAlign:'center',padding:'16px',background:'#F5F5F4',borderRadius:14,color:'#78716C',fontSize:14}}>
            Come back tomorrow for your next bonus 🌙
          </div>
        )}
      </div>
    </Modal>
  );
}

/* ─── SPIN MODAL ─────────────────────────────── */
function SpinModal({ spin, onSpin, onClose }) {
  const [angle, setAngle] = useState(0);
  const [spinning, setSpinning] = useState(false);
  const [result, setResult] = useState(null);
  const wheelRef = useRef(null);
  const n = SPIN_SEGMENTS.length;
  const segAngle = 360 / n;

  const doSpin = async () => {
    if (spinning || !spin?.can_spin) return;
    setSpinning(true);
    setResult(null);
    const extra = 1440 + Math.floor(Math.random() * 360);
    const newAngle = angle + extra;
    setAngle(newAngle);

    // wait for animation
    setTimeout(async () => {
      try {
        const res = await onSpin();
        setResult(res);
      } catch {
        setResult({ reward: { label: 'Try again!', emoji: '😅' }, coins_earned: 0, new_balance: spin?.spins_total ?? 0 });
      } finally {
        setSpinning(false);
      }
    }, 3200);
  };

  return (
    <Modal onClose={onClose}>
      <ModalHeader title="🎰 Daily Spin" onClose={onClose}/>
      <div style={{padding:'8px 20px 0',textAlign:'center'}}>
        {result ? (
          <div style={{padding:'20px 0'}}>
            <div style={{fontSize:72,marginBottom:12}}>{result.reward?.emoji ?? '🎉'}</div>
            <div style={{fontSize:26,fontWeight:800,color:'#DA9B2A',marginBottom:4}}>{result.reward?.label}</div>
            {result.coins_earned > 0 && (
              <div style={{fontSize:16,color:'#10B981',fontWeight:600,marginBottom:4}}>+{result.coins_earned} coins added!</div>
            )}
            <div style={{fontSize:13,color:'#78716C',marginBottom:24}}>New balance: <b>{result.new_balance}</b> 🪙</div>
            <button onClick={onClose} style={{
              width:'100%',padding:'16px',borderRadius:14,border:'none',
              background:'linear-gradient(135deg,#DA9B2A,#F59E0B)',color:'#fff',
              fontSize:16,fontWeight:700,cursor:'pointer',
              boxShadow:'0 4px 16px rgba(218,155,42,.4)'
            }}>
              Awesome! 🎉
            </button>
          </div>
        ) : (
          <>
            {/* Wheel */}
            <div style={{position:'relative',width:240,height:240,margin:'0 auto 20px'}}>
              {/* pointer */}
              <div style={{position:'absolute',top:-10,left:'50%',transform:'translateX(-50%)',zIndex:10,fontSize:24}}>▼</div>
              <svg ref={wheelRef} width={240} height={240} style={{
                transform:`rotate(${angle}deg)`,
                transition: spinning ? 'transform 3.2s cubic-bezier(.17,.67,.12,.99)' : 'none',
                borderRadius:'50%',boxShadow:'0 8px 32px rgba(0,0,0,.2)'
              }}>
                {SPIN_SEGMENTS.map((seg, i) => {
                  const startAngle = (i * segAngle - 90) * (Math.PI / 180);
                  const endAngle = ((i + 1) * segAngle - 90) * (Math.PI / 180);
                  const x1 = 120 + 115 * Math.cos(startAngle);
                  const y1 = 120 + 115 * Math.sin(startAngle);
                  const x2 = 120 + 115 * Math.cos(endAngle);
                  const y2 = 120 + 115 * Math.sin(endAngle);
                  const midAngle = ((i + 0.5) * segAngle - 90) * (Math.PI / 180);
                  const tx = 120 + 75 * Math.cos(midAngle);
                  const ty = 120 + 75 * Math.sin(midAngle);
                  return (
                    <g key={i}>
                      <path d={`M120,120 L${x1},${y1} A115,115 0 0,1 ${x2},${y2} Z`} fill={seg.color} stroke="#fff" strokeWidth={2}/>
                      <text x={tx} y={ty} textAnchor="middle" dominantBaseline="middle" fontSize={18}>{seg.emoji}</text>
                    </g>
                  );
                })}
                <circle cx={120} cy={120} r={20} fill="#fff" stroke="#DA9B2A" strokeWidth={3}/>
                <text x={120} y={120} textAnchor="middle" dominantBaseline="middle" fontSize={16}>⭐</text>
              </svg>
            </div>

            {spin?.can_spin ? (
              <button onClick={doSpin} disabled={spinning} style={{
                width:'100%',padding:'18px',borderRadius:14,border:'none',
                background: spinning ? '#E7E5E4' : 'linear-gradient(135deg,#DA9B2A,#F59E0B)',
                color: spinning ? '#78716C' : '#fff',
                fontSize:18,fontWeight:800,cursor: spinning ? 'not-allowed' : 'pointer',
                boxShadow: spinning ? 'none' : '0 4px 20px rgba(218,155,42,.5)',
                letterSpacing:1
              }}>
                {spinning ? '🌀 Spinning...' : '🎰 SPIN!'}
              </button>
            ) : (
              <div style={{background:'#F5F5F4',borderRadius:14,padding:'16px',color:'#78716C',fontSize:14}}>
                ✅ You already spun today! Come back tomorrow 🌙
              </div>
            )}
            <div style={{fontSize:12,color:'#A8A29E',marginTop:12}}>Total spins: {spin?.spins_total ?? 0}</div>
          </>
        )}
      </div>
    </Modal>
  );
}

/* ─── GIFT MODAL ─────────────────────────────── */
function GiftModal({ coins, onClose, onRefresh }) {
  const [recipientId, setRecipientId] = useState('');
  const [amount, setAmount] = useState(10);
  const [message, setMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [done, setDone] = useState(null);
  const [error, setError] = useState('');

  const send = async () => {
    if (!recipientId.trim()) { setError('Enter a recipient username or ID'); return; }
    if (amount < 1 || amount > (coins?.balance ?? 0)) { setError('Invalid amount'); return; }
    setSending(true); setError('');
    try {
      const res = await api.request('/gamification/gift/', {
        method:'POST',
        headers:{'Content-Type':'application/json'},
        body: JSON.stringify({ recipient_username: recipientId, amount, message })
      });
      setDone(res);
      onRefresh();
    } catch(e) { setError(e.message || 'Failed to send gift'); }
    finally { setSending(false); }
  };

  return (
    <Modal onClose={onClose}>
      <ModalHeader title="🎁 Send Coin Gift" onClose={onClose}/>
      <div style={{padding:'8px 20px 0'}}>
        {done ? (
          <div style={{textAlign:'center',padding:'24px 0'}}>
            <div style={{fontSize:64,marginBottom:12}}>🎉</div>
            <div style={{fontSize:20,fontWeight:800,color:'#1C1917',marginBottom:4}}>Gift Sent!</div>
            <div style={{fontSize:14,color:'#78716C',marginBottom:24}}>
              You sent <b>{done.amount} coins</b> to <b>@{done.recipient?.username}</b>
            </div>
            <button onClick={onClose} style={{width:'100%',padding:'16px',borderRadius:14,border:'none',background:'linear-gradient(135deg,#8B5CF6,#7C3AED)',color:'#fff',fontSize:16,fontWeight:700,cursor:'pointer'}}>
              Done 🎊
            </button>
          </div>
        ) : (
          <>
            {/* balance chip */}
            <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',background:'#FFF8F0',borderRadius:12,padding:'10px 14px',marginBottom:16}}>
              <span style={{fontSize:13,color:'#78716C'}}>Your balance</span>
              <span style={{fontWeight:800,color:'#DA9B2A',fontSize:16}}>🪙 {coins?.balance ?? 0}</span>
            </div>

            <label style={{fontSize:13,fontWeight:600,color:'#78716C',display:'block',marginBottom:6}}>Recipient Username</label>
            <input value={recipientId} onChange={e=>setRecipientId(e.target.value)}
              placeholder="e.g. johndoe"
              style={{width:'100%',padding:'13px 14px',borderRadius:12,border:'1.5px solid #E7E5E4',fontSize:15,marginBottom:14,boxSizing:'border-box',outline:'none'}}
            />

            <label style={{fontSize:13,fontWeight:600,color:'#78716C',display:'block',marginBottom:8}}>Amount</label>
            <div style={{display:'flex',alignItems:'center',gap:12,marginBottom:14}}>
              <button onClick={()=>setAmount(a=>Math.max(1,a-5))}
                style={{width:40,height:40,borderRadius:10,border:'1.5px solid #E7E5E4',background:'#F5F5F4',cursor:'pointer',fontSize:18,display:'flex',alignItems:'center',justifyContent:'center',fontWeight:700}}>
                −
              </button>
              <div style={{flex:1,textAlign:'center',fontSize:28,fontWeight:800,color:'#DA9B2A'}}>
                🪙 {amount}
              </div>
              <button onClick={()=>setAmount(a=>Math.min(coins?.balance??100,a+5))}
                style={{width:40,height:40,borderRadius:10,border:'1.5px solid #E7E5E4',background:'#F5F5F4',cursor:'pointer',fontSize:18,display:'flex',alignItems:'center',justifyContent:'center',fontWeight:700}}>
                +
              </button>
            </div>
            {/* quick amounts */}
            <div style={{display:'flex',gap:8,marginBottom:14}}>
              {[10,25,50,100].map(v=>(
                <button key={v} onClick={()=>setAmount(Math.min(v,coins?.balance??0))}
                  style={{flex:1,padding:'8px 0',borderRadius:8,border:`1.5px solid ${amount===v?'#DA9B2A':'#E7E5E4'}`,background:amount===v?'#FFF8F0':'#fff',color:amount===v?'#DA9B2A':'#78716C',fontWeight:600,cursor:'pointer',fontSize:13}}>
                  {v}
                </button>
              ))}
            </div>

            <label style={{fontSize:13,fontWeight:600,color:'#78716C',display:'block',marginBottom:6}}>Message (optional)</label>
            <input value={message} onChange={e=>setMessage(e.target.value)}
              placeholder="Say something nice ✨"
              style={{width:'100%',padding:'13px 14px',borderRadius:12,border:'1.5px solid #E7E5E4',fontSize:15,marginBottom:16,boxSizing:'border-box',outline:'none'}}
            />

            {error && <div style={{color:'#EF4444',fontSize:13,marginBottom:12,padding:'10px 14px',background:'#FEF2F2',borderRadius:10}}>{error}</div>}

            <button onClick={send} disabled={sending}
              style={{width:'100%',padding:'16px',borderRadius:14,border:'none',
                background: sending ? '#E7E5E4' : 'linear-gradient(135deg,#8B5CF6,#7C3AED)',
                color: sending ? '#78716C':'#fff',fontSize:16,fontWeight:700,cursor:sending?'not-allowed':'pointer',
                boxShadow: sending?'none':'0 4px 20px rgba(139,92,246,.4)'}}>
              {sending ? 'Sending...' : `🎁 Send ${amount} Coins`}
            </button>
          </>
        )}
      </div>
    </Modal>
  );
}

/* ─── ICON CARD ──────────────────────────────── */
function IconCard({ emoji, value, label, color, badge, onClick, disabled }) {
  return (
    <button onClick={onClick} disabled={disabled} style={{
      flex:1,
      display:'flex',flexDirection:'column',alignItems:'center',gap:4,
      padding:'12px 4px',
      background:'transparent',
      border:'none',
      cursor: disabled ? 'default' : 'pointer',
      position:'relative',
      opacity: disabled ? 0.55 : 1,
    }}>
      {/* icon circle */}
      <div style={{
        width:52,height:52,borderRadius:'50%',
        background:`${color}18`,
        border:`2.5px solid ${color}40`,
        display:'flex',alignItems:'center',justifyContent:'center',
        fontSize:24,
        boxShadow:`0 2px 12px ${color}25`,
        transition:'transform .15s',
      }}>
        {emoji}
      </div>
      {/* badge */}
      {badge && (
        <div style={{
          position:'absolute',top:6,right:'18%',
          width:12,height:12,borderRadius:'50%',
          background:'#EF4444',border:'2px solid #fff',
          boxShadow:'0 1px 4px rgba(239,68,68,.5)'
        }}/>
      )}
      <div style={{fontSize:15,fontWeight:800,color:'#1C1917',lineHeight:1}}>{value}</div>
      <div style={{fontSize:10,color:'#78716C',textTransform:'uppercase',letterSpacing:.5,fontWeight:600}}>{label}</div>
    </button>
  );
}

/* ─── MAIN BAR ───────────────────────────────── */
export function GamificationBar({ userId, theme }) {
  const [status, setStatus] = useState(null);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(null); // 'coins' | 'streak' | 'spin' | 'gift'
  const [spinResult, setSpinResult] = useState(null);
  const pri = theme?.pri || '#DA9B2A';

  useEffect(() => { load(); }, []);

  const load = async () => {
    setLoading(true);
    try {
      const res = await api.request('/gamification/status/');
      setStatus(res);
    } catch { /* silently fail */ }
    setLoading(false);
  };

  const handleSpin = async () => {
    const res = await api.request('/gamification/spin/', { method:'POST' });
    setStatus(prev => prev ? {
      ...prev,
      coins:{ ...prev.coins, balance: res.new_balance },
      spin:{ ...prev.spin, can_spin: false, spins_total: res.spins_total }
    } : prev);
    return res;
  };

  const handleLoginBonus = async () => {
    try {
      const res = await api.request('/gamification/login-bonus/', { method:'POST' });
      setStatus(prev => prev ? {
        ...prev,
        coins:{ ...prev.coins, balance: res.new_balance },
        login_streak:{ ...prev.login_streak, bonus_available: false, current: res.login_streak }
      } : prev);
    } catch { /* ignore */ }
  };

  const { coins={}, spin={}, login_streak={}, gifts={} } = status || {};

  if (loading) return (
    <div style={{display:'flex',justifyContent:'space-around',padding:'12px 0',
      background:'linear-gradient(135deg,#FFF8F0 0%,#FFFFFF 100%)',
      borderTop:`1px solid ${pri}20`,borderBottom:`1px solid ${pri}20`}}>
      {['🪙','🔥','🎰','🎁'].map(e=>(
        <div key={e} style={{display:'flex',flexDirection:'column',alignItems:'center',gap:4,padding:'8px 16px'}}>
          <div style={{width:52,height:52,borderRadius:'50%',background:'#F5F5F4',display:'flex',alignItems:'center',justifyContent:'center',fontSize:24}}>{e}</div>
          <div style={{width:24,height:8,background:'#F5F5F4',borderRadius:4,marginTop:2}}/>
          <div style={{width:32,height:6,background:'#F5F5F4',borderRadius:4}}/>
        </div>
      ))}
    </div>
  );
  const hasBonus = login_streak?.bonus_available;
  const canSpin  = spin?.can_spin;

  return (
    <>
      {/* Bar */}
      <div style={{
        display:'flex',
        background:'linear-gradient(135deg,#FFF8F0 0%,#FFFFFF 100%)',
        borderTop:`1px solid ${pri}20`,
        borderBottom:`1px solid ${pri}20`,
        padding:'4px 0',
      }}>
        <IconCard
          emoji="🪙" value={coins?.balance ?? 0} label="Coins" color={pri}
          onClick={()=>setModal('coins')}
        />
        <div style={{width:1,background:'#F0EDEB',alignSelf:'stretch',margin:'8px 0'}}/>
        <IconCard
          emoji="🔥" value={`${login_streak?.current ?? 0}d`} label="Streak" color="#EF4444"
          badge={hasBonus}
          onClick={()=>setModal('streak')}
        />
        <div style={{width:1,background:'#F0EDEB',alignSelf:'stretch',margin:'8px 0'}}/>
        <IconCard
          emoji="🎰" value={canSpin ? 'SPIN' : 'Done'} label="Daily" color={canSpin ? pri : '#A8A29E'}
          badge={canSpin}
          onClick={()=>{ setSpinResult(null); setModal('spin'); }}
        />
        <div style={{width:1,background:'#F0EDEB',alignSelf:'stretch',margin:'8px 0'}}/>
        <IconCard
          emoji="🎁" value={gifts?.received_today ?? 0} label="Gifts" color="#8B5CF6"
          onClick={()=>setModal('gift')}
        />
      </div>

      {/* Modals */}
      {modal === 'coins'  && <CoinsModal  coins={coins}  onClose={()=>setModal(null)}/>}
      {modal === 'streak' && <StreakModal streak={login_streak} onClaim={handleLoginBonus} onClose={()=>setModal(null)}/>}
      {modal === 'spin'   && <SpinModal  spin={spin} onSpin={handleSpin} onClose={()=>setModal(null)}/>}
      {modal === 'gift'   && <GiftModal  coins={coins} onClose={()=>setModal(null)} onRefresh={load}/>}
    </>
  );
}
