import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  Image,
  ActivityIndicator,
  TextInput,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import api from '../api';

export default function DiscoverScreen({ navigation }) {
  const [reels, setReels] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredReels, setFilteredReels] = useState([]);

  useEffect(() => {
    loadTrendingReels();
  }, []);

  useEffect(() => {
    if (searchQuery) {
      const filtered = reels.filter(reel =>
        reel.caption?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        reel.user?.username?.toLowerCase().includes(searchQuery.toLowerCase())
      );
      setFilteredReels(filtered);
    } else {
      setFilteredReels(reels);
    }
  }, [searchQuery, reels]);

  const loadTrendingReels = async () => {
    try {
      setLoading(true);
      const data = await api.getReelsTrending();
      setReels(data.results || data);
      setFilteredReels(data.results || data);
    } catch (error) {
      console.error('Error loading trending reels:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleReelPress = (reel) => {
    navigation.navigate('VideoDetail', { reel });
  };

  const handleProfile = (userId) => {
    navigation.navigate('ProfileDetail', { userId });
  };

  const renderReel = ({ item }) => (
    <TouchableOpacity style={styles.reelCard} onPress={() => handleReelPress(item)}>
      {item.image ? (
        <Image source={{ uri: item.image }} style={styles.thumbnail} />
      ) : (
        <View style={[styles.thumbnail, styles.thumbnailPlaceholder]} />
      )}
      <View style={styles.reelInfo}>
        <TouchableOpacity onPress={() => handleProfile(item.user?.id)}>
          <Text style={styles.username}>@{item.user?.username || 'unknown'}</Text>
        </TouchableOpacity>
        <Text style={styles.caption} numberOfLines={2}>
          {item.caption || 'No caption'}
        </Text>
        <View style={styles.stats}>
          <View style={styles.stat}>
            <Ionicons name="heart" size={14} color="#666" />
            <Text style={styles.statText}>{item.votes || 0}</Text>
          </View>
          <View style={styles.stat}>
            <Ionicons name="chatbubble" size={14} color="#666" />
            <Text style={styles.statText}>{item.comments_count || 0}</Text>
          </View>
        </View>
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

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Discover</Text>
        <View style={styles.searchBar}>
          <Ionicons name="search" size={20} color="#999" style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search..."
            placeholderTextColor="#999"
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>
      </View>

      <FlatList
        data={filteredReels}
        renderItem={renderReel}
        keyExtractor={(item) => item.id.toString()}
        numColumns={2}
        contentContainerStyle={styles.list}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>No reels found</Text>
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0d0d0d',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e5e5',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#F9E08B',
    marginBottom: 12,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1a1a1a',
    borderRadius: 12,
    paddingHorizontal: 12,
    height: 44,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: '#F9E08B',
  },
  list: {
    padding: 8,
  },
  reelCard: {
    flex: 1,
    margin: 4,
    backgroundColor: '#0d0d0d',
    borderRadius: 8,
    overflow: 'hidden',
    elevation: 2,
    shadowcolor: '#F9E08B',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  thumbnail: {
    aspectRatio: 9/16,
    backgroundColor: '#1a1a1a',
  },
  thumbnailPlaceholder: {
    backgroundColor: '#e5e5e5',
  },
  reelInfo: {
    padding: 12,
  },
  username: {
    fontSize: 14,
    fontWeight: '600',
    color: '#F9E08B',
    marginBottom: 4,
  },
  caption: {
    fontSize: 12,
    color: '#F9E08B',
    marginBottom: 8,
  },
  stats: {
    flexDirection: 'row',
    gap: 12,
  },
  stat: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  statText: {
    fontSize: 12,
    color: '#F9E08B',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 64,
  },
  emptyText: {
    fontSize: 16,
    color: '#F9E08B',
  },
});




