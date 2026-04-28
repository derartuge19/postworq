import React, { useState, useEffect } from 'react';
import { enableScreens } from 'react-native-screens';

enableScreens();
import { View, Text, TouchableOpacity, StyleSheet, Platform, ActivityIndicator, Alert, Linking } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createStackNavigator } from '@react-navigation/stack';
import { Ionicons } from '@expo/vector-icons';
import api from '../api';
import Constants from 'expo-constants';

import { AuthProvider, useAuth } from '../contexts/AuthContext';
import { LanguageProvider, useLanguage } from '../contexts/LanguageContext';
import { ThemeProvider, useTheme } from '../contexts/ThemeContext';
import LoginScreen from '../screens/auth/LoginScreen';
import RegisterScreen from '../screens/auth/RegisterScreen';
import HomeScreen from '../screens/HomeScreen';
import ExploreScreen from '../screens/ExploreScreen';
import CreateScreen from '../screens/CreateScreen';
import NotificationsScreen from '../screens/NotificationsScreen';
import ProfileScreen from '../screens/ProfileScreen';
import EditProfileScreen from '../screens/EditProfileScreen';
import ReelsScreen from '../screens/ReelsScreen';
import VideoDetailScreen from '../screens/VideoDetailScreen';
import ProfileDetailScreen from '../screens/ProfileDetailScreen';
import CommentsScreen from '../screens/CommentsScreen';
import CampaignsScreen from '../screens/CampaignsScreen';
import CampaignDetailScreen from '../screens/CampaignDetailScreen';
import CampaignFeedScreen from '../screens/CampaignFeedScreen';
import CampaignLeaderboardScreen from '../screens/CampaignLeaderboardScreen';
import SettingsScreen from '../screens/SettingsScreen';
import FollowListScreen from '../screens/FollowListScreen';
import WalletScreen from '../screens/WalletScreen';
import GiftSelectorScreen from '../screens/GiftSelectorScreen';
import CustomCameraScreen from '../screens/CustomCameraScreen';

// ── Brand theme — keep in sync with web selfi_star theme ──────────────────────
const BRAND = {
  pri:      '#F9E08B',   // gold accent — matches web T.pri
  bg:       '#ffffff',
  cardBg:   '#ffffff',
  border:   '#e5e5e5',
  txt:      '#000000',
  sub:      '#999999',
  inactive: '#999999',
};

const Tab   = createBottomTabNavigator();
const Stack = createStackNavigator();

// ── Main Tab Navigator ─────────────────────────────────────────────────────────
function MainTabs() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor: '#F9E08B',
        tabBarInactiveTintColor: '#ffffff',
        tabBarStyle: {
          backgroundColor: '#0d0d0d',
          borderTopWidth: StyleSheet.hairlineWidth,
          borderTopColor: '#F9E08B30',
          height: 60,
          paddingBottom: 8,
          paddingTop: 6,
          elevation: 8,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: -2 },
          shadowOpacity: 0.3,
          shadowRadius: 8,
        },
        tabBarLabelStyle: { fontSize: 10, fontWeight: '600' },
        tabBarIcon: ({ focused, color, size }) => {
          const icons = {
            Home:          focused ? 'home'          : 'home-outline',
            Reels:         focused ? 'film'          : 'film-outline',
            Create:        'add',
            Notifications: focused ? 'notifications' : 'notifications-outline',
            Profile:       focused ? 'person'        : 'person-outline',
          };
          const isCreate = route.name === 'Create';
          if (isCreate) {
            return (
              <View style={{
                width: 44, height: 44, borderRadius: 22,
                backgroundColor: '#F9E08B',
                justifyContent: 'center', alignItems: 'center',
                marginBottom: 4,
                shadowColor: '#F9E08B',
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: 0.5,
                shadowRadius: 8,
                elevation: 8,
              }}>
                <Ionicons name="add" size={24} color="#000" />
              </View>
            );
          }
          return <Ionicons name={icons[route.name]} size={size} color={color} />;
        },
        tabBarLabel: ({ focused, color }) => {
          const label = route.name === 'Notifications' ? 'Alerts' : route.name;
          return <Text style={{ fontSize: 10, color, fontWeight: focused ? '700' : '400' }}>{label}</Text>;
        },
      })}
    >
      <Tab.Screen name="Home"          component={HomeScreen} />
      <Tab.Screen name="Reels"         component={ReelsScreen} />
      <Tab.Screen name="Create"        component={CreateScreen} />
      <Tab.Screen name="Notifications" component={NotificationsScreen} />
      <Tab.Screen name="Profile"       component={ProfileScreen} />
    </Tab.Navigator>
  );
}

