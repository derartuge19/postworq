import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Dimensions } from 'react-native';

const { height, width } = Dimensions.get('window');

export default function ReelsScreen() {
  const [currentReel, setCurrentReel] = useState(0);

  const reels = [
    { id: 1, username: 'creator1', caption: 'Amazing Ethiopian coffee culture! ☕🇪🇹', music: 'Ethiopian Jazz - Traditional Mix', likes: 1234 },
    { id: 2, username: 'dancer2', caption: 'Traditional Ethiopian dance performance 💃', music: 'Eskista Beat - Vol. 1', likes: 5678 },
    { id: 3, username: 'foodie3', caption: 'Injera preparation tutorial 🍽️', music: 'Cooking Sounds - ASMR', likes: 3456 },
    { id: 4, username: 'traveler4', caption: 'Beautiful landscapes of Ethiopia 🏔️', music: 'Nature Sounds - Ethiopia', likes: 7890 },
  ];

  const handleLike = (reelId) => {
    console.log('Liked reel:', reelId);
  };

  const handleComment = (reelId) => {
    console.log('Comment on reel:', reelId);
  };

  const handleShare = (reelId) => {
    console.log('Share reel:', reelId);
  };

  return (
    <View style={styles.container}>
      <ScrollView
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        style={styles.reelsContainer}
        onMomentumScrollEnd={(event) => {
          const index = Math.round(event.nativeEvent.contentOffset.x / width);
          setCurrentReel(index);
        }}
      >
        {reels.map((reel, index) => (
          <View key={reel.id} style={styles.reelCard}>
            {/* Video Placeholder */}
            <View style={styles.videoPlaceholder}>
              <Text style={styles.videoIcon}>▶️</Text>
              <Text style={styles.videoText}>Video Content</Text>
            </View>

            {/* Overlay Content */}
            <View style={styles.overlay}>
              {/* Right Side Actions */}
              <View style={styles.sideActions}>
                <TouchableOpacity style={styles.actionButton}>
                  <View style={styles.avatar} />
                  <Text style={styles.actionIcon}>➕</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={() => handleLike(reel.id)} style={styles.actionButton}>
                  <Text style={styles.actionIcon}>❤️</Text>
                  <Text style={styles.actionCount}>{reel.likes}</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={() => handleComment(reel.id)} style={styles.actionButton}>
                  <Text style={styles.actionIcon}>💬</Text>
                  <Text style={styles.actionCount}>89</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={() => handleShare(reel.id)} style={styles.actionButton}>
                  <Text style={styles.actionIcon}>📤</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.actionButton}>
                  <Text style={styles.actionIcon}>⋯</Text>
                </TouchableOpacity>
              </View>

              {/* Bottom Content */}
              <View style={styles.bottomContent}>
                <View style={styles.userInfo}>
                  <Text style={styles.username}>{reel.username}</Text>
                  <TouchableOpacity style={styles.followButton}>
                    <Text style={styles.followText}>Follow</Text>
                  </TouchableOpacity>
                </View>
                <Text style={styles.caption}>{reel.caption}</Text>
                <View style={styles.musicInfo}>
                  <Text style={styles.musicIcon}>🎵</Text>
                  <Text style={styles.musicText}>{reel.music}</Text>
                </View>
              </View>
            </View>
          </View>
        ))}
      </ScrollView>

      {/* Progress Indicator */}
      <View style={styles.progressIndicator}>
        {reels.map((_, index) => (
          <View
            key={index}
            style={[
              styles.progressDot,
              index === currentReel && styles.activeDot
            ]}
          />
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  reelsContainer: {
    flex: 1,
  },
  reelCard: {
    width,
    height,
    position: 'relative',
  },
  videoPlaceholder: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#1A1A1A',
  },
  videoIcon: {
    fontSize: 48,
    marginBottom: 8,
  },
  videoText: {
    fontSize: 16,
    color: '#666',
  },
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingBottom: 80,
  },
  sideActions: {
    justifyContent: 'flex-end',
    alignItems: 'center',
    marginRight: 12,
    gap: 20,
  },
  actionButton: {
    alignItems: 'center',
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    borderWidth: 2,
    borderColor: '#F9E08B',
    backgroundColor: '#333',
    marginBottom: 8,
  },
  actionIcon: {
    fontSize: 28,
    marginBottom: 4,
  },
  actionCount: {
    fontSize: 12,
    color: '#fff',
    fontWeight: 'bold',
  },
  bottomContent: {
    flex: 1,
    justifyContent: 'flex-end',
    paddingHorizontal: 16,
    paddingBottom: 20,
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  username: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#fff',
    flex: 1,
  },
  followButton: {
    backgroundColor: '#F9E08B',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 4,
  },
  followText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#000',
  },
  caption: {
    fontSize: 14,
    color: '#fff',
    marginBottom: 8,
    lineHeight: 20,
  },
  musicInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  musicIcon: {
    fontSize: 16,
    marginRight: 8,
  },
  musicText: {
    fontSize: 12,
    color: '#fff',
    flex: 1,
  },
  progressIndicator: {
    position: 'absolute',
    top: 50,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 6,
  },
  progressDot: {
    width: 30,
    height: 3,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    borderRadius: 1.5,
  },
  activeDot: {
    backgroundColor: '#F9E08B',
  },
});
