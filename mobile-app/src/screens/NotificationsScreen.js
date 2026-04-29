import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  StatusBar,
  RefreshControl,
  Dimensions,
  ScrollView,
} from 'react-native';
import { Image } from 'expo-image';
import { FlashList } from '@shopify/flash-list';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import api from '../api';
import { useAuth } from '../contexts/AuthContext';
import config from '../config';

const { width } = Dimensions.get('window');
const BRAND_GOLD = '#C8B56A';

const mediaUrl = (url) => {
  if (!url) return null;
  if (url.startsWith('http')) return url;
  return `${config.API_BASE_URL.replace('/api', '')}${url}`;
};

const getIcon = (type) => {
  switch (type) {
    case 'like':    return { name: 'heart', color: '#C8B56A', bg: '#C8B56A20' };
    case 'comment': return { name: 'chatbubble', color: '#C8B56A', bg: '#C8B56A20' };
    case 'follow':  return { name: 'person-add', color: '#C8B56A', bg: '#C8B56A20' };
    case 'mention': return { name: 'at', color: '#C8B56A', bg: '#C8B56A20' };
    case 'campaign':return { name: 'trophy', color: '#C8B56A', bg: '#C8B56A20' };
    default:        return { name: 'notifications', color: BRAND_GOLD, bg: '#C8B56A20' };
  }
};

const FILTERS = [
  { id: 'all',      label: 'All',       icon: 'notifications' },
  { id: 'like',     label: 'Likes',     icon: 'heart' },
  { id: 'comment',  label: 'Comments',  icon: 'chatbubble' },
  { id: 'follow',   label: 'Follows',   icon: 'person-add' },
  { id: 'campaign', label: 'Campaigns', icon: 'trophy' },
];

export default function NotificationsScreen({ navigation }) {
  const insets = useSafeAreaInsets();
  const nav = useNavigation();
  const { user } = useAuth();
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeFilter, setActiveFilter] = useState('all');

  const fetchNotifications = useCallback(async (isSilent = false) => {
    if (!user) return;
    try {
      if (!isSilent) setLoading(true);
      const data = await api.getUserNotifications();
      const raw = Array.isArray(data) ? data : (data.results || []);
      
      const transformed = raw.map(n => ({
        id: n.id.toString(),
        type: n.notification_type || n.type || 'system',
        message: n.message,
        read: n.read ?? n.is_read ?? false,
        timestamp: new Date(n.timestamp || n.created_at),
        user: n.sender ? {
          id: n.sender.id,
          username: n.sender.username,
          profile_photo: n.sender.profile_photo,
        } : null,
        reel_id: n.reel_id || n.reel?.id,
        comment: n.comment ? (typeof n.comment === 'string' ? n.comment : n.comment.text) : null,
      }));
      
      setNotifications(transformed);
    } catch (error) {
      console.error('Fetch notifs error:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [user]);

  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(() => fetchNotifications(true), 30000);
    
    // Mark all read after delay
    const timer = setTimeout(() => {
      api.markAllNotificationsRead().catch(() => {});
      setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    }, 3000);

    return () => {
      clearInterval(interval);
      clearTimeout(timer);
    };
  }, [fetchNotifications]);

  // Listen for tab press event to refresh when already on Notifications screen
  useEffect(() => {
    const unsubscribe = nav.addListener('tabPress', (e) => {
      // Refresh notifications when tab is pressed while already on screen
      const currentRoute = nav.getState()?.routes[nav.getState()?.index];
      if (currentRoute?.name === 'Notifications') {
        fetchNotifications(true);
      }
    });

    return unsubscribe;
  }, [nav, fetchNotifications]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchNotifications(true);
  };

  const handleNotifClick = (notif) => {
    if (notif.type === 'follow' && notif.user) {
      navigation.navigate('ProfileDetail', { userId: notif.user.id });
    } else if (notif.reel_id) {
      navigation.navigate('Reels', { reelId: notif.reel_id });
    }
  };

  const filteredNotifs = notifications.filter(n => 
    activeFilter === 'all' || n.type === activeFilter
  );

  const renderItem = ({ item }) => {
    const icon = getIcon(item.type);
    
    return (
      <TouchableOpacity 
        style={[styles.notifItem, !item.read && styles.unreadItem]} 
        onPress={() => handleNotifClick(item)}
        activeOpacity={0.7}
      >
        <View style={styles.avatarWrap}>
          {item.user?.profile_photo ? (
            <Image source={{ uri: mediaUrl(item.user.profile_photo) }} style={styles.avatar} />
          ) : (
            <View style={[styles.avatar, styles.avatarFallback]}>
              <Text style={styles.avatarInitial}>{item.user?.username?.[0]?.toUpperCase() || '?'}</Text>
            </View>
          )}
          <View style={[styles.typeBadge, { backgroundColor: icon.color }]}>
            <Ionicons name={icon.name} size={10} color="#fff" />
          </View>
        </View>

        <View style={styles.content}>
          <Text style={styles.message}>
            <Text style={styles.username}>{item.user?.username} </Text>
            {item.message}
          </Text>
          {item.comment && (
            <Text style={styles.comment} numberOfLines={1}>"{item.comment}"</Text>
          )}
          <Text style={styles.time}>{getRelativeTime(item.timestamp)}</Text>
        </View>

        {!item.read && <View style={styles.unreadDot} />}
      </TouchableOpacity>
    );
  };

  if (loading && !refreshing) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={BRAND_GOLD} />
      </View>
    );
  }

  return (
    <View style={styles.root}>
      <StatusBar barStyle="light-content" backgroundColor="#0d0d0d" />
      
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + 10 }]}>
        <View style={styles.headerTop}>
          <Text style={styles.headerTitle}>Notifications</Text>
          <TouchableOpacity onPress={() => fetchNotifications(true)}>
            <Ionicons name="refresh" size={20} color="#C8B56A" />
          </TouchableOpacity>
        </View>

        {/* Filters */}
        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filterBar}
        >
          {FILTERS.map(f => (
            <TouchableOpacity 
              key={f.id} 
              onPress={() => setActiveFilter(f.id)}
              style={[styles.filterChip, activeFilter === f.id && styles.activeChip]}
            >
              <Ionicons 
                name={f.icon} 
                size={14} 
                color={activeFilter === f.id ? '#000' : '#C8B56A'} 
              />
              <Text style={[styles.filterLabel, activeFilter === f.id && styles.activeLabel]}>
                {f.label}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      <FlashList
        data={filteredNotifs}
        renderItem={renderItem}
        keyExtractor={item => item.id}
        contentContainerStyle={styles.list}
        estimatedItemSize={70}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[BRAND_GOLD]} />
        }
        ListEmptyComponent={
          <View style={styles.empty}>
            <Ionicons name="notifications-off-outline" size={60} color="#C8B56A" />
            <Text style={styles.emptyText}>No notifications yet</Text>
          </View>
        }
      />
    </View>
  );
}

