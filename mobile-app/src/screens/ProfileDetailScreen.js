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
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import api from '../api';
import { useAuth } from '../contexts/AuthContext';
import config from '../config';

const { width } = Dimensions.get('window');
const BRAND_GOLD = '#DA9B2A';

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
      const [profileData, postsRaw] = await Promise.all([
        api.getUser(userId).catch(err => { console.error('getUser error:', err); return null; }),
        api.getUserPosts(userId).catch(err => { console.error('getUserPosts error:', err); return []; }),
      ]);

      if (profileData) {
        const p = profileData.user || profileData;
        setProfile(p);
        setIsFollowing(profileData.is_following || false);
      }
      setPosts(Array.isArray(postsRaw) ? postsRaw : (postsRaw.results || []));
    } catch (error) {
      console.error('Profile fetch error:', error);
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

  const isOwnProfile = currentUser?.id === userId;

  return (
    <View style={styles.root}>
      <StatusBar barStyle="dark-content" />
      
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + 10 }]}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color="#000" />
        </TouchableOpacity>
        <Text style={styles.headerUsername}>{profile?.username}</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
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
                <Text style={[styles.followBtnText, isFollowing && styles.followingBtnText]}>
                  {isFollowing ? 'Following' : 'Follow'}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.msgBtn}>
                <Text style={styles.msgBtnText}>Message</Text>
              </TouchableOpacity>
            </View>
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
        </View>

        {/* Grid */}
        <FlatList
          data={activeTab === 'reels' ? posts.filter(p => p.media?.includes('.mp4')) : posts}
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
  backBtn: { width: 40, paddingVertical: 8 },
  headerUsername: { fontSize: 16, fontWeight: '800', color: '#000' },
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
  followBtn: { flex: 1, height: 36, backgroundColor: BRAND_GOLD, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
  followingBtn: { backgroundColor: '#efefef' },
  followBtnText: { fontSize: 14, fontWeight: '700', color: '#fff' },
  followingBtnText: { color: '#000' },
  msgBtn: { flex: 1, height: 36, backgroundColor: '#efefef', borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
  msgBtnText: { fontSize: 14, fontWeight: '700', color: '#000' },
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
  },
  activeTab: { borderBottomColor: BRAND_GOLD },
  grid: { padding: 1 },
  postThumb: { width: width / 3 - 2, height: width / 3 - 2, margin: 1, backgroundColor: '#f0f0f0' },
  thumbImage: { width: '100%', height: '100%', objectFit: 'cover' },
  videoBadge: { position: 'absolute', top: 5, right: 5, backgroundColor: 'rgba(0,0,0,0.5)', padding: 2, borderRadius: 4 },
  empty: { height: 200, alignItems: 'center', justifyContent: 'center' },
  emptyText: { color: '#999', marginTop: 10 },
});
