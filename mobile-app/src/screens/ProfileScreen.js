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

export default function ProfileScreen({ navigation }) {
  const [userReels, setUserReels] = useState([]);
  const [loading, setLoading] = useState(true);
  const { user, logout, loadUser } = useAuth();

  useEffect(() => {
    if (user) {
      loadUserReels();
    }
  }, [user]);

  const loadUserReels = async () => {
    try {
      setLoading(true);
      const data = await api.getUserPosts(user?.id);
      setUserReels(data.results || data);
    } catch (error) {
      console.error('Error loading user reels:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    await logout();
  };

  const handleEditProfile = () => {
    // Navigate to edit profile screen
    // For now, just log
    console.log('Edit profile');
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

  if (!user) {
    return null;
  }

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <View style={styles.profileInfo}>
          {user.profile_photo ? (
            <Image source={{ uri: user.profile_photo }} style={styles.avatar} />
          ) : (
            <View style={[styles.avatar, styles.avatarPlaceholder]}>
              <Text style={styles.avatarText}>
                {user.username?.[0]?.toUpperCase() || 'U'}
              </Text>
            </View>
          )}
          <View style={styles.stats}>
            <View style={styles.stat}>
              <Text style={styles.statValue}>{user.reels_count || 0}</Text>
              <Text style={styles.statLabel}>Reels</Text>
            </View>
            <View style={styles.stat}>
              <Text style={styles.statValue}>{user.followers_count || 0}</Text>
              <Text style={styles.statLabel}>Followers</Text>
            </View>
            <View style={styles.stat}>
              <Text style={styles.statValue}>{user.following_count || 0}</Text>
              <Text style={styles.statLabel}>Following</Text>
            </View>
          </View>
        </View>

        <Text style={styles.username}>@{user.username}</Text>
        <Text style={styles.fullName}>
          {user.first_name} {user.last_name}
        </Text>
        {user.bio && <Text style={styles.bio}>{user.bio}</Text>}

        <View style={styles.actions}>
          <TouchableOpacity style={styles.editButton} onPress={handleEditProfile}>
            <Text style={styles.editButtonText}>Edit Profile</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
            <Ionicons name="log-out-outline" size={20} color="#000" />
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.tabs}>
        <TouchableOpacity style={styles.tab}>
          <Ionicons name="grid" size={24} color="#000" />
        </TouchableOpacity>
        <TouchableOpacity style={styles.tab}>
          <Ionicons name="heart-outline" size={24} color="#999" />
        </TouchableOpacity>
      </View>

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#000" />
        </View>
      ) : (
        <FlatList
          data={userReels}
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
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
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
  actions: {
    flexDirection: 'row',
    gap: 12,
  },
  editButton: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
    padding: 12,
    alignItems: 'center',
  },
  editButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#000',
  },
  logoutButton: {
    width: 48,
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
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
  loadingContainer: {
    paddingVertical: 32,
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
