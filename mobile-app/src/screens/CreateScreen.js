import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';

export default function CreateScreen() {
  const createOptions = [
    { id: 1, title: 'Short Video', icon: '🎬', description: 'Create 15-60 second video' },
    { id: 2, title: 'Photo Post', icon: '📸', description: 'Share photos with captions' },
    { id: 3, title: 'Live Stream', icon: '🔴', description: 'Go live with your followers' },
    { id: 4, title: 'Campaign Entry', icon: '🏆', description: 'Submit to active campaigns' },
    { id: 5, title: 'Story', icon: '📱', description: 'Share 24-hour content' },
    { id: 6, title: 'Audio', icon: '🎵', description: 'Share music or podcast' },
  ];

  return (
    <View style={styles.container}>
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Create</Text>
          <Text style={styles.headerSubtitle}>Share your Ethiopian content</Text>
        </View>

        {/* Quick Actions */}
        <View style={styles.quickActions}>
          <TouchableOpacity style={styles.quickActionButton}>
            <View style={styles.quickActionIcon}>
              <Text style={styles.quickActionEmoji}>📹</Text>
            </View>
            <Text style={styles.quickActionText}>Record</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.quickActionButton}>
            <View style={styles.quickActionIcon}>
              <Text style={styles.quickActionEmoji}>🖼️</Text>
            </View>
            <Text style={styles.quickActionText}>Upload</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.quickActionButton}>
            <View style={styles.quickActionIcon}>
              <Text style={styles.quickActionEmoji}>✏️</Text>
            </View>
            <Text style={styles.quickActionText}>Edit</Text>
          </TouchableOpacity>
        </View>

        {/* Create Options */}
        <View style={styles.optionsContainer}>
          <Text style={styles.sectionTitle}>Content Types</Text>
          {createOptions.map((option) => (
            <TouchableOpacity key={option.id} style={styles.optionCard}>
              <View style={styles.optionIcon}>
                <Text style={styles.optionEmoji}>{option.icon}</Text>
              </View>
              <View style={styles.optionContent}>
                <Text style={styles.optionTitle}>{option.title}</Text>
                <Text style={styles.optionDescription}>{option.description}</Text>
              </View>
              <TouchableOpacity style={styles.optionArrow}>
                <Text style={styles.arrowIcon}>→</Text>
              </TouchableOpacity>
            </TouchableOpacity>
          ))}
        </View>

        {/* Recent Drafts */}
        <View style={styles.draftsContainer}>
          <Text style={styles.sectionTitle}>Recent Drafts</Text>
          {[1, 2, 3].map((item) => (
            <TouchableOpacity key={item} style={styles.draftItem}>
              <View style={styles.draftThumbnail}>
                <Text style={styles.draftIcon}>🎬</Text>
              </View>
              <View style={styles.draftInfo}>
                <Text style={styles.draftTitle}>Draft {item}</Text>
                <Text style={styles.draftTime}>Edited 2h ago</Text>
              </View>
              <TouchableOpacity style={styles.draftMenu}>
                <Text style={styles.menuIcon}>⋯</Text>
              </TouchableOpacity>
            </TouchableOpacity>
          ))}
        </View>

        {/* Tips */}
        <View style={styles.tipsContainer}>
          <Text style={styles.sectionTitle}>💡 Creator Tips</Text>
          <View style={styles.tipCard}>
            <Text style={styles.tipText}>Showcase Ethiopian culture, music, and traditions to reach a global audience!</Text>
          </View>
          <View style={styles.tipCard}>
            <Text style={styles.tipText}>Use trending hashtags like #Ethiopian, #AddisAbaba, #CoffeeCulture</Text>
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
  header: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#262626',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '900',
    color: '#F9E08B',
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#666',
  },
  quickActions: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#262626',
  },
  quickActionButton: {
    alignItems: 'center',
  },
  quickActionIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#F9E08B',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  quickActionEmoji: {
    fontSize: 24,
  },
  quickActionText: {
    fontSize: 12,
    color: '#fff',
    fontWeight: '600',
  },
  optionsContainer: {
    padding: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#F9E08B',
    marginBottom: 12,
  },
  optionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1A1A1A',
    borderRadius: 12,
    padding: 16,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#262626',
  },
  optionIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#333',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  optionEmoji: {
    fontSize: 20,
  },
  optionContent: {
    flex: 1,
  },
  optionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 4,
  },
  optionDescription: {
    fontSize: 12,
    color: '#666',
  },
  optionArrow: {
    padding: 8,
  },
  arrowIcon: {
    fontSize: 16,
    color: '#666',
  },
  draftsContainer: {
    padding: 16,
  },
  draftItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1A1A1A',
    borderRadius: 12,
    padding: 12,
    marginBottom: 8,
  },
  draftThumbnail: {
    width: 48,
    height: 48,
    borderRadius: 8,
    backgroundColor: '#333',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  draftIcon: {
    fontSize: 20,
  },
  draftInfo: {
    flex: 1,
  },
  draftTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 4,
  },
  draftTime: {
    fontSize: 12,
    color: '#666',
  },
  draftMenu: {
    padding: 8,
  },
  menuIcon: {
    fontSize: 16,
    color: '#666',
  },
  tipsContainer: {
    padding: 16,
  },
  tipCard: {
    backgroundColor: '#1A2A1A',
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
    borderLeftWidth: 3,
    borderLeftColor: '#F9E08B',
  },
  tipText: {
    fontSize: 13,
    color: '#F9E08B',
    lineHeight: 18,
  },
});
