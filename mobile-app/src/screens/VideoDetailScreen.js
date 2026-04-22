import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Dimensions,
} from 'react-native';
import { Video } from 'expo-av';
import { Ionicons } from '@expo/vector-icons';
import api from '../api';

const { height } = Dimensions.get('window');

export default function VideoDetailScreen({ route, navigation }) {
  const { reel } = route.params;
  const [comments, setComments] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    navigation.setOptions({
      headerRight: () => (
        <TouchableOpacity onPress={() => navigation.navigate('Comments', { reelId: reel.id })}>
          <Ionicons name="chatbubble-outline" size={24} color="#000" />
        </TouchableOpacity>
      ),
    });
  }, [navigation, reel.id]);

  return (
    <ScrollView style={styles.container}>
      <View style={styles.videoContainer}>
        {reel.media ? (
          <Video
            source={{ uri: reel.media }}
            style={styles.video}
            shouldPlay={false}
            useNativeControls
            resizeMode={Video.RESIZE_MODE_CONTAIN}
          />
        ) : reel.image ? (
          <Image source={{ uri: reel.image }} style={styles.video} />
        ) : (
          <View style={[styles.video, styles.placeholder]} />
        )}
      </View>

      <View style={styles.content}>
        <View style={styles.userInfo}>
          {reel.user?.profile_photo ? (
            <Image source={{ uri: reel.user.profile_photo }} style={styles.avatar} />
          ) : (
            <View style={[styles.avatar, styles.avatarPlaceholder]}>
              <Text style={styles.avatarText}>
                {reel.user?.username?.[0]?.toUpperCase() || 'U'}
              </Text>
            </View>
          )}
          <View>
            <Text style={styles.username}>@{reel.user?.username || 'unknown'}</Text>
            <Text style={styles.time}>
              {new Date(reel.created_at).toLocaleDateString()}
            </Text>
          </View>
        </View>

        <Text style={styles.caption}>{reel.caption || 'No caption'}</Text>

        <View style={styles.stats}>
          <View style={styles.stat}>
            <Ionicons name="heart" size={20} color="#000" />
            <Text style={styles.statText}>{reel.votes || 0} likes</Text>
          </View>
          <View style={styles.stat}>
            <Ionicons name="chatbubble" size={20} color="#000" />
            <Text style={styles.statText}>{reel.comments_count || 0} comments</Text>
          </View>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  videoContainer: {
    backgroundColor: '#000',
    alignItems: 'center',
    justifyContent: 'center',
  },
  video: {
    width: '100%',
    aspectRatio: 9/16,
  },
  placeholder: {
    backgroundColor: '#f5f5f5',
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    padding: 16,
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    marginRight: 12,
  },
  avatarPlaceholder: {
    backgroundColor: '#f5f5f5',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#999',
  },
  username: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000',
  },
  time: {
    fontSize: 12,
    color: '#999',
    marginTop: 2,
  },
  caption: {
    fontSize: 16,
    color: '#000',
    marginBottom: 16,
    lineHeight: 22,
  },
  stats: {
    flexDirection: 'row',
    gap: 24,
  },
  stat: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  statText: {
    fontSize: 14,
    color: '#666',
  },
});
