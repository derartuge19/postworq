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

const BRAND = {
  pri:      '#C8B56A',
  bg:       '#0B0B0C',
  cardBg:   '#121214',
  txt:      '#F5F5F7',
  sub:      '#A1A1AA',
};

const Tab   = createBottomTabNavigator();
const Stack = createStackNavigator();

function MainTabs() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor: '#C8B56A',
        tabBarInactiveTintColor: '#666666',
        tabBarStyle: {
          backgroundColor: '#0B0B0C',
          borderTopWidth: StyleSheet.hairlineWidth,
          borderTopColor: '#C8B56A30',
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
            Home:    focused ? 'home'          : 'home-outline',
            Reels:   focused ? 'film'          : 'film-outline',
            Create:  'add',
            Alert:   focused ? 'notifications' : 'notifications-outline',
            Profile: focused ? 'person'        : 'person-outline',
          };
          const isCreate = route.name === 'Create';
          if (isCreate) {
            return (
              <View style={{
                width: 44, height: 44, borderRadius: 22,
                backgroundColor: '#C8B56A',
                justifyContent: 'center', alignItems: 'center',
                marginBottom: 4,
                shadowColor: '#C8B56A',
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
          if (route.name === 'Create') return null;
          return <Text style={{ fontSize: 10, color, fontWeight: focused ? '700' : '400' }}>{route.name}</Text>;
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
    <Stack.Navigator
      screenOptions={{
        headerStyle: { backgroundColor: BRAND.bg, elevation: 0, shadowOpacity: 0 },
        headerTintColor: BRAND.txt,
        headerTitleStyle: { fontWeight: '700', fontSize: 16 },
        headerBackTitleVisible: false,
      }}
    >
      <Stack.Screen name="MainTabs"   component={MainTabs}          options={{ headerShown: false }} />
      <Stack.Screen name="Explore"    component={ExploreScreen}     options={{ headerShown: false }} />
      <Stack.Screen name="ReelsDetail" component={ReelsScreen}      options={{ headerShown: false }} />
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
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={BRAND.pri} />
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

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: BRAND.bg,
  },
});
