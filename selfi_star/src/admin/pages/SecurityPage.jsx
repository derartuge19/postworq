import { useState, useEffect, useCallback } from 'react';
import {
  Shield, AlertCircle, AlertTriangle, Info, Lock,
  Users, TrendingUp, RefreshCw, Eye, LogIn, LogOut,
  UserX, Key, Activity, ChevronRight, Search, X,
} from 'lucide-react';
import api from '../../api';

function StatCard({ icon: Icon, label, value, sub, color, theme }) {
  return (
    <div style={{
      background: theme.card, borderRadius: 12,
      padding: '18px 20px', border: `1px solid ${theme.border}`,
      display: 'flex', alignItems: 'center', gap: 14,
    }}>
      <div style={{
        width: 44, height: 44, borderRadius: 10,
        background: color + '18', display: 'flex',
        alignItems: 'center', justifyContent: 'center', flexShrink: 0,
      }}>
        <Icon size={22} color={color} />
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 22, fontWeight: 800, color: theme.txt }}>{value}</div>
        <div style={{ fontSize: 12, fontWeight: 600, color: theme.sub }}>{label}</div>
        {sub && <div style={{ fontSize: 11, color, marginTop: 1 }}>{sub}</div>}
      </div>
    </div>
  );
}

function DistributionBar({ label, count, total, color, theme }) {
  const pct = total > 0 ? Math.round((count / total) * 100) : 0;
  return (
    <div style={{ marginBottom: 14 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 5 }}>
        <span style={{ fontSize: 13, fontWeight: 600, color: theme.txt }}>{label}</span>
        <span style={{ fontSize: 13, fontWeight: 700, color }}>{count.toLocaleString()} ({pct}%)</span>
      </div>
      <div style={{ height: 8, background: theme.border, borderRadius: 4, overflow: 'hidden' }}>
        <div style={{ height: '100%', width: `${pct}%`, background: color, borderRadius: 4, transition: 'width .6s' }} />
      </div>
    </div>
  );
}

const EVENT_ICON = {
  security: { icon: Shield,        color: '#8B5CF6' },
  error:    { icon: AlertCircle,   color: '#EF4444' },
  warning:  { icon: AlertTriangle, color: '#F59E0B' },
  info:     { icon: Info,          color: '#3B82F6' },
  critical: { icon: AlertCircle,   color: '#DC2626' },
};

