import React, { useState, useRef, useEffect } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, Image,
  ActivityIndicator, Platform, StatusBar, SafeAreaView,
} from 'react-native';
import { CameraView, useCameraPermissions, useMicrophonePermissions } from 'expo-camera';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Video, ResizeMode } from 'expo-av';

const BRAND = '#DA9B2A';

export default function CustomCameraScreen({ navigation, route }) {
  const insets = useSafeAreaInsets();
  const { onMediaCaptured } = route.params || {};
  
  const [cameraPermission, requestCameraPermission] = useCameraPermissions();
  const [microphonePermission, requestMicrophonePermission] = useMicrophonePermissions();
  
  const [facing, setFacing] = useState('back');
  const [flash, setFlash] = useState('off');
  const [mode, setMode] = useState('picture'); // 'picture' | 'video'
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [capturedMedia, setCapturedMedia] = useState(null);
  const [cameraReady, setCameraReady] = useState(false);
  
  const cameraRef = useRef(null);
  const recordingTimerRef = useRef(null);

  useEffect(() => {
    if (!cameraPermission) {
      requestCameraPermission();
    }
    if (!microphonePermission) {
      requestMicrophonePermission();
    }
  }, [cameraPermission, microphonePermission]);

  useEffect(() => {
    return () => {
      if (recordingTimerRef.current) {
        clearInterval(recordingTimerRef.current);
      }
    };
  }, []);

  const toggleCameraFacing = () => {
    setFacing(current => current === 'back' ? 'front' : 'back');
  };

  const toggleFlash = () => {
    setFlash(current => current === 'off' ? 'on' : 'off');
  };

  const toggleMode = () => {
    setMode(current => current === 'picture' ? 'video' : 'picture');
  };

  const takePicture = async () => {
    if (!cameraRef.current || !cameraReady) return;
    
    try {
      const photo = await cameraRef.current.takePictureAsync({
        quality: 0.85,
        skipProcessing: false,
      });
      
      setCapturedMedia({
        uri: photo.uri,
        type: 'image',
      });
    } catch (error) {
      console.error('Error taking picture:', error);
    }
  };

  const startRecording = async () => {
    if (!cameraRef.current || !cameraReady) return;
    
    try {
      setIsRecording(true);
      setRecordingTime(0);
      
      const recording = await cameraRef.current.recordAsync({
        maxDuration: 60,
        quality: '720p',
        mute: false,
      });
      
      recordingTimerRef.current = setInterval(() => {
        setRecordingTime(prev => prev + 1);
      }, 1000);
      
      setCapturedMedia({
        uri: recording.uri,
        type: 'video',
      });
    } catch (error) {
      console.error('Error starting recording:', error);
      setIsRecording(false);
    }
  };

  const stopRecording = async () => {
    if (!cameraRef.current) return;
    
    try {
      await cameraRef.current.stopRecording();
      setIsRecording(false);
      
      if (recordingTimerRef.current) {
        clearInterval(recordingTimerRef.current);
      }
    } catch (error) {
      console.error('Error stopping recording:', error);
    }
  };

  const handleRetake = () => {
    setCapturedMedia(null);
    setRecordingTime(0);
  };

  const handleConfirm = () => {
    if (capturedMedia && onMediaCaptured) {
      onMediaCaptured(capturedMedia);
    }
    navigation.goBack();
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  if (!cameraPermission || !microphonePermission) {
    return (
      <View style={[styles.container, styles.centered]}>
        <ActivityIndicator size="large" color={BRAND} />
        <Text style={styles.loadingText}>Requesting permissions...</Text>
      </View>
    );
  }

  if (!cameraPermission.granted || !microphonePermission.granted) {
    return (
      <View style={[styles.container, styles.centered]}>
        <Ionicons name="camera-outline" size={64} color="#666" />
        <Text style={styles.errorTitle}>Camera & Microphone Access Required</Text>
        <Text style={styles.errorText}>
          We need camera and microphone permissions to capture photos and videos.
        </Text>
        <TouchableOpacity
          style={styles.permissionBtn}
          onPress={() => {
            requestCameraPermission();
            requestMicrophonePermission();
          }}
        >
          <Text style={styles.permissionBtnText}>Grant Permissions</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (capturedMedia) {
    return (
      <View style={styles.container}>
        <StatusBar barStyle="light-content" />
        
        {/* Preview */}
        <View style={styles.previewContainer}>
          {capturedMedia.type === 'video' ? (
            <Video
              source={{ uri: capturedMedia.uri }}
              style={styles.preview}
              resizeMode={ResizeMode.COVER}
              shouldPlay
              isLooping
              isMuted
            />
          ) : (
            <Image source={{ uri: capturedMedia.uri }} style={styles.preview} resizeMode="cover" />
          )}
          
          {/* Video indicator */}
          {capturedMedia.type === 'video' && (
            <View style={styles.videoIndicator}>
              <Ionicons name="videocam" size={24} color="#fff" />
            </View>
          )}
        </View>

        {/* Controls */}
        <SafeAreaView style={styles.controls}>
          <View style={styles.captureButtons}>
            <TouchableOpacity style={styles.retakeBtn} onPress={handleRetake}>
              <Ionicons name="refresh" size={28} color="#fff" />
            </TouchableOpacity>
            
            <TouchableOpacity style={styles.confirmBtn} onPress={handleConfirm}>
              <Ionicons name="checkmark" size={28} color="#fff" />
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />
      
      {/* Camera View */}
      <CameraView
        ref={cameraRef}
        style={styles.camera}
        facing={facing}
        flash={flash}
        onCameraReady={() => setCameraReady(true)}
        enableZoomGesture
      >
        {/* Top Controls */}
        <SafeAreaView style={styles.topControls}>
          <TouchableOpacity style={styles.topBtn} onPress={() => navigation.goBack()}>
            <Ionicons name="close" size={28} color="#fff" />
          </TouchableOpacity>
          
          <View style={styles.modeToggle}>
            <TouchableOpacity
              style={[styles.modeBtn, mode === 'picture' && styles.modeBtnActive]}
              onPress={() => setMode('picture')}
            >
              <Ionicons name="camera" size={20} color={mode === 'picture' ? '#fff' : 'rgba(255,255,255,0.6)'} />
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.modeBtn, mode === 'video' && styles.modeBtnActive]}
              onPress={() => setMode('video')}
            >
              <Ionicons name="videocam" size={20} color={mode === 'video' ? '#fff' : 'rgba(255,255,255,0.6)'} />
            </TouchableOpacity>
          </View>
          
          <TouchableOpacity style={styles.topBtn} onPress={toggleFlash}>
            <Ionicons 
              name={flash === 'on' ? 'flash' : 'flash-off'} 
              size={28} 
              color="#fff" 
            />
          </TouchableOpacity>
        </SafeAreaView>

        {/* Recording Timer */}
        {isRecording && (
          <View style={styles.recordingTimer}>
            <View style={styles.recordingDot} />
            <Text style={styles.recordingText}>{formatTime(recordingTime)}</Text>
          </View>
        )}

        {/* Bottom Controls */}
        <SafeAreaView style={styles.bottomControls}>
          {/* Gallery */}
          <TouchableOpacity style={styles.galleryBtn}>
            <Ionicons name="images" size={24} color="#fff" />
          </TouchableOpacity>

          {/* Capture Button */}
          <TouchableOpacity
            style={[
              styles.captureBtn,
              mode === 'video' && styles.captureBtnVideo,
              isRecording && styles.captureBtnRecording
            ]}
            onPress={mode === 'video' ? (isRecording ? stopRecording : startRecording) : takePicture}
            onLongPress={mode === 'picture' ? null : startRecording}
            delayLongPress={100}
          >
            <View style={[
              styles.captureBtnInner,
              mode === 'video' && styles.captureBtnInnerVideo,
              isRecording && styles.captureBtnInnerRecording
            ]} />
          </TouchableOpacity>

          {/* Flip Camera */}
          <TouchableOpacity style={styles.flipBtn} onPress={toggleCameraFacing}>
            <Ionicons name="camera-reverse" size={24} color="#fff" />
          </TouchableOpacity>
        </SafeAreaView>
      </CameraView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundcolor: '#F9E08B',
  },
  centered: {
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#F9E08B',
  },
  errorTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#F9E08B',
    marginTop: 16,
    marginBottom: 8,
    textAlign: 'center',
  },
  errorText: {
    fontSize: 14,
    color: '#F9E08B',
    textAlign: 'center',
    marginBottom: 24,
  },
  permissionBtn: {
    backgroundColor: BRAND,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  permissionBtnText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
  camera: {
    flex: 1,
  },
  topControls: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: Platform.OS === 'ios' ? 50 : StatusBar.currentHeight + 10,
  },
  topBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modeToggle: {
    flexDirection: 'row',
    backgroundColor: 'rgba(0,0,0,0.4)',
    borderRadius: 24,
    padding: 4,
  },
  modeBtn: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  modeBtnActive: {
    backgroundColor: BRAND,
  },
  recordingTimer: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 120 : StatusBar.currentHeight + 80,
    alignSelf: 'center',
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.6)',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    gap: 8,
  },
  recordingDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#FF3B57',
  },
  recordingText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  bottomControls: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    paddingHorizontal: 30,
    paddingBottom: Platform.OS === 'ios' ? 40 : 30,
  },
  galleryBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  captureBtn: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: 'rgba(255,255,255,0.3)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 4,
    borderColor: '#fff',
  },
  captureBtnVideo: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: 'rgba(255,255,255,0.3)',
  },
  captureBtnRecording: {
    backgroundColor: 'rgba(255,59,87,0.3)',
    borderColor: '#FF3B57',
  },
  captureBtnInner: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#0d0d0d',
  },
  captureBtnInnerVideo: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#0d0d0d',
  },
  captureBtnInnerRecording: {
    width: 24,
    height: 24,
    borderRadius: 4,
    backgroundColor: '#FF3B57',
  },
  flipBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  previewContainer: {
    flex: 1,
    backgroundcolor: '#F9E08B',
  },
  preview: {
    flex: 1,
  },
  videoIndicator: {
    position: 'absolute',
    top: 20,
    right: 20,
    backgroundColor: 'rgba(0,0,0,0.6)',
    borderRadius: 20,
    padding: 8,
  },
  controls: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(0,0,0,0.8)',
    paddingBottom: Platform.OS === 'ios' ? 40 : 30,
  },
  captureButtons: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    paddingHorizontal: 60,
    paddingVertical: 20,
  },
  retakeBtn: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  confirmBtn: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: BRAND,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
