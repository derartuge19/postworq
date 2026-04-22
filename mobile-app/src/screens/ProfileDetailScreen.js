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
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import api from '../api';
import { useAuth } from '../contexts/AuthContext';

export default function ProfileDetailScreen({ route, navigation }) {
  const { userId } = route.params;
  const [profile, setProfile] = useState(null);
  const [reels, setReels] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isFollowing, setIsFollowing] = useState(false);
  const { user: currentUser } = useAuth();

  useEffect(() => {
    loadProfile();
  }, [userId]);

  const loadProfile = async () => {
    try {
      setLoading(true);
      const [profileData, reelsData] = await Promise.all([
        api.getUser(userId),
        api.getUserPosts(userId),
      ]);
      setProfile(profileData.user || profileData);
      setReels(reelsData.results || reelsData);
      setIsFollowing(profileData.is_following || false);
    } catch (error) {
      console.error('Error loading profile:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleFollow = async () => {
    try {
      await api.toggleFollow(userId);
      setIsFollowing(!isFollowing);
      setProfile({
        ...profile,
        followers_count: isFollowing 
          ? profile.followers_count - 1 
          : profile.followers_count + 1,
      });
    } catch (error) {
      console.error('Error toggling follow:', error);
    }
  };

  const renderReel = ({ item }) => (
    <TouchableOpacity style={styles.reelItem}>
      {item.image ? (
        <Image source={{ uri: item.image }} style={styles.reelThumbnail} />
      ) : (
        <View style={[styles.reelThumbnail, styles.thumbnailPlaceholder]} />
      )}
      <View style={styles.reelStats}>
        <Ionicons name="heart" size={14} color="#fff" />
        <Text style={styles.reelStatsText}>{item.votes || 0}</Text>
      </View>
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#000" />
      </View>
    );
  }

  if (!profile) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.errorText}>Profile not found</Text>
      </View>
    );
  }

  const isOwnProfile = currentUser?.id === userId;

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <View style={styles.profileInfo}>
          {profile.profile_photo ? (
            <Image source={{ uri: profile.profile_photo }} style={styles.avatar} />
          ) : (
            <View style={[styles.avatar, styles.avatarPlaceholder]}>
              <Text style={styles.avatarText}>
                {profile.username?.[0]?.toUpperCase() || 'U'}
              </Text>
            </View>
          )}
          <View style={styles.stats}>
            <View style={styles.stat}>
              <Text style={styles.statValue}>{profile.reels_count || 0}</Text>
              <Text style={styles.statLabel}>Reels</Text>
            </View>
            <View style={styles.stat}>
              <Text style={styles.statValue}>{profile.followers_count || 0}</Text>
              <Text style={styles.statLabel}>Followers</Text>
            </View>
            <View style={styles.stat}>
              <Text style={styles.statValue}>{profile.following_count || 0}</Text>
              <Text style={styles.statLabel}>Following</Text>
            </View>
          </View>
        </View>

        <Text style={styles.username}>@{profile.username}</Text>
        <Text style={styles.fullName}>
          {profile.first_name} {profile.last_name}
        </Text>
        {profile.bio && <Text style={styles.bio}>{profile.bio}</Text>}

        {!isOwnProfile && (
          <TouchableOpacity
            style={[styles.followButton, isFollowing && styles.followingButton]}
            onPress={handleToggleFollow}
          >
            <Text style={[styles.followButtonText, isFollowing && styles.followingButtonText]}>
              {isFollowing ? 'Following' : 'Follow'}
            </Text>
          </TouchableOpacity>
        )}
      </View>

      <View style={styles.tabs}>
        <TouchableOpacity style={styles.tab}>
          <Ionicons name="grid" size={24} color="#000" />
        </TouchableOpacity>
        <TouchableOpacity style={styles.tab}>
          <Ionicons name="heart-outline" size={24} color="#999" />
        </TouchableOpacity>
      </View>

      <FlatList
        data={reels}
        renderItem={renderReel}
        keyExtractor={(item) => item.id.toString()}
        numColumns={3}
        contentContainerStyle={styles.reelsGrid}
        scrollEnabled={false}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>No reels yet</Text>
          </View>
        }
      />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorText: {
    fontSize: 16,
    color: '#999',
  },
  header: {
    padding: 24,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e5e5',
  },
  profileInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    marginRight: 24,
  },
  avatarPlaceholder: {
    backgroundColor: '#f5f5f5',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#999',
  },
  stats: {
    flexDirection: 'row',
    flex: 1,
    justifyContent: 'space-around',
  },
  stat: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#000',
  },
  statLabel: {
    fontSize: 12,
    color: '#666',
  },
  username: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#000',
    marginBottom: 4,
  },
  fullName: {
    fontSize: 16,
    color: '#000',
    marginBottom: 4,
  },
  bio: {
    fontSize: 14,
    color: '#666',
    marginBottom: 16,
  },
  followButton: {
    backgroundColor: '#000',
    borderRadius: 8,
    padding: 12,
    alignItems: 'center',
  },
  followingButton: {
    backgroundColor: '#f5f5f5',
  },
  followButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#fff',
  },
  followingButtonText: {
    color: '#000',
  },
  tabs: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e5e5',
  },
  tab: {
    flex: 1,
    padding: 16,
    alignItems: 'center',
  },
  reelsGrid: {
    padding: 2,
  },
  reelItem: {
    flex: 1,
    aspectRatio: 1,
    margin: 1,
    position: 'relative',
  },
  reelThumbnail: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  thumbnailPlaceholder: {
    backgroundColor: '#e5e5e5',
  },
  reelStats: {
    position: 'absolute',
    bottom: 4,
    left: 4,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  reelStatsText: {
    fontSize: 12,
    color: '#fff',
    fontWeight: '600',
  },
  emptyContainer: {
    paddingVertical: 64,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 16,
    color: '#999',
  },
});
