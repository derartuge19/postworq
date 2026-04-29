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

const BRAND_GOLD = '#C8B56A';
const CYAN_COLOR = '#3B82F6';

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
  const [openSections, setOpenSections] = useState({ desc: true, reqs: false, timeline: false, scoring: false });
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
  const toggleSection = (k) => setOpenSections(s => ({ ...s, [k]: !s[k] }));

  const hasRequirements = (campaign.min_followers > 0 || campaign.min_level > 0 || campaign.min_votes_per_reel > 0 || campaign.required_hashtags || campaign.winner_count > 0);

  const Accordion = ({ id, icon, title, subtitle, color, children }) => {
    const open = openSections[id];
    return (
      <View style={styles.accordion}>
        <TouchableOpacity
          style={styles.accordionHeader}
          onPress={() => toggleSection(id)}
          activeOpacity={0.7}
        >
          <View style={[styles.accordionIcon, { backgroundColor: (color || BRAND_GOLD) + '22' }]}>
            <Ionicons name={icon} size={16} color={color || BRAND_GOLD} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.accordionTitle}>{title}</Text>
            {subtitle ? <Text style={styles.accordionSubtitle}>{subtitle}</Text> : null}
          </View>
          <Ionicons name={open ? 'chevron-up' : 'chevron-down'} size={18} color="#999" />
        </TouchableOpacity>
        {open && (
          <View style={styles.accordionBody}>
            {children}
          </View>
        )}
      </View>
    );
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Sticky Header */}
      <View style={styles.stickyHeader}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.headerBack}>
          <Ionicons name="chevron-back" size={22} color={CYAN_COLOR} />
        </TouchableOpacity>
        <Text style={styles.headerTitle} numberOfLines={1}>{campaign.title}</Text>
        <View style={[styles.headerStatusPill, { backgroundColor: statusColor + '25' }]}>
          <Text style={[styles.headerStatusText, { color: statusColor }]}>{campaign.status}</Text>
        </View>
      </View>

      <ScrollView style={styles.scrollView} contentContainerStyle={{ paddingBottom: 40 }}>
        {/* Hero with prize overlay */}
        <View style={styles.hero}>
          {campaign.image ? (
            <Image source={{ uri: mediaUrl(campaign.image) }} style={styles.heroImage} />
          ) : (
            <View style={[styles.heroImage, styles.heroPlaceholder]}>
              <Ionicons name="trophy" size={64} color={BRAND_GOLD} style={{ opacity: 0.5 }} />
            </View>
          )}
          <View style={styles.heroGradient} />
          <View style={styles.heroOverlay}>
            <View style={styles.heroPrizeIcon}>
              <Ionicons name="trophy" size={22} color="#000" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.heroPrizeLabel}>Prize Pool</Text>
              <Text style={styles.heroPrizeValue}>
                {campaign.prize_value ? `${campaign.prize_value} ETB` : (campaign.prize_title || '—')}
              </Text>
            </View>
            <View style={styles.heroTimePill}>
              <Ionicons name="time-outline" size={12} color="#fff" />
              <Text style={styles.heroTimeText}>
                {getTimeRemaining(campaign.voting_end || campaign.entry_deadline)}
              </Text>
            </View>
          </View>
        </View>

        <View style={styles.content}>
          {/* Quick Stats */}
          <View style={styles.statsRow}>
            <View style={styles.statBox}>
              <View style={styles.statHeader}>
                <Ionicons name="people-outline" size={11} color="#3B82F6" />
                <Text style={styles.statLabel}>Entries</Text>
              </View>
              <Text style={[styles.statValueBox, { color: '#3B82F6' }]}>{campaign.total_entries || 0}</Text>
            </View>
            <View style={styles.statBox}>
              <View style={styles.statHeader}>
                <Ionicons name="flame-outline" size={11} color="#EF4444" />
                <Text style={styles.statLabel}>Votes</Text>
              </View>
              <Text style={[styles.statValueBox, { color: '#EF4444' }]}>{campaign.total_votes || 0}</Text>
            </View>
            <View style={styles.statBox}>
              <View style={styles.statHeader}>
                <Ionicons name="star-outline" size={11} color={BRAND_GOLD} />
                <Text style={styles.statLabel}>Winners</Text>
              </View>
              <Text style={[styles.statValueBox, { color: BRAND_GOLD }]}>{campaign.winner_count || 1}</Text>
            </View>
          </View>

          {/* Primary CTA */}
          {canSubmit() ? (
            <TouchableOpacity
              style={styles.ctaButton}
              onPress={() => setShowSubmitModal(true)}
              activeOpacity={0.85}
            >
              <Ionicons name="add-circle" size={18} color="#000" />
              <Text style={styles.ctaButtonText}>Join Campaign</Text>
            </TouchableOpacity>
          ) : userEntry ? (
            <View style={styles.ctaAlready}>
              <Ionicons name="checkmark-circle" size={18} color="#10B981" />
              <Text style={styles.ctaAlreadyText}>You're in! Rank #{userEntry.rank || '—'}</Text>
            </View>
          ) : (
            <View style={styles.ctaDisabled}>
              <Ionicons name="alert-circle-outline" size={18} color="#999" />
              <Text style={styles.ctaDisabledText}>
                {campaign.status === 'completed' ? 'Campaign Ended' : campaign.status === 'upcoming' ? 'Starts Soon' : 'Not Accepting Entries'}
              </Text>
            </View>
          )}

          {/* Secondary actions */}
          <View style={styles.quickActions}>
            <TouchableOpacity
              style={styles.quickActionButton}
              onPress={() => navigation.navigate('CampaignLeaderboard', { campaignId })}
              activeOpacity={0.7}
            >
              <Ionicons name="trophy-outline" size={16} color={BRAND_GOLD} />
              <Text style={styles.quickActionText}>Leaderboard</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.quickActionButton}
              onPress={() => navigation.navigate('CampaignFeed', { campaignId })}
              activeOpacity={0.7}
            >
              <Ionicons name="list-outline" size={16} color={BRAND_GOLD} />
              <Text style={styles.quickActionText}>Feed</Text>
            </TouchableOpacity>
          </View>

          {/* User entry compact */}
          {userEntry && (
            <View style={styles.userEntryCompact}>
              <View style={styles.userEntryCompactIcon}>
                <Ionicons name="checkmark" size={18} color="#fff" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.userEntryCompactTitle}>Your Entry is Live 🎉</Text>
                <Text style={styles.userEntryCompactSub}>
                  {userEntry.vote_count || 0} votes · Rank #{userEntry.rank || '—'}
                </Text>
              </View>
            </View>
          )}

          {/* ─── ACCORDIONS ─── */}
          <Accordion id="desc" icon="document-text-outline" title="About this Campaign" subtitle="Description & type" color={BRAND_GOLD}>
            <Text style={styles.accBody}>{campaign.description || 'No description provided.'}</Text>
            <View style={styles.accHint}>
              <Ionicons name="pricetag-outline" size={12} color={BRAND_GOLD} />
              <Text style={styles.accHintText}>
                Type: <Text style={{ fontWeight: '800' }}>{campaign.campaign_type === 'grand' ? 'Grand Campaign' : campaign.campaign_type === 'daily' ? 'Daily' : campaign.campaign_type === 'weekly' ? 'Weekly' : 'Monthly'}</Text>
                {campaign.prize_title ? ` · ${campaign.prize_title}` : ''}
              </Text>
            </View>
          </Accordion>

          {hasRequirements && (
            <Accordion id="reqs" icon="flag-outline" title="Entry Requirements" subtitle="What you need to qualify" color="#3B82F6">
              {campaign.required_hashtags ? (
                <View style={styles.reqRow}><Text style={styles.reqLabel}>Required tags</Text><Text style={[styles.reqValue, { color: BRAND_GOLD }]}>{campaign.required_hashtags}</Text></View>
              ) : null}
              {campaign.min_followers > 0 && (
                <View style={styles.reqRow}><Text style={styles.reqLabel}>Min followers</Text><Text style={[styles.reqValue, { color: '#3B82F6' }]}>{campaign.min_followers}+</Text></View>
              )}
              {campaign.min_level > 0 && (
                <View style={styles.reqRow}><Text style={styles.reqLabel}>Min level</Text><Text style={[styles.reqValue, { color: '#F97316' }]}>Level {campaign.min_level}</Text></View>
              )}
              {campaign.min_votes_per_reel > 0 && (
                <View style={styles.reqRow}><Text style={styles.reqLabel}>Min votes/reel</Text><Text style={[styles.reqValue, { color: '#EF4444' }]}>{campaign.min_votes_per_reel}+</Text></View>
              )}
              {campaign.winner_count > 0 && (
                <View style={styles.reqRow}><Text style={styles.reqLabel}>Winners</Text><Text style={[styles.reqValue, { color: '#10B981' }]}>{campaign.winner_count}</Text></View>
              )}
            </Accordion>
          )}

          <Accordion id="timeline" icon="calendar-outline" title="Timeline" subtitle="Key dates" color="#8B5CF6">
            {[
              { label: 'Starts',          date: campaign.start_date,      color: '#10B981' },
              { label: 'Entry Deadline',  date: campaign.entry_deadline,  color: '#F59E0B' },
              { label: 'Voting Begins',   date: campaign.voting_start,    color: '#3B82F6' },
              { label: 'Voting Ends',     date: campaign.voting_end,      color: '#EF4444' },
            ].map((t, i) => (
              <View key={i} style={styles.tlRow}>
                <View style={[styles.tlDot, { backgroundColor: t.color }]} />
                <Text style={styles.tlLabel}>{t.label}</Text>
                <Text style={styles.tlDate}>{formatDate(t.date)}</Text>
              </View>
            ))}
          </Accordion>

          <Accordion id="scoring" icon="trending-up-outline" title="How Scoring Works" subtitle="Engagement + votes" color="#EC4899">
            <Text style={styles.accBody}>
              Your total score is calculated from likes, comments, shares, and votes on your entry during the campaign period.
            </Text>
            <View style={styles.metricsGrid}>
              {[
                { label: 'Likes',    icon: 'heart-outline',         color: '#EF4444' },
                { label: 'Comments', icon: 'chatbubble-outline',    color: '#3B82F6' },
                { label: 'Shares',   icon: 'share-social-outline',  color: '#8B5CF6' },
                { label: 'Votes',    icon: 'ribbon-outline',        color: BRAND_GOLD },
              ].map((m, i) => (
                <View key={i} style={styles.metricItem}>
                  <Ionicons name={m.icon} size={14} color={m.color} />
                  <Text style={styles.metricText}>{m.label}</Text>
                </View>
              ))}
            </View>
          </Accordion>
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
              To submit an entry, create a post and select this campaign during creation.
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
  container: { flex: 1, backgroundColor: '#121214' },
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
    color: '#A1A1AA',
  },
  campaignImage: { width: '100%', height: 200, backgroundColor: '#0B0B0C' },
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
  title: { fontSize: 24, fontWeight: 'bold', color: '#C8B56A', marginBottom: 12 },
  description: { fontSize: 16, color: '#A1A1AA', lineHeight: 22, marginBottom: 24 },
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
    color: '#A1A1AA',
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
    color: '#C8B56A',
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
    color: '#A1A1AA',
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 2,
  },
  dateValue: {
    fontSize: 14,
    color: '#C8B56A',
    fontWeight: '600',
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 24,
    paddingVertical: 16,
    borderTopWidth: 1,
    borderTopColor: '#2A2A2E',
    borderBottomWidth: 1,
    borderBottomColor: '#2A2A2E',
  },
  stat: { alignItems: 'center' },
  statValue: { fontSize: 24, fontWeight: 'bold', color: '#C8B56A' },
  statLabel: { fontSize: 12, color: '#A1A1AA', marginTop: 4 },
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
    backgroundColor: '#121214',
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
    color: '#C8B56A',
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
    backgroundColor: '#121214',
    borderRadius: 16,
    padding: 24,
    width: '100%',
    maxWidth: 320,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#C8B56A',
    marginBottom: 12,
  },
  modalText: {
    fontSize: 14,
    color: '#A1A1AA',
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
    backgroundColor: '#0B0B0C',
  },
  modalButtonTextSecondary: {
    color: '#C8B56A',
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
    color: '#C8B56A',
    marginLeft: 8,
  },
  requirementsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  requirementItem: {
    width: '48%',
    padding: 12,
    backgroundColor: '#121214',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#2A2A2E',
    marginBottom: 8,
    marginRight: '2%',
  },
  requirementLabel: {
    fontSize: 11,
    color: '#A1A1AA',
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
    backgroundColor: '#0B0B0C',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#2A2A2E',
    marginBottom: 16,
  },
  timelineTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#C8B56A',
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
    color: '#A1A1AA',
    fontWeight: '600',
    marginBottom: 4,
  },
  timelineValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#C8B56A',
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
    color: '#C8B56A',
  },
  userEntrySubtitle: {
    fontSize: 13,
    color: '#A1A1AA',
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
    color: '#A1A1AA',
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
    backgroundColor: '#121214',
    borderRadius: 12,
    padding: 12,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#2A2A2E',
    gap: 8,
  },
  quickActionText: {
    fontSize: 14,
    fontWeight: '600',
    color: BRAND_GOLD,
  },

  // ─── Redesigned compact layout styles ─────────────────────────
  stickyHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#0B0B0C',
    borderBottomWidth: 1,
    borderBottomColor: CYAN_COLOR,
  },
  headerBack: {
    padding: 4,
  },
  headerTitle: {
    flex: 1,
    fontSize: 16,
    fontWeight: '700',
    color: CYAN_COLOR,
    marginLeft: 8,
  },
  headerStatusPill: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 10,
  },
  headerStatusText: {
    fontSize: 10,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  hero: {
    position: 'relative',
    aspectRatio: 16 / 10,
    marginTop: 12,
    marginHorizontal: 12,
    borderRadius: 14,
    overflow: 'hidden',
    alignSelf: 'stretch',
  },
  heroImage: { width: '100%', height: '100%' },
  heroPlaceholder: {
    backgroundColor: 'rgba(249, 224, 139, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  heroGradient: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    height: '60%',
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  heroOverlay: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    gap: 12,
  },
  heroPrizeIcon: {
    width: 42, height: 42, borderRadius: 21,
    backgroundColor: BRAND_GOLD,
    justifyContent: 'center', alignItems: 'center',
  },
  heroPrizeLabel: {
    fontSize: 10,
    color: 'rgba(255,255,255,0.85)',
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  heroPrizeValue: {
    fontSize: 22,
    fontWeight: '900',
    color: BRAND_GOLD,
    lineHeight: 24,
  },
  heroTimePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 10,
    backgroundColor: 'rgba(0,0,0,0.55)',
  },
  heroTimeText: { color: '#fff', fontSize: 11, fontWeight: '800' },
  statsRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 12,
    marginTop: 14,
  },
  statBox: {
    flex: 1,
    padding: 10,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#2A2A2E',
    backgroundColor: '#121214',
    alignItems: 'center',
  },
  statHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 4,
  },
  statValueBox: { fontSize: 16, fontWeight: '900' },
  ctaButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: BRAND_GOLD,
    marginBottom: 10,
    shadowColor: BRAND_GOLD,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 10,
    elevation: 6,
  },
  ctaButtonText: { color: '#C8B56A', fontSize: 15, fontWeight: '800' },
  ctaAlready: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: 'rgba(16,185,129,0.1)',
    borderWidth: 1.5,
    borderColor: '#10B981',
    marginBottom: 10,
  },
  ctaAlreadyText: { color: '#10B981', fontSize: 14, fontWeight: '700' },
  ctaDisabled: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: '#0B0B0C',
    borderWidth: 1,
    borderColor: '#2A2A2E',
    marginBottom: 10,
  },
  ctaDisabledText: { color: '#A1A1AA', fontSize: 14, fontWeight: '700' },
  userEntryCompact: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    padding: 12,
    borderRadius: 12,
    backgroundColor: 'rgba(16,185,129,0.1)',
    borderWidth: 1.5,
    borderColor: '#10B981',
    marginBottom: 12,
  },
  userEntryCompactIcon: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: '#10B981',
    justifyContent: 'center', alignItems: 'center',
  },
  userEntryCompactTitle: { fontSize: 14, fontWeight: '800', color: '#C8B56A' },
  userEntryCompactSub: { fontSize: 11, color: '#A1A1AA', marginTop: 2 },
  accordion: {
    backgroundColor: '#121214',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#2A2A2E',
    marginBottom: 10,
    overflow: 'hidden',
  },
  accordionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    gap: 10,
  },
  accordionIcon: {
    width: 32, height: 32, borderRadius: 10,
    justifyContent: 'center', alignItems: 'center',
  },
  accordionTitle: { fontSize: 14, fontWeight: '700', color: '#C8B56A' },
  accordionSubtitle: { fontSize: 11, color: '#A1A1AA', marginTop: 2 },
  accordionBody: {
    padding: 12,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#2A2A2E',
  },
  accBody: { fontSize: 13, color: '#C8B56A', lineHeight: 20 },
  accHint: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 6,
    marginTop: 10,
    padding: 10,
    borderRadius: 8,
    backgroundColor: 'rgba(249, 224, 139, 0.15)',
  },
  accHintText: { flex: 1, fontSize: 12, color: '#C8B56A' },
  reqRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 10,
    backgroundColor: '#2A2A2E',
    borderRadius: 8,
    marginBottom: 6,
    gap: 10,
  },
  reqLabel: { flex: 1, fontSize: 12, color: '#A1A1AA', fontWeight: '600' },
  reqValue: { fontSize: 13, fontWeight: '800' },
  tlRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
    gap: 10,
  },
  tlDot: { width: 8, height: 8, borderRadius: 4 },
  tlLabel: { flex: 1, fontSize: 12, color: '#A1A1AA', fontWeight: '600' },
  tlDate: { fontSize: 13, color: '#C8B56A', fontWeight: '700' },
  metricsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 10,
  },
  metricItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 8,
    paddingHorizontal: 10,
    backgroundColor: '#2A2A2E',
    borderRadius: 8,
    minWidth: '48%',
  },
  metricText: { fontSize: 12, color: '#C8B56A', fontWeight: '600' },
});





