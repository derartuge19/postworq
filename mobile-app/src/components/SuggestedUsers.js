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

const BRAND_GOLD = '#F9E08B';
const BG = '#1A1A1A';
const CARD_BG = '#1A1A1A';

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
          <Ionicons name="close" size={16} color="#999" />
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
                  <Text style={styles.avatarFallback}>👤</Text>
                )}
              </View>

              {/* Name */}
              <Text style={styles.username} numberOfLines={1}>
                {user.username}
              </Text>
              <Text style={styles.sub} numberOfLines={1}>
                {user.first_name
                  ? `${user.first_name} ${user.last_name || ''}`.trim()
                  : 'Suggested for you'}
              </Text>

              {/* Follow button */}
              <TouchableOpacity
                style={[styles.followBtn, isFollowing && styles.followBtnActive]}
                onPress={() => handleFollow(user.id)}
                activeOpacity={0.8}
              >
                <Ionicons
                  name={isFollowing ? 'checkmark-circle' : 'person-add'}
                  size={14}
                  color={isFollowing ? BRAND_GOLD : '#000'}
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
    marginVertical: 8,
    marginHorizontal: 0,
    backgroundColor: CARD_BG,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: 'rgba(226,179,85,0.35)',
    paddingVertical: 16,
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
    color: '#fff',
  },
  dismissBtn: {
    padding: 4,
  },
  scrollContent: {
    paddingHorizontal: 16,
    gap: 12,
  },
  card: {
    width: 150,
    minWidth: 150,
    backgroundColor: CARD_BG,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: 'rgba(226,179,85,0.35)',
    padding: 16,
    alignItems: 'center',
  },
  avatarWrap: {
    width: 70,
    height: 70,
    minWidth: 70,
    minHeight: 70,
    borderRadius: 35,
    overflow: 'hidden',
    marginBottom: 10,
    backgroundColor: 'rgba(249,224,139,0.2)',
    borderWidth: 2,
    borderColor: CARD_BG,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatar: {
    width: '100%',
    height: '100%',
  },
  avatarFallback: {
    fontSize: 24,
  },
  username: {
    fontSize: 13,
    fontWeight: '700',
    color: '#fff',
    marginBottom: 2,
    maxWidth: '100%',
  },
  sub: {
    fontSize: 11,
    color: '#999',
    marginBottom: 12,
    maxWidth: '100%',
  },
  followBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 0,
    paddingVertical: 7,
    borderRadius: 8,
    backgroundColor: BRAND_GOLD,
    width: '100%',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: 'transparent',
  },
  followBtnActive: {
    backgroundColor: 'rgba(249,224,139,0.15)',
    borderColor: 'rgba(249,224,139,0.6)',
  },
  followText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#000',
  },
  followTextActive: {
    color: BRAND_GOLD,
  },
});