// ── Main Stack (wraps tabs + push screens) ─────────────────────────────────────
function MainStack() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerStyle: { backgroundColor: BRAND.bg, elevation: 0, shadowOpacity: 0 },
        headerTintColor: BRAND.txt,
        headerTitleStyle: { fontWeight: '700', fontSize: 16 },
        headerBackTitleVisible: false,
      }}
    >
      <Stack.Screen name="MainTabs"       component={MainTabs}             options={{ headerShown: false }} />
      <Stack.Screen name="Explore"        component={ExploreScreen}        options={{ headerShown: false }} />
      <Stack.Screen name="Reels"          component={ReelsScreen}          options={{ headerShown: false }} />
      <Stack.Screen name="VideoDetail"    component={VideoDetailScreen}    options={{ title: 'Video' }} />
      <Stack.Screen name="ProfileDetail"  component={ProfileDetailScreen}  options={{ title: 'Profile' }} />
      <Stack.Screen name="EditProfile"    component={EditProfileScreen}     options={{ headerShown: false }} />
      <Stack.Screen name="Comments"           component={CommentsScreen}           options={{ title: 'Comments', headerBackTitleVisible: false }} />
      <Stack.Screen name="Campaigns"          component={CampaignsScreen}          options={{ title: 'Campaigns' }} />
      <Stack.Screen name="CampaignDetail"     component={CampaignDetailScreen}     options={{ title: 'Campaign' }} />
      <Stack.Screen name="CampaignFeed"       component={CampaignFeedScreen}       options={{ title: 'Campaign Feed' }} />
      <Stack.Screen name="CampaignLeaderboard" component={CampaignLeaderboardScreen} options={{ title: 'Leaderboard' }} />
      <Stack.Screen name="Settings"           component={SettingsScreen}           options={{ headerShown: false }} />
      <Stack.Screen name="FollowList"         component={FollowListScreen}         options={{ headerShown: false }} />
      <Stack.Screen name="Wallet"             component={WalletScreen}             options={{ title: 'Wallet' }} />
      <Stack.Screen name="GiftSelector"       component={GiftSelectorScreen}       options={{ headerShown: false }} />
      <Stack.Screen name="CustomCamera"       component={CustomCameraScreen}       options={{ headerShown: false }} />
    </Stack.Navigator>
  );
}

// ── Auth Stack ─────────────────────────────────────────────────────────────────
function AuthStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Login"    component={LoginScreen} />
      <Stack.Screen name="Register" component={RegisterScreen} />
    </Stack.Navigator>
  );
}

// ── Root Navigator ─────────────────────────────────────────────────────────────
function RootNavigator() {
  const { user, loading: authLoading } = useAuth();
  const [appLoading, setAppLoading] = useState(true);
  const [forceUpdate, setForceUpdate] = useState(null);

  useEffect(() => {
    checkMobileConfig();
  }, []);

  const checkMobileConfig = async () => {
    try {
      const config = await api.getPublicSettings();
      
      // Check for force update from admin side
      if (config?.force_update?.enabled) {
        const minVersion = config.force_update.min_version;
        const currentVersion = Constants.expoConfig?.version || '1.0.0';
        
        if (isVersionLower(currentVersion, minVersion)) {
          setForceUpdate(config.force_update);
          return;
        }
      }
      
      // Feature flags could be stored in a context here if needed
    } catch (e) {
      console.warn('[RootNavigator] Config fetch failed:', e);
    } finally {
      setAppLoading(false);
    }
  };

  const isVersionLower = (current, min) => {
    const c = current.split('.').map(Number);
    const m = min.split('.').map(Number);
    for (let i = 0; i < 3; i++) {
      if ((c[i] || 0) < (m[i] || 0)) return true;
      if ((c[i] || 0) > (m[i] || 0)) return false;
    }
    return false;
  };

  if (authLoading || appLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={BRAND.pri} />
      </View>
    );
  }

  if (forceUpdate) {
    return (
      <View style={styles.updateContainer}>
        <View style={styles.updateCard}>
          <Ionicons name="cloud-download" size={64} color={BRAND.pri} />
          <Text style={styles.updateTitle}>Update Required</Text>
          <Text style={styles.updateMessage}>
            {forceUpdate.message || 'A new version of FlipStar is available. Please update to continue.'}
          </Text>
          <TouchableOpacity 
            style={styles.updateBtn}
            onPress={() => Linking.openURL(Platform.OS === 'ios' ? 'https://apps.apple.com' : 'https://play.google.com')}
          >
            <Text style={styles.updateBtnText}>Update Now</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return user ? <MainStack /> : <AuthStack />;
}

export default function AppNavigator() {
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

// ── Styles ─────────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: BRAND.bg,
  },

  // Bottom tab bar styles removed (using built-in tab bar now)

  // Update Screen
  updateContainer: {
    flex: 1,
    backgroundColor: BRAND.bg,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  updateCard: {
    width: '100%',
    backgroundColor: BRAND.cardBg,
    borderRadius: 24,
    padding: 32,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.1,
    shadowRadius: 24,
    elevation: 12,
  },
  updateTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: BRAND.txt,
    marginTop: 20,
    marginBottom: 12,
  },
  updateMessage: {
    fontSize: 15,
    color: BRAND.sub,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 28,
  },
  updateBtn: {
    width: '100%',
    height: 52,
    backgroundColor: BRAND.pri,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: BRAND.pri,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 6,
  },
  updateBtnText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
});
