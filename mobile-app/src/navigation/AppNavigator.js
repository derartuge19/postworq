import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { useAuth } from '../contexts/AuthContext';
import LoginScreen from '../screens/auth/LoginScreen';
import RegisterScreen from '../screens/auth/RegisterScreen';
import HomeScreen from '../screens/HomeScreen';
import ReelsScreen from '../screens/ReelsScreen';
import ExploreScreen from '../screens/ExploreScreen';
import CreateScreen from '../screens/CreateScreen';
import NotificationsScreen from '../screens/NotificationsScreen';
import ProfileScreen from '../screens/ProfileScreen';

const Stack = createStackNavigator();
const Tab = createBottomTabNavigator();

const MainTabs = () => (
  <Tab.Navigator
    screenOptions={{
      headerShown: false,
      tabBarStyle: {
        backgroundColor: '#1A1A1A',
        borderTopColor: '#262626',
        borderTopWidth: 1,
        paddingBottom: 5,
        paddingTop: 5,
        height: 65,
      },
      tabBarActiveTintColor: '#F9E08B',
      tabBarInactiveTintColor: '#666',
      tabBarLabelStyle: {
        fontSize: 11,
        fontWeight: '600',
      },
    }}
  >
    <Tab.Screen 
      name="Home" 
      component={HomeScreen} 
      options={{
        tabBarLabel: 'Home',
        tabBarIcon: ({ color, size }) => (
          <Text style={{ color, fontSize: size }}>🏠</Text>
        ),
      }}
    />
    <Tab.Screen 
      name="Explore" 
      component={ExploreScreen} 
      options={{
        tabBarLabel: 'Explore',
        tabBarIcon: ({ color, size }) => (
          <Text style={{ color, fontSize: size }}>🔍</Text>
        ),
      }}
    />
    <Tab.Screen 
      name="Create" 
      component={CreateScreen} 
      options={{
        tabBarLabel: 'Create',
        tabBarIcon: ({ color, size }) => (
          <Text style={{ color, fontSize: size }}>➕</Text>
        ),
      }}
    />
    <Tab.Screen 
      name="Reels" 
      component={ReelsScreen} 
      options={{
        tabBarLabel: 'Reels',
        tabBarIcon: ({ color, size }) => (
          <Text style={{ color, fontSize: size }}>🎬</Text>
        ),
      }}
    />
    <Tab.Screen 
      name="Notifications" 
      component={NotificationsScreen} 
      options={{
        tabBarLabel: 'Alerts',
        tabBarIcon: ({ color, size }) => (
          <Text style={{ color, fontSize: size }}>🔔</Text>
        ),
      }}
    />
  </Tab.Navigator>
);

const AppStack = () => (
  <Stack.Navigator screenOptions={{ headerShown: false }}>
    <Stack.Screen name="MainTabs" component={MainTabs} />
    <Stack.Screen name="Profile" component={ProfileScreen} />
  </Stack.Navigator>
);

const AuthStack = () => (
  <Stack.Navigator screenOptions={{ headerShown: false }}>
    <Stack.Screen name="Login" component={LoginScreen} />
    <Stack.Screen name="Register" component={RegisterScreen} />
  </Stack.Navigator>
);

const AppNavigator = () => {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    // You could add a loading screen here
    return null;
  }

  return isAuthenticated ? <AppStack /> : <AuthStack />;
};

export default AppNavigator;