function getRelativeTime(date) {
  const now = new Date();
  const diff = Math.floor((now - date) / 1000);
  if (diff < 60) return 'Just now';
  if (diff < 3600) return `${Math.floor(diff/60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff/3600)}h ago`;
  return `${Math.floor(diff/86400)}d ago`;
}


const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#0B0B0C' },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#0B0B0C' },
  header: {
    backgroundColor: '#0B0B0C',
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#C8B56A30',
    paddingBottom: 10,
  },
  headerTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    marginBottom: 15,
  },
  headerTitle: { fontSize: 22, fontWeight: '800', color: '#C8B56A' },
  filterBar: { paddingHorizontal: 16, gap: 8 },
  filterChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    backgroundColor: '#121214',
    gap: 6,
  },
  activeChip: { backgroundColor: BRAND_GOLD },
  filterLabel: { fontSize: 13, fontWeight: '600', color: '#C8B56A' },
  activeLabel: { color: '#C8B56A' },
  list: { paddingBottom: 100 },
  notifItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#C8B56A15',
  },
  unreadItem: { backgroundColor: '#C8B56A08' },
  avatarWrap: { position: 'relative' },
  avatar: { width: 48, height: 48, borderRadius: 24, backgroundColor: '#121214' },
  avatarFallback: { alignItems: 'center', justifyContent: 'center', backgroundColor: BRAND_GOLD + '20' },
  avatarInitial: { fontSize: 18, fontWeight: 'bold', color: BRAND_GOLD },
  typeBadge: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    width: 20,
    height: 20,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#0B0B0C',
  },
  content: { flex: 1, marginLeft: 15 },
  message: { fontSize: 14, color: '#A1A1AA', lineHeight: 18 },
  username: { fontWeight: '800', color: '#C8B56A' },
   import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  StatusBar,
  RefreshControl,
  Dimensions,
  ScrollView,
} from 'react-native';
import { Image } from 'expo-image';
import { FlashList } from '@shopify/flash-list';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import api from '../api';
import { useAuth } from '../contexts/AuthContext';
import config from '../config';

const { width } = Dimensions.get('window');
const BRAND_GOLD = '#C8B56A';

const mediaUrl = (url) => {
  if (!url) return null;
  if (url.startsWith('http')) return url;
  return `${config.API_BASE_URL.replace('/api', '')}${url}`;
};

