import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useAuth } from '../contexts/AuthContext';

export default function ProfileScreen() {
  const { user } = useAuth();

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Profile</Text>
      {user ? (
        <View style={styles.userInfo}>
          <Text style={styles.userInfoText}>Username: {user.username}</Text>
          <Text style={styles.userInfoText}>Name: {user.first_name} {user.last_name}</Text>
        </View>
      ) : (
        <Text style={styles.userInfoText}>No user data available</Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0D0D0D',
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#F9E08B',
    marginBottom: 20,
  },
  userInfo: {
    backgroundColor: '#1A1A1A',
    padding: 15,
    borderRadius: 10,
  },
  userInfoText: {
    color: '#fff',
    fontSize: 16,
    marginBottom: 8,
  },
});
