import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput } from 'react-native';

export default function ExploreScreen() {
  const [searchText, setSearchText] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');

  const categories = ['All', 'Music', 'Dance', 'Food', 'Travel', 'Comedy', 'Sports', 'Education'];
  const trending = [
    { id: 1, title: 'Ethiopian Coffee Ceremony', views: '1.2M', category: 'Food' },
    { id: 2, title: 'Traditional Eskista Dance', views: '890K', category: 'Dance' },
    { id: 3, title: 'Addis Ababa City Tour', views: '2.3M', category: 'Travel' },
    { id: 4, title: 'Ethiopian Jazz Music', views: '567K', category: 'Music' },
  ];

  return (
    <View style={styles.container}>
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        {/* Search Bar */}
        <View style={styles.searchContainer}>
          <TextInput
            style={styles.searchInput}
            placeholder="Search videos, creators, hashtags..."
            placeholderTextColor="#666"
            value={searchText}
            onChangeText={setSearchText}
          />
          <TouchableOpacity style={styles.searchButton}>
            <Text style={styles.searchIcon}>🔍</Text>
          </TouchableOpacity>
        </View>

        {/* Categories */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.categoriesContainer}>
          {categories.map((category) => (
            <TouchableOpacity
              key={category}
              style={[
                styles.categoryChip,
                selectedCategory === category && styles.categoryChipActive
              ]}
              onPress={() => setSelectedCategory(category)}
            >
              <Text style={[
                styles.categoryText,
                selectedCategory === category && styles.categoryTextActive
              ]}>
                {category}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* Trending Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>🔥 Trending Now</Text>
          {trending.map((item) => (
            <TouchableOpacity key={item.id} style={styles.trendingItem}>
              <View style={styles.trendingThumbnail}>
                <Text style={styles.thumbnailIcon}>▶️</Text>
              </View>
              <View style={styles.trendingInfo}>
                <Text style={styles.trendingTitle}>{item.title}</Text>
                <Text style={styles.trendingMeta}>{item.views} views • {item.category}</Text>
              </View>
              <TouchableOpacity style={styles.moreButton}>
                <Text style={styles.moreIcon}>⋯</Text>
              </TouchableOpacity>
            </TouchableOpacity>
          ))}
        </View>

        {/* Popular Creators */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>🌟 Popular Creators</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            {['Creator1', 'Creator2', 'Creator3', 'Creator4'].map((creator, index) => (
              <TouchableOpacity key={index} style={styles.creatorCard}>
                <View style={styles.creatorAvatar} />
                <Text style={styles.creatorName}>{creator}</Text>
                <Text style={styles.creatorFollowers}>{(Math.random() * 100).toFixed(1)}K followers</Text>
                <TouchableOpacity style={styles.followButton}>
                  <Text style={styles.followButtonText}>Follow</Text>
                </TouchableOpacity>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* Hashtags */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>📱 Trending Hashtags</Text>
          <View style={styles.hashtagsContainer}>
            {['#Ethiopian', '#Coffee', '#Dance', '#Music', '#Travel', '#Food'].map((tag, index) => (
              <TouchableOpacity key={index} style={styles.hashtagChip}>
                <Text style={styles.hashtagText}>{tag}</Text>
              </TouchableOpacity>
            ))}
          </View>
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
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 80,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    margin: 16,
    marginBottom: 8,
  },
  searchInput: {
    flex: 1,
    backgroundColor: '#1A1A1A',
    borderWidth: 1,
    borderColor: '#262626',
    borderRadius: 25,
    paddingHorizontal: 16,
    paddingVertical: 12,
    color: '#fff',
    fontSize: 14,
  },
  searchButton: {
    marginLeft: 12,
    width: 40,
    height: 40,
    backgroundColor: '#F9E08B',
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  searchIcon: {
    fontSize: 16,
  },
  categoriesContainer: {
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  categoryChip: {
    backgroundColor: '#1A1A1A',
    borderWidth: 1,
    borderColor: '#262626',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginRight: 8,
  },
  categoryChipActive: {
    backgroundColor: '#F9E08B',
    borderColor: '#F9E08B',
  },
  categoryText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  categoryTextActive: {
    color: '#000',
  },
  section: {
    margin: 16,
    marginTop: 8,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#F9E08B',
    marginBottom: 12,
  },
  trendingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1A1A1A',
    borderRadius: 12,
    padding: 12,
    marginBottom: 8,
  },
  trendingThumbnail: {
    width: 80,
    height: 60,
    backgroundColor: '#333',
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  thumbnailIcon: {
    fontSize: 20,
  },
  trendingInfo: {
    flex: 1,
  },
  trendingTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 4,
  },
  trendingMeta: {
    fontSize: 12,
    color: '#666',
  },
  moreButton: {
    padding: 8,
  },
  moreIcon: {
    fontSize: 16,
    color: '#666',
  },
  creatorCard: {
    alignItems: 'center',
    marginRight: 16,
  },
  creatorAvatar: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#333',
    marginBottom: 8,
  },
  creatorName: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 4,
  },
  creatorFollowers: {
    fontSize: 10,
    color: '#666',
    marginBottom: 8,
  },
  followButton: {
    backgroundColor: '#F9E08B',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  followButtonText: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#000',
  },
  hashtagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  hashtagChip: {
    backgroundColor: '#1A1A1A',
    borderWidth: 1,
    borderColor: '#262626',
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  hashtagText: {
    fontSize: 12,
    color: '#F9E08B',
  },
});
