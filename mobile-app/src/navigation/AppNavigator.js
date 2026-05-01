import React, { useState, useEffect } from 'react';
import { enableScreens } from 'react-native-screens';
enableScreens();
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createStackNavigator } from '@react-navigation/stack';
import { Ionicons } from '@expo/vector-icons';
import api from '../api';

import { AuthProvider, useAuth } from '../contexts/AuthContext';
import { LanguageProvider } from '../contexts/LanguageContext';
import { ThemeProvider } from '../contexts/ThemeContext';

// Auth
import LoginScreen from '../screens/auth/LoginScreen';
import RegisterScreen from '../screens/auth/RegisterScreen';

// Main tabs
import HomeScreen from '../screens/HomeScreen';
import ReelsScreen from '../screens/ReelsScreen';
import CreateScreen from '../screens/CreateScreen';
import MessagesScreen from '../screens/MessagesScreen';
import ProfileScreen from '../screens/ProfileScreen';

// Stack screens
import ExploreScreen from '../screens/ExploreScreen';
import EditProfileScreen from '../screens/EditProfileScreen';
import SettingsScreen from '../screens/SettingsScreen';
import FollowListScreen from '../screens/FollowListScreen';
import CampaignsScreen from '../screens/CampaignsScreen';
import CampaignDetailScreen from '../screens/CampaignDetailScreen';
import LeaderboardScreen from '../screens/LeaderboardScreen';
import WalletScreen from '../screens/WalletScreen';
import SubscriptionScreen from '../screens/SubscriptionScreen';
import GamificationScreen from '../screens/GamificationScreen';
import NotificationsScreen from '../screens/NotificationsScreen';

const GOLD = '#C8B56A';
const BG = '#0B0B0C';

const Tab = createBottomTabNavigator();
const Stack = createStackNavigator();

function MainTabs() {
  const [unreadMessages, setUnreadMessages] = useState(0);

  useEffect(() => {
    // Poll unread DM count every 30s
    const fetchUnread = async () => {
      try {
        const data = await api.request('/messages/unread-count/').catch(() => null);
        if (data?.count !== undefined) setUnreadMessages(data.count);
      } catch {}
    };
    fetchUnread();
    const interval = setInterval(fetchUnread, 30000);
    return () => clearInterval(interval);
  }, []);
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor: GOLD,
        tabBarInactiveTintColor: '#666',
        tabBarStyle: {
          backgroundColor: '#0B0B0C',
          borderTopWidth: StyleSheet.hairlineWidth,
          borderTopColor: GOLD + '30',
          height: 60,
          paddingBottom: 8,
          paddingTop: 6,
        },
        tabBarLabelStyle: { fontSize: 10, fontWeight: '600' },
        tabBarIcon: ({ focused, color, size }) => {
          const icons = {
            Home:     focused ? 'home'          : 'home-outline',
            Reels:    focused ? 'film'          : 'film-outline',
            Create:   'add',
            Messages: focused ? 'chatbubble'    : 'chatbubble-outline',
            Profile:  focused ? 'person'        : 'person-outline',
          };
          if (route.name === 'Create') {
            return (
              <View style={{ width: 44, height: 44, borderRadius: 22, backgroundColor: GOLD, justifyContent: 'center', alignItems: 'center', marginBottom: 4, elevation: 8, shadowColor: GOLD, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.5, shadowRadius: 8 }}>
                <Ionicons name="add" size={26} color="#000" />
              </View>
            );
          }
          if (route.name === 'Messages' && unreadMessages > 0) {
            return (
              <View>
                <Ionicons name={focused ? 'chatbubble' : 'chatbubble-outline'} size={size} color={color} />
                <View style={{ position: 'absolute', top: -4, right: -6, backgroundColor: '#EF4444', borderRadius: 8, minWidth: 16, height: 16, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 3 }}>
                  <Text style={{ color: '#fff', fontSize: 9, fontWeight: '800' }}>{unreadMessages > 99 ? '99+' : unreadMessages}</Text>
                </View>
              </View>
            );
          }
          return <Ionicons name={icons[route.name]} size={size} color={color} />;
        },
        tabBarLabel: ({ color }) => {
          if (route.name === 'Create') return null;
          const labels = { Home: 'Home', Reels: 'Reels', Messages: 'Messages', Profile: 'Profile' };
          return <Text style={{ fontSize: 10, color, fontWeight: '600' }}>{labels[route.name]}</Text>;
        },
      })}
    >
      <Tab.Screen name="Home"     component={HomeScreen} />
      <Tab.Screen name="Reels"    component={ReelsScreen} />
      <Tab.Screen name="Create"   component={CreateScreen} />
      <Tab.Screen name="Messages" component={MessagesScreen} />
      <Tab.Screen name="Profile"  component={ProfileScreen} />
    </Tab.Navigator>
  );
}

function MainStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false, cardStyle: { backgroundColor: BG } }}>
      <Stack.Screen name="MainTabs"        component={MainTabs} />
      <Stack.Screen name="Explore"         component={ExploreScreen} />
      <Stack.Screen name="ReelsDetail"     component={ReelsScreen} />
      <Stack.Screen name="Profile"         component={ProfileScreen} />
      <Stack.Screen name="EditProfile"     component={EditProfileScreen} />
      <Stack.Screen name="Settings"        component={SettingsScreen} />
      <Stack.Screen name="Messages"        component={MessagesScreen} />
      <Stack.Screen name="FollowList"      component={FollowListScreen} />
      <Stack.Screen name="Campaigns"       component={CampaignsScreen} />
      <Stack.Screen name="CampaignDetail"  component={CampaignDetailScreen} />
      <Stack.Screen name="Leaderboard"    component={LeaderboardScreen} />
      <Stack.Screen name="Wallet"          component={WalletScreen} />
      <Stack.Screen name="Subscription"    component={SubscriptionScreen} />
      <Stack.Screen name="Gamification"    component={GamificationScreen} />
      <Stack.Screen name="Notifications"   component={NotificationsScreen} />
    </Stack.Navigator>
  );
}

function AuthStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Login"    component={LoginScreen} />
      <Stack.Screen name="Register" component={RegisterScreen} />
    </Stack.Navigator>
  );
}

function RootNavigator() {
  const { user, loading } = useAuth();
  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: BG }}>
        <ActivityIndicator size="large" color={GOLD} />
      </View>
    );
  }
  return user ? <MainStack /> : <AuthStack />;
}

export default function AppNavigator() {
  // Wake up the backend immediately on app open (Render free tier cold starts)
  React.useEffect(() => { api.warmUp(); }, []);
  return (
    <ThemeProvider>
      <LanguageProvider>
        <AuthProvider>
          <NavigationContainer>
            <RootNavigator />
          </NavigationContainer>
        </AuthProvider>
      </LanguageProvider>
    </ThemeProvider>
  );
}