const getIcon = (type) => {
  switch (type) {
    case 'like':    return { name: 'heart', color: '#C8B56A', bg: '#C8B56A20' };
    case 'comment': return { name: 'chatbubble', color: '#C8B56A', bg: '#C8B56A20' };
    case 'follow':  return { name: 'person-add', color: '#C8B56A', bg: '#C8B56A20' };
    case 'mention': return { name: 'at', color: '#C8B56A', bg: '#C8B56A20' };
    case 'campaign':return { name: 'trophy', color: '#C8B56A', bg: '#C8B56A20' };
    default:        return { name: 'notifications', color: BRAND_GOLD, bg: '#C8B56A20' };
  }
};

const FILTERS = [
  { id: 'all',      label: 'All',       icon: 'notifications' },
  { id: 'like',     label: 'Likes',     icon: 'heart' },
  { id: 'comment',  label: 'Comments',  icon: 'chatbubble' },
  { id: 'follow',   label: 'Follows',   icon: 'person-add' },
  { id: 'campaign', label: 'Campaigns', icon: 'trophy' },
];

export default function NotificationsScreen({ navigation }) {
  const insets = useSafeAreaInsets();
  const nav = useNavigation();
  const { user } = useAuth();
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeFilter, setActiveFilter] = useState('all');

  const fetchNotifications = useCallback(async (isSilent = false) => {
    if (!user) return;
    try {
      if (!isSilent) setLoading(true);
      const data = await api.getUserNotifications();
      const raw = Array.isArray(data) ? data : (data.results || []);
      
      const transformed = raw.map(n => ({
        id: n.id.toString(),
        type: n.notification_type || n.type || 'system',
        message: n.message,
        read: n.read ?? n.is_read ?? false,
        timestamp: new Date(n.timestamp || n.created_at),
        user: n.sender ? {
          id: n.sender.id,
          username: n.sender.username,
          profile_photo: n.sender.profile_photo,
        } : null,
        reel_id: n.reel_id || n.reel?.id,
        comment: n.comment ? (typeof n.comment === 'string' ? n.comment : n.comment.text) : null,
      }));
      
      setNotifications(transformed);
    } catch (error) {
      console.error('Fetch notifs error:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [user]);

  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(() => fetchNotifications(true), 30000);
    
    // Mark all read after delay
    const timer = setTimeout(() => {
      api.markAllNotificationsRead().catch(() => {});
      setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    }, 3000);

    return () => {
      clearInterval(interval);
      clearTimeout(timer);
    };
  }, [fetchNotifications]);

  // Listen for tab press event to refresh when already on Notifications screen
  useEffect(() => {
    const unsubscribe = nav.addListener('tabPress', (e) => {
      // Refresh notifications when tab is pressed while already on screen
      const currentRoute = nav.getState()?.routes[nav.getState()?.index];
      if (currentRoute?.name === 'Notifications') {
        fetchNotifications(true);
      }
    });

    return unsubscribe;
  }, [nav, fetchNotifications]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchNotifications(true);
  };

  const handleNotifClick = (notif) => {
    if (notif.type === 'follow' && notif.user) {
      navigation.navigate('ProfileDetail', { userId: notif.user.id });
    } else if (notif.reel_id) {
      navigation.navigate('Reels', { reelId: notif.reel_id });
    }
  };

  const filteredNotifs = notifications.filter(n => 
    activeFilter === 'all' || n.type === activeFilter
  );

  const renderItem = ({ item }) => {
    const icon = getIcon(item.type);
    
    return (
      <TouchableOpacity 
        style={[styles.notifItem, !item.read && styles.unreadItem]} 
        onPress={() => handleNotifClick(item)}
        activeOpacity={0.7}
      >
        <View style={styles.avatarWrap}>
          {item.user?.profile_photo ? (
            <Image source={{ uri: mediaUrl(item.user.profile_photo) }} style={styles.avatar} />
          ) : (
            <View style={[styles.avatar, styles.avatarFallback]}>
              <Text style={styles.avatarInitial}>{item.user?.username?.[0]?.toUpperCase() || '?'}</Text>
            </View>
          )}
          <View style={[styles.typeBadge, { backgroundColor: icon.color }]}>
            <Ionicons name={icon.name} size={10} color="#fff" />
          </View>
        </View>

        <View style={styles.content}>
          <Text style={styles.message}>
            <Text style={styles.username}>{item.user?.username} </Text>
            {item.message}
          </Text>
          {item.comment && (
            <Text style={styles.comment} numberOfLines={1}>"{item.comment}"</Text>
          )}
          <Text style={styles.time}>{getRelativeTime(item.timestamp)}</Text>
        </View>

        {!item.read && <View style={styles.unreadDot} />}
      </TouchableOpacity>
    );
  };

  if (loading && !refreshing) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={BRAND_GOLD} />
      </View>
    );
  }

  return (
    <View style={styles.root}>
      <StatusBar barStyle="light-content" backgroundColor="#0d0d0d" />
      
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + 10 }]}>
        <View style={styles.headerTop}>
          <Text style={styles.headerTitle}>Notifications</Text>
          <TouchableOpacity onPress={() => fetchNotifications(true)}>
            <Ionicons name="refresh" size={20} color="#C8B56A" />
          </TouchableOpacity>
        </View>

        {/* Filters */}
        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filterBar}
        >
          {FILTERS.map(f => (
            <TouchableOpacity 
              key={f.id} 
              onPress={() => setActiveFilter(f.id)}
              style={[styles.filterChip, activeFilter === f.id && styles.activeChip]}
            >
              <Ionicons 
                name={f.icon} 
                size={14} 
                color={activeFilter === f.id ? '#000' : '#C8B56A'} 
              />
              <Text style={[styles.filterLabel, activeFilter === f.id && styles.activeLabel]}>
                {f.label}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      <FlashList
        data={filteredNotifs}
        renderItem={renderItem}
        keyExtractor={item => item.id}
        contentContainerStyle={styles.list}
        estimatedItemSize={70}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[BRAND_GOLD]} />
        }
        ListEmptyComponent={
          <View style={styles.empty}>
            <Ionicons name="notifications-off-outline" size={60} color="#C8B56A" />
            <Text style={styles.emptyText}>No notifications yet</Text>
          </View>
        }
      />
    </View>
  );
}

