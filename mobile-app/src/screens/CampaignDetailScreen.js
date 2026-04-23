import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Modal,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import api from '../api';
import config from '../config';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const BRAND_GOLD = '#DA9B2A';

const mediaUrl = (url) => {
  if (!url) return null;
  if (url.startsWith('http')) return url;
  return `${config.API_BASE_URL.replace('/api', '')}${url}`;
};

export default function CampaignDetailScreen({ route, navigation }) {
  const { campaignId } = route.params;
  const [campaign, setCampaign] = useState(null);
  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [userEntry, setUserEntry] = useState(null);
  const [showSubmitModal, setShowSubmitModal] = useState(false);
  const insets = useSafeAreaInsets();

  useEffect(() => {
    if (campaignId) {
      loadCampaignDetails();
    }
  }, [campaignId]);

  const loadCampaignDetails = async () => {
    try {
      setLoading(true);
      const data = await api.getCampaignDetail(campaignId);
      setCampaign(data);
      setEntries(data.entries || []);
      // Check if user has already entered - check both user_id and user.id
      const userHasEntered = data.entries?.some(entry => 
        entry.user_id === data.current_user_id || entry.user?.id === data.current_user_id
      );
      setUserEntry(userHasEntered ? data.entries.find(entry => 
        entry.user_id === data.current_user_id || entry.user?.id === data.current_user_id
      ) : null);
    } catch (error) {
      console.error('Failed to load campaign:', error);
      Alert.alert('Error', 'Failed to load campaign details');
    } finally {
      setLoading(false);
    }
  };

  const handleVote = async (entryId) => {
    try {
      await api.voteCampaignEntry(entryId);
      loadCampaignDetails();
    } catch (error) {
      console.error('Failed to vote:', error);
      Alert.alert('Error', 'Failed to vote. Please try again.');
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return 'N/A';
    return date.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
  };

  const getTimeRemaining = (endDate) => {
    if (!endDate) return 'N/A';
    const now = new Date();
    const end = new Date(endDate);
    if (isNaN(end.getTime())) return 'N/A';
    
    const diff = end - now;
    if (diff <= 0) return 'Ended';
    
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    
    if (days > 0) return `${days} days ${hours} hours`;
    return `${hours} hours`;
  };

  const canSubmit = () => {
    if (!campaign) return false;
    const now = new Date();
    const start = new Date(campaign.start_date);
    const deadline = new Date(campaign.entry_deadline);
    
    if (isNaN(start.getTime()) || isNaN(deadline.getTime())) return false;
    
    return campaign.status === 'active' && now >= start && now <= deadline && !userEntry;
  };

  const canVote = () => {
    if (!campaign) return false;
    // Only grand campaigns allow voting
    if (campaign.campaign_type !== 'grand') return false;
    const now = new Date();
    const votingStart = new Date(campaign.voting_start);
    const votingEnd = new Date(campaign.voting_end);
    
    if (isNaN(votingStart.getTime()) || isNaN(votingEnd.getTime())) return false;
    
    return campaign.status === 'voting' && now >= votingStart && now <= votingEnd;
  };

  if (loading) {
    return (
      <View style={[styles.container, styles.centerContent]}>
        <ActivityIndicator size="large" color={BRAND_GOLD} />
      </View>
    );
  }

  if (!campaign) {
    return (
      <View style={[styles.container, styles.centerContent]}>
        <Ionicons name="alert-circle" size={48} color="#EF4444" />
        <Text style={styles.errorTitle}>Campaign Not Found</Text>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Text style={styles.backButtonText}>Back to Campaigns</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const statusColor = campaign.status === 'active' ? BRAND_GOLD : 
                       campaign.status === 'voting' ? '#3B82F6' : 
                       campaign.status === 'upcoming' ? '#F97316' : '#999999';

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <ScrollView style={styles.scrollView}>
        {/* Back Button */}
        <TouchableOpacity style={styles.backButtonTop} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={20} color="#666" />
          <Text style={styles.backButtonTextTop}>Back</Text>
        </TouchableOpacity>

        {/* Campaign Image */}
        {campaign.image ? (
          <Image source={{ uri: campaign.image }} style={styles.campaignImage} />
        ) : (
          <View style={[styles.campaignImage, styles.imagePlaceholder]}>
            <Ionicons name="trophy" size={64} color={BRAND_GOLD} />
          </View>
        )}

        {/* Campaign Info */}
        <View style={styles.content}>
          {/* Status Badge */}
          <View style={[styles.statusBadge, { backgroundColor: statusColor }]}>
            <Text style={styles.statusText}>{campaign.status}</Text>
          </View>

          {/* Type Badge */}
          <View style={styles.typeBadge}>
            <Text style={styles.typeText}>
              {campaign.campaign_type === 'grand' ? 'Grand' : 
               campaign.campaign_type === 'daily' ? 'Daily' : 
               campaign.campaign_type === 'weekly' ? 'Weekly' : 'Monthly'}
            </Text>
          </View>

          <Text style={styles.title}>{campaign.title}</Text>
          <Text style={styles.description}>{campaign.description}</Text>

          {/* Prize */}
          <View style={styles.prizeContainer}>
            <View style={styles.prizeIcon}>
              <Ionicons name="award" size={24} color="#fff" />
            </View>
            <View style={styles.prizeInfo}>
              <Text style={styles.prizeLabel}>Grand Prize</Text>
              <Text style={styles.prizeValue}>${campaign.prize_value || 0}</Text>
              <Text style={styles.prizeTitle}>{campaign.prize_title || 'Cash Prize'}</Text>
            </View>
          </View>

          {/* Entry Requirements */}
          {(campaign.min_followers > 0 || campaign.min_level > 0 || campaign.min_votes_per_reel > 0 || campaign.required_hashtags) && (
            <View style={styles.requirementsContainer}>
              <View style={styles.requirementsHeader}>
                <Ionicons name="flag" size={20} color={BRAND_GOLD} />
                <Text style={styles.requirementsTitle}>Entry Requirements</Text>
              </View>
              <View style={styles.requirementsGrid}>
                {campaign.required_hashtags && (
                  <View style={styles.requirementItem}>
                    <Text style={styles.requirementLabel}>Required Hashtags</Text>
                    <Text style={styles.requirementValue}>{campaign.required_hashtags}</Text>
                  </View>
                )}
                {campaign.min_followers > 0 && (
                  <View style={styles.requirementItem}>
                    <Text style={styles.requirementLabel}>Min Followers</Text>
                    <Text style={styles.requirementValue}>{campaign.min_followers}+</Text>
                  </View>
                )}
                {campaign.min_level > 0 && (
                  <View style={styles.requirementItem}>
                    <Text style={styles.requirementLabel}>Min Level</Text>
                    <Text style={styles.requirementValue}>Level {campaign.min_level}</Text>
                  </View>
                )}
                {campaign.min_votes_per_reel > 0 && (
                  <View style={styles.requirementItem}>
                    <Text style={styles.requirementLabel}>Min Votes/Reel</Text>
                    <Text style={styles.requirementValue}>{campaign.min_votes_per_reel}+</Text>
                  </View>
                )}
                {campaign.winner_count > 0 && (
                  <View style={styles.requirementItem}>
                    <Text style={styles.requirementLabel}>Winners</Text>
                    <Text style={styles.requirementValue}>{campaign.winner_count}</Text>
                  </View>
                )}
              </View>
            </View>
          )}

          {/* Timeline */}
          <View style={styles.timelineContainer}>
            <Text style={styles.timelineTitle}>Campaign Timeline</Text>
            <View style={styles.timelineGrid}>
              <View style={styles.timelineItem}>
                <Text style={styles.timelineLabel}>Start Date</Text>
                <Text style={styles.timelineValue}>{formatDate(campaign.start_date)}</Text>
              </View>
              <View style={styles.timelineItem}>
                <Text style={styles.timelineLabel}>Entry Deadline</Text>
                <Text style={styles.timelineValue}>{formatDate(campaign.entry_deadline)}</Text>
              </View>
              <View style={styles.timelineItem}>
                <Text style={styles.timelineLabel}>Voting Period</Text>
                <Text style={styles.timelineValue}>{formatDate(campaign.voting_start)} - {formatDate(campaign.voting_end)}</Text>
              </View>
            </View>
          </View>

          {/* Stats */}
          <View style={styles.statsContainer}>
            <View style={styles.stat}>
              <Text style={styles.statValue}>{campaign.total_entries || 0}</Text>
              <Text style={styles.statLabel}>Entries</Text>
            </View>
            <View style={styles.stat}>
              <Text style={[styles.statValue, styles.votesText]}>{campaign.total_votes || 0}</Text>
              <Text style={styles.statLabel}>Votes</Text>
            </View>
            <View style={styles.stat}>
              <Text style={[styles.statValue, { color: statusColor }]}>
                {getTimeRemaining(campaign.voting_end || campaign.entry_deadline)}
              </Text>
              <Text style={styles.statLabel}>Time Left</Text>
            </View>
          </View>

          {/* User's Entry with Gamification */}
          {userEntry && (
            <View style={styles.userEntryCard}>
              <View style={styles.userEntryHeader}>
                <View style={styles.userEntryIcon}>
                  <Ionicons name="checkmark-circle" size={24} color="#10B981" />
                </View>
                <View style={styles.userEntryInfo}>
                  <Text style={styles.userEntryTitle}>Your Entry Submitted!</Text>
                  <Text style={styles.userEntrySubtitle}>Good luck! 🍀</Text>
                </View>
                {userEntry.rank && userEntry.rank <= 3 && (
                  <View style={[styles.rankBadge, { backgroundColor: userEntry.rank === 1 ? '#FFD700' : userEntry.rank === 2 ? '#C0C0C0' : '#CD7F32' }]}>
                    <Ionicons name="crown" size={16} color="#fff" />
                    <Text style={styles.rankBadgeText}>#{userEntry.rank}</Text>
                  </View>
                )}
              </View>
              <View style={styles.userEntryStats}>
                <View style={styles.entryStat}>
                  <Text style={styles.entryStatValue}>{userEntry.vote_count || 0}</Text>
                  <Text style={styles.entryStatLabel}>Votes</Text>
                </View>
                <View style={styles.entryStat}>
                  <Text style={styles.entryStatValue}>#{userEntry.rank || '-'}</Text>
                  <Text style={styles.entryStatLabel}>Rank</Text>
                </View>
                <View style={styles.entryStat}>
                  <Ionicons name="checkmark" size={20} color="#10B981" />
                  <Text style={styles.entryStatLabel}>Active</Text>
                </View>
              </View>
            </View>
          )}

          {/* Action Buttons */}
          {canSubmit() && (
            <TouchableOpacity 
              style={styles.submitButton}
              onPress={() => setShowSubmitModal(true)}
            >
              <Ionicons name="add-circle" size={20} color="#fff" />
              <Text style={styles.submitButtonText}>🎯 Join Campaign</Text>
            </TouchableOpacity>
          )}

          {userEntry ? (
            <View style={styles.statusButton}>
              <Ionicons name="checkmark-circle" size={20} color="#10B981" />
              <Text style={styles.statusButtonText}>Already Entered</Text>
            </View>
          ) : !canSubmit() && (
            <View style={[styles.statusButton, styles.cannotSubmitButton]}>
              <Ionicons name="alert-circle" size={20} color="#EF4444" />
              <Text style={styles.statusButtonText}>Cannot Submit</Text>
            </View>
          )}

          <View style={styles.quickActions}>
            <TouchableOpacity 
              style={styles.quickActionButton}
              onPress={() => navigation.navigate('CampaignLeaderboard', { campaignId })}
            >
              <Ionicons name="trophy" size={18} color={BRAND_GOLD} />
              <Text style={styles.quickActionText}>Leaderboard</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={styles.quickActionButton}
              onPress={() => navigation.navigate('CampaignFeed', { campaignId })}
            >
              <Ionicons name="list" size={18} color={BRAND_GOLD} />
              <Text style={styles.quickActionText}>Feed</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>

      {/* Submit Modal */}
      <Modal
        visible={showSubmitModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowSubmitModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Submit Entry</Text>
            <Text style={styles.modalText}>
              To submit an entry to this campaign, create a post and select this campaign during creation.
            </Text>
            <TouchableOpacity 
              style={styles.modalButton}
              onPress={() => {
                setShowSubmitModal(false);
                navigation.navigate('Create', { campaignId });
              }}
            >
              <Text style={styles.modalButtonText}>Create Post</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={[styles.modalButton, styles.modalButtonSecondary]}
              onPress={() => setShowSubmitModal(false)}
            >
              <Text style={[styles.modalButtonText, styles.modalButtonTextSecondary]}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  centerContent: { justifyContent: 'center', alignItems: 'center' },
  scrollView: { flex: 1 },
  backButtonTop: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  backButtonTextTop: {
    marginLeft: 8,
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
  },
  campaignImage: { width: '100%', height: 200, backgroundColor: '#f5f5f5' },
  imagePlaceholder: {
    backgroundColor: 'rgba(218, 155, 42, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: { padding: 20 },
  statusBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    marginBottom: 8,
  },
  statusText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  typeBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 4,
    backgroundColor: 'rgba(218, 155, 42, 0.15)',
    borderRadius: 8,
    marginBottom: 12,
  },
  typeText: {
    color: BRAND_GOLD,
    fontSize: 10,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  title: { fontSize: 24, fontWeight: 'bold', color: '#000', marginBottom: 12 },
  description: { fontSize: 16, color: '#666', lineHeight: 22, marginBottom: 24 },
  prizeContainer: {
    flexDirection: 'row',
    backgroundColor: 'rgba(218, 155, 42, 0.1)',
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: 'rgba(218, 155, 42, 0.25)',
  },
  prizeIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: BRAND_GOLD,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  prizeInfo: { flex: 1 },
  prizeLabel: {
    fontSize: 12,
    color: '#666',
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  prizeValue: {
    fontSize: 24,
    fontWeight: '900',
    color: BRAND_GOLD,
    marginBottom: 4,
  },
  prizeTitle: {
    fontSize: 16,
    color: '#000',
    fontWeight: '600',
  },
  datesContainer: {
    marginBottom: 24,
  },
  dateItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  dateInfo: { marginLeft: 12 },
  dateLabel: {
    fontSize: 12,
    color: '#666',
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 2,
  },
  dateValue: {
    fontSize: 14,
    color: '#000',
    fontWeight: '600',
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 24,
    paddingVertical: 16,
    borderTopWidth: 1,
    borderTopColor: '#e5e5e5',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e5e5',
  },
  stat: { alignItems: 'center' },
  statValue: { fontSize: 24, fontWeight: 'bold', color: '#000' },
  statLabel: { fontSize: 12, color: '#666', marginTop: 4 },
  votesText: { color: '#EF4444' },
  submitButton: {
    flexDirection: 'row',
    backgroundColor: BRAND_GOLD,
    borderRadius: 12,
    padding: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  submitButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
    marginLeft: 8,
  },
  voteButton: {
    flexDirection: 'row',
    backgroundColor: '#3B82F6',
    borderRadius: 12,
    padding: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  voteButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
    marginLeft: 8,
  },
  leaderboardButton: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: BRAND_GOLD,
  },
  leaderboardButtonText: {
    fontSize: 16,
    fontWeight: '700',
    marginLeft: 8,
  },
  errorTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#000',
    marginTop: 16,
    marginBottom: 16,
  },
  backButton: {
    backgroundColor: BRAND_GOLD,
    borderRadius: 8,
    padding: 12,
  },
  backButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 24,
    width: '100%',
    maxWidth: 320,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#000',
    marginBottom: 12,
  },
  modalText: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
    marginBottom: 20,
  },
  modalButton: {
    backgroundColor: BRAND_GOLD,
    borderRadius: 12,
    padding: 14,
    alignItems: 'center',
    marginBottom: 8,
  },
  modalButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
  modalButtonSecondary: {
    backgroundColor: '#f5f5f5',
  },
  modalButtonTextSecondary: {
    color: '#000',
  },
  requirementsContainer: {
    padding: 16,
    backgroundColor: 'rgba(59,130,246,0.05)',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(59,130,246,0.2)',
    marginBottom: 16,
  },
  requirementsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  requirementsTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#000',
    marginLeft: 8,
  },
  requirementsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  requirementItem: {
    width: '48%',
    padding: 12,
    backgroundColor: '#fff',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e5e5e5',
    marginBottom: 8,
    marginRight: '2%',
  },
  requirementLabel: {
    fontSize: 11,
    color: '#666',
    fontWeight: '600',
    textTransform: 'uppercase',
    marginBottom: 4,
  },
  requirementValue: {
    fontSize: 14,
    fontWeight: '700',
    color: BRAND_GOLD,
  },
  timelineContainer: {
    padding: 16,
    backgroundColor: '#f5f5f5',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e5e5e5',
    marginBottom: 16,
  },
  timelineTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#000',
    marginBottom: 12,
  },
  timelineGrid: {
    gap: 12,
  },
  timelineItem: {
    marginBottom: 8,
  },
  timelineLabel: {
    fontSize: 12,
    color: '#666',
    fontWeight: '600',
    marginBottom: 4,
  },
  timelineValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#000',
  },
  userEntryCard: {
    backgroundColor: 'linear-gradient(135deg, rgba(16,185,129,0.1), rgba(218,155,42,0.1))',
    borderRadius: 16,
    padding: 20,
    borderWidth: 2,
    borderColor: '#10B981',
    marginBottom: 16,
  },
  userEntryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  userEntryIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#10B981',
    justifyContent: 'center',
    alignItems: 'center',
  },
  userEntryInfo: {
    flex: 1,
    marginLeft: 12,
  },
  userEntryTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#000',
  },
  userEntrySubtitle: {
    fontSize: 13,
    color: '#666',
  },
  rankBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    gap: 4,
  },
  rankBadgeText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#fff',
  },
  userEntryStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  entryStat: {
    alignItems: 'center',
  },
  entryStatValue: {
    fontSize: 24,
    fontWeight: '800',
    color: BRAND_GOLD,
  },
  entryStatLabel: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
  },
  statusButton: {
    flexDirection: 'row',
    backgroundColor: 'rgba(16,185,129,0.15)',
    borderRadius: 12,
    padding: 14,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#10B981',
    marginBottom: 12,
  },
  cannotSubmitButton: {
    backgroundColor: 'rgba(239,68,68,0.15)',
    borderColor: '#EF4444',
  },
  statusButtonText: {
    color: '#10B981',
    fontSize: 14,
    fontWeight: '700',
    marginLeft: 8,
  },
  quickActions: {
    flexDirection: 'row',
    gap: 8,
  },
  quickActionButton: {
    flex: 1,
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 12,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e5e5e5',
    gap: 8,
  },
  quickActionText: {
    fontSize: 14,
    fontWeight: '600',
    color: BRAND_GOLD,
  },
});
