import React, { useState, useEffect } from 'react';
import { enableScreens } from 'react-native-screens';
enableScreens();
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createStackNavigator } from '@react-navigation/stack';
import { Ionicons } from '@expo/vector-icons';

import { AuthProvider, useAuth } from '../contexts/AuthContext';
import { LanguageProvider } from '../contexts/LanguageContext';
import { ThemeProvider } from '../contexts/ThemeContext';

import LoginScreen from '../screens/auth/LoginScreen';
import RegisterScreen from '../screens/auth/RegisterScreen';
import HomeScreen from '../screens/HomeScreen';
import ExploreScreen from '../screens/ExploreScreen';
import CreateScreen from '../screens/CreateScreen';
import NotificationsScreen from '../screens/NotificationsScreen';
import ProfileScreen from '../screens/ProfileScreen';
import ReelsScreen from '../screens/ReelsScreen';

const GOLD = '#C8B56A';
const BG = '#0B0B0C';

const Tab = createBottomTabNavigator();
const Stack = createStackNavigator();

function MainTabs() {
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
            Home:    focused ? 'home'          : 'home-outline',
            Reels:   focused ? 'film'          : 'film-outline',
            Create:  'add',
            Alert:   focused ? 'notifications' : 'notifications-outline',
            Profile: focused ? 'person'        : 'person-outline',
          };
          if (route.name === 'Create') {
            return (
              <View style={{ width: 44, height: 44, borderRadius: 22, backgroundColor: GOLD, justifyContent: 'center', alignItems: 'center', marginBottom: 4, elevation: 8 }}>
                <Ionicons name="add" size={26} color="#000" />
              </View>
            );
          }
          return <Ionicons name={icons[route.name]} size={size} color={color} />;
        },
        tabBarLabel: ({ color }) => {
          if (route.name === 'Create') return null;
          const labels = { Home: 'Home', Reels: 'Reels', Alert: 'Alerts', Profile: 'Profile' };
          return <Text style={{ fontSize: 10, color, fontWeight: '600' }}>{labels[route.name]}</Text>;
        },
      })}
    >
      <Tab.Screen name="Home"    component={HomeScreen} />
      <Tab.Screen name="Reels"   component={ReelsScreen} />
      <Tab.Screen name="Create"  component={CreateScreen} />
      <Tab.Screen name="Alert"   component={NotificationsScreen} />
      <Tab.Screen name="Profile" component={ProfileScreen} />
    </Tab.Navigator>
  );
}

function MainStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false, cardStyle: { backgroundColor: BG } }}>
      <Stack.Screen name="MainTabs"    component={MainTabs} />
      <Stack.Screen name="Explore"     component={ExploreScreen} />
      <Stack.Screen name="ReelsDetail" component={ReelsScreen} />
      <Stack.Screen name="Profile"     component={ProfileScreen} />
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
