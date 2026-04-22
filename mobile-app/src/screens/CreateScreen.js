import React, { useState, useRef, useEffect, useCallback } from 'react';
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
  FlatList,
  Modal,
  PanResponder,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { Video, ResizeMode, Audio } from 'expo-av';
import * as SecureStore from 'expo-secure-store';
import api from '../api';
import { useAuth } from '../contexts/AuthContext';

const { width, height } = Dimensions.get('window');

// ── CONSTANTS ────────────────────────────────────────────────────────────────
const BRAND = {
  pri: '#DA9B2A',
  bg: '#ffffff',
  cardBg: '#ffffff',
  border: '#e5e5e5',
  txt: '#000000',
  sub: '#999999',
  white: '#ffffff',
};

const FILTERS = [
  { id: 'none',      name: 'Original', color: 'transparent' },
  { id: 'sepia',     name: 'Vintage',  color: 'rgba(112, 66, 20, 0.2)' },
  { id: 'cool',      name: 'Cool',     color: 'rgba(0, 50, 150, 0.1)' },
  { id: 'warm',      name: 'Warm',     color: 'rgba(255, 100, 0, 0.1)' },
  { id: 'grayscale', name: 'B&W',      color: 'rgba(0, 0, 0, 0.3)' },
  { id: 'vibrant',   name: 'Vibrant',  color: 'rgba(255, 255, 255, 0.1)' },
];

const SAMPLE_SOUNDS = [
  { id: 's1', name: 'Chill Beats',    artist: 'LoFi Studio',   url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3' },
  { id: 's2', name: 'Trending Vibe',  artist: 'Beat Factory',  url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3' },
  { id: 's3', name: 'Energetic Drop', artist: 'Bass House',    url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-3.mp3' },
];

const TEXT_COLORS = ['#FFFFFF', '#000000', '#FF3B57', '#DA9B2A', '#3B82F6', '#10B981'];

// ── DRAGGABLE TEXT COMPONENT ─────────────────────────────────────────────────
const DraggableText = ({ overlay, onRemove, onUpdate }) => {
  const pan = useRef({ x: overlay.x, y: overlay.y }).current;
  
  const panResponder = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: () => true,
      onPanResponderMove: (e, gestureState) => {
        const newX = overlay.x + (gestureState.dx / width) * 100;
        const newY = overlay.y + (gestureState.dy / height) * 100;
        onUpdate(overlay.id, { 
          x: Math.max(5, Math.min(95, newX)), 
          y: Math.max(5, Math.min(95, newY)) 
        });
      },
      onPanResponderRelease: () => {
        // Finalize position
      },
    })
  ).current;

  return (
    <View
      style={[
        styles.draggableContainer,
        { left: `${overlay.x}%`, top: `${overlay.y}%` }
      ]}
      {...panResponder.panHandlers}
    >
      <View style={[styles.textOverlayPill, { backgroundColor: overlay.style === 'highlight' ? overlay.color : 'rgba(0,0,0,0.4)' }]}>
        <Text style={[styles.overlayText, { color: overlay.style === 'highlight' ? '#fff' : overlay.color }]}>
          {overlay.text}
        </Text>
      </View>
      <TouchableOpacity style={styles.removeTextBtn} onPress={() => onRemove(overlay.id)}>
        <Ionicons name="close-circle" size={20} color="#fff" />
      </TouchableOpacity>
    </View>
  );
};

