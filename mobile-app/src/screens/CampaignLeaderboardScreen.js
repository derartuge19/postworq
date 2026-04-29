import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import api from '../api';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';

const BRAND_GOLD = '#C8B56A';

const PERIODS = [
  { id: 'overall', label: 'All Time' },
  { id: 'daily', label: 'Today' },
  { id: 'weekly', label: 'This Week' },
  { id: 'monthly', label: 'This Month' },
];

const MEDAL = { 1: '#FFD700', 2: '#A8A8A8', 3: '#CD7F32' };

export default function CampaignLeaderboardScreen({ route, navigation }) {
  const { campaignId } = route.params;
  const [campaign, setCampaign] = useState(null);
  const [leaderboard, setLeaderboard] = useState([]);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState('overall');
  const insets = useSafeAreaInsets();

  useFocusEffect(
    React.useCallback(() => {
      loadData();
    }, [campaignId, period])
  );

  const loadData = async () => {
    try {
      setLoading(true);
      const [campaignRes, lbRes] = await Promise.all([
        api.getCampaignDetail(campaignId),
        api.getCampaignLeaderboard(campaignId, period)
      ]);
      setCampaign(campaignRes);
      setLeaderboard(lbRes.entries || []);
    } catch (error) {
      console.error('Error loading leaderboard:', error);
    } finally {
      setLoading(false);
    }
  };

  const top3 = leaderboard.slice(0, 3);
  const rest = leaderboard.slice(3);

  const renderPodium = () => {
    if (top3.length === 0) return null;

    const getPodiumStyle = (rank) => {
      if (rank === 1) return { height: 140, bg: '#FFD700', border: '#FFD700' };
      if (rank === 2) return { height: 100, bg: '#A8A8A8', border: '#A8A8A8' };
      if (rank === 3) return { height: 80, bg: '#CD7F32', border: '#CD7F32' };
      return { height: 60, bg: '#0B0B0C', border: '#e5e5e5' };
    };

    return (
      <View style={styles.podiumContainer}>
        <Text style={styles.podiumTitle}>Top Performers</Text>
        <View style={styles.podium}>
          {/* 2nd Place */}
          {top3[1] && (
            <View style={styles.podiumItem}>
              <View style={[
                styles.podiumBar,
                { height: 100, backgroundColor: 'rgba(168, 168, 168, 0.2)', borderColor: '#A8A8A8' }
              ]}>
                <View style={styles.podiumAvatar}>
                  <Text style={styles.podiumAvatarText}>
                    {top3[1].username?.[0]?.toUpperCase() || '?'}
                  </Text>
                </View>
              </View>
              <View style={styles.podiumMedal}>
                <Text style={styles.podiumMedalText}>🥈</Text>
              </View>
              <Text style={styles.podiumName}>{top3[1].username || 'User'}</Text>
              <Text style={styles.podiumScore}>{top3[1].total_score || 0} pts</Text>
            </View>
          )}

          {/* 1st Place */}
          {top3[0] && (
            <View style={[styles.podiumItem, styles.podiumItemFirst]}>
              <View style={[
                styles.podiumBar,
                { height: 140, backgroundColor: 'rgba(255, 215, 0, 0.2)', borderColor: '#FFD700' }
              ]}>
                <View style={[styles.podiumAvatar, styles.podiumAvatarFirst]}>
                  <Text style={[styles.podiumAvatarText, styles.podiumAvatarTextFirst]}>
                    {top3[0].username?.[0]?.toUpperCase() || '?'}
                  </Text>
                </View>
              </View>
              <View style={[styles.podiumMedal, styles.podiumMedalFirst]}>
                <Text style={styles.podiumMedalText}>🥇</Text>
              </View>
              <Text style={[styles.podiumName, styles.podiumNameFirst]}>{top3[0].username || 'User'}</Text>
              <Text style={[styles.podiumScore, styles.podiumScoreFirst]}>{top3[0].total_score || 0} pts</Text>
            </View>
          )}

          {/* 3rd Place */}
          {top3[2] && (
            <View style={styles.podiumItem}>
              <View style={[
                styles.podiumBar,
                { height: 80, backgroundColor: 'rgba(205, 127, 50, 0.2)', borderColor: '#CD7F32' }
              ]}>
                <View style={styles.podiumAvatar}>
                  <Text style={styles.podiumAvatarText}>
                    {top3[2].username?.[0]?.toUpperCase() || '?'}
                  </Text>
                </View>
              </View>
              <View style={styles.podiumMedal}>
                <Text style={styles.podiumMedalText}>🥉</Text>
              </View>
              <Text style={styles.podiumName}>{top3[2].username || 'User'}</Text>
              <Text style={styles.podiumScore}>{top3[2].total_score || 0} pts</Text>
            </View>
          )}
        </View>
      </View>
    );
  };

  const renderLeaderboardItem = ({ item, index }) => {
    const rank = index + 4; // Since top3 are shown in podium
    const medalColor = MEDAL[rank];

    return (
      <View style={styles.leaderboardItem}>
        <View style={[styles.rank, { backgroundColor: medalColor ? `${medalColor}20` : '#f5f5f5' }]}>
          <Text style={[styles.rankText, { color: medalColor || '#666' }]}>{rank}</Text>
        </View>
        <View style={styles.userInfo}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{item.username?.[0]?.toUpperCase() || '?'}</Text>
          </View>
          <Text style={styles.username}>{item.username || 'User'}</Text>
        </View>
        <View style={styles.scoreInfo}>
          <Text style={styles.score}>{item.total_score || 0}</Text>
          <Text style={styles.scoreLabel}>pts</Text>
        </View>
      </View>
    );
  };

  if (loading) {
    return (
      <View style={[styles.container, styles.centerContent]}>
        <ActivityIndicator size="large" color={BRAND_GOLD} />
      </View>
    );
  }

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Ionicons name="chevron-back" size={16} color="#C8B56A" />
          <Text style={styles.backButtonText}>Back to Campaign</Text>
        </TouchableOpacity>
        
        <View style={styles.headerTitle}>
          <View style={styles.headerIcon}>
            <Ionicons name="trending-up" size={20} color="#fff" />
          </View>
          <View>
            <Text style={styles.title}>Leaderboard</Text>
            {campaign && (
              <View style={styles.campaignTypeRow}>
                <Text style={styles.campaignName}>{campaign.title}</Text>
                {campaign.campaign_type && (
                  <Text style={styles.campaignType}>
                    {campaign.campaign_type === 'grand' ? 'Grand' : 
                     campaign.campaign_type === 'daily' ? 'Daily' : 
                     campaign.campaign_type === 'weekly' ? 'Weekly' : 'Monthly'}
                  </Text>
                )}
              </View>
            )}
          </View>
        </View>

        {/* Period Tabs */}
        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.periodTabs}
        >
          {PERIODS.map((p) => (
            <TouchableOpacity
              key={p.id}
              onPress={() => setPeriod(p.id)}
              style={[styles.periodTab, period === p.id && styles.periodTabActive]}
            >
              <Text style={[styles.periodTabText, period === p.id && styles.periodTabTextActive]}>
                {p.label}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      <ScrollView style={styles.content}>
        {leaderboard.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Ionicons name="trophy" size={44} color={BRAND_GOLD} style={{ marginBottom: 16, opacity: 0.4 }} />
            <Text style={styles.emptyTitle}>No Rankings Yet</Text>
            <Text style={styles.emptySubtitle}>Be the first to participate!</Text>
          </View>
        ) : (
          <>
            {renderPodium()}
            
            {/* Rest of leaderboard */}
            {rest.length > 0 && (
              <View style={styles.leaderboardList}>
                <Text style={styles.listTitle}>Rankings</Text>
                {rest.map((item, index) => renderLeaderboardItem({ item, index }))}
              </View>
            )}
          </>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0B0B0C',
  },
  centerContent: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    backgroundColor: '#121214',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e5e5',
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  backButtonText: {
    marginLeft: 6,
    fontSize: 14,
    fontWeight: '600',
    color: '#A1A1AA',
  },
  headerTitle: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingBottom: 14,
  },
  headerIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: BRAND_GOLD,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  title: {
    fontSize: 20,
    fontWeight: '800',
    color: '#C8B56A',
  },
  campaignTypeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 2,
  },
  campaignName: {
    fontSize: 13,
    color: '#A1A1AA',
    marginRight: 8,
  },
  campaignType: {
    paddingHorizontal: 4,
    paddingVertical: 2,
    backgroundColor: 'rgba(218, 155, 42, 0.15)',
    color: BRAND_GOLD,
    borderRadius: 4,
    fontSize: 10,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  periodTabs: {
    paddingHorizontal: 16,
    paddingBottom: 12,
    gap: 6,
  },
  periodTab: {
    paddingHorizontal: 16,
    paddingVertical: 7,
    borderRadius: 20,
    backgroundColor: '#121214',
    borderWidth: 1.5,
    borderColor: '#2A2A2E',
  },
  periodTabActive: {
    backgroundColor: BRAND_GOLD,
    borderColor: BRAND_GOLD,
  },
  periodTabText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#A1A1AA',
  },
  periodTabTextActive: {
    color: '#fff',
  },
  content: {
    flex: 1,
    padding: 16,
  },
  podiumContainer: {
    backgroundColor: '#121214',
    borderRadius: 14,
    padding: 24,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#2A2A2E',
  },
  podiumTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#A1A1AA',
    textTransform: 'uppercase',
    letterSpacing: 0.05,
    marginBottom: 20,
  },
  podium: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'center',
    gap: 16,
  },
  podiumItem: {
    flex: 1,
    alignItems: 'center',
  },
  podiumItemFirst: {
    flex: 1.2,
  },
  podiumBar: {
    width: 64,
    borderRadius: 8,
    borderWidth: 3,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
  },
  podiumAvatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#121214',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
  },
  podiumAvatarFirst: {
    width: 64,
    height: 64,
    borderRadius: 32,
  },
  podiumAvatarText: {
    fontSize: 20,
    fontWeight: '800',
    color: '#C8B56A',
  },
  podiumAvatarTextFirst: {
    fontSize: 26,
  },
  podiumMedal: {
    marginBottom: 8,
  },
  podiumMedalFirst: {
    marginBottom: 12,
  },
  podiumMedalText: {
    fontSize: 32,
  },
  podiumName: {
    fontSize: 12,
    fontWeight: '600',
    color: '#C8B56A',
    marginBottom: 4,
  },
  podiumNameFirst: {
    fontSize: 14,
  },
  podiumScore: {
    fontSize: 14,
    fontWeight: '700',
    color: BRAND_GOLD,
  },
  podiumScoreFirst: {
    fontSize: 16,
  },
  leaderboardList: {
    backgroundColor: '#121214',
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: '#2A2A2E',
  },
  listTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#A1A1AA',
    textTransform: 'uppercase',
    letterSpacing: 0.05,
    marginBottom: 12,
  },
  leaderboardItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f5f5f5',
  },
  rank: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  rankText: {
    fontSize: 14,
    fontWeight: '700',
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#0B0B0C',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  avatarText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#C8B56A',
  },
  username: {
    fontSize: 14,
    fontWeight: '600',
    color: '#C8B56A',
  },
  scoreInfo: {
    alignItems: 'flex-end',
  },
  score: {
    fontSize: 18,
    fontWeight: '800',
    color: BRAND_GOLD,
  },
  scoreLabel: {
    fontSize: 10,
    color: '#A1A1AA',
    fontWeight: '600',
  },
  emptyContainer: {
    backgroundColor: '#121214',
    borderRadius: 14,
    padding: 48,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#2A2A2E',
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#C8B56A',
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 14,
    color: '#A1A1AA',
  },
});




