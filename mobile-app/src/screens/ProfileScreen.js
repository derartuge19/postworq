import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  ScrollView,
  Dimensions,
  ActivityIndicator,
  StatusBar,
  FlatList,
  Alert,
  Share,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useIsFocused } from '@react-navigation/native';
import api from '../api';
import { useAuth } from '../contexts/AuthContext';
import config from '../config';
import GamificationBar from '../components/GamificationBar';

const { width } = Dimensions.get('window');
const BRAND_GOLD = '#DA9B2A';

const mediaUrl = (url) => {
  if (!url) return null;
  if (url.startsWith('http')) return url;
  return `${config.API_BASE_URL.replace('/api', '')}${url}`;
};

export default function ProfileScreen({ navigation }) {
  const insets = useSafeAreaInsets();
  const isFocused = useIsFocused();
  const { user, logout } = useAuth();
  
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState(null);
  const [posts, setPosts] = useState([]);
  const [followers, setFollowers] = useState(0);
  const [following, setFollowing] = useState(0);
  const [activeTab, setActiveTab] = useState('posts'); // 'posts' | 'reels' | 'saved'

  const fetchProfileData = useCallback(async () => {
    if (!user) return;
    try {
      setLoading(true);
      const targetUserId = profile?.id || user.id;
      
      const [profileData, followersRaw, followingRaw] = await Promise.all([
        api.getProfile(),
        api.getFollowers(targetUserId),
        api.getFollowing(targetUserId),
      ]);

      setProfile(profileData);
      setFollowers(Array.isArray(followersRaw) ? followersRaw.length : (followersRaw.results?.length || 0));
      setFollowing(Array.isArray(followingRaw) ? followingRaw.length : (followingRaw.results?.length || 0));
      
      // Initial fetch of posts
      await fetchPosts();
    } catch (error) {
      console.error('Profile fetch error:', error);
      if (error.message.includes('404')) {
        Alert.alert('Profile Not Found', 'Your profile could not be found. Please contact support or try logging out and in again.');
      }
    } finally {
      setLoading(false);
    }
  }, [user, profile?.id]);

  const fetchPosts = async () => {
    try {
      let data;
      if (activeTab === 'saved') {
        const raw = await api.getSavedPosts();
        data = Array.isArray(raw) ? raw : (raw.results || []);
      } else if (activeTab === 'reels') {
        const raw = await api.getUserPosts(user.id);
        const rawArr = Array.isArray(raw) ? raw : (raw.results || []);
        data = rawArr.filter(p => p.media?.includes('.mp4') || p.media?.includes('/video/'));
      } else {
        const raw = await api.getUserPosts(user.id);
        data = Array.isArray(raw) ? raw : (raw.results || []);
      }
      setPosts(data);
    } catch (error) {
      console.error('Fetch posts error:', error);
    }
  };

  useEffect(() => {
    if (isFocused) {
      fetchPosts();
    }
  }, [activeTab, isFocused]);

  useEffect(() => {
    if (isFocused) {
      fetchProfileData();
    }
  }, [isFocused, fetchProfileData]);

  const renderPostItem = ({ item }) => {
    const mediaUri = item.image || item.thumbnail || item.media;
    const isVideo = item.media?.includes('.mp4') || item.media?.includes('/video/') || item.is_reel;
    
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

  return (
    <View style={styles.root}>
      <StatusBar translucent backgroundColor="transparent" barStyle="dark-content" />
      
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Gamification Section (Now at the very top) */}
        <View style={{ paddingTop: insets.top }}>
          <GamificationBar userId={user?.id} />
        </View>

        {/* Header (Now inside ScrollView, below Gamification) */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <Text style={styles.headerUsername}>@{profile?.username || user?.username || 'user'}</Text>
          </View>
          <View style={styles.headerRight}>
            <TouchableOpacity onPress={() => navigation.navigate('Settings')}>
              <Ionicons name="settings-outline" size={24} color="#000" />
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
            style={[styles.tabItem, activeTab === 'saved' && styles.activeTab]}
            onPress={() => setActiveTab('saved')}
          >
            <Ionicons name="bookmark-outline" size={22} color={activeTab === 'saved' ? BRAND_GOLD : '#666'} />
            <Text style={[styles.tabLabel, activeTab === 'saved' && styles.activeTabLabel]}>Saved</Text>
          </TouchableOpacity>
        </View>

        {/* Grid */}
        <FlatList
          data={filteredPosts}
          renderItem={renderPostItem}
          keyExtractor={item => item.id.toString()}
          numColumns={3}
          scrollEnabled={false}
          contentContainerStyle={styles.grid}
          ListEmptyComponent={
            <View style={styles.empty}>
              <Ionicons name="apps-outline" size={40} color="#ccc" />
              <Text style={styles.emptyText}>No posts yet</Text>
            </View>
          }
        />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#fff' },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingBottom: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#eee',
  },
  headerUsername: { fontSize: 18, fontWeight: '800', color: '#000' },
  profileInfo: { padding: 16 },
  mainInfoRow: { flexDirection: 'row', alignItems: 'center' },
  avatarWrap: { position: 'relative' },
  avatar: { width: 86, height: 86, borderRadius: 43, borderWidth: 2, borderColor: '#fff' },
  avatarFallback: { alignItems: 'center', justifyContent: 'center', backgroundColor: BRAND_GOLD + '20' },
  avatarInitial: { fontSize: 32, fontWeight: 'bold', color: BRAND_GOLD },
  statsRow: { flex: 1, flexDirection: 'row', justifyContent: 'space-around', marginLeft: 20 },
  statItem: { alignItems: 'center' },
  statCount: { fontSize: 18, fontWeight: '800', color: '#000' },
  statLabel: { fontSize: 12, color: '#666', marginTop: 2 },
  bioSection: { marginTop: 15 },
  fullName: { fontSize: 15, fontWeight: '700', color: '#000' },
  bioText: { fontSize: 14, color: '#333', marginTop: 4, lineHeight: 20 },
  actionButtons: { flexDirection: 'row', gap: 8, marginTop: 20 },
  editBtn: { flex: 1, height: 36, backgroundColor: '#efefef', borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
  editBtnText: { fontSize: 14, fontWeight: '700', color: '#000' },
  shareBtn: { flex: 1, height: 36, backgroundColor: '#efefef', borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
  shareBtnText: { fontSize: 14, fontWeight: '700', color: '#000' },
  tabs: {
    flexDirection: 'row',
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: '#eee',
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
  tabLabel: { fontSize: 10, fontWeight: '500', color: '#666' },
  activeTabLabel: { color: BRAND_GOLD, fontWeight: '700' },
  grid: { padding: 1 },
  postThumb: { width: width / 3 - 2, height: width / 3 - 2, margin: 1, backgroundColor: '#f0f0f0' },
  thumbImage: { width: '100%', height: '100%', objectFit: 'cover' },
  videoBadge: { position: 'absolute', top: 5, right: 5, backgroundColor: 'rgba(0,0,0,0.5)', padding: 2, borderRadius: 4 },
  empty: { height: 200, alignItems: 'center', justifyContent: 'center' },
  emptyText: { color: '#999', marginTop: 10 },
});
