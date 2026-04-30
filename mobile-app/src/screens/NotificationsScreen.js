import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';

export default function NotificationsScreen() {
  const [activeTab, setActiveTab] = useState('all');

  const notifications = {
    all: [
      { id: 1, type: 'like', user: 'creator1', action: 'liked your video', time: '2m ago', read: false },
      { id: 2, type: 'comment', user: 'dancer2', action: 'commented: "Amazing moves!"', time: '15m ago', read: false },
      { id: 3, type: 'follow', user: 'foodie3', action: 'started following you', time: '1h ago', read: true },
      { id: 4, type: 'campaign', user: 'FlipStar', action: 'New campaign: Ethiopian Music Challenge', time: '2h ago', read: true },
      { id: 5, type: 'mention', user: 'traveler4', action: 'mentioned you in a post', time: '3h ago', read: true },
    ],
    likes: [
      { id: 1, type: 'like', user: 'creator1', action: 'liked your video', time: '2m ago', read: false },
      { id: 6, type: 'like', user: 'user5', action: 'liked your photo', time: '5h ago', read: true },
    ],
    comments: [
      { id: 2, type: 'comment', user: 'dancer2', action: 'commented: "Amazing moves!"', time: '15m ago', read: false },
      { id: 7, type: 'comment', user: 'user6', action: 'commented: "Great content!"', time: '4h ago', read: true },
    ],
    mentions: [
      { id: 5, type: 'mention', user: 'traveler4', action: 'mentioned you in a post', time: '3h ago', read: true },
    ],
  };

  const getIcon = (type) => {
    switch (type) {
      case 'like': return '❤️';
      case 'comment': return '💬';
      case 'follow': return '👤';
      case 'campaign': return '🏆';
      case 'mention': return '@';
      default: return '📱';
    }
  };

  const currentNotifications = notifications[activeTab] || notifications.all;

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Notifications</Text>
        <TouchableOpacity style={styles.markAllRead}>
          <Text style={styles.markAllReadText}>Mark all read</Text>
        </TouchableOpacity>
      </View>

      {/* Tabs */}
      <View style={styles.tabsContainer}>
        {['all', 'likes', 'comments', 'mentions'].map((tab) => (
          <TouchableOpacity
            key={tab}
            style={[styles.tab, activeTab === tab && styles.activeTab]}
            onPress={() => setActiveTab(tab)}
          >
            <Text style={[styles.tabText, activeTab === tab && styles.activeTabText]}>
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Notifications List */}
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        {currentNotifications.map((notification) => (
          <TouchableOpacity
            key={notification.id}
            style={[
              styles.notificationItem,
              !notification.read && styles.unreadItem
            ]}
          >
            <View style={styles.notificationIcon}>
              <Text style={styles.iconText}>{getIcon(notification.type)}</Text>
            </View>
            <View style={styles.notificationContent}>
              <View style={styles.notificationHeader}>
                <Text style={styles.username}>{notification.user}</Text>
                <Text style={styles.time}>{notification.time}</Text>
              </View>
              <Text style={styles.action}>{notification.action}</Text>
            </View>
            {!notification.read && <View style={styles.unreadDot} />}
          </TouchableOpacity>
        ))}

        {/* Campaign Alert */}
        <View style={styles.campaignAlert}>
          <Text style={styles.campaignIcon}>🏆</Text>
          <View style={styles.campaignContent}>
            <Text style={styles.campaignTitle}>New Campaign Available!</Text>
            <Text style={styles.campaignDescription}>Ethiopian Culture Challenge - Win prizes</Text>
            <TouchableOpacity style={styles.campaignButton}>
              <Text style={styles.campaignButtonText}>Join Now</Text>
            </TouchableOpacity>
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
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#262626',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '900',
    color: '#F9E08B',
  },
  markAllRead: {
    padding: 8,
  },
  markAllReadText: {
    fontSize: 12,
    color: '#F9E08B',
    fontWeight: '600',
  },
  tabsContainer: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#262626',
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
  },
  activeTab: {
    borderBottomWidth: 2,
    borderBottomColor: '#F9E08B',
  },
  tabText: {
    fontSize: 14,
    color: '#666',
    fontWeight: '600',
  },
  activeTabText: {
    color: '#F9E08B',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 80,
  },
  notificationItem: {
    flexDirection: 'row',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#262626',
    backgroundColor: '#1A1A1A',
  },
  unreadItem: {
    backgroundColor: '#1A2A1A',
  },
  notificationIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#333',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  iconText: {
    fontSize: 18,
  },
  notificationContent: {
    flex: 1,
  },
  notificationHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  username: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#fff',
  },
  time: {
    fontSize: 12,
    color: '#666',
  },
  action: {
    fontSize: 14,
    color: '#fff',
    lineHeight: 18,
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#F9E08B',
    marginLeft: 8,
    alignSelf: 'flex-start',
    marginTop: 8,
  },
  campaignAlert: {
    margin: 16,
    backgroundColor: '#1A2A1A',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#F9E08B',
  },
  campaignIcon: {
    fontSize: 24,
    marginBottom: 8,
  },
  campaignContent: {
    flex: 1,
  },
  campaignTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#F9E08B',
    marginBottom: 4,
  },
  campaignDescription: {
    fontSize: 14,
    color: '#fff',
    marginBottom: 12,
  },
  campaignButton: {
    backgroundColor: '#F9E08B',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    alignSelf: 'flex-start',
  },
  campaignButtonText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#000',
  },
});
