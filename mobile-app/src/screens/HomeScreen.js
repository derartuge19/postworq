import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, RefreshControl, Image } from 'react-native';
import { useAuth } from '../contexts/AuthContext';

export default function HomeScreen({ navigation }) {
  const [refreshing, setRefreshing] = useState(false);
  const { user } = useAuth();

  const onRefresh = () => {
    setRefreshing(true);
    setTimeout(() => setRefreshing(false), 2000);
  };

  const posts = [
    { id: 1, username: 'creator1', likes: 1234, comments: 89, caption: 'Amazing Ethiopian coffee culture! ☕🇪🇹' },
    { id: 2, username: 'dancer2', likes: 5678, comments: 234, caption: 'Traditional Ethiopian dance performance 💃' },
    { id: 3, username: 'foodie3', likes: 3456, comments: 123, caption: 'Injera preparation tutorial 🍽️' },
    { id: 4, username: 'traveler4', likes: 7890, comments: 456, caption: 'Beautiful landscapes of Ethiopia 🏔️' },
  ];

  return (
    <View style={styles.container}>
      <ScrollView
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#F9E08B" />
        }
        contentContainerStyle={styles.scrollContent}
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>FlipStar</Text>
          <TouchableOpacity onPress={() => navigation.navigate('Notifications')}>
            <Text style={styles.notificationIcon}>🔔</Text>
          </TouchableOpacity>
        </View>

        {/* Stories */}
        <View style={styles.storiesContainer}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <TouchableOpacity style={styles.storyItem}>
              <View style={styles.storyAdd}>
                <Text style={styles.storyAddText}>+</Text>
              </View>
              <Text style={styles.storyUsername}>Your Story</Text>
            </TouchableOpacity>
            {['user1', 'user2', 'user3', 'user4'].map((username, index) => (
              <TouchableOpacity key={index} style={styles.storyItem}>
                <View style={styles.storyAvatar} />
                <Text style={styles.storyUsername}>{username}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* Posts Feed */}
        <View style={styles.feedContainer}>
          {posts.map((post) => (
            <View key={post.id} style={styles.postCard}>
              <View style={styles.postHeader}>
                <View style={styles.postUserInfo}>
                  <View style={styles.postAvatar} />
                  <View style={styles.postUserDetails}>
                    <Text style={styles.postUsername}>{post.username}</Text>
                    <Text style={styles.postTime}>2h ago</Text>
                  </View>
                </View>
                <TouchableOpacity>
                  <Text style={styles.moreOptions}>⋯</Text>
                </TouchableOpacity>
              </View>

              <View style={styles.postContent}>
                <Text style={styles.postCaption}>{post.caption}</Text>
              </View>

              <View style={styles.postImagePlaceholder}>
                <Text style={styles.postImageText}>📸 Video/Image Content</Text>
              </View>

              <View style={styles.postActions}>
                <TouchableOpacity style={styles.actionButton}>
                  <Text style={styles.actionIcon}>❤️</Text>
                  <Text style={styles.actionText}>{post.likes}</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.actionButton}>
                  <Text style={styles.actionIcon}>💬</Text>
                  <Text style={styles.actionText}>{post.comments}</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.actionButton}>
                  <Text style={styles.actionIcon}>📤</Text>
                  <Text style={styles.actionText}>Share</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.actionButton}>
                  <Text style={styles.actionIcon}>💾</Text>
                </TouchableOpacity>
              </View>
            </View>
          ))}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0D0D0D',
  },
  scrollContent: {
    paddingBottom: 80,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#262626',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '900',
    color: '#F9E08B',
  },
  notificationIcon: {
    fontSize: 24,
  },
  storiesContainer: {
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#262626',
  },
  storyItem: {
    alignItems: 'center',
    marginHorizontal: 12,
  },
  storyAdd: {
    width: 64,
    height: 64,
    borderRadius: 32,
    borderWidth: 2,
    borderColor: '#F9E08B',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#1A1A1A',
  },
  storyAddText: {
    fontSize: 24,
    color: '#F9E08B',
    fontWeight: 'bold',
  },
  storyAvatar: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#333',
  },
  storyUsername: {
    fontSize: 11,
    color: '#fff',
    marginTop: 4,
  },
  feedContainer: {
    paddingHorizontal: 16,
  },
  postCard: {
    backgroundColor: '#1A1A1A',
    borderRadius: 12,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#262626',
  },
  postHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 12,
  },
  postUserInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  postAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#333',
    marginRight: 12,
  },
  postUserDetails: {
    flex: 1,
  },
  postUsername: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#fff',
  },
  postTime: {
    fontSize: 12,
    color: '#666',
  },
  moreOptions: {
    fontSize: 20,
    color: '#fff',
  },
  postContent: {
    padding: 12,
    paddingTop: 0,
  },
  postCaption: {
    fontSize: 14,
    color: '#fff',
    lineHeight: 20,
  },
  postImagePlaceholder: {
    height: 300,
    backgroundColor: '#333',
    justifyContent: 'center',
    alignItems: 'center',
    margin: 12,
    borderRadius: 8,
  },
  postImageText: {
    fontSize: 16,
    color: '#666',
  },
  postActions: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    padding: 12,
    borderTopWidth: 1,
    borderTopColor: '#262626',
  },
  actionButton: {
    alignItems: 'center',
    flex: 1,
  },
  actionIcon: {
    fontSize: 20,
    marginBottom: 4,
  },
  actionText: {
    fontSize: 11,
    color: '#666',
  },
});
