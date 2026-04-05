import React, { useState, useEffect } from 'react';
import api from '../api';
import { ArrowLeft, Trophy, Medal, Award, TrendingUp } from 'lucide-react';

const CampaignLeaderboard = ({ campaignId, onBack }) => {
  const [loading, setLoading] = useState(true);
  const [campaign, setCampaign] = useState(null);
  const [period, setPeriod] = useState('daily');
  const [leaderboard, setLeaderboard] = useState([]);

  useEffect(() => {
    loadData();
  }, [campaignId, period]);

  const loadData = async () => {
    try {
      setLoading(true);
      const [campaignRes, leaderboardRes] = await Promise.all([
        api.request(`/campaigns/${campaignId}/`),
        api.request(`/campaigns/${campaignId}/leaderboard/?period=${period}`)
      ]);
      setCampaign(campaignRes);
      setLeaderboard(leaderboardRes.entries || []);
    } catch (error) {
      console.error('Error loading leaderboard:', error);
    } finally {
      setLoading(false);
    }
  };

  const getRankIcon = (rank) => {
    if (rank === 1) return <Trophy size={24} color="#FFD700" />;
    if (rank === 2) return <Medal size={24} color="#C0C0C0" />;
    if (rank === 3) return <Medal size={24} color="#CD7F32" />;
    return <Award size={20} color="#999" />;
  };

  const getRankColor = (rank) => {
    if (rank === 1) return '#FFD700';
    if (rank === 2) return '#C0C0C0';
    if (rank === 3) return '#CD7F32';
    return '#666';
  };

  if (loading) {
    return (
      <div style={{ padding: '40px', textAlign: 'center' }}>
        <div style={{ fontSize: '18px', color: '#666' }}>Loading...</div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', background: '#f5f5f5', paddingBottom: '80px' }}>
      {/* Header */}
      <div style={{
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        color: 'white',
        padding: '20px',
        position: 'sticky',
        top: 0,
        zIndex: 100
      }}>
        <button
          onClick={() => onBack?.()}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '8px 16px',
            background: 'rgba(255,255,255,0.2)',
            border: 'none',
            borderRadius: '8px',
            color: 'white',
            cursor: 'pointer',
            marginBottom: '16px'
          }}
        >
          <ArrowLeft size={20} />
          Back to Campaign
        </button>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
          <TrendingUp size={32} />
          <div>
            <h1 style={{ fontSize: '24px', fontWeight: 'bold', margin: 0 }}>
              Leaderboard
            </h1>
            <p style={{ margin: 0, opacity: 0.9, fontSize: '14px' }}>
              {campaign?.title}
            </p>
          </div>
        </div>

        {/* Period Selector */}
        <div style={{ display: 'flex', gap: '8px', overflowX: 'auto' }}>
          {['daily', 'weekly', 'monthly', 'overall'].map((p) => (
            <button
              key={p}
              onClick={() => setPeriod(p)}
              style={{
                padding: '8px 16px',
                background: period === p ? 'white' : 'rgba(255,255,255,0.2)',
                color: period === p ? '#667eea' : 'white',
                border: 'none',
                borderRadius: '20px',
                cursor: 'pointer',
                fontSize: '14px',
                fontWeight: '500',
                textTransform: 'capitalize',
                whiteSpace: 'nowrap'
              }}
            >
              {p}
            </button>
          ))}
        </div>
      </div>

      {/* Top 3 Podium */}
      {leaderboard.length >= 3 && (
        <div style={{
          padding: '30px 20px',
          background: 'white',
          marginBottom: '20px'
        }}>
          <div style={{
            display: 'flex',
            alignItems: 'flex-end',
            justifyContent: 'center',
            gap: '16px',
            maxWidth: '600px',
            margin: '0 auto'
          }}>
            {/* 2nd Place */}
            <div style={{ flex: 1, textAlign: 'center' }}>
              <div style={{
                width: '80px',
                height: '80px',
                borderRadius: '50%',
                background: 'linear-gradient(135deg, #C0C0C0, #E8E8E8)',
                margin: '0 auto 12px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '32px',
                fontWeight: 'bold',
                color: 'white',
                border: '4px solid #C0C0C0'
              }}>
                {leaderboard[1]?.username?.[0]?.toUpperCase()}
              </div>
              <div style={{ fontSize: '16px', fontWeight: '600', marginBottom: '4px' }}>
                {leaderboard[1]?.username}
              </div>
              <div style={{ fontSize: '20px', fontWeight: 'bold', color: '#C0C0C0' }}>
                {leaderboard[1]?.total_score}
              </div>
              <div style={{ fontSize: '12px', color: '#999', marginTop: '4px' }}>
                2nd Place
              </div>
            </div>

            {/* 1st Place */}
            <div style={{ flex: 1, textAlign: 'center', marginBottom: '20px' }}>
              <Trophy size={32} color="#FFD700" style={{ marginBottom: '8px' }} />
              <div style={{
                width: '100px',
                height: '100px',
                borderRadius: '50%',
                background: 'linear-gradient(135deg, #FFD700, #FFA500)',
                margin: '0 auto 12px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '40px',
                fontWeight: 'bold',
                color: 'white',
                border: '4px solid #FFD700',
                boxShadow: '0 4px 12px rgba(255,215,0,0.3)'
              }}>
                {leaderboard[0]?.username?.[0]?.toUpperCase()}
              </div>
              <div style={{ fontSize: '18px', fontWeight: '700', marginBottom: '4px' }}>
                {leaderboard[0]?.username}
              </div>
              <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#FFD700' }}>
                {leaderboard[0]?.total_score}
              </div>
              <div style={{ fontSize: '12px', color: '#999', marginTop: '4px' }}>
                Champion
              </div>
            </div>

            {/* 3rd Place */}
            <div style={{ flex: 1, textAlign: 'center' }}>
              <div style={{
                width: '80px',
                height: '80px',
                borderRadius: '50%',
                background: 'linear-gradient(135deg, #CD7F32, #E5A572)',
                margin: '0 auto 12px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '32px',
                fontWeight: 'bold',
                color: 'white',
                border: '4px solid #CD7F32'
              }}>
                {leaderboard[2]?.username?.[0]?.toUpperCase()}
              </div>
              <div style={{ fontSize: '16px', fontWeight: '600', marginBottom: '4px' }}>
                {leaderboard[2]?.username}
              </div>
              <div style={{ fontSize: '20px', fontWeight: 'bold', color: '#CD7F32' }}>
                {leaderboard[2]?.total_score}
              </div>
              <div style={{ fontSize: '12px', color: '#999', marginTop: '4px' }}>
                3rd Place
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Full Leaderboard */}
      <div style={{ padding: '0 20px' }}>
        {leaderboard.length === 0 ? (
          <div style={{
            background: 'white',
            borderRadius: '12px',
            padding: '40px',
            textAlign: 'center'
          }}>
            <TrendingUp size={48} color="#ccc" style={{ marginBottom: '16px' }} />
            <h3 style={{ fontSize: '18px', color: '#666', marginBottom: '8px' }}>
              No Rankings Yet
            </h3>
            <p style={{ color: '#999', fontSize: '14px' }}>
              Be the first to participate and climb the leaderboard!
            </p>
          </div>
        ) : (
          <div style={{ background: 'white', borderRadius: '12px', overflow: 'hidden' }}>
            {leaderboard.map((entry, index) => (
              <div
                key={entry.user_id || index}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  padding: '16px',
                  borderBottom: index < leaderboard.length - 1 ? '1px solid #f0f0f0' : 'none',
                  background: entry.rank <= 3 ? 'rgba(255,215,0,0.05)' : 'white'
                }}
              >
                {/* Rank */}
                <div style={{
                  width: '50px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  {entry.rank <= 3 ? (
                    getRankIcon(entry.rank)
                  ) : (
                    <span style={{ fontSize: '18px', fontWeight: '600', color: '#999' }}>
                      {entry.rank}
                    </span>
                  )}
                </div>

                {/* User */}
                <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div style={{
                    width: '40px',
                    height: '40px',
                    borderRadius: '50%',
                    background: getRankColor(entry.rank),
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: 'white',
                    fontSize: '16px',
                    fontWeight: 'bold'
                  }}>
                    {entry.username?.[0]?.toUpperCase()}
                  </div>
                  <div>
                    <div style={{ fontWeight: '600', fontSize: '16px' }}>
                      {entry.username}
                    </div>
                    {entry.post_count && (
                      <div style={{ fontSize: '12px', color: '#999' }}>
                        {entry.post_count} posts
                      </div>
                    )}
                  </div>
                </div>

                {/* Score */}
                <div style={{ textAlign: 'right' }}>
                  <div style={{
                    fontSize: '20px',
                    fontWeight: 'bold',
                    color: getRankColor(entry.rank)
                  }}>
                    {entry.total_score || entry.score}
                  </div>
                  <div style={{ fontSize: '12px', color: '#999' }}>
                    points
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default CampaignLeaderboard;
