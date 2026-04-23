import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  StatusBar,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import api from '../api';
import config from '../config';

const BRAND_GOLD = '#DA9B2A';

export default function FollowListScreen({ route, navigation }) {
  const { userId, type } = route.params; // type: 'followers' | 'following'
  const insets = useSafeAreaInsets();
  
  const [loading, setLoading] = useState(true);
  const [users, setUsers] = useState([]);
  const [refreshing, setRefreshing] = useState(false);

  const fetchUsers = async () => {
    try {
      const data = type === 'followers' 
        ? await api.getFollowers(userId)
        : await api.getFollowing(userId);
      
      const raw = Array.isArray(data) ? data : (data.results || []);
      
      // Extract user objects from follow objects
      const extractedUsers = raw.map(item => type === 'followers' ? item.follower : item.following).filter(u => !!u);
      setUsers(extractedUsers);
    } catch (error) {
      console.error('Fetch follow list error:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, [userId, type]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchUsers();
  };

  const mediaUrl = (url) => {
    if (!url) return null;
    if (url.startsWith('http')) return url;
    return `${config.API_BASE_URL.replace('/api', '')}${url}`;
  };

  const renderUserItem = ({ item }) => (
    <TouchableOpacity 
      style={styles.userItem}
      onPress={() => navigation.navigate('ProfileDetail', { userId: item.id })}
    >
      <View style={styles.avatarContainer}>
        {item.profile_photo ? (
          <Image source={{ uri: mediaUrl(item.profile_photo) }} style={styles.avatar} />
        ) : (
          <View style={[styles.avatar, styles.avatarFallback]}>
            <Text style={styles.avatarInitial}>{item.username?.[0]?.toUpperCase()}</Text>
          </View>
        )}
      </View>
      <View style={styles.userInfo}>
        <Text style={styles.username}>@{item.username}</Text>
        <Text style={styles.fullName}>{item.first_name} {item.last_name}</Text>
      </View>
      <Ionicons name="chevron-forward" size={20} color="#ccc" />
    </TouchableOpacity>
  );

  return (
    <View style={styles.root}>
      <StatusBar barStyle="dark-content" />
      
      {/* Custom Header to ensure back button works as expected */}
      <View style={[styles.header, { paddingTop: insets.top }]}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color="#000" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{type === 'followers' ? 'Followers' : 'Following'}</Text>
        <View style={{ width: 40 }} />
      </View>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={BRAND_GOLD} />
        </View>
      ) : (
        <FlatList
          data={users}
          renderItem={renderUserItem}
          keyExtractor={item => item.id.toString()}
          contentContainerStyle={styles.list}
          refreshing={refreshing}
          onRefresh={onRefresh}
          ListEmptyComponent={
            <View style={styles.empty}>
              <Ionicons name="people-outline" size={60} color="#eee" />
              <Text style={styles.emptyText}>No users found</Text>
            </View>
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#fff' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 8,
    paddingBottom: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#eee',
  },
  backBtn: { padding: 8 },
  headerTitle: { fontSize: 17, fontWeight: '700', color: '#000' },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  list: { paddingVertical: 8 },
  userItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  avatarContainer: { marginRight: 12 },
  avatar: { width: 50, height: 50, borderRadius: 25 },
  avatarFallback: { backgroundColor: '#f0f0f0', alignItems: 'center', justifyContent: 'center' },
  avatarInitial: { fontSize: 20, fontWeight: 'bold', color: BRAND_GOLD },
  userInfo: { flex: 1 },
  username: { fontSize: 15, fontWeight: '700', color: '#000' },
  fullName: { fontSize: 13, color: '#666', marginTop: 2 },
  empty: { flex: 1, alignItems: 'center', justifyContent: 'center', marginTop: 100 },
  emptyText: { fontSize: 16, color: '#999', marginTop: 16 },
});