function getRelativeTime(date) {
  const now = new Date();
  const diff = Math.floor((now - date) / 1000);
  if (diff < 60) return 'Just now';
  if (diff < 3600) return `${Math.floor(diff/60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff/3600)}h ago`;
  return `${Math.floor(diff/86400)}d ago`;
}


const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#0B0B0C' },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#0B0B0C' },
  header: {
    backgroundColor: '#0B0B0C',
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#C8B56A30',
    paddingBottom: 10,
  },
  headerTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    marginBottom: 15,
  },
  headerTitle: { fontSize: 22, fontWeight: '800', color: '#C8B56A' },
  filterBar: { paddingHorizontal: 16, gap: 8 },
  filterChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    backgroundColor: '#121214',
    gap: 6,
  },
  activeChip: { backgroundColor: BRAND_GOLD },
  filterLabel: { fontSize: 13, fontWeight: '600', color: '#C8B56A' },
  activeLabel: { color: '#C8B56A' },
  list: { paddingBottom: 100 },
  notifItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#C8B56A15',
  },
  unreadItem: { backgroundColor: '#C8B56A08' },
  avatarWrap: { position: 'relative' },
  avatar: { width: 48, height: 48, borderRadius: 24, backgroundColor: '#121214' },
  avatarFallback: { alignItems: 'center', justifyContent: 'center', backgroundColor: BRAND_GOLD + '20' },
  avatarInitial: { fontSize: 18, fontWeight: 'bold', color: BRAND_GOLD },
  typeBadge: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    width: 20,
    height: 20,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#0B0B0C',
  },
  content: { flex: 1, marginLeft: 15 },
  message: { fontSize: 14, color: '#A1A1AA', lineHeight: 18 },
  username: { fontWeight: '800', color: '#C8B56A' },
  comment: { fontSize: 12, color: '#A1A1AA', opacity: 0.6, marginTop: 4, fontStyle: 'italic' },
  time: { fontSize: 11, color: '#C8B56A', opacity: 0.5, marginTop: 4 },
  unreadDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#C8B56A', marginLeft: 10 },
  empty: { flex: 1, alignItems: 'center', justifyContent: 'center', marginTop: 100 },
  emptyText: { color: '#C8B56A', opacity: 0.5, marginTop: 15, fontSize: 16 },
});




.Value -replace "'#[A-Fa-f0-9]+'", "'#A1A1AA'" , opacity: 0.6, marginTop: 4, fontStyle: 'italic' },
  time: { fontSize: 11, color: '#C8B56A', opacity: 0.5, marginTop: 4 },
  unreadDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#C8B56A', marginLeft: 10 },
  empty: { flex: 1, alignItems: 'center', justifyContent: 'center', marginTop: 100 },
  emptyText: { color: '#C8B56A', opacity: 0.5, marginTop: 15, fontSize: 16 },
});






