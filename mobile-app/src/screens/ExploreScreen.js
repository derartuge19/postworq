import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, StyleSheet, TextInput, TouchableOpacity, FlatList,
  Image, ActivityIndicator, Dimensions, ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import api from '../api';

const { width } = Dimensions.get('window');
const GOLD = '#C8B56A';
const BG = '#0D0D0D';
const CARD = '#1A1A1A';
const BORDER = '#262626';
const COLS = 3;
const ITEM_SIZE = (width - 4) / COLS;

const CATEGORIES = ['Trending', 'Dance', 'Comedy', 'Sports', 'Food', 'Travel', 'Art', 'Gaming', 'Beauty', 'Fashion'];
const TIME_RANGES = [{ label: '24h', value: '24h' }, { label: '7 days', value: '7d' }, { label: '30 days', value: '30d' }];

export default function ExploreScreen({ navigation }) {
  const insets = useSafeAreaInsets();
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState('Trending');
  const [timeRange, setTimeRange] = useState('7d');
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchResults, setSearchResults] = useState(null);
  const [searching, setSearching] = useState(false);
  const [hashtags, setHashtags] = useState([]);

  useEffect(() => { fetchTrending(); fetchHashtags(); }, [category, timeRange]);

  const fetchTrending = async () => {
    setLoading(true);
    try {
      const cat = category === 'Trending' ? 'all' : category.toLowerCase();
      const data = await api.request(`/explorer/trending/?category=${cat}&time_range=${timeRange}&limit=30`);
      setItems(Array.isArray(data) ? data : (data.results || []));
    } catch { setItems([]); }
    finally { setLoading(false); }
  };

  const fetchHashtags = async () => {
    try {
      const data = await api.request(`/explorer/trending-hashtags/?time_range=${timeRange}&limit=10`);
      setHashtags(Array.isArray(data) ? data : (data.results || []));
    } catch { setHashtags([]); }
  };

  const doSearch = useCallback(async (q) => {
    if (!q.trim()) { setSearchResults(null); return; }
    setSearching(true);
    try {
      const data = await api.request(`/search/?q=${encodeURIComponent(q.trim())}`);
      setSearchResults(data);
    } catch { setSearchResults(null); }
    finally { setSearching(false); }
  }, []);

  useEffect(() => {
    const t = setTimeout(() => doSearch(query), 300);
    return () => clearTimeout(t);
  }, [query]);

  const renderGridItem = ({ item, index }) => (
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
      {index < 3 && (
        <View style={styles.rankBadge}>
          <Text style={styles.rankText}>{['🥇', '🥈', '🥉'][index]}</Text>
        </View>
      )}
      <View style={styles.gridOverlay}>
        <Ionicons name="heart" size={12} color="#fff" />
        <Text style={styles.gridStat}>{item.likes_count || 0}</Text>
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Search bar */}
      <View style={styles.searchBar}>
        <Ionicons name="search" size={18} color="#666" style={{ marginRight: 8 }} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search users, posts, hashtags..."
          placeholderTextColor="#666"
          value={query}
          onChangeText={setQuery}
          returnKeyType="search"
        />
        {!!query && (
          <TouchableOpacity onPress={() => { setQuery(''); setSearchResults(null); }}>
            <Ionicons name="close-circle" size={18} color="#666" />
          </TouchableOpacity>
        )}
      </View>

      {/* Search results */}
      {searchResults ? (
        <ScrollView style={{ flex: 1 }}>
          {searching && <ActivityIndicator color={GOLD} style={{ padding: 20 }} />}
          {/* Users */}
          {searchResults.users?.length > 0 && (
            <View>
              <Text style={styles.sectionTitle}>Users</Text>
              {searchResults.users.map(u => (
                <TouchableOpacity key={u.id} style={styles.userRow} onPress={() => navigation.navigate('Profile', { userId: u.id })}>
                  {u.profile_photo
                    ? <Image source={{ uri: u.profile_photo }} style={styles.userAvatar} />
                    : <View style={[styles.userAvatar, { backgroundColor: GOLD, justifyContent: 'center', alignItems: 'center' }]}>
                        <Text style={{ color: '#000', fontWeight: '700' }}>{(u.username || '?')[0].toUpperCase()}</Text>
                      </View>}
                  <View style={{ marginLeft: 12 }}>
                    <Text style={styles.userName}>{u.username}</Text>
                    {u.bio && <Text style={styles.userBio} numberOfLines={1}>{u.bio}</Text>}
                  </View>
                </TouchableOpacity>
              ))}
            </View>
          )}
          {/* Posts */}
          {searchResults.posts?.length > 0 && (
            <View>
              <Text style={styles.sectionTitle}>Posts</Text>
              <View style={styles.grid}>
                {searchResults.posts.map((item, i) => renderGridItem({ item, index: i }))}
              </View>
            </View>
          )}
          {!searching && !searchResults.users?.length && !searchResults.posts?.length && (
            <Text style={{ color: '#666', textAlign: 'center', padding: 32 }}>No results found</Text>
          )}
        </ScrollView>
      ) : (
        <ScrollView style={{ flex: 1 }} showsVerticalScrollIndicator={false}>
          {/* Categories */}
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.categories} contentContainerStyle={{ paddingHorizontal: 12, gap: 8 }}>
            {CATEGORIES.map(cat => (
              <TouchableOpacity
                key={cat}
                style={[styles.catChip, category === cat && styles.catChipActive]}
                onPress={() => setCategory(cat)}
              >
                <Text style={[styles.catText, category === cat && styles.catTextActive]}>{cat}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          {/* Time range */}
          <View style={styles.timeRow}>
            {TIME_RANGES.map(t => (
              <TouchableOpacity
                key={t.value}
                style={[styles.timeChip, timeRange === t.value && styles.timeChipActive]}
                onPress={() => setTimeRange(t.value)}
              >
                <Text style={[styles.timeText, timeRange === t.value && styles.timeTextActive]}>{t.label}</Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Trending hashtags */}
          {hashtags.length > 0 && (
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.hashtagRow} contentContainerStyle={{ paddingHorizontal: 12, gap: 8 }}>
              {hashtags.map((h, i) => (
                <TouchableOpacity key={i} style={styles.hashChip}>
                  <Text style={styles.hashText}>#{h.tag || h.name || h}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          )}

          {/* Grid */}
          {loading
            ? <ActivityIndicator color={GOLD} style={{ padding: 40 }} />
            : <View style={styles.grid}>
                {items.map((item, i) => renderGridItem({ item, index: i }))}
              </View>}
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: BG },
  searchBar: { flexDirection: 'row', alignItems: 'center', backgroundColor: CARD, margin: 12, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 10, borderWidth: 1, borderColor: BORDER },
  searchInput: { flex: 1, color: '#fff', fontSize: 15 },
  categories: { marginBottom: 8 },
  catChip: { paddingHorizontal: 14, paddingVertical: 7, borderRadius: 20, backgroundColor: CARD, borderWidth: 1, borderColor: BORDER },
  catChipActive: { backgroundColor: GOLD, borderColor: GOLD },
  catText: { color: '#aaa', fontSize: 13, fontWeight: '600' },
  catTextActive: { color: '#000', fontWeight: '700' },
  timeRow: { flexDirection: 'row', paddingHorizontal: 12, gap: 8, marginBottom: 8 },
  timeChip: { paddingHorizontal: 12, paddingVertical: 5, borderRadius: 12, backgroundColor: CARD, borderWidth: 1, borderColor: BORDER },
  timeChipActive: { backgroundColor: GOLD + '30', borderColor: GOLD },
  timeText: { color: '#aaa', fontSize: 12 },
  timeTextActive: { color: GOLD, fontWeight: '700' },
  hashtagRow: { marginBottom: 8 },
  hashChip: { paddingHorizontal: 12, paddingVertical: 5, borderRadius: 12, backgroundColor: GOLD + '20', borderWidth: 1, borderColor: GOLD + '40' },
  hashText: { color: GOLD, fontSize: 12, fontWeight: '600' },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 2, paddingHorizontal: 2 },
  gridItem: { width: ITEM_SIZE, height: ITEM_SIZE, position: 'relative' },
  gridImage: { width: '100%', height: '100%' },
  videoIcon: { position: 'absolute', top: 6, right: 6, backgroundColor: 'rgba(0,0,0,0.5)', borderRadius: 4, padding: 2 },
  rankBadge: { position: 'absolute', top: 4, left: 4 },
  rankText: { fontSize: 16 },
  gridOverlay: { position: 'absolute', bottom: 4, left: 4, flexDirection: 'row', alignItems: 'center', gap: 3 },
  gridStat: { color: '#fff', fontSize: 11, fontWeight: '600', textShadowColor: '#000', textShadowRadius: 4 },
  sectionTitle: { fontSize: 15, fontWeight: '700', color: GOLD, padding: 12 },
  userRow: { flexDirection: 'row', alignItems: 'center', padding: 12, borderBottomWidth: 1, borderBottomColor: BORDER },
  userAvatar: { width: 44, height: 44, borderRadius: 22 },
  userName: { fontSize: 14, fontWeight: '700', color: '#fff' },
  userBio: { fontSize: 12, color: '#666', marginTop: 2 },
});