export function SecurityPage({ theme }) {
  const [overview, setOverview]       = useState(null);
  const [loading, setLoading]         = useState(true);
  const [search, setSearch]           = useState('');
  const [eventFilter, setEventFilter] = useState('all');

  const load = useCallback(async () => {
    try {
      setLoading(true);
      const data = await api.request('/admin/security/');
      setOverview(data);
    } catch (err) {
      console.error('Security load error:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const T = theme;

  if (loading) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        <div style={{ height: 36, width: 240, background: T.border, borderRadius: 8, opacity: 0.6 }} />
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 14 }}>
          {[0,1,2,3].map(i => <div key={i} style={{ height: 90, background: T.border, borderRadius: 12, opacity: 0.5 }} />)}
        </div>
        {[0,1,2,3,4,5].map(i => <div key={i} style={{ height: 62, background: T.border, borderRadius: 8, opacity: 0.4 }} />)}
        <style>{`@keyframes pulse{0%,100%{opacity:.5}50%{opacity:.25}}`}</style>
      </div>
    );
  }

  const stats        = overview?.stats         || {};
  const distribution = overview?.log_distribution || {};
  const events       = overview?.recent_events  || [];
  const totalLogs    = stats.total_logs || 0;

  const filtered = events.filter(e => {
    const matchFilter = eventFilter === 'all' ? true : e.message?.toLowerCase().includes(eventFilter);
    const matchSearch = !search || e.message?.toLowerCase().includes(search.toLowerCase())
                     || e.user?.toLowerCase().includes(search.toLowerCase())
                     || e.ip_address?.includes(search);
    return matchFilter && matchSearch;
  });

  return (
    <div>
      {/* ── Header ── */}
      <div style={{ marginBottom: 24, display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between' }}>
        <div>
          <h1 style={{ margin: 0, fontSize: 28, fontWeight: 700, color: T.txt, marginBottom: 4, display: 'flex', alignItems: 'center', gap: 10 }}>
            <Shield size={26} color={T.purple} /> Security
          </h1>
          <p style={{ margin: 0, fontSize: 14, color: T.sub }}>
            Monitor authentication, access control, and security events
          </p>
        </div>
        <button onClick={load} style={{
          display: 'flex', alignItems: 'center', gap: 6, padding: '8px 14px',
          borderRadius: 8, border: `1px solid ${T.border}`, background: T.card,
          fontSize: 13, fontWeight: 600, cursor: 'pointer', color: T.txt,
        }}>
          <RefreshCw size={14} /> Refresh
        </button>
      </div>

      {/* ── Stat cards ── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 14, marginBottom: 28 }}>
        <StatCard icon={Shield}        label="Security Events (24h)" value={stats.security_24h || 0}  sub={`${stats.security_total || 0} total`}       color={T.purple} theme={T} />
        <StatCard icon={AlertCircle}   label="Errors (24h)"          value={stats.error_24h    || 0}  sub={`${stats.error_total || 0} total`}           color={T.red}    theme={T} />
        <StatCard icon={AlertTriangle} label="Warnings (24h)"        value={stats.warning_24h  || 0}  sub={`${stats.warning_total || 0} total`}         color={T.orange} theme={T} />
        <StatCard icon={Users}         label="Active Users (7d)"     value={stats.active_users_7d || 0} sub={`+${stats.new_users_24h || 0} joined today`} color={T.green}  theme={T} />
        <StatCard icon={Activity}      label="Total Logs"            value={(totalLogs).toLocaleString()} sub="all time"                                color={T.blue}   theme={T} />
        <StatCard icon={AlertCircle}   label="Critical Events (24h)" value={stats.critical_24h || 0}  sub={`${stats.critical_total || 0} total`}        color="#DC2626"  theme={T} />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 300px', gap: 20 }}>
        {/* ── Recent security events ── */}
        <div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
            <h2 style={{ margin: 0, fontSize: 17, fontWeight: 700, color: T.txt }}>Recent Security Events</h2>
            <div style={{ display: 'flex', gap: 8 }}>
              {['all','login','failed','cleared','created','deleted'].map(f => (
                <button key={f} onClick={() => setEventFilter(f)} style={{
                  padding: '5px 10px', borderRadius: 6, fontSize: 11, fontWeight: 700, cursor: 'pointer',
                  border: `1.5px solid ${eventFilter === f ? T.purple : T.border}`,
                  background: eventFilter === f ? T.purple + '18' : T.card,
                  color: eventFilter === f ? T.purple : T.sub,
                }}>
                  {f === 'all' ? 'All' : f.charAt(0).toUpperCase() + f.slice(1)}
                </button>
              ))}
            </div>
          </div>

          {/* Search */}
          <div style={{ position: 'relative', marginBottom: 14 }}>
            <Search size={13} color={T.sub} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }} />
            <input value={search} onChange={e => setSearch(e.target.value)}
              placeholder="Search events, users, IP addresses…"
              style={{ width: '100%', boxSizing: 'border-box', padding: '9px 32px 9px 30px',
                border: `1.5px solid ${T.border}`, borderRadius: 8, fontSize: 13,
                background: T.card, color: T.txt, outline: 'none' }} />
            {search && (
              <button onClick={() => setSearch('')} style={{ position: 'absolute', right: 8, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: T.sub, display: 'flex' }}>
                <X size={13} />
              </button>
            )}
          </div>

          {filtered.length === 0 ? (
            <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 12, padding: 40, textAlign: 'center' }}>
              <Shield size={36} color={T.sub} style={{ opacity: 0.3, marginBottom: 10 }} />
              <div style={{ fontSize: 15, fontWeight: 600, color: T.txt, marginBottom: 6 }}>No security events yet</div>
              <div style={{ fontSize: 13, color: T.sub }}>Events are recorded when users log in, fail authentication, or perform admin actions.</div>
            </div>
          ) : (
            <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 12, overflow: 'hidden' }}>
              {filtered.map((ev, i) => {
                const meta  = EVENT_ICON[ev.log_type] || EVENT_ICON.info;
                const Icon  = meta.icon;
                const color = meta.color;
                const isLogin   = ev.message?.toLowerCase().includes('successful login');
                const isFailed  = ev.message?.toLowerCase().includes('failed');
                return (
                  <div key={ev.id} style={{
                    padding: '13px 16px',
                    borderBottom: i < filtered.length - 1 ? `1px solid ${T.border}` : 'none',
                    display: 'flex', gap: 12, alignItems: 'flex-start',
                    background: isFailed ? T.red + '06' : isLogin ? T.green + '06' : 'transparent',
                  }}>
                    <div style={{ width: 34, height: 34, borderRadius: 8, background: color + '18',
                      display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      {isLogin ? <LogIn size={16} color={T.green} />
                       : isFailed ? <UserX size={16} color={T.red} />
                       : <Icon size={16} color={color} />}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 13, fontWeight: 600, color: T.txt, marginBottom: 3 }}>{ev.message}</div>
                      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                        {ev.user && <span style={{ fontSize: 11, color: T.sub }}>👤 {ev.user}</span>}
                        {ev.ip_address && <span style={{ fontSize: 11, color: T.sub, fontFamily: 'monospace' }}>🌐 {ev.ip_address}</span>}
                        <span style={{ fontSize: 11, color: T.sub }}>{new Date(ev.created_at).toLocaleString()}</span>
                      </div>
                      {ev.details && (
                        <details style={{ marginTop: 5 }}>
                          <summary style={{ fontSize: 11, color: T.pri, cursor: 'pointer', fontWeight: 600 }}>Details</summary>
                          <pre style={{ marginTop: 4, padding: 8, background: T.bg, borderRadius: 6, fontSize: 10,
                            fontFamily: 'monospace', maxHeight: 120, overflow: 'auto', color: T.txt }}>
                            {JSON.stringify(ev.details, null, 2)}
                          </pre>
                        </details>
                      )}
                    </div>
                    <span style={{
                      padding: '2px 6px', borderRadius: 4, fontSize: 9, fontWeight: 800,
                      textTransform: 'uppercase', background: color + '20', color, flexShrink: 0,
                    }}>
                      {ev.log_type}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* ── Right column: distribution ── */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 12, padding: 18 }}>
            <h3 style={{ margin: '0 0 16px', fontSize: 15, fontWeight: 700, color: T.txt }}>Log Distribution</h3>
            {totalLogs === 0 ? (
              <div style={{ fontSize: 13, color: T.sub, textAlign: 'center', padding: '20px 0' }}>No logs yet</div>
            ) : (
              <>
                <DistributionBar label="Security" count={distribution.security || 0} total={totalLogs} color={T.purple} theme={T} />
                <DistributionBar label="Info"     count={distribution.info     || 0} total={totalLogs} color={T.blue}   theme={T} />
                <DistributionBar label="Warning"  count={distribution.warning  || 0} total={totalLogs} color={T.orange} theme={T} />
                <DistributionBar label="Error"    count={distribution.error    || 0} total={totalLogs} color={T.red}    theme={T} />
                <DistributionBar label="Critical" count={distribution.critical || 0} total={totalLogs} color="#DC2626"  theme={T} />
              </>
            )}
          </div>

          {/* Quick actions */}
          <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 12, padding: 18 }}>
            <h3 style={{ margin: '0 0 14px', fontSize: 15, fontWeight: 700, color: T.txt }}>Security Checklist</h3>
            {[
              { icon: Key,      label: 'API Keys', detail: 'Review & rotate keys', color: T.orange },
              { icon: Users,    label: 'Admin Accounts', detail: 'Check who has staff access', color: T.blue },
              { icon: Lock,     label: 'Failed Logins', detail: `${stats.security_total || 0} security events total`, color: T.red },
              { icon: Activity, label: 'System Logs', detail: `${totalLogs.toLocaleString()} entries`, color: T.purple },
            ].map(({ icon: Icon, label, detail, color }) => (
              <div key={label} style={{
                display: 'flex', alignItems: 'center', gap: 10, padding: '10px 0',
                borderBottom: `1px solid ${T.border}`,
              }}>
                <div style={{ width: 30, height: 30, borderRadius: 8, background: color + '18', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Icon size={15} color={color} />
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 13, fontWeight: 700, color: T.txt }}>{label}</div>
                  <div style={{ fontSize: 11, color: T.sub }}>{detail}</div>
                </div>
                <ChevronRight size={14} color={T.sub} />
              </div>
            ))}
          </div>

          {/* System health */}
          <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 12, padding: 18 }}>
            <h3 style={{ margin: '0 0 14px', fontSize: 15, fontWeight: 700, color: T.txt }}>System Health</h3>
            {[
              { label: 'Authentication', status: 'healthy', color: T.green },
              { label: 'API Gateway',    status: 'healthy', color: T.green },
              { label: 'Database',       status: 'healthy', color: T.green },
              { label: 'Storage',        status: 'healthy', color: T.green },
            ].map(({ label, status, color }) => (
              <div key={label} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
                <span style={{ fontSize: 13, color: T.txt }}>{label}</span>
                <span style={{ fontSize: 11, fontWeight: 700, color, background: color + '18', padding: '2px 8px', borderRadius: 20, textTransform: 'uppercase' }}>
                  {status}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
