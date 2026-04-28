import { useState, useEffect } from 'react';
import { Crown, Zap, Star } from 'lucide-react';
import api from '../../api';

export function SubscriptionManagement({ theme }) {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    try {
      const response = await api.request('/admin/dashboard/');
      setStats(response);
    } catch (error) {
      console.error('Failed to load stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const plans = [
    {
      name: 'Free',
      icon: Star,
      color: theme.sub,
      features: [
        'Basic posting',
        'Standard engagement',
        'Community access',
        'Limited analytics'
      ],
      count: stats?.subscriptions?.find(s => s.plan === 'free')?.count || 0
    },
    {
      name: 'Pro',
      icon: Zap,
      color: theme.blue,
      features: [
        'Unlimited posting',
        'Priority support',
        'Advanced analytics',
        'Custom profile badge',
        'No ads'
      ],
      count: stats?.subscriptions?.find(s => s.plan === 'pro')?.count || 0
    },
    {
      name: 'Premium',
      icon: Crown,
      color: theme.pri,
      features: [
        'Everything in Pro',
        'Verified badge',
        'Early feature access',
        'Dedicated support',
        'Custom themes',
        'API access'
      ],
      count: stats?.subscriptions?.find(s => s.plan === 'premium')?.count || 0
    },
  ];

  if (loading) {
    return (
      <div style={{ padding: 40, textAlign: 'center', color: theme.sub }}>
        Loading subscription data...
      </div>
    );
  }

  const totalSubscribers = plans.reduce((sum, plan) => sum + plan.count, 0);
  const paidSubscribers = plans.slice(1).reduce((sum, plan) => sum + plan.count, 0);
  const revenue = paidSubscribers * 999; // Assuming 999 ETB average

  return (
    <div>
      {/* Header */}
      <div style={{ marginBottom: 32 }}>
        <h1 style={{
          margin: 0,
          fontSize: 32,
          fontWeight: 700,
          color: theme.txt,
          marginBottom: 8,
        }}>
          Subscription Management
        </h1>
        <p style={{
          margin: 0,
          fontSize: 16,
          color: theme.sub,
        }}>
          Monitor subscription plans and revenue
        </p>
      </div>

      {/* Revenue Stats */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
        gap: 24,
        marginBottom: 32,
      }}>
        <div style={{
          background: theme.card,
          borderRadius: 12,
          padding: 24,
          border: `1px solid ${theme.border}`,
        }}>
          <div style={{
            fontSize: 14,
            fontWeight: 600,
            color: theme.sub,
            marginBottom: 8,
          }}>
            Total Subscribers
          </div>
          <div style={{
            fontSize: 32,
            fontWeight: 700,
            color: theme.txt,
          }}>
            {totalSubscribers}
          </div>
        </div>

        <div style={{
          background: theme.card,
          borderRadius: 12,
          padding: 24,
          border: `1px solid ${theme.border}`,
        }}>
          <div style={{
            fontSize: 14,
            fontWeight: 600,
            color: theme.sub,
            marginBottom: 8,
          }}>
            Paid Subscribers
          </div>
          <div style={{
            fontSize: 32,
            fontWeight: 700,
            color: theme.green,
          }}>
            {paidSubscribers}
          </div>
        </div>

        <div style={{
          background: theme.card,
          borderRadius: 12,
          padding: 24,
          border: `1px solid ${theme.border}`,
        }}>
          <div style={{
            fontSize: 14,
            fontWeight: 600,
            color: theme.sub,
            marginBottom: 8,
          }}>
            Est. Monthly Revenue
          </div>
          <div style={{
            fontSize: 32,
            fontWeight: 700,
            color: theme.pri,
          }}>
            ${revenue.toFixed(2)}
          </div>
        </div>
      </div>

      {/* Subscription Plans */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
        gap: 24,
      }}>
        {plans.map((plan) => {
          const Icon = plan.icon;
          const percentage = totalSubscribers > 0 ? ((plan.count / totalSubscribers) * 100).toFixed(1) : 0;
          
          return (
            <div
              key={plan.name}
              style={{
                background: theme.card,
                borderRadius: 12,
                padding: 24,
                border: `2px solid ${plan.color}`,
                position: 'relative',
                overflow: 'hidden',
              }}
            >
              {/* Background decoration */}
              <div style={{
                position: 'absolute',
                top: -20,
                right: -20,
                width: 100,
                height: 100,
                borderRadius: '50%',
                background: plan.color + '10',
              }} />

              <div style={{
                position: 'relative',
                zIndex: 1,
              }}>
                <div style={{
                  width: 56,
                  height: 56,
                  borderRadius: 12,
                  background: plan.color + '15',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginBottom: 16,
                }}>
                  <Icon size={28} color={plan.color} />
                </div>

                <h3 style={{
                  margin: 0,
                  fontSize: 24,
                  fontWeight: 700,
                  color: theme.txt,
                  marginBottom: 8,
                }}>
                  {plan.name}
                </h3>

                <div style={{
                  fontSize: 14,
                  color: theme.sub,
                  marginBottom: 20,
                }}>
                  {plan.count} subscribers ({percentage}%)
                </div>

                {/* Progress Bar */}
                <div style={{
                  width: '100%',
                  height: 8,
                  background: theme.bg,
                  borderRadius: 4,
                  overflow: 'hidden',
                  marginBottom: 20,
                }}>
                  <div style={{
                    width: `${percentage}%`,
                    height: '100%',
                    background: plan.color,
                    transition: 'width 0.3s ease',
                  }} />
                </div>

                {/* Features */}
                <div style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 8,
                }}>
                  {plan.features.map((feature, index) => (
                    <div
                      key={index}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 8,
                        fontSize: 13,
                        color: theme.sub,
                      }}
                    >
                      <div style={{
                        width: 16,
                        height: 16,
                        borderRadius: '50%',
                        background: plan.color + '20',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: 10,
                      }}>
                        ✓
                      </div>
                      {feature}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