export default function CreateScreen({ navigation }) {
  // Stages: pick -> edit -> details -> uploading
  const [stage, setStage] = useState('pick'); 
  const [media, setMedia] = useState(null);
  const [caption, setCaption] = useState('');
  const [hashtags, setHashtags] = useState('');
  
  // Edit logic
  const [selectedFilter, setSelectedFilter] = useState(FILTERS[0]);
  const [textOverlays, setTextOverlays] = useState([]);
  const [showTextModal, setShowTextModal] = useState(false);
  const [currentText, setCurrentText] = useState('');
  const [currentColor, setCurrentColor] = useState('#FFFFFF');
  
  // Sound logic
  const [selectedSound, setSelectedSound] = useState(null);
  const [showSoundModal, setShowSoundModal] = useState(false);
  const [soundObject, setSoundObject] = useState(null);
  
  // Upload logic
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  
  const { user } = useAuth();
  const videoRef = useRef(null);

  // ── DRAFTS ────────────────────────────────────────────────────────────────
  const [drafts, setDrafts] = useState([]);
  useEffect(() => {
    loadDrafts();
  }, []);

  const loadDrafts = async () => {
    try {
      const saved = await SecureStore.getItemAsync('mobile_drafts');
      if (saved) setDrafts(JSON.parse(saved));
    } catch (e) { console.error(e); }
  };

  const saveDraft = async () => {
    const draft = {
      id: Date.now(),
      media, caption, hashtags, selectedFilter, textOverlays, selectedSound,
      timestamp: new Date().toISOString(),
    };
    const updated = [draft, ...drafts].slice(0, 5);
    setDrafts(updated);
    await SecureStore.setItemAsync('mobile_drafts', JSON.stringify(updated));
    Alert.alert('Draft Saved', 'You can find it in your drafts later.');
    setStage('pick');
  };

  // ── SOUND HANDLING ─────────────────────────────────────────────────────────
  const playSound = async (url) => {
    if (soundObject) {
      await soundObject.unloadAsync();
    }
    const { sound } = await Audio.Sound.createAsync({ uri: url }, { shouldPlay: true });
    setSoundObject(sound);
  };

  const stopSound = async () => {
    if (soundObject) {
      await soundObject.stopAsync();
    }
  };

  useEffect(() => {
    return () => {
      if (soundObject) soundObject.unloadAsync();
    };
  }, [soundObject]);

  // ── MEDIA PICKING ──────────────────────────────────────────────────────────
  const pickMedia = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.All,
      allowsEditing: true,
      aspect: [9, 16],
      quality: 1,
    });
    if (!result.canceled) {
      setMedia(result.assets[0]);
      setStage('edit');
    }
  };

  const takeMedia = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') return;
    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.All,
      allowsEditing: true,
      aspect: [9, 16],
      quality: 1,
    });
    if (!result.canceled) {
      setMedia(result.assets[0]);
      setStage('edit');
    }
  };

  // ── OVERLAY HELPERS ────────────────────────────────────────────────────────
  const addText = () => {
    if (!currentText.trim()) return;
    const newOverlay = {
      id: Date.now(),
      text: currentText,
      color: currentColor,
      x: 50, y: 50,
      style: 'default'
    };
    setTextOverlays([...textOverlays, newOverlay]);
    setCurrentText('');
    setShowTextModal(false);
  };

  const updateOverlay = (id, updates) => {
    setTextOverlays(prev => prev.map(o => o.id === id ? { ...o, ...updates } : o));
  };

  const removeOverlay = (id) => {
    setTextOverlays(prev => prev.filter(o => o.id !== id));
  };

  // ── UPLOAD ─────────────────────────────────────────────────────────────────
  const handleUpload = async () => {
    if (!user) { Alert.alert('Error', 'Please login'); return; }
    setStage('uploading');
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', {
        uri: Platform.OS === 'ios' ? media.uri.replace('file://', '') : media.uri,
        type: media.type === 'video' ? 'video/mp4' : 'image/jpeg',
        name: media.type === 'video' ? 'video.mp4' : 'photo.jpg',
      });
      formData.append('caption', caption);
      if (hashtags) formData.append('hashtags', hashtags);
      if (textOverlays.length) formData.append('overlay_text', JSON.stringify(textOverlays));
      
      await api.createPost(formData, {
        onProgress: (pct) => setUploadProgress(pct),
      });

      Alert.alert('Success', 'Post shared successfully!');
      navigation.navigate('Home');
    } catch (error) {
      Alert.alert('Error', error.message || 'Upload failed');
      setStage('details');
    } finally {
      setUploading(false);
    }
  };

  // ── RENDER STAGES ──────────────────────────────────────────────────────────

  if (stage === 'pick') {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Create Post</Text>
          {drafts.length > 0 && (
            <TouchableOpacity style={styles.draftsPill} onPress={() => Alert.alert('Drafts', 'Feature coming soon')}>
              <Ionicons name="document-text" size={14} color={BRAND.pri} />
              <Text style={styles.draftsText}>Drafts ({drafts.length})</Text>
            </TouchableOpacity>
          )}
        </View>
        <View style={styles.pickContent}>
          <View style={styles.heroIcon}>
            <Ionicons name="camera" size={40} color="#fff" />
          </View>
          <Text style={styles.heroTitle}>Pick a format</Text>
          <Text style={styles.heroSub}>Choose from library or capture live</Text>
          
          <View style={styles.pickActions}>
            <TouchableOpacity style={styles.actionCard} onPress={pickMedia}>
              <View style={[styles.iconBox, { backgroundColor: '#818cf8' }]}>
                <Ionicons name="images" size={24} color="#fff" />
              </View>
              <Text style={styles.actionLabel}>Upload</Text>
            </TouchableOpacity>
            
            <TouchableOpacity style={styles.actionCard} onPress={takeMedia}>
              <View style={[styles.iconBox, { backgroundColor: BRAND.pri }]}>
                <Ionicons name="videocam" size={24} color="#fff" />
              </View>
              <Text style={styles.actionLabel}>Camera</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    );
  }

  if (stage === 'edit') {
    return (
      <View style={styles.container}>
        <StatusBar barStyle="light-content" />
        {/* Full Screen Preview */}
        <View style={styles.fullPreview}>
          {media.type === 'video' ? (
            <Video
              ref={videoRef}
              source={{ uri: media.uri }}
              style={styles.fullMedia}
              resizeMode={ResizeMode.COVER}
              shouldPlay
              isLooping
              isMuted
            />
          ) : (
            <Image source={{ uri: media.uri }} style={styles.fullMedia} />
          )}
          
          {/* Filter Overlay */}
          <View style={[StyleSheet.absoluteFill, { backgroundColor: selectedFilter.color }]} pointerEvents="none" />
          
          {/* Text Overlays */}
          {textOverlays.map(ov => (
            <DraggableText 
              key={ov.id} 
              overlay={ov} 
              onRemove={removeOverlay} 
              onUpdate={updateOverlay} 
            />
          ))}
          
          {/* Side Tools */}
          <View style={styles.editTools}>
            <TouchableOpacity style={styles.toolBtn} onPress={() => setShowTextModal(true)}>
              <Ionicons name="text" size={24} color="#fff" />
              <Text style={styles.toolLabel}>Text</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.toolBtn} onPress={() => setShowSoundModal(true)}>
              <Ionicons name="musical-notes" size={24} color="#fff" />
              <Text style={styles.toolLabel}>Music</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.toolBtn} onPress={() => setSelectedFilter(FILTERS[(FILTERS.indexOf(selectedFilter)+1)%FILTERS.length])}>
              <Ionicons name="color-filter" size={24} color="#fff" />
              <Text style={styles.toolLabel}>Filters</Text>
            </TouchableOpacity>
          </View>

          {/* Top Bar */}
          <View style={styles.editHeader}>
            <TouchableOpacity onPress={() => setStage('pick')} style={styles.editBack}>
              <Ionicons name="close" size={28} color="#fff" />
            </TouchableOpacity>
            <TouchableOpacity onPress={() => setStage('details')} style={styles.nextBtn}>
              <Text style={styles.nextBtnText}>Next</Text>
            </TouchableOpacity>
          </View>
          
          {/* Filter Selector (Floating) */}
          <View style={styles.filterBar}>
             <ScrollView horizontal showsHorizontalScrollIndicator={false}>
               {FILTERS.map(f => (
                 <TouchableOpacity 
                   key={f.id} 
                   onPress={() => setSelectedFilter(f)}
                   style={[styles.filterPill, selectedFilter.id === f.id && styles.filterPillActive]}
                 >
                   <Text style={[styles.filterText, selectedFilter.id === f.id && styles.filterTextActive]}>{f.name}</Text>
                 </TouchableOpacity>
               ))}
             </ScrollView>
          </View>
        </View>

        {/* Text Input Modal */}
        <Modal visible={showTextModal} transparent animationType="fade">
          <KeyboardAvoidingView behavior="padding" style={styles.modalOverlay}>
            <View style={styles.textInputBox}>
              <TextInput
                style={[styles.overlayTextInput, { color: currentColor }]}
                placeholder="Type something..."
                placeholderTextColor="rgba(255,255,255,0.5)"
                value={currentText}
                onChangeText={setCurrentText}
                autoFocus
                multiline
              />
              <View style={styles.colorRow}>
                {TEXT_COLORS.map(c => (
                  <TouchableOpacity 
                    key={c} 
                    style={[styles.colorCircle, { backgroundColor: c, borderWidth: currentColor === c ? 2 : 0, borderColor: '#fff' }]}
                    onPress={() => setCurrentColor(c)}
                  />
                ))}
              </View>
              <View style={styles.modalActions}>
                <TouchableOpacity onPress={() => setShowTextModal(false)}><Text style={styles.modalBtnCancel}>Cancel</Text></TouchableOpacity>
                <TouchableOpacity onPress={addText}><Text style={styles.modalBtnAdd}>Done</Text></TouchableOpacity>
              </View>
            </View>
          </KeyboardAvoidingView>
        </Modal>

        {/* Sound Selection Modal */}
        <Modal visible={showSoundModal} transparent animationType="slide">
          <View style={styles.bottomSheet}>
            <View style={styles.sheetHeader}>
              <Text style={styles.sheetTitle}>Choose Sound</Text>
              <TouchableOpacity onPress={() => { stopSound(); setShowSoundModal(false); }}>
                <Ionicons name="close" size={24} color="#000" />
              </TouchableOpacity>
            </View>
            <FlatList
              data={SAMPLE_SOUNDS}
              keyExtractor={item => item.id}
              renderItem={({ item }) => (
                <TouchableOpacity 
                  style={[styles.soundItem, selectedSound?.id === item.id && styles.soundItemActive]}
                  onPress={() => { setSelectedSound(item); playSound(item.url); }}
                >
                  <Ionicons name="musical-note" size={20} color={BRAND.pri} />
                  <View style={{ flex: 1, marginLeft: 12 }}>
                    <Text style={styles.soundName}>{item.name}</Text>
                    <Text style={styles.soundArtist}>{item.artist}</Text>
                  </View>
                  {selectedSound?.id === item.id && <Ionicons name="checkmark-circle" size={20} color={BRAND.pri} />}
                </TouchableOpacity>
              )}
            />
            <TouchableOpacity 
              style={styles.sheetDoneBtn} 
              onPress={() => { stopSound(); setShowSoundModal(false); }}
            >
              <Text style={styles.sheetDoneText}>Confirm</Text>
            </TouchableOpacity>
          </View>
        </Modal>
      </View>
    );
  }

  if (stage === 'details' || stage === 'uploading') {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => setStage('edit')}>
            <Ionicons name="arrow-back" size={24} color="#000" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Post</Text>
          <TouchableOpacity onPress={handleUpload} disabled={uploading}>
            <Text style={[styles.headerAction, { color: uploading ? '#ccc' : BRAND.pri }]}>Share</Text>
          </TouchableOpacity>
        </View>

        {uploading && (
          <View style={styles.progressHeader}>
            <View style={[styles.progressFill, { width: `${uploadProgress}%` }]} />
          </View>
        )}

        <ScrollView contentContainerStyle={styles.detailsContent}>
          <View style={styles.detailsTop}>
            <View style={styles.thumbWrapper}>
              <Image source={{ uri: media.uri }} style={styles.detailsThumb} />
              <View style={[StyleSheet.absoluteFill, { backgroundColor: selectedFilter.color }]} />
            </View>
            <TextInput
              style={styles.captionArea}
              placeholder="Write a caption..."
              multiline
              value={caption}
              onChangeText={setCaption}
            />
          </View>
          
          <View style={styles.detailsRow}>
            <Ionicons name="pricetag" size={20} color={BRAND.pri} />
            <TextInput
              style={styles.hashtagField}
              placeholder="Add hashtags (e.g. #fun #flipstar)"
              value={hashtags}
              onChangeText={setHashtags}
              autoCapitalize="none"
            />
          </View>

          <TouchableOpacity style={styles.draftBtn} onPress={saveDraft}>
            <Ionicons name="bookmark-outline" size={18} color="#666" />
            <Text style={styles.draftBtnText}>Save to Drafts</Text>
          </TouchableOpacity>
        </ScrollView>
      </View>
    );
  }

  return null;
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  header: { height: 60, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, borderBottomWidth: 1, borderBottomColor: BRAND.border },
  headerTitle: { fontSize: 18, fontWeight: '800' },
  draftsPill: { flexDirection: 'row', alignItems: 'center', backgroundColor: BRAND.pri + '15', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12, gap: 4 },
  draftsText: { fontSize: 12, fontWeight: '700', color: BRAND.pri },
  pickContent: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 40 },
  heroIcon: { width: 80, height: 80, borderRadius: 40, backgroundColor: BRAND.pri, alignItems: 'center', justifyContent: 'center', marginBottom: 24 },
  heroTitle: { fontSize: 24, fontWeight: '800', marginBottom: 8 },
  heroSub: { fontSize: 14, color: '#666', textAlign: 'center' },
  pickActions: { flexDirection: 'row', marginTop: 40, gap: 20 },
  actionCard: { alignItems: 'center' },
  iconBox: { width: 64, height: 64, borderRadius: 20, alignItems: 'center', justifyContent: 'center', marginBottom: 8 },
  actionLabel: { fontSize: 14, fontWeight: '600' },
  
  fullPreview: { flex: 1, backgroundColor: '#000' },
  fullMedia: { flex: 1 },
  editHeader: { position: 'absolute', top: 50, left: 0, right: 0, flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 16, alignItems: 'center' },
  editBack: { width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(0,0,0,0.3)', alignItems: 'center', justifyContent: 'center' },
  nextBtn: { backgroundColor: BRAND.pri, paddingHorizontal: 20, paddingVertical: 8, borderRadius: 20 },
  nextBtnText: { color: '#fff', fontWeight: '800' },
  editTools: { position: 'absolute', top: 120, right: 16, gap: 20 },
  toolBtn: { alignItems: 'center', gap: 4 },
  toolLabel: { color: '#fff', fontSize: 12, fontWeight: '600', textShadowColor: '#000', textShadowRadius: 2 },
  filterBar: { position: 'absolute', bottom: 40, left: 0, right: 0 },
  filterPill: { paddingHorizontal: 16, paddingVertical: 6, borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.2)', marginHorizontal: 8, borderWidth: 1, borderColor: 'rgba(255,255,255,0.3)' },
  filterPillActive: { backgroundColor: BRAND.pri, borderColor: BRAND.pri },
  filterText: { color: '#fff', fontWeight: '700' },
  
  draggableContainer: { position: 'absolute', alignItems: 'center', justifyContent: 'center', transform: [{ translateX: -50 }, { translateY: -50 }] },
  textOverlayPill: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8 },
  overlayText: { fontSize: 20, fontWeight: '800', textAlign: 'center' },
  removeTextBtn: { position: 'absolute', top: -10, right: -10 },
  
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.8)', justifyContent: 'center', padding: 20 },
  textInputBox: { alignItems: 'center' },
  overlayTextInput: { fontSize: 32, fontWeight: '800', textAlign: 'center', width: '100%', marginBottom: 30 },
  colorRow: { flexDirection: 'row', gap: 12, marginBottom: 40 },
  colorCircle: { width: 30, height: 30, borderRadius: 15 },
  modalActions: { flexDirection: 'row', gap: 40 },
  modalBtnCancel: { color: '#fff', fontSize: 16 },
  modalBtnAdd: { color: BRAND.pri, fontSize: 16, fontWeight: '800' },
  
  bottomSheet: { backgroundColor: '#fff', borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 20, height: height * 0.6 },
  sheetHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  sheetTitle: { fontSize: 18, fontWeight: '800' },
  soundItem: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#f0f0f0' },
  soundItemActive: { backgroundColor: BRAND.pri + '10' },
  soundName: { fontSize: 15, fontWeight: '700' },
  soundArtist: { fontSize: 12, color: '#999' },
  sheetDoneBtn: { backgroundColor: BRAND.pri, height: 50, borderRadius: 12, alignItems: 'center', justifyContent: 'center', marginTop: 20 },
  sheetDoneText: { color: '#fff', fontWeight: '700', fontSize: 16 },
  
  detailsContent: { padding: 16 },
  detailsTop: { flexDirection: 'row', gap: 16, marginBottom: 24 },
  thumbWrapper: { width: 100, height: 140, borderRadius: 12, overflow: 'hidden', backgroundColor: '#000' },
  detailsThumb: { flex: 1 },
  captionArea: { flex: 1, fontSize: 16, color: '#000', textAlignVertical: 'top' },
  detailsRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#f5f5f5', borderRadius: 12, paddingHorizontal: 12, height: 50, gap: 10 },
  hashtagField: { flex: 1, fontSize: 14 },
  headerAction: { fontSize: 16, fontWeight: '800' },
  progressHeader: { height: 4, backgroundColor: '#f0f0f0', width: '100%' },
  progressFill: { height: '100%', backgroundColor: BRAND.pri },
  draftBtn: { flexDirection: 'row', alignItems: 'center', alignSelf: 'center', marginTop: 40, gap: 6 },
  draftBtnText: { color: '#666', fontSize: 14, fontWeight: '600' },
});
