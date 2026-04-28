import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  Image,
  ActivityIndicator,
  ScrollView,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import api from '../api';

const { width } = Dimensions.get('window');
const BRAND_GOLD = '#F9E08B';

const ALL_TABS = ['All', 'Active', 'Voting', 'Upcoming', 'Completed'];

export default function CampaignsScreen({ navigation }) {
  const [campaigns, setCampaigns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('All');

  useEffect(() => {
    loadCampaigns();
  }, [activeTab]);

  const loadCampaigns = async () => {
    try {
      setLoading(true);
      const status = activeTab === 'All' ? '' : activeTab.toLowerCase();
      const data = await api.getCampaignsByStatus(status);
      setCampaigns(Array.isArray(data) ? data : (data?.results || []));
    } catch (error) {
      console.error('Error loading campaigns:', error);
      setCampaigns([]);
    } finally {
      setLoading(false);
    }
  };

  const handleCampaignPress = (campaign) => {
    navigation.navigate('CampaignDetail', { campaignId: campaign.id });
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'active': return BRAND_GOLD;
      case 'voting': return '#3B82F6';
      case 'upcoming': return '#F97316';
      case 'completed': return '#999999';
      default: return BRAND_GOLD;
    }
  };

  const getTimeRemaining = (endDate) => {
    if (!endDate) return 'Ended';
    const now = new Date();
    const end = new Date(endDate);
    const diff = end - now;
    
    if (diff <= 0) return 'Ended';
    
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    
    if (days > 0) return `${days}d ${hours}h`;
    return `${hours}h`;
  };

  const renderHeader = () => (
    <View>
      {/* Hero Section */}
      <View style={styles.hero}>
        <View style={styles.heroIcon}>
          <Ionicons name="trophy" size={32} color="#fff" />
        </View>
        <Text style={styles.heroTitle}>Prize Campaigns</Text>
        <Text style={styles.heroSubtitle}>Participate in exciting competitions and win amazing prizes!</Text>
      </View>

      {/* Filter Tabs */}
      <ScrollView 
        horizontal 
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.tabsContainer}
      >
        {ALL_TABS.map((tab) => (
          <TouchableOpacity
            key={tab}
            onPress={() => setActiveTab(tab)}
            style={[styles.tab, activeTab === tab && styles.tabActive]}
          >
            <Text style={[styles.tabText, activeTab === tab && styles.tabTextActive]}>
              {tab}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );

  const renderCampaign = ({ item }) => {
    const statusColor = getStatusColor(item.status);
    const campaignType = item.campaign_type || 'daily';
    
    return (
      <TouchableOpacity
        style={styles.campaignCard}
        onPress={() => handleCampaignPress(item)}
        activeOpacity={0.9}
      >
        {/* Campaign Image */}
        {item.image ? (
          <Image source={{ uri: item.image }} style={styles.campaignImage} />
        ) : (
          <View style={[styles.campaignImage, styles.imagePlaceholder]}>
            <Ionicons name="trophy" size={48} color={BRAND_GOLD} />
          </View>
        )}

        {/* Status Badge */}
        <View style={[styles.statusBadge, { backgroundColor: statusColor }]}>
          <Text style={styles.statusText}>{item.status}</Text>
        </View>

        {/* Campaign Info */}
        <View style={styles.campaignInfo}>
          {/* Type Badge */}
          <View style={styles.typeBadge}>
            <Text style={styles.typeText}>
              {campaignType === 'grand' ? 'Grand' : 
               campaignType === 'daily' ? 'Daily' : 
               campaignType === 'weekly' ? 'Weekly' : 'Monthly'}
            </Text>
          </View>

          <Text style={styles.campaignTitle}>{item.title}</Text>
          <Text style={styles.campaignDescription} numberOfLines={2}>
            {item.description}
          </Text>

          {/* Prize */}
          <View style={styles.prizeContainer}>
            <View style={styles.prizeIcon}>
              <Ionicons name="award" size={20} color="#fff" />
            </View>
            <View style={styles.prizeInfo}>
              <Text style={styles.prizeLabel}>Grand Prize</Text>
              <Text style={styles.prizeValue}>${item.prize_value || 0}</Text>
              <Text style={styles.prizeTitle}>{item.prize_title || 'Cash Prize'}</Text>
            </View>
          </View>

          {/* Stats */}
          <View style={styles.statsContainer}>
            <View style={styles.stat}>
              <Text style={styles.statLabel}>Entries</Text>
              <Text style={styles.statValue}>{item.total_entries || 0}</Text>
            </View>
            <View style={styles.stat}>
              <Text style={styles.statLabel}>Votes</Text>
              <Text style={[styles.statValue, styles.votesText]}>{item.total_votes || 0}</Text>
            </View>
            <View style={styles.stat}>
              <Text style={styles.statLabel}>Time Left</Text>
              <Text style={[styles.statValue, { color: statusColor }]}>
                {getTimeRemaining(item.voting_end || item.entry_deadline).split(' ')[0]}
              </Text>
            </View>
          </View>

          {/* Action Button */}
          <View style={styles.actionButton}>
            <Text style={styles.actionButtonText}>View Campaign</Text>
            <Ionicons name="chevron-forward" size={20} color="#000" />
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={BRAND_GOLD} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={campaigns}
        renderItem={renderCampaign}
        keyExtractor={(item) => item.id.toString()}
        ListHeaderComponent={renderHeader}
        contentContainerStyle={styles.list}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons name="trophy" size={48} color={BRAND_GOLD} />
            <Text style={styles.emptyTitle}>No {activeTab.toLowerCase()} campaigns</Text>
            <Text style={styles.emptySubtitle}>Check back later for new opportunities!</Text>
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
  },
  hero: {
    padding: 20,
    alignItems: 'center',
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e5e5',
  },
  heroIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: BRAND_GOLD,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
    shadowColor: BRAND_GOLD,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 10,
    elevation: 6,
  },
  heroTitle: {
    fontSize: 22,
    fontWeight: '900',
    color: '#000',
    marginBottom: 4,
    textAlign: 'center',
  },
  heroSubtitle: {
    fontSize: 13,
    color: '#666',
    textAlign: 'center',
    maxWidth: 280,
  },
  tabsContainer: {
    paddingHorizontal: 16,
    paddingVertical: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e5e5',
    gap: 8,
  },
  tab: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 16,
    backgroundColor: '#f5f5f5',
    borderWidth: 2,
    borderColor: '#e5e5e5',
  },
  tabActive: {
    backgroundColor: BRAND_GOLD,
    borderColor: BRAND_GOLD,
  },
  tabText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#000',
  },
  tabTextActive: {
    color: '#000',
  },
  list: {
    padding: 16,
  },
  campaignCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    marginBottom: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  campaignImage: {
    width: '100%',
    height: 160,
    backgroundColor: '#f5f5f5',
  },
  imagePlaceholder: {
    backgroundColor: 'rgba(249, 224, 139, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  statusBadge: {
    position: 'absolute',
    top: 16,
    right: 16,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  statusText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  campaignInfo: {
    padding: 12,
  },
  typeBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 4,
    backgroundColor: 'rgba(249, 224, 139, 0.2)',
    borderRadius: 8,
    marginBottom: 8,
  },
  typeText: {
    color: BRAND_GOLD,
    fontSize: 10,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  campaignTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#000',
    marginBottom: 6,
  },
  campaignDescription: {
    fontSize: 13,
    color: '#666',
    marginBottom: 12,
    lineHeight: 18,
  },
  prizeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(249, 224, 139, 0.15)',
    borderRadius: 10,
    padding: 10,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: 'rgba(249, 224, 139, 0.4)',
  },
  prizeIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: BRAND_GOLD,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  prizeInfo: {
    flex: 1,
  },
  prizeLabel: {
    fontSize: 10,
    color: '#666',
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 2,
  },
  prizeValue: {
    fontSize: 18,
    fontWeight: '900',
    color: BRAND_GOLD,
    marginBottom: 2,
  },
  prizeTitle: {
    fontSize: 13,
    color: '#000',
    fontWeight: '600',
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#e5e5e5',
  },
  stat: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 8,
    backgroundColor: '#f5f5f5',
    borderRadius: 6,
    marginHorizontal: 4,
  },
  statLabel: {
    fontSize: 9,
    color: '#666',
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  statValue: {
    fontSize: 16,
    fontWeight: '700',
    color: '#3B82F6',
  },
  votesText: {
    color: '#EF4444',
  },
  actionButton: {
    flexDirection: 'row',
    backgroundColor: BRAND_GOLD,
    borderRadius: 10,
    padding: 12,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: BRAND_GOLD,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 5,
  },
  actionButtonText: {
    color: '#000',
    fontSize: 14,
    fontWeight: '800',
    marginRight: 6,
  },
  emptyContainer: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 40,
    alignItems: 'center',
    marginTop: 20,
    marginHorizontal: 16,
    borderWidth: 1,
    borderColor: '#e5e5e5',
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#000',
    marginTop: 12,
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
  },
});

