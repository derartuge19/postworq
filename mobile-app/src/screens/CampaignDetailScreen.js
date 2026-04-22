import React from 'react';
import { View, Text, StyleSheet, ScrollView, Image, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export default function CampaignDetailScreen({ route }) {
  const { campaign } = route.params;

  return (
    <ScrollView style={styles.container}>
      {campaign.image ? (
        <Image source={{ uri: campaign.image }} style={styles.campaignImage} />
      ) : (
        <View style={[styles.campaignImage, styles.imagePlaceholder]} />
      )}

      <View style={styles.content}>
        <Text style={styles.title}>{campaign.title}</Text>
        <Text style={styles.description}>{campaign.description}</Text>

        <View style={styles.statsSection}>
          <View style={styles.stat}>
            <Text style={styles.statValue}>{campaign.participants_count || 0}</Text>
            <Text style={styles.statLabel}>Participants</Text>
          </View>
          <View style={styles.stat}>
            <Text style={styles.statValue}>{campaign.entries_count || 0}</Text>
            <Text style={styles.statLabel}>Entries</Text>
          </View>
        </View>

        <TouchableOpacity style={styles.joinButton}>
          <Text style={styles.joinButtonText}>Join Campaign</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  campaignImage: { width: '100%', height: 200, backgroundColor: '#f5f5f5' },
  imagePlaceholder: { backgroundColor: '#e5e5e5' },
  content: { padding: 20 },
  title: { fontSize: 24, fontWeight: 'bold', color: '#000', marginBottom: 12 },
  description: { fontSize: 16, color: '#666', lineHeight: 22, marginBottom: 24 },
  statsSection: { flexDirection: 'row', justifyContent: 'space-around', marginBottom: 24 },
  stat: { alignItems: 'center' },
  statValue: { fontSize: 24, fontWeight: 'bold', color: '#000' },
  statLabel: { fontSize: 12, color: '#666' },
  joinButton: { backgroundColor: '#000', borderRadius: 12, padding: 16, alignItems: 'center' },
  joinButtonText: { color: '#fff', fontSize: 16, fontWeight: '600' },
});
