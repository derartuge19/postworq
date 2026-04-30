import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, Image, FlatList,
  ActivityIndicator, ScrollView, Dimensions, Alert, RefreshControl,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '../contexts/AuthContext';
import api from '../api';

const { width } = Dimensions.get('window');
const GOLD = '#C8B56A';
const BG = '#0D0D0D';
const CARD = '#1A1A1A';
const BORDER = '#262626';
const COLS = 3;
const ITEM_SIZE = (width - 4) / COLS;

export default function ProfileScreen({ navigation, route }) {
  const insets = useSafeAreaInsets();
  const { user: authUser, logout } = useAuth();
  const targetUserId = route?.params?.userId || authUser?.id;
  const isOwnProfile = !route?.params?.userId || route?.params?.userId === authUser?.id;

  const [profile, setProfile] = useState(null);
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [isFollowing, setIsFollowing] = useState(false);
  const [activeTab, setActiveTab] = useState('posts');
  const [followersCount, setFollowersCount] = useState(0);
  const [followingCount, setFollowingCount] = useState(0);

  useEffect(() => { loadProfile(); }, [targetUserId]);

  const loadProfile = async () => {
    try {
      setLoading(true);
      const [profileData, postsData] = await Promise.all([
        api.request(`/profile/${targetUserId}/`),
        api.request(`/reels/?user=${targetUserId}`),
      ]);
      setProfile(profileData);
      setPosts(Array.isArray(postsData) ? postsData : (postsData.results || []));
      setFollowersCount(profileData.followers_count || 0);
      setFollowingCount(profileData.following_count || 0);
      setIsFollowing(profileData.is_following || false);
    } catch (e) { console.error('Profile error:', e); }
    finally { setLoading(false); setRefreshing(false); }
  };

  const toggleFollow = async () => {
    const prev = isFollowing;
    setIsFollowing(!prev);
    setFollowersCount(c => prev ? c - 1 : c + 1);
    try {
      await api.request('/follows/toggle/', { method: 'POST', body: JSON.stringify({ following_id: targetUserId }) });
    } catch {
      setIsFollowing(prev);
      setFollowersCount(c => prev ? c + 1 : c - 1);
    }
  };

  const handleLogout = () => {
    Alert.alert('Logout', 'Are you sure you want to logout?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Logout', style: 'destructive', onPress: logout },
    ]);
  };

  if (loading) return (
    <View style={[styles.container, { justifyContent: 'center', alignItems: 'center', paddingTop: insets.top }]}>
      <ActivityIndicator size="large" color={GOLD} />
    </View>
  );

  const renderPost = ({ item }) => (
    <TouchableOpacity
      style={styles.gridItem}
      onPress={() => navigation.navigate('ReelsDetail', { initialVideoId: item.id })}
    >
      {item.thumbnail_url || item.image_url
        ? <Image source={{ uri: item.thumbnail_url || item.image_url }} style={styles.gridImage} resizeMode="cover" />
        : <View style={[styles.gridImage, { backgroundColor: '#222', justifyContent: 'center', alignItems: 'center' }]}>
            <Ionicons name={item.video_url ? 'play' : 'image'} size={24} color="#444" />
          </View>}
      {item.video_url && (
        <View style={styles.videoIcon}>
          <Ionicons name="play" size={10} color="#fff" />
        </View>
      )}
    </TouchableOpacity>
  );

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.header}>
        {!isOwnProfile && (
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Ionicons name="chevron-back" size={24} color={GOLD} />
          </TouchableOpacity>
        )}
        <Text style={styles.headerTitle}>{profile?.username || 'Profile'}</Text>
        {isOwnProfile
          ? <TouchableOpacity onPress={handleLogout}>
              <Ionicons name="log-out-outline" size={24} color={GOLD} />
            </TouchableOpacity>
          : <View style={{ width: 24 }} />}
      </View>

      <ScrollView
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); loadProfile(); }} tintColor={GOLD} />}
        showsVerticalScrollIndicator={false}
      >
        {/* Profile info */}
        <View style={styles.profileInfo}>
          {profile?.profile_photo
            ? <Image source={{ uri: profile.profile_photo }} style={styles.avatar} />
            : <View style={[styles.avatar, { backgroundColor: GOLD, justifyContent: 'center', alignItems: 'center' }]}>
                <Text style={{ color: '#000', fontSize: 32, fontWeight: '700' }}>{(profile?.username || '?')[0].toUpperCase()}</Text>
              </View>}

          <Text style={styles.displayName}>{profile?.first_name ? `${profile.first_name} ${profile.last_name || ''}`.trim() : profile?.username}</Text>
          <Text style={styles.usernameText}>@{profile?.username}</Text>
          {!!profile?.bio && <Text style={styles.bio}>{profile.bio}</Text>}

          {/* Stats */}
          <View style={styles.stats}>
            <View style={styles.statItem}>
              <Text style={styles.statNum}>{posts.length}</Text>
              <Text style={styles.statLabel}>Posts</Text>
            </View>
            <TouchableOpacity style={styles.statItem} onPress={() => navigation.navigate('FollowList', { userId: targetUserId, type: 'followers' })}>
              <Text style={styles.statNum}>{followersCount}</Text>
              <Text style={styles.statLabel}>Followers</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.statItem} onPress={() => navigation.navigate('FollowList', { userId: targetUserId, type: 'following' })}>
              <Text style={styles.statNum}>{followingCount}</Text>
              <Text style={styles.statLabel}>Following</Text>
            </TouchableOpacity>
          </View>

          {/* Action buttons */}
          {isOwnProfile ? (
            <View style={styles.actionRow}>
              <TouchableOpacity style={styles.editBtn} onPress={() => navigation.navigate('EditProfile')}>
                <Text style={styles.editBtnText}>Edit Profile</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.walletBtn} onPress={() => navigation.navigate('Wallet')}>
                <Ionicons name="wallet-outline" size={18} color={GOLD} />
              </TouchableOpacity>
              <TouchableOpacity style={styles.walletBtn} onPress={() => navigation.navigate('Settings')}>
                <Ionicons name="settings-outline" size={18} color={GOLD} />
              </TouchableOpacity>
            </View>
          ) : (
            <View style={styles.actionRow}>
              <TouchableOpacity
                style={[styles.followBtn, isFollowing && styles.followingBtn]}
                onPress={toggleFollow}
              >
                <Text style={[styles.followBtnText, isFollowing && styles.followingBtnText]}>
                  {isFollowing ? 'Following' : 'Follow'}
                </Text>
              </TouchableOpacity>
            </View>
          )}
        </View>

        {/* Tabs */}
        <View style={styles.tabs}>
          {['posts', 'reels'].map(tab => (
            <TouchableOpacity key={tab} style={styles.tabBtn} onPress={() => setActiveTab(tab)}>
              <Ionicons
                name={tab === 'posts' ? 'grid-outline' : 'film-outline'}
                size={22}
                color={activeTab === tab ? GOLD : '#666'}
              />
              {activeTab === tab && <View style={styles.tabIndicator} />}
            </TouchableOpacity>
          ))}
        </View>

        {/* Posts grid */}
        <View style={styles.grid}>
          {posts.filter(p => activeTab === 'reels' ? !!p.video_url : true).map((item, i) => renderPost({ item, index: i }))}
        </View>

        {posts.length === 0 && (
          <View style={{ padding: 40, alignItems: 'center' }}>
            <Ionicons name="images-outline" size={48} color="#333" />
            <Text style={{ color: '#666', marginTop: 12 }}>No posts yet</Text>
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: BG },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: BORDER },
  headerTitle: { fontSize: 17, fontWeight: '700', color: '#fff' },
  profileInfo: { alignItems: 'center', padding: 20 },
  avatar: { width: 90, height: 90, borderRadius: 45, borderWidth: 3, borderColor: GOLD, marginBottom: 12 },
  displayName: { fontSize: 18, fontWeight: '800', color: '#fff', marginBottom: 2 },
  usernameText: { fontSize: 14, color: '#888', marginBottom: 8 },
  bio: { fontSize: 14, color: '#ccc', textAlign: 'center', lineHeight: 20, marginBottom: 16, paddingHorizontal: 20 },
  stats: { flexDirection: 'row', gap: 32, marginBottom: 16 },
  statItem: { alignItems: 'center' },
  statNum: { fontSize: 18, fontWeight: '800', color: '#fff' },
  statLabel: { fontSize: 12, color: '#888', marginTop: 2 },
  actionRow: { flexDirection: 'row', gap: 10, alignItems: 'center' },
  editBtn: { flex: 1, paddingVertical: 9, borderRadius: 10, borderWidth: 1.5, borderColor: BORDER, alignItems: 'center' },
  editBtnText: { color: '#fff', fontWeight: '700', fontSize: 14 },
  walletBtn: { width: 40, height: 40, borderRadius: 10, borderWidth: 1.5, borderColor: BORDER, justifyContent: 'center', alignItems: 'center' },
  followBtn: { paddingHorizontal: 40, paddingVertical: 10, borderRadius: 10, backgroundColor: GOLD },
  followingBtn: { backgroundColor: 'transparent', borderWidth: 1.5, borderColor: BORDER },
  followBtnText: { color: '#000', fontWeight: '700', fontSize: 14 },
  followingBtnText: { color: '#fff' },
  tabs: { flexDirection: 'row', borderTopWidth: 1, borderTopColor: BORDER, borderBottomWidth: 1, borderBottomColor: BORDER },
  tabBtn: { flex: 1, alignItems: 'center', paddingVertical: 12, position: 'relative' },
  tabIndicator: { position: 'absolute', bottom: 0, left: '25%', right: '25%', height: 2, backgroundColor: GOLD },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 2, paddingHorizontal: 2 },
  gridItem: { width: ITEM_SIZE, height: ITEM_SIZE, position: 'relative' },
  gridImage: { width: '100%', height: '100%' },
  videoIcon: { position: 'absolute', top: 6, right: 6, backgroundColor: 'rgba(0,0,0,0.5)', borderRadius: 4, padding: 2 },
});
