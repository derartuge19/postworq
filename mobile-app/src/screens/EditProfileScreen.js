import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  TextInput,
  ScrollView,
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  StatusBar,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import api from '../api';
import { useAuth } from '../contexts/AuthContext';
import config from '../config';

const BRAND_GOLD = '#DA9B2A';

const mediaUrl = (url) => {
  if (!url) return null;
  if (url.startsWith('http')) return url;
  return `${config.API_BASE_URL.replace('/api', '')}${url}`;
};

export default function EditProfileScreen({ navigation }) {
  const insets = useSafeAreaInsets();
  const { user, setUser } = useAuth();
  
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    username: user?.username || '',
    email: user?.email || '',
    firstName: user?.first_name || '',
    lastName: user?.last_name || '',
    bio: user?.bio || '',
  });
  
  const [photoPreview, setPhotoPreview] = useState(user?.profile_photo || null);
  const [photoFile, setPhotoFile] = useState(null);

  const handlePhotoPick = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission Denied', 'Camera roll access is required to change your photo.');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.7,
    });

    if (!result.canceled && result.assets?.length) {
      const asset = result.assets[0];
      setPhotoPreview(asset.uri);
      setPhotoFile({
        uri: asset.uri,
        name: 'profile_photo.jpg',
        type: 'image/jpeg',
      });
    }
  };

  const handleSave = async () => {
    try {
      setLoading(true);
      const data = new FormData();
      data.append('username', formData.username);
      data.append('email', formData.email);
      data.append('first_name', formData.firstName);
      data.append('last_name', formData.lastName);
      data.append('bio', formData.bio);
      
      if (photoFile) {
        data.append('profile_photo', {
          uri: Platform.OS === 'ios' ? photoFile.uri.replace('file://', '') : photoFile.uri,
          name: photoFile.name,
          type: photoFile.type,
        });
      }

      const response = await api.request('/profile/update_profile/', {
        method: 'PATCH',
        body: data,
      });

      // Update local auth context
      setUser({ ...user, ...response });
      
      Alert.alert('Success', 'Profile updated successfully!', [
        { text: 'OK', onPress: () => navigation.goBack() }
      ]);
    } catch (error) {
      console.error('Update profile error:', error);
      Alert.alert('Error', 'Failed to update profile. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.root}>
      <StatusBar barStyle="dark-content" />
      
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + 10 }]}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color="#000" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Edit Profile</Text>
        <TouchableOpacity onPress={handleSave} disabled={loading}>
          {loading ? (
            <ActivityIndicator size="small" color={BRAND_GOLD} />
          ) : (
            <Text style={styles.saveBtnText}>Save</Text>
          )}
        </TouchableOpacity>
      </View>

      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'} 
        style={{ flex: 1 }}
      >
        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          {/* Profile Photo */}
          <View style={styles.photoContainer}>
            <TouchableOpacity onPress={handlePhotoPick} activeOpacity={0.8}>
              <View style={styles.avatarWrap}>
                {photoPreview ? (
                  <Image source={{ uri: photoPreview.startsWith('file') ? photoPreview : mediaUrl(photoPreview) }} style={styles.avatar} />
                ) : (
                  <View style={[styles.avatar, styles.avatarFallback]}>
                    <Text style={styles.avatarInitial}>{user?.username?.[0]?.toUpperCase()}</Text>
                  </View>
                )}
                <View style={styles.cameraIcon}>
                  <Ionicons name="camera" size={16} color="#fff" />
                </View>
              </View>
              <Text style={styles.changePhotoText}>Change Profile Photo</Text>
            </TouchableOpacity>
          </View>

          {/* Form */}
          <View style={styles.form}>
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Username</Text>
              <TextInput
                style={styles.input}
                value={formData.username}
                onChangeText={(v) => setFormData({ ...formData, username: v })}
                autoCapitalize="none"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Email</Text>
              <TextInput
                style={styles.input}
                value={formData.email}
                onChangeText={(v) => setFormData({ ...formData, email: v })}
                keyboardType="email-address"
                autoCapitalize="none"
              />
            </View>

            <View style={styles.row}>
              <View style={[styles.inputGroup, { flex: 1 }]}>
                <Text style={styles.label}>First Name</Text>
                <TextInput
                  style={styles.input}
                  value={formData.firstName}
                  onChangeText={(v) => setFormData({ ...formData, firstName: v })}
                />
              </View>
              <View style={[styles.inputGroup, { flex: 1 }]}>
                <Text style={styles.label}>Last Name</Text>
                <TextInput
                  style={styles.input}
                  value={formData.lastName}
                  onChangeText={(v) => setFormData({ ...formData, lastName: v })}
                />
              </View>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Bio</Text>
              <TextInput
                style={[styles.input, styles.bioInput]}
                value={formData.bio}
                onChangeText={(v) => setFormData({ ...formData, bio: v })}
                multiline
                numberOfLines={3}
                maxLength={150}
              />
              <Text style={styles.charCount}>{formData.bio.length}/150</Text>
            </View>
          </View>

          <TouchableOpacity 
            style={styles.logoutBtn}
            onPress={() => Alert.alert('Logout', 'Are you sure?', [
              { text: 'Cancel' },
              { text: 'Logout', onPress: () => {}}
            ])}
          >
            <Text style={styles.logoutBtnText}>Logout</Text>
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#fff' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingBottom: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#eee',
  },
  headerTitle: { fontSize: 17, fontWeight: '800', color: '#000' },
  backBtn: { padding: 4 },
  saveBtnText: { fontSize: 16, fontWeight: '800', color: BRAND_GOLD },
  scrollContent: { padding: 20 },
  photoContainer: { alignItems: 'center', marginBottom: 30 },
  avatarWrap: { position: 'relative' },
  avatar: { width: 100, height: 100, borderRadius: 50, borderWidth: 3, borderColor: BRAND_GOLD + '20' },
  avatarFallback: { backgroundColor: BRAND_GOLD + '20', alignItems: 'center', justifyContent: 'center' },
  avatarInitial: { fontSize: 40, fontWeight: 'bold', color: BRAND_GOLD },
  cameraIcon: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: BRAND_GOLD,
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#fff',
  },
  changePhotoText: { color: BRAND_GOLD, fontSize: 14, fontWeight: '700', marginTop: 12 },
  form: { gap: 20 },
  inputGroup: { gap: 8 },
  label: { fontSize: 13, fontWeight: '700', color: '#666' },
  input: {
    backgroundColor: '#f9f9f9',
    borderWidth: 1,
    borderColor: '#eee',
    borderRadius: 10,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 15,
    color: '#000',
  },
  row: { flexDirection: 'row', gap: 12 },
  bioInput: { minHeight: 80, textAlignVertical: 'top' },
  charCount: { alignSelf: 'flex-end', fontSize: 11, color: '#999', marginTop: 4 },
  logoutBtn: { marginTop: 40, alignItems: 'center' },
  logoutBtnText: { color: '#FF3B30', fontSize: 16, fontWeight: '700' },
});
