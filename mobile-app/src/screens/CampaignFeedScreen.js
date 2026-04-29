import React, { useState, useEffect, useRef } from 'react';
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
import { Video, ResizeMode } from 'expo-av';
import api from '../api';
import config from '../config';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';

const { width } = Dimensions.get('window');
const BRAND_GOLD = '#C8B56A';

const mediaUrl = (url) => {
  if (!url) return null;
  if (url.startsWith('http')) return url;
  return `${config.API_BASE_URL.replace('/api', '')}${url}`;
};

const ALL_TABS = ['All', 'Top Rated', 'Most Liked', 'Recent'];

export default function CampaignFeedScreen({ route, navigation }) {
  const { campaignId } = route.params;
  const [campaign, setCampaign] = useState(null);
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('All');
  const [votingInProgress, setVotingInProgress] = useState({});
  const engagementTimer = useRef(null);
  const insets = useSafeAreaInsets();

  useFocusEffect(
    React.useCallback(() => {
      loadData();
      return () => {
        if (engagementTimer.current) {
          clearTimeout(engagementTimer.current);
        }
      };
    }, [campaignId, activeTab])
  );

  const loadData = async () => {
    try {
      setLoading(true);
      const [campaignRes, feedRes] = await Promise.all([
        api.getCampaignDetail(campaignId),
        api.getCampaignFeed(campaignId, activeTab.toLowerCase())
      ]);
      setCampaign(campaignRes);
      setPosts(feedRes.posts || []);
    } catch (error) {
      console.error('Error loading feed:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleLike = async (post) => {
    const reelId = post.reel?.id;
    if (!reelId) return;

    const wasLiked = post.engagement?.user_liked ?? false;
    const prevLikes = post.engagement?.likes ?? 0;

    // Optimistic update
    setPosts(prev => prev.map(p =>
      p.id === post.id
        ? { ...p, engagement: { ...p.engagement, user_liked: !wasLiked, likes: wasLiked ? prevLikes - 1 : prevLikes + 1 } }
        : p
    ));

    try {
      await api.voteReel(reelId);

      // Update engagement score
      clearTimeout(engagementTimer.current);
      engagementTimer.current = setTimeout(async () => {
        try {
          await api.updateCampaignEngagement(campaignId);
          loadData();
        } catch (e) {
          console.error('Engagement sync error:', e);
        }
      }, 1200);
    } catch (error) {
      // Revert on error
      setPosts(prev => prev.map(p =>
        p.id === post.id
          ? { ...p, engagement: { ...p.engagement, user_liked: wasLiked, likes: prevLikes } }
          : p
      ));
    }
  };

  const handleVote = async (postId) => {
    try {
      setVotingInProgress(prev => ({ ...prev, [postId]: true }));
      await api.voteCampaignEntry(postId);
      loadData();
    } catch (error) {
      console.error('Failed to vote:', error);
    } finally {
      setVotingInProgress(prev => ({ ...prev, [postId]: false }));
    }
  };

  const renderHeader = () => (
    <View>
      {/* Back Button */}
      <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
        <Ionicons name="chevron-back" size={20} color="#C8B56A" />
        <Text style={styles.backButtonText}>Back to Campaign</Text>
      </TouchableOpacity>

      {/* Campaign Info */}
      {campaign && (
        <View style={styles.campaignInfo}>
          <Text style={styles.campaignTitle}>{campaign.title}</Text>
          <Text style={styles.campaignSubtitle}>
            {campaign.campaign_type === 'grand' ? 'Grand' : 
             campaign.campaign_type === 'daily' ? 'Daily' : 
             campaign.campaign_type === 'weekly' ? 'Weekly' : 'Monthly'} Campaign
          </Text>
        </View>
      )}

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

  const renderPost = ({ item, index }) => {
    const mediaSrc = mediaUrl(item.reel?.media);
    const avatarSrc = mediaUrl(item.user?.profile_photo);
    const isVideo = !!item.reel?.media && (
      /\.(mp4|webm|ogg|mov)(\?|$)/i.test(item.reel.media) ||
      item.reel.media.includes('/video/upload/')
    );
    const userLiked = item.engagement?.user_liked || false;
    const likes = item.engagement?.likes || 0;
    const comments = item.engagement?.comments || 0;
    const score = item.engagement_score || 0;
    const totalScore = item.total_score || 0;

    // Rank styles
    const getRankStyle = (rank) => {
      if (rank === 1) return { bg: '#FFD70020', border: '#FFD700', text: '#B8860B', label: '🥇' };
      if (rank === 2) return { bg: '#C0C0C020', border: '#C0C0C0', text: '#808080', label: '🥈' };
      if (rank === 3) return { bg: '#CD7F3220', border: '#CD7F32', text: '#8B4513', label: '🥉' };
      return { bg: '#0B0B0C', border: '#e5e5e5', text: '#666', label: `#${index + 1}` };
    };
    const rankStyle = getRankStyle(index + 1);

    return (
      <View style={styles.postCard}>
        {/* Rank Badge */}
        <View style={[styles.rankBadge, { backgroundColor: rankStyle.bg, borderColor: rankStyle.border }]}>
          <Text style={styles.rankLabel}>{rankStyle.label}</Text>
        </View>

        {/* Header */}
        <View style={styles.postHeader}>
          <Image source={{ uri: avatarSrc }} style={styles.avatar} />
          <View style={styles.headerInfo}>
            <Text style={styles.username}>{item.user?.username || 'user'}</Text>
            <Text style={styles.score}>Score: {totalScore}</Text>
          </View>
          <TouchableOpacity 
            style={[styles.voteButton, votingInProgress[item.id] && styles.voteButtonDisabled]}
            onPress={() => handleVote(item.id)}
            disabled={votingInProgress[item.id]}
          >
            <Ionicons name="trophy" size={16} color="#fff" />
            <Text style={styles.voteButtonText}>Vote</Text>
          </TouchableOpacity>
        </View>

        {/* Media */}
        <View style={styles.mediaContainer}>
          {mediaSrc ? (
            isVideo ? (
              <Video
                source={{ uri: mediaSrc }}
                style={styles.media}
                shouldPlay={false}
                isLooping
                resizeMode={ResizeMode.CONTAIN}
                useNativeControls={false}
                isMuted={true}
              />
            ) : (
              <Image source={{ uri: mediaSrc }} style={styles.media} />
            )
          ) : (
            <View style={[styles.media, styles.mediaPlaceholder]}>
              <Ionicons name="image" size={48} color="#ccc" />
            </View>
          )}
        </View>

        {/* Actions */}
        <View style={styles.actions}>
          <TouchableOpacity 
            style={styles.actionItem}
            onPress={() => handleLike(item)}
          >
            <Ionicons 
              name={userLiked ? "heart" : "heart-outline"} 
              size={24} 
              color={userLiked ? "#EF4444" : "#000"} 
            />
            <Text style={styles.actionText}>{likes}</Text>
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.actionItem}>
            <Ionicons name="chatbubble-outline" size={24} color="#000" />
            <Text style={styles.actionText}>{comments}</Text>
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.actionItem}>
            <Ionicons name="share-social" size={24} color="#000" />
          </TouchableOpacity>
        </View>

        {/* Caption */}
        {item.reel?.caption && (
          <View style={styles.captionContainer}>
            <Text style={styles.captionUsername}>{item.user?.username} </Text>
            <Text style={styles.captionText}>{item.reel.caption}</Text>
          </View>
        )}

        {/* Score Info */}
        <View style={styles.scoreInfo}>
          <Text style={styles.scoreLabel}>Engagement Score: </Text>
          <Text style={styles.scoreValue}>{score}</Text>
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
      <FlatList
        data={posts}
        renderItem={renderPost}
        keyExtractor={(item) => item.id.toString()}
        ListHeaderComponent={renderHeader}
        contentContainerStyle={styles.list}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons name="trophy" size={48} color={BRAND_GOLD} />
            <Text style={styles.emptyTitle}>No entries yet</Text>
            <Text style={styles.emptySubtitle}>Be the first to participate!</Text>
          </View>
        }
      />
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
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#121214',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e5e5',
  },
  backButtonText: {
    marginLeft: 8,
    fontSize: 14,
    fontWeight: '600',
    color: '#A1A1AA',
  },
  campaignInfo: {
    padding: 16,
    backgroundColor: '#121214',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e5e5',
  },
  campaignTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#C8B56A',
    marginBottom: 4,
  },
  campaignSubtitle: {
    fontSize: 14,
    color: '#A1A1AA',
  },
  tabsContainer: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#121214',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e5e5',
    gap: 8,
  },
  tab: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 16,
    backgroundColor: '#0B0B0C',
    borderWidth: 2,
    borderColor: '#2A2A2E',
  },
  tabActive: {
    backgroundColor: BRAND_GOLD,
    borderColor: BRAND_GOLD,
  },
  tabText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#C8B56A',
  },
  tabTextActive: {
    color: '#fff',
  },
  list: {
    padding: 16,
  },
  postCard: {
    backgroundColor: '#121214',
    borderRadius: 12,
    marginBottom: 16,
    overflow: 'hidden',
    shadowcolor: '#C8B56A',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  rankBadge: {
    position: 'absolute',
    top: 12,
    left: 12,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 2,
    zIndex: 10,
  },
  rankLabel: {
    fontSize: 12,
    fontWeight: '800',
  },
  postHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f5f5f5',
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 12,
  },
  headerInfo: {
    flex: 1,
  },
  username: {
    fontSize: 14,
    fontWeight: '600',
    color: '#C8B56A',
  },
  score: {
    fontSize: 12,
    color: '#A1A1AA',
  },
  voteButton: {
    flexDirection: 'row',
    backgroundColor: BRAND_GOLD,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    alignItems: 'center',
  },
  voteButtonDisabled: {
    opacity: 0.6,
  },
  voteButtonText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
    marginLeft: 4,
  },
  mediaContainer: {
    aspectRatio: 9 / 16,
    backgroundcolor: '#C8B56A',
  },
  media: {
    width: '100%',
    height: '100%',
  },
  mediaPlaceholder: {
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#0B0B0C',
  },
  actions: {
    flexDirection: 'row',
    paddingHorizontal: 12,
    paddingVertical: 12,
    gap: 24,
  },
  actionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  actionItemDisabled: {
    opacity: 0.5,
  },
  actionText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#C8B56A',
  },
  actionTextDisabled: {
    color: '#71717A',
  },
  captionContainer: {
    paddingHorizontal: 12,
    paddingBottom: 12,
    flexDirection: 'row',
  },
  captionUsername: {
    fontSize: 14,
    fontWeight: '600',
    color: '#C8B56A',
  },
  captionText: {
    fontSize: 14,
    color: '#C8B56A',
    lineHeight: 20,
    flex: 1,
  },
  scoreInfo: {
    flexDirection: 'row',
    paddingHorizontal: 12,
    paddingBottom: 12,
    borderTopWidth: 1,
    borderTopColor: '#f5f5f5',
    paddingTop: 12,
  },
  scoreLabel: {
    fontSize: 12,
    color: '#A1A1AA',
  },
  scoreValue: {
    fontSize: 14,
    fontWeight: '700',
    color: BRAND_GOLD,
  },
  emptyContainer: {
    backgroundColor: '#121214',
    borderRadius: 16,
    padding: 40,
    alignItems: 'center',
    marginTop: 20,
    borderWidth: 1,
    borderColor: '#2A2A2E',
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#C8B56A',
    marginTop: 12,
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 14,
    color: '#A1A1AA',
    textAlign: 'center',
  },
});





