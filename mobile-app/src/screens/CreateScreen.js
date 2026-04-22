import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  Alert,
  TextInput,
  ActivityIndicator,
  ScrollView,
  Dimensions,
  Platform,
  KeyboardAvoidingView,
  StatusBar,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { Video, ResizeMode } from 'expo-av';
import api from '../api';
import { useAuth } from '../contexts/AuthContext';

const { width, height } = Dimensions.get('window');

// ── BRAND THEME ──────────────────────────────────────────────────────────────
const BRAND = {
  pri: '#DA9B2A',
  bg: '#ffffff',
  cardBg: '#ffffff',
  border: '#e5e5e5',
  txt: '#000000',
  sub: '#999999',
};

export default function CreateScreen({ navigation }) {
  const [step, setStep] = useState(1); // 1: Pick, 2: Details, 3: Uploading
  const [media, setMedia] = useState(null);
  const [caption, setCaption] = useState('');
  const [hashtags, setHashtags] = useState('');
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const { user } = useAuth();
  const videoRef = useRef(null);

  const pickMedia = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.All,
        allowsEditing: true,
        aspect: [9, 16],
        quality: 1,
      });

      if (!result.canceled) {
        setMedia(result.assets[0]);
        setStep(2);
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to pick media');
    }
  };

  const takeMedia = async () => {
    try {
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Denied', 'Camera permission is required');
        return;
      }

      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.All,
        allowsEditing: true,
        aspect: [9, 16],
        quality: 1,
      });

      if (!result.canceled) {
        setMedia(result.assets[0]);
        setStep(2);
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to open camera');
    }
  };

  const handleUpload = async () => {
    if (!media) return;
    if (!user) {
      Alert.alert('Auth Required', 'Please login to post.');
      return;
    }

    setStep(3);
    setUploading(true);
    setUploadProgress(0);

    try {
      const formData = new FormData();
      formData.append('file', {
        uri: Platform.OS === 'ios' ? media.uri.replace('file://', '') : media.uri,
        type: media.type === 'video' ? 'video/mp4' : 'image/jpeg',
        name: media.type === 'video' ? 'video.mp4' : 'photo.jpg',
      });
      formData.append('caption', caption);
      if (hashtags) formData.append('hashtags', hashtags);

      await api.createPost(formData, {
        onProgress: (pct) => {
          setUploadProgress(pct);
        },
      });

      Alert.alert('Success', 'Your reel has been posted!', [
        { text: 'Awesome', onPress: () => {
          setMedia(null);
          setCaption('');
          setHashtags('');
          setStep(1);
          navigation.navigate('Home');
        }}
      ]);
    } catch (error) {
      Alert.alert('Upload Failed', error.message || 'Something went wrong');
      setStep(2);
    } finally {
      setUploading(false);
    }
  };

  // ── STEP 1: PICK MEDIA ─────────────────────────────────────────────────────
  if (step === 1) {
    return (
      <View style={styles.container}>
        <StatusBar barStyle="dark-content" />
        <View style={styles.header}>
          <Text style={styles.headerTitle}>New Post</Text>
        </View>

        <View style={styles.pickContent}>
          <View style={styles.illustrationContainer}>
            <View style={styles.circleBg}>
              <Ionicons name="videocam" size={40} color={BRAND.pri} />
            </View>
            <Text style={styles.pickTitle}>Share your story</Text>
            <Text style={styles.pickSub}>Choose a video or photo to get started</Text>
          </View>

          <View style={styles.actionContainer}>
            <TouchableOpacity style={styles.primaryBtn} onPress={pickMedia}>
              <Ionicons name="images" size={20} color="#fff" style={{ marginRight: 8 }} />
              <Text style={styles.primaryBtnText}>Library</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.secondaryBtn} onPress={takeMedia}>
              <Ionicons name="camera" size={20} color={BRAND.pri} style={{ marginRight: 8 }} />
              <Text style={styles.secondaryBtnText}>Camera</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    );
  }

  // ── STEP 2: DETAILS ────────────────────────────────────────────────────────
  if (step === 2) {
    return (
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.container}
      >
        <StatusBar barStyle="dark-content" />
        <View style={styles.header}>
          <TouchableOpacity onPress={() => setStep(1)} style={styles.backBtn}>
            <Ionicons name="chevron-back" size={24} color={BRAND.txt} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Details</Text>
          <TouchableOpacity onPress={handleUpload} style={styles.postBtn}>
            <Text style={styles.postBtnText}>Post</Text>
          </TouchableOpacity>
        </View>

        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
          <View style={styles.previewCard}>
            {media.type === 'video' ? (
              <Video
                ref={videoRef}
                source={{ uri: media.uri }}
                style={styles.previewMedia}
                resizeMode={ResizeMode.COVER}
                shouldPlay
                isLooping
                isMuted
              />
            ) : (
              <Image source={{ uri: media.uri }} style={styles.previewMedia} />
            )}
            <View style={styles.mediaTypeBadge}>
              <Ionicons 
                name={media.type === 'video' ? "videocam" : "image"} 
                size={14} color="#fff" 
              />
              <Text style={styles.mediaTypeText}>{media.type.toUpperCase()}</Text>
            </View>
          </View>

          <View style={styles.inputSection}>
            <Text style={styles.inputLabel}>Caption</Text>
            <TextInput
              style={styles.captionInput}
              placeholder="What's on your mind?..."
              placeholderTextColor={BRAND.sub}
              value={caption}
              onChangeText={setCaption}
              multiline
            />

            <Text style={styles.inputLabel}>Hashtags</Text>
            <TextInput
              style={styles.hashtagInput}
              placeholder="#trending #fun #flipstar"
              placeholderTextColor={BRAND.sub}
              value={hashtags}
              onChangeText={setHashtags}
              autoCapitalize="none"
            />
          </View>

          <View style={styles.tipContainer}>
            <Ionicons name="information-circle" size={18} color={BRAND.pri} />
            <Text style={styles.tipText}>
              High-quality videos with good lighting tend to get more views!
            </Text>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    );
  }

  // ── STEP 3: UPLOADING ──────────────────────────────────────────────────────
  return (
    <View style={styles.container}>
      <View style={styles.uploadingContent}>
        <ActivityIndicator size="large" color={BRAND.pri} />
        <Text style={styles.uploadingTitle}>Posting your reel...</Text>
        <View style={styles.progressBarContainer}>
          <View style={[styles.progressBarFill, { width: `${uploadProgress}%` }]} />
        </View>
        <Text style={styles.uploadingSub}>{uploadProgress}% completed</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: BRAND.bg,
  },
  header: {
    height: 60,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: BRAND.border,
    backgroundColor: '#fff',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: BRAND.txt,
  },
  backBtn: {
    padding: 4,
  },
  postBtn: {
    backgroundColor: BRAND.pri,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  postBtnText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 14,
  },
  pickContent: {
    flex: 1,
    justifyContent: 'center',
    padding: 32,
  },
  illustrationContainer: {
    alignItems: 'center',
    marginBottom: 48,
  },
  circleBg: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: BRAND.pri + '15',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
  },
  pickTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: BRAND.txt,
    marginBottom: 8,
  },
  pickSub: {
    fontSize: 15,
    color: BRAND.sub,
    textAlign: 'center',
    lineHeight: 22,
  },
  actionContainer: {
    gap: 16,
  },
  primaryBtn: {
    height: 56,
    backgroundColor: BRAND.pri,
    borderRadius: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: BRAND.pri,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  primaryBtnText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
  secondaryBtn: {
    height: 56,
    backgroundColor: '#fff',
    borderRadius: 16,
    borderWidth: 2,
    borderColor: BRAND.pri,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  secondaryBtnText: {
    color: BRAND.pri,
    fontSize: 16,
    fontWeight: '700',
  },
  scrollContent: {
    padding: 20,
  },
  previewCard: {
    width: '100%',
    aspectRatio: 9/12,
    borderRadius: 24,
    backgroundColor: '#000',
    overflow: 'hidden',
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 16,
    elevation: 8,
  },
  previewMedia: {
    flex: 1,
  },
  mediaTypeBadge: {
    position: 'absolute',
    top: 16,
    right: 16,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    gap: 4,
  },
  mediaTypeText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: '800',
  },
  inputSection: {
    gap: 16,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '700',
    color: BRAND.txt,
    marginLeft: 4,
  },
  captionInput: {
    backgroundColor: BRAND.pri + '05',
    borderRadius: 16,
    padding: 16,
    fontSize: 16,
    color: BRAND.txt,
    minHeight: 100,
    textAlignVertical: 'top',
    borderWidth: 1,
    borderColor: BRAND.border,
  },
  hashtagInput: {
    backgroundColor: BRAND.pri + '05',
    borderRadius: 16,
    padding: 16,
    fontSize: 15,
    color: BRAND.pri,
    borderWidth: 1,
    borderColor: BRAND.border,
  },
  tipContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: BRAND.pri + '10',
    padding: 16,
    borderRadius: 12,
    marginTop: 24,
    gap: 12,
  },
  tipText: {
    flex: 1,
    fontSize: 13,
    color: BRAND.pri,
    fontWeight: '600',
    lineHeight: 18,
  },
  uploadingContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  uploadingTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: BRAND.txt,
    marginTop: 24,
    marginBottom: 16,
  },
  progressBarContainer: {
    width: '100%',
    height: 8,
    backgroundColor: BRAND.border,
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: 12,
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: BRAND.pri,
  },
  uploadingSub: {
    fontSize: 14,
    color: BRAND.sub,
    fontWeight: '600',
  },
});
