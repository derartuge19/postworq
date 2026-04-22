import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  Image,
  Dimensions,
  ActivityIndicator,
} from 'react-native';
import { Video } from 'expo-av';
import { Ionicons } from '@expo/vector-icons';
import api from '../api';
import { useAuth } from '../contexts/AuthContext';

const { height } = Dimensions.get('window');

export default function HomeScreen({ navigation }) {
  const [reels, setReels] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentIndex, setCurrentIndex] = useState(0);
  const { user } = useAuth();

  useEffect(() => {
    loadReels();
  }, []);

  const loadReels = async () => {
    try {
      setLoading(true);
      const data = await api.getReels();
      setReels(data.results || data);
    } catch (error) {
      console.error('Error loading reels:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleVote = async (reelId) => {
    try {
      await api.voteReel(reelId);
      setReels(reels.map(reel => 
        reel.id === reelId 
          ? { ...reel, votes: (reel.votes || 0) + 1, has_voted: true }
          : reel
      ));
    } catch (error) {
      console.error('Error voting:', error);
    }
  };

  const handleComment = (reelId) => {
    navigation.navigate('Comments', { reelId });
  };

  const handleProfile = (userId) => {
    navigation.navigate('ProfileDetail', { userId });
  };

  const renderReel = ({ item, index }) => {
    const isActive = index === currentIndex;
    
    return (
      <View style={styles.reelContainer}>
        {item.media && (
          <Video
            source={{ uri: item.media }}
            style={styles.video}
            shouldPlay={isActive}
            isLooping
            resizeMode={Video.RESIZE_MODE_COVER}
            useNativeControls={false}
          />
        )}
        
        <View style={styles.overlay}>
          <View style={styles.userInfo}>
            <TouchableOpacity onPress={() => handleProfile(item.user?.id)}>
              {item.user?.profile_photo ? (
                <Image source={{ uri: item.user.profile_photo }} style={styles.avatar} />
              ) : (
                <View style={[styles.avatar, styles.avatarPlaceholder]}>
                  <Text style={styles.avatarText}>
                    {item.user?.username?.[0]?.toUpperCase() || 'U'}
                  </Text>
                </View>
              )}
            </TouchableOpacity>
            <TouchableOpacity onPress={() => handleProfile(item.user?.id)}>
              <Text style={styles.username}>@{item.user?.username || 'unknown'}</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.caption}>
            <Text style={styles.captionText}>{item.caption || ''}</Text>
          </View>

          <View style={styles.actions}>
            <TouchableOpacity style={styles.action} onPress={() => handleVote(item.id)}>
              <Ionicons 
                name={item.has_voted ? "heart" : "heart-outline"} 
                size={32} 
                color={item.has_voted ? "#ff0050" : "#fff"} 
              />
              <Text style={styles.actionText}>{item.votes || 0}</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.action} onPress={() => handleComment(item.id)}>
              <Ionicons name="chatbubble-outline" size={32} color="#fff" />
              <Text style={styles.actionText}>{item.comments_count || 0}</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.action}>
              <Ionicons name="share-outline" size={32} color="#fff" />
            </TouchableOpacity>
          </View>
        </View>
      </View>
    );
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#000" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={reels}
        renderItem={renderReel}
        keyExtractor={(item) => item.id.toString()}
        pagingEnabled
        vertical
        showsVerticalScrollIndicator={false}
        onViewableItemsChanged={({ viewableItems }) => {
          if (viewableItems.length > 0) {
            setCurrentIndex(viewableItems[0].index);
          }
        }}
        viewabilityConfig={{
          itemVisiblePercentThreshold: 50,
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#000',
  },
  reelContainer: {
    height: height,
    backgroundColor: '#000',
  },
  video: {
    ...StyleSheet.absoluteFillObject,
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'flex-end',
    padding: 16,
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    marginRight: 12,
  },
  avatarPlaceholder: {
    backgroundColor: '#333',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    color: '#fff',
    fontSize: 20,
    fontWeight: 'bold',
  },
  username: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  caption: {
    marginBottom: 24,
    maxWidth: '70%',
  },
  captionText: {
    color: '#fff',
    fontSize: 14,
  },
  actions: {
    position: 'absolute',
    right: 16,
    bottom: 100,
    gap: 24,
  },
  action: {
    alignItems: 'center',
    marginBottom: 24,
  },
  actionText: {
    color: '#fff',
    fontSize: 12,
    marginTop: 4,
  },
});
