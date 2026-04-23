import React, { useState, useEffect, useRef } from 'react';
import { View, TouchableOpacity, Text, StyleSheet, Platform, ActivityIndicator, Alert, Linking, PanResponder } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createStackNavigator } from '@react-navigation/stack';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
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
import SettingsScreen from '../screens/SettingsScreen';
import FollowListScreen from '../screens/FollowListScreen';

// ── Brand theme — keep in sync with web selfi_star theme ──────────────────────
const BRAND = {
  pri:      '#DA9B2A',   // gold accent — matches web T.pri
  bg:       '#ffffff',
  cardBg:   '#ffffff',
  border:   '#e5e5e5',
  txt:      '#000000',
  sub:      '#999999',
  inactive: '#999999',
};

const Tab   = createBottomTabNavigator();
const Stack = createStackNavigator();

// ── Custom Tab Bar ─────────────────────────────────────────────────────────────
// Matches the web AppShell mobile bottom nav: Home | Discover | [+] | Alerts | Profile
function CustomTabBar({ state, descriptors, navigation }) {
  const insets = useSafeAreaInsets();

  const TAB_ORDER = ['Home', 'Reels', 'Create', 'Notifications', 'Profile'];

  return (
    <View style={[styles.tabBar, { paddingBottom: insets.bottom || 8 }]}>
      {TAB_ORDER.map((routeName, index) => {
        const route = state.routes.find(r => r.name === routeName);
        if (!route) return null;

        const { options } = descriptors[route.key];
        const isFocused = state.index === state.routes.indexOf(route);
        const isCreate  = routeName === 'Create';

        const onPress = () => {
          const event = navigation.emit({
            type: 'tabPress',
            target: route.key,
            canPreventDefault: true,
          });
          if (!isFocused && !event.defaultPrevented) {
            navigation.navigate(route.name);
          }
        };

        // ── Icon map ──
        const iconMap = {
          Home:          isFocused ? 'home'              : 'home-outline',
          Reels:         isFocused ? 'film'              : 'film-outline',
          Create:        'add',
          Notifications: isFocused ? 'notifications'     : 'notifications-outline',
          Profile:       isFocused ? 'person'            : 'person-outline',
        };
        const iconName = iconMap[routeName];
        const label    = routeName === 'Notifications' ? 'Alerts' : routeName;

        // ── Center Create pill button ──
        if (isCreate) {
          return (
            <TouchableOpacity
              key={routeName}
              accessibilityRole="button"
              accessibilityLabel="Create new post"
              onPress={onPress}
              activeOpacity={0.8}
              style={styles.createBtn}
            >
              <Ionicons name="add" size={22} color="#fff" strokeWidth={2.5} />
            </TouchableOpacity>
          );
        }

        // ── Normal tab ──
        return (
          <TouchableOpacity
            key={routeName}
            accessibilityRole="button"
            accessibilityLabel={label}
            onPress={onPress}
            activeOpacity={0.7}
            style={styles.tabItem}
          >
            <Ionicons
              name={iconName}
              size={24}
              color={isFocused ? BRAND.pri : BRAND.inactive}
            />
            <Text style={[styles.tabLabel, { color: isFocused ? BRAND.pri : BRAND.inactive, fontWeight: isFocused ? '700' : '400' }]}>
              {label}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

// ── Swipe Navigation Wrapper ───────────────────────────────────────────────────
function SwipeableTabs({ navigation }) {
  const swipeStart = useRef({ x: 0, y: 0, active: false });
  const TAB_ORDER = ['Home', 'Reels', 'Create', 'Notifications', 'Profile'];

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => false, // Only handle horizontal swipes, not vertical scroll
      onPanResponderGrant: (e) => {
        swipeStart.current = {
          x: e.nativeEvent.locationX,
          y: e.nativeEvent.locationY,
          active: true
        };
      },
      onPanResponderRelease: (e) => {
        if (!swipeStart.current.active) return;
        
        const dx = e.nativeEvent.locationX - swipeStart.current.x;
        const dy = e.nativeEvent.locationY - swipeStart.current.y;
        
        // Must be horizontal swipe with minimal vertical movement
        const absX = Math.abs(dx);
        const absY = Math.abs(dy);
        
        // Thresholds: 70px horizontal distance, horizontal must be 1.8x vertical
        if (absX > 70 && absX > absY * 1.8) {
          const currentRoute = navigation.getState().routes[navigation.getState().index].name;
          const currentIndex = TAB_ORDER.indexOf(currentRoute);
          
          if (currentIndex !== -1) {
            const nextIndex = dx < 0 ? currentIndex + 1 : currentIndex - 1; // left = next, right = prev
            
            if (nextIndex >= 0 && nextIndex < TAB_ORDER.length) {
              navigation.navigate(TAB_ORDER[nextIndex]);
            }
          }
        }
        
        swipeStart.current.active = false;
      },
    })
  ).current;

  return (
    <View style={{ flex: 1 }} {...panResponder.panHandlers}>
      <Tab.Navigator
        tabBar={props => <CustomTabBar {...props} />}
        screenOptions={{ headerShown: false }}
      >
        <Tab.Screen name="Home"          component={HomeScreen} />
        <Tab.Screen name="Reels"         component={ReelsScreen} />
        <Tab.Screen name="Create"        component={CreateScreen} />
        <Tab.Screen name="Notifications" component={NotificationsScreen} />
        <Tab.Screen name="Profile"       component={ProfileScreen} />
      </Tab.Navigator>
    </View>
  );
}

// ── Main Tab Navigator ─────────────────────────────────────────────────────────
function MainTabs({ navigation }) {
  return <SwipeableTabs navigation={navigation} />;
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
      <Stack.Screen name="Comments"       component={CommentsScreen}       options={{ title: 'Comments' }} />
      <Stack.Screen name="Campaigns"      component={CampaignsScreen}      options={{ title: 'Campaigns' }} />
      <Stack.Screen name="CampaignDetail" component={CampaignDetailScreen} options={{ title: 'Campaign' }} />
      <Stack.Screen name="Settings"       component={SettingsScreen}       options={{ headerShown: false }} />
      <Stack.Screen name="FollowList"     component={FollowListScreen}     options={{ headerShown: false }} />
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

  // Bottom tab bar — height 60 + safe-area, matching web AppShell height:60
  tabBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    backgroundColor: BRAND.cardBg,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: BRAND.border,
    height: 60 + (Platform.OS === 'ios' ? 0 : 0), // safe-area added via paddingBottom
    paddingTop: 6,
    // subtle shadow on iOS
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 8,
  },

  tabItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 2,
  },

  tabLabel: {
    fontSize: 10,
    lineHeight: 14,
    marginTop: 2,
  },

  // Center [+] pill — matches web rounded-pill create button
  createBtn: {
    width: 48,
    height: 32,
    borderRadius: 16,
    backgroundColor: BRAND.pri,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: BRAND.pri,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 6,
    marginBottom: 4,
  },

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
