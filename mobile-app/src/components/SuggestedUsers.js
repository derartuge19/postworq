import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import api from '../api';
import config from '../config';

const BRAND_GOLD = '#DA9B2A';

const mediaUrl = (url) => {
  if (!url) return null;
  if (url.startsWith('http')) return url;
  return `${config.API_BASE_URL.replace('/api', '')}${url}`;
};

export default function SuggestedUsers({ onUserPress, onDismiss }) {
  const [suggestions, setSuggestions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [followStates, setFollowStates] = useState({});

  useEffect(() => {
    fetchSuggestions();
  }, []);

  const fetchSuggestions = async () => {
    try {
      const raw = await api.getUserSuggestions();
      const all = Array.isArray(raw) ? raw : (raw?.results || []);
      const data = all.filter(u => !u.is_staff && !u.is_superuser).slice(0, 10);
      setSuggestions(data);
      const states = {};
      data.forEach(u => { states[u.id] = u.is_following || false; });
      setFollowStates(states);
    } catch (e) {
      console.error('SuggestedUsers fetch error:', e);
    } finally {
      setLoading(false);
    }
  };

  const handleFollow = async (userId) => {
    try {
      const res = await api.toggleFollow(userId);
      setFollowStates(prev => ({ ...prev, [userId]: res.following }));
    } catch (e) {
      console.error('Follow toggle error:', e);
    }
  };

  if (loading || suggestions.length === 0) return null;

  return (
    <View style={styles.wrapper}>
      <View style={styles.header}>
        <Text style={styles.title}>Suggested for you</Text>
        <TouchableOpacity onPress={onDismiss} style={styles.dismissBtn}>
          <Ionicons name="close" size={18} color="#888" />
        </TouchableOpacity>
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {suggestions.map(user => {
          const isFollowing = followStates[user.id];
          const avatar = mediaUrl(user.profile_photo);

          return (
            <TouchableOpacity
              key={user.id}
              style={styles.card}
              onPress={() => onUserPress?.(user.id)}
              activeOpacity={0.85}
            >
              {/* Avatar */}
              <View style={styles.avatarWrap}>
                {avatar ? (
                  <Image source={{ uri: avatar }} style={styles.avatar} />
                ) : (
                  <View style={[styles.avatar, styles.avatarFallback]}>
                    <Text style={styles.avatarInitial}>
                      {user.username?.[0]?.toUpperCase() || '?'}
                    </Text>
                  </View>
                )}
              </View>

              {/* Name */}
              <Text style={styles.username} numberOfLines={1}>
                {user.username}
              </Text>
              <Text style={styles.sub} numberOfLines={1}>
                {user.first_name
                  ? `${user.first_name} ${user.last_name || ''}`.trim()
                  : `${user.followers_count || 0} followers`}
              </Text>

              {/* Follow button */}
              <TouchableOpacity
                style={[styles.followBtn, isFollowing && styles.followBtnActive]}
                onPress={() => handleFollow(user.id)}
                activeOpacity={0.8}
              >
                <Ionicons
                  name={isFollowing ? 'checkmark' : 'person-add'}
                  size={13}
                  color={isFollowing ? '#555' : '#fff'}
                />
                <Text style={[styles.followText, isFollowing && styles.followTextActive]}>
                  {isFollowing ? 'Following' : 'Follow'}
                </Text>
              </TouchableOpacity>
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    marginVertical: 12,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: '#f0f0f0',
    paddingVertical: 14,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    marginBottom: 12,
  },
  title: {
    fontSize: 14,
    fontWeight: '700',
    color: '#111',
  },
  dismissBtn: {
    padding: 4,
  },
  scrollContent: {
    paddingHorizontal: 12,
    gap: 10,
  },
  card: {
    width: 130,
    backgroundColor: '#fafafa',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#efefef',
    padding: 14,
    alignItems: 'center',
  },
  avatarWrap: {
    width: 60,
    height: 60,
    borderRadius: 30,
    overflow: 'hidden',
    marginBottom: 8,
    backgroundColor: BRAND_GOLD + '20',
  },
  avatar: {
    width: '100%',
    height: '100%',
  },
  avatarFallback: {
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: BRAND_GOLD + '30',
  },
  avatarInitial: {
    fontSize: 22,
    fontWeight: '700',
    color: BRAND_GOLD,
  },
  username: {
    fontSize: 13,
    fontWeight: '700',
    color: '#111',
    marginBottom: 2,
    maxWidth: '100%',
  },
  sub: {
    fontSize: 11,
    color: '#888',
    marginBottom: 10,
    maxWidth: '100%',
  },
  followBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 8,
    backgroundColor: BRAND_GOLD,
    width: '100%',
    justifyContent: 'center',
  },
  followBtnActive: {
    backgroundColor: '#efefef',
  },
  followText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#fff',
  },
  followTextActive: {
    color: '#555',
  },
});
