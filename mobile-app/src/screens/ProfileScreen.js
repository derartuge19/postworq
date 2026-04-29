import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Dimensions,
  ActivityIndicator,
  StatusBar,
  Alert,
  Share,
  Modal,
  TextInput,
} from 'react-native';
import { Image } from 'expo-image';
import { FlashList } from '@shopify/flash-list';
import * as ImagePicker from 'expo-image-picker';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useIsFocused, useNavigation } from '@react-navigation/native';
import api from '../api';
import { useAuth } from '../contexts/AuthContext';
import config from '../config';
import GamificationBar from '../components/GamificationBar';

const { width } = Dimensions.get('window');
const BRAND_GOLD = '#F9E08B';

const mediaUrl = (url) => {
  if (!url) return null;
  if (url.startsWith('http')) return url;
  return `${config.API_BASE_URL.replace('/api', '')}${url}`;
};

export default function ProfileScreen({ navigation }) {
  const insets = useSafeAreaInsets();
  const isFocused = useIsFocused();
  const nav = useNavigation();
  const { user, logout } = useAuth();
  
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState(null);
  const [posts, setPosts] = useState([]);
  const [followers, setFollowers] = useState(0);
  const [following, setFollowing] = useState(0);
  const [activeTab, setActiveTab] = useState('posts'); // 'posts' | 'reels' | 'saved' | 'campaigns'
  const [campaignStats, setCampaignStats] = useState(null);
  const [postMenuId, setPostMenuId] = useState(null);
  const [editingPost, setEditingPost] = useState(null);
  const [editCaption, setEditCaption] = useState('');
  const [editHashtags, setEditHashtags] = useState('');
  const [editMediaFile, setEditMediaFile] = useState(null);
  const [editMediaPreview, setEditMediaPreview] = useState(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState(null);
  const [isSaving, setIsSaving] = useState(false);
  const [successMsg, setSuccessMsg] = useState(null);
  const [showGamModal, setShowGamModal] = useState(false);

  const fetchProfileData = useCallback(async () => {
    const currentUserId = user?.id;
    console.log('ProfileScreen: fetchProfileData starting. Auth User ID:', currentUserId);
    
    if (!currentUserId) {
      console.log('ProfileScreen: No auth user ID yet, skipping fetch');
      return;
    }

    try {
      setLoading(true);
      const targetUserId = profile?.id || currentUserId;
      console.log('ProfileScreen: Fetching for targetUserId:', targetUserId);
      
      const [profileData, followersRaw, followingRaw] = await Promise.all([
        api.getProfile().catch(err => { console.error('getProfile error:', err); return null; }),
        api.getFollowers(targetUserId).catch(err => { console.error('getFollowers error:', err); return []; }),
        api.getFollowing(targetUserId).catch(err => { console.error('getFollowing error:', err); return []; }),
      ]);

      console.log('ProfileScreen: API Results:', { 
        hasProfile: !!profileData, 
        followersCount: Array.isArray(followersRaw) ? followersRaw.length : 'non-array',
        followingCount: Array.isArray(followingRaw) ? followingRaw.length : 'non-array'
      });

      if (profileData) {
        const actualProfile = profileData.user || profileData;
        console.log('ProfileScreen: Setting profile data. Stats:', {
          followers: actualProfile.followers_count,
          following: actualProfile.following_count
        });
        setProfile(actualProfile);
        
        // Use counts from profile object if available, otherwise use list length
        setFollowers(actualProfile.followers_count ?? (Array.isArray(followersRaw) ? followersRaw.length : (followersRaw.results?.length || 0)));
        setFollowing(actualProfile.following_count ?? (Array.isArray(followingRaw) ? followingRaw.length : (followingRaw.results?.length || 0)));
      } else if (user) {
        // Fallback to auth user if profile fetch fails
        console.log('ProfileScreen: Profile fetch failed, falling back to auth user');
        setProfile(user);
        setFollowers(user.followers_count || 0);
        setFollowing(user.following_count || 0);
      }
      
      // Initial fetch of posts
      await fetchPosts();
    } catch (error) {
      console.error('ProfileScreen fetch error:', error);
    } finally {
      setLoading(false);
    }
  }, [user, profile?.id]);

  const getVideoThumbnail = (url) => {
    if (!url) return null;
    if (url.includes('cloudinary') && url.includes('/video/upload/')) {
      return url
        .replace('/video/upload/', '/video/upload/so_0,w_300,h_300,c_fill,q_auto:low,f_jpg/')
        .replace(/\.(mp4|webm|ogg|mov)(\?.*)?$/i, '.jpg');
    }
    return null;
  };

  const renderPostItem = ({ item }) => {
    // Handle campaign entries differently
    if (activeTab === 'campaigns') {
      return (
        <TouchableOpacity 
          style={styles.campaignThumb}
          onPress={() => navigation.navigate('CampaignDetail', { campaignId: item.campaign_id })}
        >
          <View style={styles.campaignThumbContent}>
            <Ionicons name="trophy" size={24} color={BRAND_GOLD} />
            <Text style={styles.campaignThumbTitle} numberOfLines={2}>{item.campaign_title || 'Campaign'}</Text>
            <Text style={styles.campaignThumbStatus}>{item.status}</Text>
          </View>
        </TouchableOpacity>
      );
    }

    const mediaUri = item.thumbnail || item.image || getVideoThumbnail(item.media) || item.media;
    const isVideo = item.media?.includes('.mp4') || item.media?.includes('/video/') || item.is_reel;
    const isOwnPost = item.user?.id === user?.id;
    
    return (
      <TouchableOpacity 
        style={styles.postThumb}
        onPress={() => navigation.navigate('Reels', { reelId: item.id })}
      >
        <Image 
          source={{ uri: mediaUrl(mediaUri) }} 
          style={styles.thumbImage}
          resizeMode="cover"
        />
        {isVideo && (
          <View style={styles.videoBadge}>
            <Ionicons name="play" size={12} color="#fff" />
          </View>
        )}
        {isOwnPost && (
          <TouchableOpacity
            style={styles.postMenuBtn}
            onPress={(e) => {
              e.stopPropagation();
              setPostMenuId(postMenuId === item.id ? null : item.id);
            }}
          >
            <Ionicons name="ellipsis-vertical" size={16} color="#fff" />
          </TouchableOpacity>
        )}
      </TouchableOpacity>
    );
  };

  const fetchPosts = useCallback(async () => {
    try {
      const userId = profile?.id || user?.id;
      console.log('ProfileScreen: fetchPosts starting. ID:', userId, 'Tab:', activeTab);
      
      if (!userId && activeTab !== 'saved') return;

      let data;
      if (activeTab === 'saved') {
        const raw = await api.getSavedPosts().catch(() => []);
        data = Array.isArray(raw) ? raw : (raw.results || []);
      } else if (activeTab === 'reels') {
        const raw = await api.getUserPosts(userId).catch(() => []);
        const rawArr = Array.isArray(raw) ? raw : (raw.results || []);
        data = rawArr.filter(p => {
          const url = p.media || p.image || '';
          return url.match(/\.(mp4|webm|ogg|mov)$/i) || url.includes('video') || p.is_reel;
        });
      } else if (activeTab === 'campaigns') {
        const raw = await api.getUserCampaignEntries(userId).catch(() => null);
        setCampaignStats(raw);
        data = raw?.campaigns || [];
      } else {
        const raw = await api.getUserPosts(userId).catch(() => []);
        data = Array.isArray(raw) ? raw : (raw.results || []);
      }
      
      console.log(`ProfileScreen: Fetched ${data.length} posts for ${activeTab}`);
      setPosts(data);
    } catch (error) {
      console.error('ProfileScreen fetchPosts error:', error);
    }
  }, [profile?.id, user?.id, activeTab]);

  useEffect(() => {
    if (isFocused) {
      fetchPosts();
    }
  }, [fetchPosts, isFocused]);

  useEffect(() => {
    if (isFocused) {
      fetchProfileData();
    }
  }, [isFocused, fetchProfileData]);

  // Listen for tab press event to refresh when already on Profile screen
  useEffect(() => {
    const unsubscribe = nav.addListener('tabPress', (e) => {
      // Refresh profile data when tab is pressed while already on screen
      const currentRoute = nav.getState()?.routes[nav.getState()?.index];
      if (currentRoute?.name === 'Profile') {
        fetchProfileData();
      }
    });

    return unsubscribe;
  }, [nav, fetchProfileData]);

  if (loading && !profile) {
    return (
      <View style={[styles.root, { paddingTop: insets.top }]}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Ionicons name="arrow-back" size={24} color="#000" />
          </TouchableOpacity>
          <Text style={styles.headerUsername}>Profile</Text>
          <View style={{ width: 24 }} />
        </View>
        <View style={styles.center}>
          <ActivityIndicator size="large" color={BRAND_GOLD} />
        </View>
      </View>
    );
  }

  const filteredPosts = posts;

  const handleShareProfile = async () => {
    try {
      const profileUrl = `${config.API_BASE_URL.replace('/api', '')}/profile/${profile?.username || user?.username}`;
      await Share.share({
        message: `Check out @${profile?.username || user?.username}'s profile on FlipStar! ${profileUrl}`,
      });
    } catch (error) {
      console.error('Share error:', error);
    }
  };

  const handleDeletePost = async (postId) => {
    setConfirmDeleteId(null);
    try {
      await api.deletePost(postId);
      setSuccessMsg('Post deleted!');
      setTimeout(() => setSuccessMsg(null), 2500);
      fetchPosts();
    } catch (error) {
      console.error('Failed to delete post:', error);
      // Check if the error is about missing reel
      if (error.message?.includes('No Reel matches') || error.message?.includes('404')) {
        Alert.alert('Error', 'This post no longer exists or has already been deleted.');
        // Refresh posts to remove the stale entry
        fetchPosts();
      } else {
        Alert.alert('Error', 'Could not delete this post. Please try again.');
      }
    }
  };

  const handleEditPost = (post) => {
    setPostMenuId(null);
    setEditingPost(post);
    setEditCaption(post.caption || '');
    setEditHashtags(post.hashtags || '');
    setEditMediaFile(null);
    setEditMediaPreview(null);
  };

  const handleEditMediaChange = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.All,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 1,
      });

      if (!result.canceled) {
        setEditMediaFile(result.assets[0]);
        setEditMediaPreview(result.assets[0].uri);
      }
    } catch (error) {
      console.error('Error picking media:', error);
      Alert.alert('Error', 'Could not pick media. Please try again.');
    }
  };

  const handleEditSave = async () => {
    if (!editingPost) return;
    setIsSaving(true);
    try {
      // If there's a new media file, use FormData
      if (editMediaFile) {
        const formData = new FormData();
        formData.append('caption', editCaption);
        formData.append('hashtags', editHashtags);
        formData.append('file', {
          uri: editMediaFile.uri,
          type: editMediaFile.type || 'image/jpeg',
          name: editMediaFile.fileName || 'media.jpg',
        });

        await api.request(`/reels/${editingPost.id}/`, {
          method: 'PATCH',
          body: formData,
        });
      } else {
        // No new media, just update text fields
        await api.updatePost(editingPost.id, {
          caption: editCaption,
          hashtags: editHashtags
        });
      }

      setEditingPost(null);
      setEditMediaFile(null);
      setEditMediaPreview(null);
      setSuccessMsg('Post updated!');
      setTimeout(() => setSuccessMsg(null), 2500);
      fetchPosts();
    } catch (error) {
      console.error('Failed to update post:', error);
      Alert.alert('Error', 'Could not update this post. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <View style={styles.root}>
      <StatusBar translucent backgroundColor="transparent" barStyle="dark-content" />
      
      {/* ── Gamification rewards bottom-sheet modal ── */}
      <Modal
        visible={showGamModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowGamModal(false)}
      >
        <TouchableOpacity
          style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.72)' }}
          activeOpacity={1}
          onPress={() => setShowGamModal(false)}
        >
          <View style={{ flex: 1 }} />
          <TouchableOpacity activeOpacity={1} onPress={e => e.stopPropagation()}>
            <View style={styles.gamModalSheet}>
              {/* Handle */}
              <View style={styles.gamModalHandle} />
              {/* Header row */}
              <View style={styles.gamModalHeader}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                  <Ionicons name="diamond-outline" size={20} color={BRAND_GOLD} />
                  <Text style={styles.gamModalTitle}>My Rewards</Text>
                </View>
                <TouchableOpacity onPress={() => setShowGamModal(false)} style={{ padding: 4 }}>
                  <Ionicons name="close" size={22} color="#78716C" />
                </TouchableOpacity>
              </View>
              {/* Bar */}
              <ScrollView style={{ maxHeight: '70%' }} showsVerticalScrollIndicator={false}>
                <GamificationBar userId={user?.id} onShowWallet={() => { setShowGamModal(false); navigation.navigate('Wallet'); }} />
                <View style={{ height: insets.bottom || 16 }} />
              </ScrollView>
            </View>
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>

      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={[styles.header, { paddingTop: insets.top }]}>
          <View style={styles.headerLeft}>
            <Text style={styles.headerUsername}>@{profile?.username || user?.username || 'user'}</Text>
          </View>
          <View style={styles.headerRight}>
            {/* Treasure chest — opens rewards modal */}
            <TouchableOpacity onPress={() => setShowGamModal(true)} style={{ marginRight: 12 }}>
              <Ionicons name="diamond-outline" size={24} color={BRAND_GOLD} />
            </TouchableOpacity>
            <TouchableOpacity onPress={() => navigation.navigate('Wallet')} style={{ marginRight: 12 }}>
              <Ionicons name="wallet-outline" size={24} color="#F9E08B" />
            </TouchableOpacity>
            <TouchableOpacity onPress={() => navigation.navigate('Settings')}>
              <Ionicons name="settings-outline" size={24} color="#F9E08B" />
            </TouchableOpacity>
          </View>
        </View>

        {/* Profile Info */}
        <View style={styles.profileInfo}>
          <View style={styles.mainInfoRow}>
            <View style={styles.avatarWrap}>
              {profile?.profile_photo ? (
                <Image source={{ uri: mediaUrl(profile.profile_photo) }} style={styles.avatar} />
              ) : (
                <View style={[styles.avatar, styles.avatarFallback]}>
                  <Text style={styles.avatarInitial}>{user?.username?.[0]?.toUpperCase()}</Text>
                </View>
              )}
            </View>
            
            <View style={styles.statsRow}>
              <View style={styles.statItem}>
                <Text style={styles.statCount}>{posts.length}</Text>
                <Text style={styles.statLabel}>Posts</Text>
              </View>
              <TouchableOpacity 
                style={styles.statItem} 
                onPress={() => navigation.navigate('FollowList', { userId: profile?.id || user?.id, type: 'followers' })}
              >
                <Text style={styles.statCount}>{followers}</Text>
                <Text style={styles.statLabel}>Followers</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={styles.statItem} 
                onPress={() => navigation.navigate('FollowList', { userId: profile?.id || user?.id, type: 'following' })}
              >
                <Text style={styles.statCount}>{following}</Text>
                <Text style={styles.statLabel}>Following</Text>
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.bioSection}>
            <Text style={styles.fullName}>
              {profile?.first_name || user?.first_name || ''} {profile?.last_name || user?.last_name || ''}
              {!(profile?.first_name || user?.first_name) && (profile?.username || user?.username)}
            </Text>
            {(profile?.bio || user?.bio) && <Text style={styles.bioText}>{profile?.bio || user?.bio}</Text>}
          </View>

          <View style={styles.actionButtons}>
            <TouchableOpacity 
              style={styles.editBtn}
              onPress={() => navigation.navigate('EditProfile')}
            >
              <Text style={styles.editBtnText}>Edit Profile</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={styles.shareBtn}
              onPress={handleShareProfile}
            >
              <Text style={styles.shareBtnText}>Share Profile</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Tabs */}
        <View style={styles.tabs}>
          <TouchableOpacity 
            style={[styles.tabItem, activeTab === 'posts' && styles.activeTab]}
            onPress={() => setActiveTab('posts')}
          >
            <Ionicons name="grid-outline" size={22} color={activeTab === 'posts' ? BRAND_GOLD : '#666'} />
            <Text style={[styles.tabLabel, activeTab === 'posts' && styles.activeTabLabel]}>Posts</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.tabItem, activeTab === 'reels' && styles.activeTab]}
            onPress={() => setActiveTab('reels')}
          >
            <Ionicons name="film-outline" size={22} color={activeTab === 'reels' ? BRAND_GOLD : '#666'} />
            <Text style={[styles.tabLabel, activeTab === 'reels' && styles.activeTabLabel]}>Reels</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.tabItem, activeTab === 'campaigns' && styles.activeTab]}
            onPress={() => setActiveTab('campaigns')}
          >
            <Ionicons name="trophy-outline" size={22} color={activeTab === 'campaigns' ? BRAND_GOLD : '#666'} />
            <Text style={[styles.tabLabel, activeTab === 'campaigns' && styles.activeTabLabel]}>Campaigns</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.tabItem, activeTab === 'saved' && styles.activeTab]}
            onPress={() => setActiveTab('saved')}
          >
            <Ionicons name="bookmark-outline" size={22} color={activeTab === 'saved' ? BRAND_GOLD : '#666'} />
            <Text style={[styles.tabLabel, activeTab === 'saved' && styles.activeTabLabel]}>Saved</Text>
          </TouchableOpacity>
        </View>

        {/* Campaign Stats */}
        {activeTab === 'campaigns' ? (
          <View style={styles.campaignStatsContainer}>
            {campaignStats ? (
              <>
                <View style={styles.campaignHeader}>
                  <Ionicons name="trophy" size={22} color={BRAND_GOLD} />
                  <Text style={styles.campaignHeaderText}>Campaign Achievements</Text>
                </View>

                {/* Overall Stats Grid */}
                <View style={styles.statsGrid}>
                  <View style={styles.statCard}>
                    <Ionicons name="flag" size={18} color={BRAND_GOLD} />
                    <Text style={styles.statValue}>{campaignStats.total_campaigns || 0}</Text>
                    <Text style={styles.statLabel}>Campaigns</Text>
                  </View>
                  <View style={styles.statCard}>
                    <Ionicons name="award" size={18} color={BRAND_GOLD} />
                    <Text style={styles.statValue}>{campaignStats.total_score || 0}</Text>
                    <Text style={styles.statLabel}>Total Score</Text>
                  </View>
                  <View style={styles.statCard}>
                    <Ionicons name="trending-up" size={18} color={BRAND_GOLD} />
                    <Text style={styles.statValue}>{campaignStats.best_rank ? `#${campaignStats.best_rank}` : '–'}</Text>
                    <Text style={styles.statLabel}>Best Rank</Text>
                  </View>
                  <View style={styles.statCard}>
                    <Ionicons name="calendar" size={18} color={BRAND_GOLD} />
                    <Text style={styles.statValue}>{campaignStats.current_streak || 0}</Text>
                    <Text style={styles.statLabel}>Streak</Text>
                  </View>
                </View>

                {/* Campaign List */}
                {campaignStats.campaigns?.length > 0 && (
                  <View style={styles.campaignList}>
                    <Text style={styles.campaignListTitle}>Active Campaigns</Text>
                    {campaignStats.campaigns.map((campaign) => (
                      <TouchableOpacity 
                        key={campaign.campaign_id}
                        style={styles.campaignListItem}
                        onPress={() => navigation.navigate('CampaignDetail', { campaignId: campaign.campaign_id })}
                      >
                        <View style={styles.campaignListItemInfo}>
                          <Text style={styles.campaignListItemTitle}>{campaign.campaign_title}</Text>
                          <Text style={styles.campaignListItemSubtitle}>
                            {campaign.posts_count} posts · Rank #{campaign.rank || '–'}
                          </Text>
                        </View>
                        <View style={styles.campaignListItemScore}>
                          <Text style={styles.campaignListItemScoreText}>{campaign.total_score} pts</Text>
                        </View>
                      </TouchableOpacity>
                    ))}
                  </View>
                )}

                {/* Badges */}
                {campaignStats.badges?.length > 0 && (
                  <View style={styles.badgesContainer}>
                    <Text style={styles.badgesTitle}>Badges Earned</Text>
                    <View style={styles.badgesList}>
                      {campaignStats.badges.map((badge, idx) => (
                        <View key={idx} style={styles.badgeItem}>
                          <Ionicons name="award" size={13} color={BRAND_GOLD} />
                          <Text style={styles.badgeText}>{badge.title}</Text>
                        </View>
                      ))}
                    </View>
                  </View>
                )}
              </>
            ) : (
              <View style={styles.empty}>
                <Ionicons name="trophy" size={48} color={BRAND_GOLD} />
                <Text style={styles.emptyTitle}>No campaigns yet</Text>
                <Text style={styles.emptySubtitle}>Join a campaign to see your stats here!</Text>
              </View>
            )}
          </View>
        ) : (
          /* Grid */
          <FlashList
            data={filteredPosts}
            renderItem={renderPostItem}
            keyExtractor={item => item.id.toString()}
            numColumns={3}
            scrollEnabled={false}
            contentContainerStyle={styles.grid}
            estimatedItemSize={width / 3}
            ListEmptyComponent={
              <View style={styles.empty}>
                <Ionicons name="apps-outline" size={40} color="#ccc" />
                <Text style={styles.emptyText}>No posts yet</Text>
              </View>
            }
          />
        )}
      </ScrollView>

      {/* Post Menu Bottom Sheet */}
      <Modal visible={!!postMenuId} transparent animationType="slide">
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setPostMenuId(null)}
        >
          <View style={styles.bottomSheet} onStartShouldSetResponder={() => true}>
            <View style={styles.sheetHandle} />
            <TouchableOpacity
              style={styles.sheetItem}
              onPress={() => { const p = posts.find(p => p.id === postMenuId); handleEditPost(p); }}
            >
              <Ionicons name="create-outline" size={20} color={BRAND_GOLD} />
              <Text style={styles.sheetItemText}>Edit Caption</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.sheetItem}
              onPress={() => { setConfirmDeleteId(postMenuId); setPostMenuId(null); }}
            >
              <Ionicons name="trash-outline" size={20} color="#EF4444" />
              <Text style={[styles.sheetItemText, { color: '#EF4444' }]}>Delete Post</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>

      {/* Edit Post Modal */}
      <Modal visible={!!editingPost} transparent animationType="fade">
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setEditingPost(null)}
        >
          <View style={styles.editModal} onStartShouldSetResponder={() => true}>
            <Text style={styles.modalTitle}>Edit Post</Text>
            <Text style={styles.modalSubtitle}>Update your post details below.</Text>

            {/* Media Preview */}
            <View style={styles.formGroup}>
              <Text style={styles.formLabel}>Media</Text>
              <View style={styles.mediaPreview}>
                {(() => {
                  if (!editingPost) return null;
                  
                  const displayUrl = editMediaPreview || (() => {
                    const mediaUrl = editingPost.media || editingPost.image || '';
                    return mediaUrl.startsWith('http') ? mediaUrl : `${config.API_BASE_URL.replace('/api', '')}${mediaUrl}`;
                  })();
                  
                  const isVideo = editMediaFile 
                    ? editMediaFile.type?.startsWith('video/')
                    : (editingPost.media || '').match(/\.(mp4|webm|ogg|mov)$/i) || (editingPost.media || '').includes('video');
                  
                  if (isVideo) {
                    return (
                      <View style={styles.videoPlaceholder}>
                        <Ionicons name="videocam" size={40} color="#666" />
                        <Text style={styles.videoPlaceholderText}>Video</Text>
                      </View>
                    );
                  } else {
                    return (
                      <Image 
                        source={{ uri: displayUrl }} 
                        style={styles.mediaImage}
                        resizeMode="cover"
                      />
                    );
                  }
                })()}
              </View>
              <TouchableOpacity
                style={styles.changeMediaBtn}
                onPress={handleEditMediaChange}
              >
                <Ionicons name="camera" size={16} color={BRAND_GOLD} />
                <Text style={styles.changeMediaBtnText}>{editMediaFile ? 'Change Media Again' : 'Change Media'}</Text>
              </TouchableOpacity>
              {editMediaFile && (
                <Text style={styles.newMediaSelectedText}>✓ New media selected</Text>
              )}
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.formLabel}>Caption</Text>
              <TextInput
                style={styles.textInput}
                value={editCaption}
                onChangeText={setEditCaption}
                placeholder="Write a caption..."
                multiline
                numberOfLines={4}
              />
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.formLabel}>Hashtags</Text>
              <TextInput
                style={styles.textInput}
                value={editHashtags}
                onChangeText={setEditHashtags}
                placeholder="#hashtag1 #hashtag2"
              />
              <Text style={styles.formHelperText}>Separate hashtags with spaces (e.g., #travel #photography)</Text>
            </View>

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalBtn, styles.cancelBtn]}
                onPress={() => setEditingPost(null)}
              >
                <Text style={styles.cancelBtnText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalBtn, styles.saveBtn]}
                onPress={handleEditSave}
                disabled={isSaving}
              >
                <Text style={styles.saveBtnText}>{isSaving ? 'Saving...' : 'Save Changes'}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </TouchableOpacity>
      </Modal>

      {/* Confirm Delete Modal */}
      <Modal visible={!!confirmDeleteId} transparent animationType="fade">
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setConfirmDeleteId(null)}
        >
          <View style={styles.confirmModal} onStartShouldSetResponder={() => true}>
            <Text style={styles.confirmEmoji}>🗑️</Text>
            <Text style={styles.confirmTitle}>Delete Post?</Text>
            <Text style={styles.confirmSubtitle}>This cannot be undone.</Text>
            <View style={styles.confirmButtons}>
              <TouchableOpacity
                style={[styles.confirmBtn, styles.confirmCancelBtn]}
                onPress={() => setConfirmDeleteId(null)}
              >
                <Text style={styles.confirmCancelBtnText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.confirmBtn, styles.confirmDeleteBtn]}
                onPress={() => handleDeletePost(confirmDeleteId)}
              >
                <Text style={styles.confirmDeleteBtnText}>Delete</Text>
              </TouchableOpacity>
            </View>
          </View>
        </TouchableOpacity>
      </Modal>

      {/* Success Toast */}
      {successMsg && (
        <View style={styles.successToast}>
          <Text style={styles.successToastText}>✓ {successMsg}</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#0d0d0d' },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingBottom: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#262626',
  },
  headerLeft: { flex: 1 },
  headerRight: { flexDirection: 'row', alignItems: 'center' },
  headerUsername: { fontSize: 18, fontWeight: '800', color: '#F9E08B' },
  profileInfo: { padding: 16 },
  mainInfoRow: { flexDirection: 'row', alignItems: 'center' },
  avatarWrap: { position: 'relative' },
  avatar: { width: 86, height: 86, borderRadius: 43, borderWidth: 2, borderColor: '#F9E08B' },
  avatarFallback: { alignItems: 'center', justifyContent: 'center', backgroundColor: BRAND_GOLD + '20' },
  avatarInitial: { fontSize: 32, fontWeight: 'bold', color: BRAND_GOLD },
  statsRow: { flex: 1, flexDirection: 'row', justifyContent: 'space-around', marginLeft: 20 },
  statItem: { alignItems: 'center' },
  statCount: { fontSize: 18, fontWeight: '800', color: '#F9E08B' },
  statLabel: { fontSize: 12, color: '#F9E08B', marginTop: 2 },
  bioSection: { marginTop: 15 },
  fullName: { fontSize: 15, fontWeight: '700', color: '#F9E08B' },
  bioText: { fontSize: 14, color: '#F9E08B', marginTop: 4, lineHeight: 20 },
  actionButtons: { flexDirection: 'row', gap: 10, marginTop: 20, paddingHorizontal: 0 },
  editBtn: { flex: 1, height: 38, backgroundColor: '#1A1A1A', borderRadius: 8, alignItems: 'center', justifyContent: 'center', minWidth: 0, borderWidth: 1.5, borderColor: '#F9E08B' },
  editBtnText: { fontSize: 14, fontWeight: '700', color: '#F9E08B' },
  shareBtn: { flex: 1, height: 38, backgroundColor: '#1A1A1A', borderRadius: 8, alignItems: 'center', justifyContent: 'center', minWidth: 0, borderWidth: 1.5, borderColor: '#F9E08B' },
  shareBtnText: { fontSize: 14, fontWeight: '700', color: '#F9E08B' },
  tabs: {
    flexDirection: 'row',
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: '#262626',
    marginTop: 10,
  },
  tabItem: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
    gap: 4,
  },
  activeTab: { borderBottomColor: BRAND_GOLD },
  tabLabel: { fontSize: 10, fontWeight: '500', color: '#F9E08B' },
  activeTabLabel: { color: BRAND_GOLD, fontWeight: '700' },
  grid: { padding: 1 },
  postThumb: { width: width / 3 - 2, height: width / 3 - 2, margin: 1, backgroundColor: '#1A1A1A' },
  thumbImage: { width: '100%', height: '100%', objectFit: 'cover' },
  videoBadge: { position: 'absolute', top: 5, right: 5, backgroundColor: 'rgba(0,0,0,0.5)', padding: 2, borderRadius: 4 },
  campaignThumb: { 
    width: width / 3 - 2, 
    height: width / 3 - 2, 
    margin: 1, 
    backgroundColor: 'rgba(218, 155, 42, 0.1)', 
    borderWidth: 1,
    borderColor: 'rgba(218, 155, 42, 0.3)',
  },
  campaignThumbContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 8,
  },
  campaignThumbTitle: {
    fontSize: 10,
    fontWeight: '600',
    color: '#F9E08B',
    textAlign: 'center',
    marginTop: 8,
  },
  campaignThumbStatus: {
    fontSize: 9,
    fontWeight: '700',
    color: BRAND_GOLD,
    textTransform: 'uppercase',
    marginTop: 4,
  },
  campaignStatsContainer: {
    padding: 20,
  },
  campaignHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 20,
  },
  campaignHeaderText: {
    fontSize: 18,
    fontWeight: '800',
    color: '#F9E08B',
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 24,
  },
  statCard: {
    width: '48%',
    backgroundColor: '#1a1a1a',
    borderRadius: 14,
    padding: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#262626',
    marginBottom: 8,
    marginRight: '2%',
  },
  statValue: {
    fontSize: 22,
    fontWeight: '800',
    color: '#F9E08B',
    marginTop: 8,
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 11,
    color: '#F9E08B',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  campaignList: {
    marginBottom: 24,
  },
  campaignListTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#F9E08B',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginBottom: 12,
  },
  campaignListItem: {
    backgroundColor: '#1a1a1a',
    borderRadius: 14,
    padding: 14,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#262626',
    marginBottom: 10,
  },
  campaignListItemInfo: {
    flex: 1,
  },
  campaignListItemTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#F9E08B',
    marginBottom: 3,
  },
  campaignListItemSubtitle: {
    fontSize: 12,
    color: '#F9E08B',
  },
  campaignListItemScore: {
    backgroundColor: 'rgba(218, 155, 42, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(218, 155, 42, 0.3)',
    padding: 6,
    paddingHorizontal: 14,
    borderRadius: 20,
  },
  campaignListItemScoreText: {
    fontSize: 13,
    fontWeight: '700',
    color: BRAND_GOLD,
  },
  badgesContainer: {
    marginBottom: 24,
  },
  badgesTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#F9E08B',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginBottom: 12,
  },
  badgesList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  badgeItem: {
    backgroundColor: 'rgba(218, 155, 42, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(218, 155, 42, 0.3)',
    padding: 6,
    paddingHorizontal: 12,
    borderRadius: 20,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  badgeText: {
    fontSize: 12,
    fontWeight: '700',
    color: BRAND_GOLD,
  },
  empty: { height: 200, alignItems: 'center', justifyContent: 'center' },
  emptyText: { color: '#F9E08B', marginTop: 10 },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#F9E08B',
    marginTop: 12,
    marginBottom: 6,
  },
  emptySubtitle: {
    fontSize: 13,
    color: '#F9E08B',
  },
  postMenuBtn: {
    position: 'absolute',
    top: 6,
    right: 6,
    backgroundColor: 'rgba(0,0,0,0.5)',
    borderRadius: 12,
    padding: 6,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  bottomSheet: {
    backgroundColor: '#0d0d0d',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingBottom: 40,
    maxHeight: '80%',
  },
  sheetHandle: {
    width: 40,
    height: 4,
    backgroundColor: '#404040',
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: 15,
    marginTop: 8,
  },
  sheetItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 15,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#262626',
    gap: 14,
  },
  sheetItemText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#F9E08B',
  },
  editModal: {
    backgroundColor: '#0d0d0d',
    borderRadius: 20,
    padding: 24,
    margin: 20,
    maxHeight: '90%',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#F9E08B',
    marginBottom: 4,
  },
  modalSubtitle: {
    fontSize: 13,
    color: '#F9E08B',
    marginBottom: 20,
  },
  formGroup: {
    marginBottom: 16,
  },
  formLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#F9E08B',
    marginBottom: 8,
  },
  mediaPreview: {
    width: '100%',
    aspectRatio: 1,
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: '#1a1a1a',
    borderWidth: 1,
    borderColor: '#262626',
  },
  mediaImage: {
    width: '100%',
    height: '100%',
  },
  videoPlaceholder: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  videoPlaceholderText: {
    marginTop: 8,
    fontSize: 14,
    color: '#F9E08B',
  },
  changeMediaBtn: {
    marginTop: 10,
    padding: 10,
    backgroundColor: '#1a1a1a',
    borderWidth: 1.5,
    borderColor: '#262626',
    borderRadius: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  changeMediaBtnText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#F9E08B',
  },
  newMediaSelectedText: {
    fontSize: 12,
    color: BRAND_GOLD,
    marginTop: 6,
    fontWeight: '600',
  },
  formHelperText: {
    fontSize: 12,
    color: '#F9E08B',
    marginTop: 4,
  },
  textInput: {
    width: '100%',
    padding: 12,
    fontSize: 15,
    color: '#F9E08B',
    borderWidth: 1.5,
    borderColor: '#262626',
    borderRadius: 12,
    minHeight: 80,
  },
  modalButtons: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 20,
  },
  modalBtn: {
    flex: 1,
    padding: 12,
    borderRadius: 12,
    alignItems: 'center',
  },
  cancelBtn: {
    backgroundColor: '#0d0d0d',
    borderWidth: 1,
    borderColor: '#262626',
  },
  cancelBtnText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#F9E08B',
  },
  saveBtn: {
    backgroundColor: BRAND_GOLD,
  },
  saveBtnText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#fff',
  },
  confirmModal: {
    backgroundColor: '#0d0d0d',
    borderRadius: 20,
    padding: 28,
    margin: 20,
    alignItems: 'center',
  },
  confirmEmoji: {
    fontSize: 44,
    marginBottom: 12,
  },
  confirmTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#F9E08B',
    marginBottom: 8,
  },
  confirmSubtitle: {
    fontSize: 14,
    color: '#F9E08B',
    marginBottom: 24,
    textAlign: 'center',
  },
  confirmButtons: {
    flexDirection: 'row',
    gap: 12,
    width: '100%',
  },
  confirmBtn: {
    flex: 1,
    padding: 12,
    borderRadius: 12,
    alignItems: 'center',
  },
  confirmCancelBtn: {
    backgroundColor: '#0d0d0d',
    borderWidth: 1,
    borderColor: '#262626',
  },
  confirmCancelBtnText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#F9E08B',
  },
  confirmDeleteBtn: {
    backgroundColor: '#EF4444',
  },
  confirmDeleteBtnText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#fff',
  },
  successToast: {
    position: 'absolute',
    bottom: 90,
    left: '50%',
    transform: [{ translateX: -50 }],
    backgroundColor: '#1C1917',
    color: '#fff',
    padding: 12,
    paddingHorizontal: 24,
    borderRadius: 24,
    zIndex: 100,
  },
  successToastText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  gamModalSheet: {
    backgroundColor: '#1A1A1A',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    borderWidth: 1,
    borderColor: '#262626',
    borderBottomWidth: 0,
    paddingTop: 8,
    maxHeight: '75%',
  },
  gamModalHandle: {
    width: 36,
    height: 4,
    backgroundcolor: '#F9E08B',
    borderRadius: 4,
    alignSelf: 'center',
    marginBottom: 4,
  },
  gamModalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  gamModalTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: '#fff',
    marginLeft: 8,
  },
});



