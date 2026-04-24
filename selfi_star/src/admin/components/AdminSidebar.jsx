import { BarChart3, Users, FileVideo, CreditCard, LogOut, LayoutDashboard, Settings, Key, FileText, Activity, Bell, Shield, Lock, Trophy, Target, Zap, Award, Flag, Scale, Smartphone, Gift as GiftIcon } from 'lucide-react';

export function AdminSidebar({ theme, currentPage, onPageChange, adminUser, onLogout }) {
  const menuItems = [
    { id: 'dashboard',   icon: LayoutDashboard, label: 'Dashboard' },
    { id: 'mobile-app',  icon: Smartphone,      label: '📱 Mobile App' },
    { id: 'contest', icon: Award, label: '90-Day Contest' },
    { id: 'judging', icon: Target, label: 'Judging Portal' },
    { id: 'anti-cheat', icon: Zap, label: 'Anti-Cheat' },
    { id: 'gifts', icon: GiftIcon, label: 'Gifts' },
    { id: 'users', icon: Users, label: 'Users' },
    { id: 'content', icon: FileVideo, label: 'Content' },
    { id: 'master-campaigns', icon: Trophy, label: 'Master Campaigns' },
    { id: 'campaigns', icon: Award, label: 'Sub-Campaigns' },
    { id: 'reports', icon: Flag, label: 'Reports' },
    { id: 'analytics', icon: BarChart3, label: 'Analytics' },
    { id: 'subscriptions', icon: CreditCard, label: 'Subscriptions' },
    { id: 'performance', icon: Activity, label: 'Performance' },
    { id: 'notifications', icon: Bell, label: 'Notifications' },
    { id: 'admins', icon: Shield, label: 'Admins' },
    { id: 'api-keys',  icon: Key,      label: 'API Keys'  },
    { id: 'security',  icon: Lock,     label: 'Security'  },
    { id: 'legal',     icon: Scale,    label: 'Legal Docs' },
    { id: 'logs',      icon: FileText, label: 'Logs'      },
    { id: 'settings', icon: Settings, label: 'Settings' },
  ];

  return (
    <div className="glass-sidebar" style={{
      width: 240,
      background: 'var(--glass-bg)',
      display: 'flex',
      flexDirection: 'column',
      borderRight: '1px solid var(--glass-border)',
      height: '100vh',
      position: 'fixed',
      left: 0,
      top: 0,
      zIndex: 1000,
    }}>
      {/* Logo */}
      <div style={{
        padding: '16px 12px',
        borderBottom: `1px solid #E7E5E4`,
      }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: 12,
        }}>
          <div>
            <div style={{
              fontSize: 22,
              fontWeight: 900,
              background: `linear-gradient(135deg, ${theme.pri}, ${theme.dark})`,
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
            }}>
              FlipStar
            </div>
            <div style={{
              fontSize: 10,
              color: '#78716C',
              fontWeight: 600,
              textTransform: 'uppercase',
              letterSpacing: '0.5px',
            }}>
              Admin Panel
            </div>
          </div>
        </div>
      </div>

      {/* Menu Items */}
      <div style={{
        flex: 1,
        padding: '8px 0',
        overflowY: 'auto',
      }}>
        {menuItems.map(item => {
          const Icon = item.icon;
          const isActive = currentPage === item.id;
          
          return (
            <button
              key={item.id}
              className={`glass-hover ${isActive ? 'glass-primary' : ''}`}
              onClick={() => onPageChange(item.id)}
              onMouseEnter={(e) => {
                if (!isActive) e.currentTarget.style.background = 'var(--glass-bg)';
              }}
              onMouseLeave={(e) => {
                if (!isActive) e.currentTarget.style.background = 'transparent';
              }}
              style={{
                width: '100%',
                padding: '8px 12px',
                background: isActive ? 'var(--glass-primary)' : 'transparent',
                border: 'none',
                borderRadius: '10px',
                margin: '0 8px',
                color: isActive ? 'var(--color-primary)' : 'var(--color-txt)',
                fontSize: 12,
                fontWeight: isActive ? 700 : 500,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: 12,
                transition: 'all 0.2s',
                textAlign: 'left',
              }}
            >
              <Icon size={20} />
              {item.label}
            </button>
          );
        })}
      </div>

      {/* Admin User Info */}
      <div style={{
        padding: '12px 14px',
        borderTop: `1px solid #E7E5E4`,
        marginTop: 'auto',
      }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: 10,
          marginBottom: 12,
        }}>
          <div style={{
            width: 36,
            height: 36,
            borderRadius: '50%',
            background: `linear-gradient(135deg, ${theme.pri}, ${theme.dark})`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 16,
            fontWeight: 700,
            color: '#fff',
          }}>
            {adminUser?.username?.[0]?.toUpperCase() || 'A'}
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{
              fontSize: 13,
              fontWeight: 700,
              color: '#1C1917',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            }}>
              {adminUser?.username || 'Admin'}
            </div>
            <div style={{
              fontSize: 11,
              color: '#78716C',
            }}>
              Administrator
            </div>
          </div>
        </div>
        
        <button
          onClick={onLogout}
          className="glass-button glass-hover"
          style={{
            width: '100%',
            padding: '8px 12px',
            background: 'var(--glass-bg)',
            border: '1px solid var(--glass-border)',
            borderRadius: 8,
            color: 'var(--color-txt)',
            fontSize: 13,
            fontWeight: 600,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 8,
            transition: 'all 0.2s',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = 'var(--glass-primary)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = 'var(--glass-bg)';
          }}
        >
          <LogOut size={16} />
          Logout
        </button>
      </div>
    </div>
  );
}
