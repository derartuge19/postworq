import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Image,
  Alert,
  TextInput,
  ActivityIndicator,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import api from '../api';
import { useAuth } from '../contexts/AuthContext';

export default function CreateScreen({ navigation }) {
  const [video, setVideo] = useState(null);
  const [caption, setCaption] = useState('');
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const { user } = useAuth();

  const pickVideo = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Videos,
        allowsEditing: true,
        quality: 1,
      });

      if (!result.canceled) {
        setVideo(result.assets[0]);
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to pick video');
    }
  };

  const handleUpload = async () => {
    if (!video) {
      Alert.alert('Error', 'Please select a video');
      return;
    }

    if (!user) {
      Alert.alert('Error', 'Please login to upload');
      return;
    }

    setUploading(true);
    setUploadProgress(0);

    try {
      const formData = new FormData();
      formData.append('media', {
        uri: video.uri,
        type: video.type || 'video/mp4',
        name: video.fileName || 'video.mp4',
      });
      formData.append('caption', caption);

      await api.createPost(formData, {
        onProgress: (progress) => {
          setUploadProgress(progress);
        },
      });

      Alert.alert('Success', 'Video uploaded successfully!');
      setVideo(null);
      setCaption('');
      navigation.navigate('Home');
    } catch (error) {
      Alert.alert('Upload Failed', error.message || 'Something went wrong');
    } finally {
      setUploading(false);
      setUploadProgress(0);
    }
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.title}>Create Reel</Text>

        {!video ? (
          <TouchableOpacity style={styles.uploadButton} onPress={pickVideo}>
            <Ionicons name="videocam" size={48} color="#999" />
            <Text style={styles.uploadText}>Select Video</Text>
          </TouchableOpacity>
        ) : (
          <View style={styles.previewContainer}>
            <Image source={{ uri: video.uri }} style={styles.thumbnail} />
            <TouchableOpacity style={styles.changeButton} onPress={pickVideo}>
              <Text style={styles.changeButtonText}>Change Video</Text>
            </TouchableOpacity>
          </View>
        )}

        <TextInput
          style={styles.captionInput}
          placeholder="Add a caption..."
          placeholderTextColor="#999"
          value={caption}
          onChangeText={setCaption}
          multiline
          numberOfLines={4}
          textAlignVertical="top"
        />

        {uploading && (
          <View style={styles.progressContainer}>
            <Text style={styles.progressText}>Uploading... {uploadProgress}%</Text>
            <View style={styles.progressBar}>
              <View style={[styles.progressFill, { width: `${uploadProgress}%` }]} />
            </View>
          </View>
        )}

        <TouchableOpacity
          style={[styles.submitButton, (!video || uploading) && styles.buttonDisabled]}
          onPress={handleUpload}
          disabled={!video || uploading}
        >
          {uploading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.submitButtonText}>Post Reel</Text>
          )}
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  content: {
    padding: 24,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#000',
    marginBottom: 24,
  },
  uploadButton: {
    aspectRatio: 9/16,
    backgroundColor: '#f5f5f5',
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
  },
  uploadText: {
    fontSize: 16,
    color: '#999',
    marginTop: 12,
  },
  previewContainer: {
    marginBottom: 24,
  },
  thumbnail: {
    width: '100%',
    aspectRatio: 9/16,
    borderRadius: 12,
    backgroundColor: '#f5f5f5',
  },
  changeButton: {
    backgroundColor: '#f5f5f5',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 12,
  },
  changeButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#000',
  },
  captionInput: {
    backgroundColor: '#f5f5f5',
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    color: '#000',
    marginBottom: 24,
    minHeight: 100,
  },
  progressContainer: {
    marginBottom: 24,
  },
  progressText: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
    textAlign: 'center',
  },
  progressBar: {
    height: 4,
    backgroundColor: '#e5e5e5',
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#000',
  },
  submitButton: {
    backgroundColor: '#000',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  submitButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});
