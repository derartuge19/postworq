import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, FlatList, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import api from '../api';

const GOLD = '#C8B56A', BG = '#0D0D0D', CARD = '#1A1A1A', BORDER = '#262626';

export default function UserSuggestions({ onUserClick }) {
  const [suggestions, setSuggestions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [followingStates, setFollowingStates] = useState({});

  useEffect(() => {
    if (api.hasToken()) {
      fetchSuggestions();
    } else {
      setLoading(false);
    }
  }, []);

  const fetchSuggestions = async () => {
    try {
      setLoading(true);
      const raw = await api.getUserSuggestions();
      const all = Array.isArray(raw) ? raw : (raw.results || []);
      const data = all.filter(u => !u.is_staff && !u.is_superuser);
      setSuggestions(data);

      const states = {};
      data.forEach(user => {
        states[user.id] = user.is_following || false;
      });
      setFollowingStates(states);
    } catch (error) {
      setSuggestions([]);
    } finally {
      setLoading(false);
    }
  };

  const handleFollowToggle = async (userId) => {
    try {
      const response = await api.toggleFollow(userId);
      setFollowingStates(prev => ({
        ...prev,
        [userId]: response.following
      }));

      setSuggestions(prev => prev.map(user => 
        user.id === userId 
          ? { ...user, followers_count: user.followers_count + (response.following ? 1 : -1) }
          : user
      ));
    } catch (error) {
      console.error("Failed to toggle follow:", error);
    }
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <Text style={styles.title}>Suggested for you</Text>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="small" color={GOLD} />
        </View>
      </View>
    );
  }

  if (suggestions.length === 0) {
    return null;
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Suggested for you</Text>
      <FlatList
        data={suggestions.slice(0, 5)}
        keyExtractor={item => String(item.id)}
        renderItem={({ item }) => {
          const isFollowing = followingStates[item.id];
          return (
            <View style={styles.suggestionItem}>
              <TouchableOpacity
                style={styles.userInfo}
                onPress={() => onUserClick?.(item)}
              >
                <View style={styles.avatar}>
                  <Text style={styles.avatarText}>👤</Text>
                </View>
                <View style={styles.userDetails}>
                  <Text style={styles.username}>{item.username}</Text>
                  <Text style={styles.followers}>{item.followers_count} followers</Text>
                </View>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.followButton, isFollowing && styles.followingButton]}
                onPress={() => handleFollowToggle(item.id)}
              >
                <Ionicons 
                  name={isFollowing ? "checkmark" : "add"} 
                  size={14} 
                  color={isFollowing ? GOLD : '#000'} 
                />
                <Text style={[styles.followButtonText, isFollowing && styles.followingButtonText]}>
                  {isFollowing ? 'Following' : 'Follow'}
                </Text>
              </TouchableOpacity>
            </View>
          );
        }}
        scrollEnabled={false}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 16,
    paddingBottom: 8,
  },
  title: {
    fontSize: 14,
    fontWeight: '700',
    color: '#fff',
    marginBottom: 12,
  },
  loadingContainer: {
    padding: 20,
    alignItems: 'center',
  },
  suggestionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: BORDER,
  },
  userInfo: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: GOLD + '30',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    fontSize: 18,
  },
  userDetails: {
    flex: 1,
  },
  username: {
    fontSize: 13,
    fontWeight: '700',
    color: '#fff',
  },
  followers: {
    fontSize: 11,
    color: '#888',
  },
  followButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    backgroundColor: GOLD,
  },
  followingButton: {
    backgroundColor: 'rgba(249,224,139,0.15)',
    borderWidth: 1.5,
    borderColor: 'rgba(249,224,139,0.6)',
  },
  followButtonText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#000',
  },
  followingButtonText: {
    color: GOLD,
  },
});
