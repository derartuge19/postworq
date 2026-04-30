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
} from 'react-native';
import { Image } from 'expo-image';
import { FlashList } from '@shopify/flash-list';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import api from '../api';
import { useAuth } from '../contexts/AuthContext';
import config from '../config';

const { width } = Dimensions.get('window');
const BRAND_GOLD = '#C8B56A';

const mediaUrl = (url) => {
  if (!url) return null;
  if (url.startsWith('http')) return url;
  return `${config.API_BASE_URL.replace('/api', '')}${url}`;
};

export default function ProfileDetailScreen({ route, navigation }) {
  const { userId } = route.params;
  const insets = useSafeAreaInsets();
  const { user: currentUser } = useAuth();
  
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState(null);
  const [posts, setPosts] = useState([]);
  const [isFollowing, setIsFollowing] = useState(false);
  const [activeTab, setActiveTab] = useState('posts');

  const fetchProfileData = useCallback(async () => {
    try {
      setLoading(true);
      const postsRaw = await api.getUserPosts(userId).catch(err => { console.error('getUserPosts error:', err); return []; });
      
      const posts = Array.isArray(postsRaw) ? postsRaw : (postsRaw.results || []);
      setPosts(posts);

      // Extract user data from posts instead of calling getUser endpoint
      let userProfile = null;
      if (posts.length > 0) {
        const userFromPosts = posts[0].user;
        if (userFromPosts) {
          userProfile = userFromPosts;
          setIsFollowing(userFromPosts.is_following || false);
        }
      } else {
        // If no posts, set a minimal profile
        userProfile = { id: userId, username: 'Unknown' };
        setIsFollowing(false);
      }

      // Fetch follower/following counts separately
      try {
        const followersData = await api.getFollowers(userId).catch(() => ({ results: [] }));
        const followingData = await api.getFollowing(userId).catch(() => ({ results: [] }));
        
        const followersCount = Array.isArray(followersData) ? followersData.length : (followersData.count || followersData.results?.length || 0);
        const followingCount = Array.isArray(followingData) ? followingData.length : (followingData.count || followingData.results?.length || 0);
        
        setProfile({
          ...userProfile,
          followers_count: userProfile?.followers_count || followersCount,
          following_count: userProfile?.following_count || followingCount,
        });
      } catch (error) {
        console.error('Failed to fetch follow counts:', error);
        setProfile(userProfile);
      }
    } catch (error) {
      console.error('Profile fetch error:', error);
      setProfile({ id: userId, username: 'Unknown' });
      setIsFollowing(false);
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    fetchProfileData();
  }, [fetchProfileData]);

  const handleToggleFollow = async () => {
    try {
      const next = !isFollowing;
      setIsFollowing(next);
      setProfile(prev => ({
        ...prev,
        followers_count: next ? (prev.followers_count || 0) + 1 : (prev.followers_count || 1) - 1
      }));
      await api.toggleFollow(userId);
    } catch (error) {
      setIsFollowing(!isFollowing);
    }
  };

  const renderPostItem = ({ item }) => {
    const mediaUri = item.image || item.thumbnail || item.media;
    const isVideo = item.media?.includes('.mp4') || item.media?.includes('/video/') || item.is_reel;
    
    return (
      <TouchableOpacity 
        style={styles.postThumb}
        onPress={() => navigation.navigate('ReelsDetail', { reelId: item.id })}
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
      </TouchableOpacity>
    );
  };

  if (loading && !profile) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={BRAND_GOLD} />
      </View>
    );
  }

  const isOwnProfile = currentUser?.id === userId;

  return (
    <View style={styles.root}>
      <StatusBar translucent backgroundColor="transparent" barStyle="dark-content" />
      
      <ScrollView showsVerticalScrollIndicator={false} style={{ paddingTop: insets.top }}>
        {/* Profile Info */}
        <View style={styles.profileInfo}>
          <View style={styles.mainInfoRow}>
            <View style={styles.avatarWrap}>
              {profile?.profile_photo ? (
                <Image source={{ uri: mediaUrl(profile.profile_photo) }} style={styles.avatar} />
              ) : (
                <View style={[styles.avatar, styles.avatarFallback]}>
                  <Text style={styles.avatarInitial}>{profile?.username?.[0]?.toUpperCase()}</Text>
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
                onPress={() => navigation.navigate('FollowList', { userId: profile?.id, type: 'followers' })}
              >
                <Text style={styles.statCount}>{profile?.followers_count || 0}</Text>
                <Text style={styles.statLabel}>Followers</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={styles.statItem}
                onPress={() => navigation.navigate('FollowList', { userId: profile?.id, type: 'following' })}
              >
                <Text style={styles.statCount}>{profile?.following_count || 0}</Text>
                <Text style={styles.statLabel}>Following</Text>
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.bioSection}>
            <Text style={styles.fullName}>{profile?.first_name} {profile?.last_name}</Text>
            {profile?.bio && <Text style={styles.bioText}>{profile.bio}</Text>}
          </View>

          {!isOwnProfile && (
            <View style={styles.actionButtons}>
              <TouchableOpacity 
                style={[styles.followBtn, isFollowing && styles.followingBtn]}
                onPress={handleToggleFollow}
              >
                <Ionicons name={isFollowing ? "checkmark" : "add"} size={16} color={isFollowing ? "#000" : "#fff"} style={{ marginRight: 6 }} />
                <Text style={[styles.followBtnText, isFollowing && styles.followingBtnText]}>
                  {isFollowing ? 'Following' : 'Follow'}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.iconBtn} onPress={() => navigation.goBack()}>
                <Ionicons name="chevron-back" size={18} color="#C8B56A" />
              </TouchableOpacity>
              <TouchableOpacity style={styles.iconBtn} onPress={() => {/* Share functionality */}}>
                <Ionicons name="share-social" size={18} color="#000" />
              </TouchableOpacity>
              <TouchableOpacity style={[styles.iconBtn, styles.reportBtn]} onPress={() => {/* Report functionality */}}>
                <Ionicons name="flag-outline" size={18} color="#EF4444" />
              </TouchableOpacity>
            </View>
          )}

          {isOwnProfile && (
            <TouchableOpacity 
              style={styles.editProfileBtn}
              onPress={() => navigation.navigate('Profile')}
            >
              <Ionicons name="create-outline" size={16} color="#000" style={{ marginRight: 8 }} />
              <Text style={styles.editProfileBtnText}>Edit Profile</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Tabs */}
        <View style={styles.tabs}>
          <TouchableOpacity 
            style={[styles.tabItem, activeTab === 'posts' && styles.activeTab]}
            onPress={() => setActiveTab('posts')}
          >
            <Ionicons name="grid-outline" size={22} color={activeTab === 'posts' ? BRAND_GOLD : '#666'} />
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.tabItem, activeTab === 'reels' && styles.activeTab]}
            onPress={() => setActiveTab('reels')}
          >
            <Ionicons name="film-outline" size={22} color={activeTab === 'reels' ? BRAND_GOLD : '#666'} />
          </TouchableOpacity>
          {isOwnProfile && (
            <TouchableOpacity 
              style={[styles.tabItem, activeTab === 'saved' && styles.activeTab]}
              onPress={() => setActiveTab('saved')}
            >
              <Ionicons name="bookmark-outline" size={22} color={activeTab === 'saved' ? BRAND_GOLD : '#666'} />
            </TouchableOpacity>
          )}
        </View>

        {/* Grid */}
        <FlashList
          data={activeTab === 'reels' ? posts.filter(p => {
            const url = p.media || p.image || '';
            return url.match(/\.(mp4|webm|ogg|mov)$/i) || url.includes('video') || p.is_reel;
          }) : posts}
          renderItem={renderPostItem}
          keyExtractor={item => item.id.toString()}
          numColumns={3}
          scrollEnabled={false}
          contentContainerStyle={styles.grid}
          estimatedItemSize={width / 3}
          ListEmptyComponent={
            <View style={styles.empty}>
              <Ionicons name="apps-outline" size={40} color="#ccc" />
              <Text style={styles.emptyText}>
                {activeTab === 'reels' ? 'No reels yet' : activeTab === 'saved' ? 'No saved posts' : 'No posts yet'}
              </Text>
            </View>
          }
        />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#0B0B0C' },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  profileInfo: { padding: 20 },
  mainInfoRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 20 },
  avatarWrap: { position: 'relative', flexShrink: 0 },
  avatar: { width: 80, height: 80, borderRadius: 40, borderWidth: 2, borderColor: '#fff' },
  avatarFallback: { alignItems: 'center', justifyContent: 'center', backgroundColor: BRAND_GOLD + '30' },
  avatarInitial: { fontSize: 32, fontWeight: 'bold', color: BRAND_GOLD },
  statsRow: { flex: 1, flexDirection: 'row', justifyContent: 'space-around', marginLeft: 20, marginBottom: 12 },
  statItem: { alignItems: 'center' },
  statCount: { fontSize: 18, fontWeight: '700', color: '#C8B56A' },
  statLabel: { fontSize: 13, color: '#C8B56A', marginTop: 2 },
  bioSection: { marginBottom: 16 },
  fullName: { fontSize: 15, fontWeight: '700', color: '#C8B56A', marginBottom: 4 },
  bioText: { fontSize: 14, color: '#C8B56A', lineHeight: 20 },
  actionButtons: { flexDirection: 'row', gap: 8 },
  followBtn: { flex: 1, height: 36, backgroundColor: BRAND_GOLD, borderRadius: 8, alignItems: 'center', justifyContent: 'center', flexDirection: 'row', paddingHorizontal: 20 },
  followingBtn: { backgroundColor: '#0B0B0C', borderWidth: 1, borderColor: '#e5e5e5' },
  followBtnText: { fontSize: 14, fontWeight: '700', color: '#fff' },
  followingBtnText: { color: '#C8B56A' },
  iconBtn: { 
    width: 40, 
    height: 36, 
    backgroundColor: '#0B0B0C', 
    borderWidth: 1, 
    borderColor: '#e5e5e5', 
    borderRadius: 8, 
    alignItems: 'center', 
    justifyContent: 'center' 
  },
  reportBtn: { borderColor: '#e5e5e5' },
  editProfileBtn: { 
    width: '100%', 
    height: 36, 
    backgroundColor: '#0B0B0C', 
    borderWidth: 1, 
    borderColor: '#e5e5e5', 
    borderRadius: 8, 
    alignItems: 'center', 
    justifyContent: 'center', 
    flexDirection: 'row',
    marginTop: 20,
  },
  editProfileBtnText: { fontSize: 14, fontWeight: '700', color: '#C8B56A' },
  tabs: {
    flexDirection: 'row',
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: '#eee',
  },
  tabItem: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  activeTab: { borderBottomColor: BRAND_GOLD },
  grid: { padding: 1 },
  postThumb: { width: width / 3 - 2, height: width / 3 - 2, margin: 1, backgroundColor: '#f0f0f0' },
  thumbImage: { width: '100%', height: '100%' },
  videoBadge: { position: 'absolute', top: 5, right: 5, backgroundColor: 'rgba(0,0,0,0.5)', padding: 2, borderRadius: 4 },
  empty: { height: 200, alignItems: 'center', justifyContent: 'center' },
  emptyText: { color: '#C8B56A', marginTop: 10 },
});





