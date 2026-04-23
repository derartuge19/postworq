import React, { useState, useRef, useEffect } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, Image, Alert,
  TextInput, ActivityIndicator, ScrollView, Dimensions,
  Platform, KeyboardAvoidingView, StatusBar, FlatList, Modal,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { Video, ResizeMode } from 'expo-av';
import * as SecureStore from 'expo-secure-store';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import config from '../config';
import api from '../api';
import { useAuth } from '../contexts/AuthContext';

const { width, height } = Dimensions.get('window');
const BRAND = '#DA9B2A';

// Visual filter definitions (rendered as color overlays)
const FILTERS = [
  { id: 'none',      name: 'Original', overlay: 'transparent' },
  { id: 'warm',      name: 'Warm',     overlay: 'rgba(255,140,0,0.18)' },
  { id: 'cool',      name: 'Cool',     overlay: 'rgba(30,80,200,0.14)' },
  { id: 'sepia',     name: 'Vintage',  overlay: 'rgba(120,70,10,0.22)' },
  { id: 'bw',        name: 'B&W',      overlay: 'rgba(0,0,0,0.25)' },
  { id: 'vibrant',   name: 'Vibrant',  overlay: 'rgba(200,0,200,0.08)' },
  { id: 'golden',    name: 'Golden',   overlay: 'rgba(218,155,42,0.2)' },
];

const TEXT_COLORS = ['#FFFFFF','#000000','#FF3B57','#DA9B2A','#3B82F6','#10B981','#EC4899'];



// ─── Drafts ──────────────────────────────────────────────────────────────────
async function loadDrafts() {
  try {
    const raw = await SecureStore.getItemAsync('cp_drafts');
    return raw ? JSON.parse(raw) : [];
  } catch { return []; }
}
async function saveDrafts(drafts) {
  try { await SecureStore.setItemAsync('cp_drafts', JSON.stringify(drafts)); } catch {}
}

export default function CreateScreen({ navigation }) {
  const { user } = useAuth();
  const insets = useSafeAreaInsets();

  // Stage: 'pick' | 'edit' | 'details' | 'uploading'
  const [stage, setStage] = useState('pick');
  const [media, setMedia] = useState(null);          // { uri, type: 'image'|'video' }
  const [caption, setCaption] = useState('');
  const [hashtags, setHashtags] = useState('');
  const [filter, setFilter] = useState(FILTERS[0]);
  const [overlays, setOverlays] = useState([]);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [drafts, setDrafts] = useState([]);

  // Text overlay modal
  const [textModal, setTextModal] = useState(false);
  const [inputText, setInputText] = useState('');
  const [textColor, setTextColor] = useState('#FFFFFF');

  const videoRef = useRef(null);

  useEffect(() => { loadDrafts().then(setDrafts); }, []);

  // ── Media Picking ─────────────────────────────────────────────────────────
  const pickFromLibrary = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission Required', 'Please allow access to your photo library in Settings.');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.All,
      allowsEditing: true,
      aspect: [9, 16],
      quality: 0.85,
      videoMaxDuration: 60,
    });
    if (!result.canceled && result.assets?.length) {
      const asset = result.assets[0];
      setMedia({ uri: asset.uri, type: asset.type || 'image' });
      setStage('edit');
    }
  };

  const pickFromCamera = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission Required', 'Please allow camera access in Settings.');
      return;
    }
    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.All,
      allowsEditing: true,
      aspect: [9, 16],
      quality: 0.85,
      videoMaxDuration: 60,
    });
    if (!result.canceled && result.assets?.length) {
      const asset = result.assets[0];
      setMedia({ uri: asset.uri, type: asset.type || 'image' });
      setStage('edit');
    }
  };

  // ── Draft logic ───────────────────────────────────────────────────────────
  const handleSaveDraft = async () => {
    const draft = { id: Date.now(), media, caption, hashtags, filter, overlays };
    const updated = [draft, ...drafts].slice(0, 8);
    setDrafts(updated);
    await saveDrafts(updated);
    Alert.alert('Saved', 'Draft saved!', [{ text: 'OK', onPress: () => setStage('pick') }]);
  };

  const loadDraft = (draft) => {
    setMedia(draft.media);
    setCaption(draft.caption || '');
    setHashtags(draft.hashtags || '');
    setFilter(draft.filter || FILTERS[0]);
    setOverlays(draft.overlays || []);
    setStage('edit');
  };

  // ── Upload ────────────────────────────────────────────────────────────────
  const handlePost = async () => {
    if (!media) return;
    if (!user) { Alert.alert('Login Required', 'Please login to post.'); return; }

    setStage('uploading');
    setUploadProgress(0);

    try {
      const isVideo = media.type === 'video';
      const filename = isVideo ? 'upload.mp4' : 'upload.jpg';
      const mimeType = isVideo ? 'video/mp4' : 'image/jpeg';

      const fd = new FormData();
      fd.append('file', {
        uri: Platform.OS === 'ios' ? media.uri.replace('file://', '') : media.uri,
        type: mimeType,
        name: filename
      });
      fd.append('caption', caption || '');
      if (hashtags) fd.append('hashtags', hashtags);
      if (overlays?.length) fd.append('overlay_text', JSON.stringify(overlays));

      await api.createPost(fd, {
        onProgress: (pct) => {
          setUploadProgress(Math.min(pct, 99)); // Keep at 99 until finish
        }
      });

      setUploadProgress(100);
      setTimeout(() => {
        setMedia(null); setCaption(''); setHashtags('');
        setFilter(FILTERS[0]); setOverlays([]);
        setStage('pick');
        navigation.navigate('Home');
      }, 800);
    } catch (err) {
      console.error('Upload Error:', err);
      let errorMsg = 'Something went wrong. Please try again.';
      if (typeof err === 'object') {
        errorMsg = err.detail || err.error || err.message || JSON.stringify(err);
      } else if (typeof err === 'string') {
        errorMsg = err;
      }
      
      Alert.alert('Upload Failed', errorMsg);
      setStage('details');
    }
  };

  // ──────────────────────────────────────────────────────────────────────────
  // STAGE: PICK
  // ──────────────────────────────────────────────────────────────────────────
  if (stage === 'pick') {
    return (
      <View style={s.container}>
        <StatusBar barStyle="dark-content" />
        
        {/* Header */}
        <View style={[s.newHeader, { paddingTop: insets.top + 8 }]}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={s.headerBtn}>
            <Ionicons name="close" size={24} color="#000" />
          </TouchableOpacity>
          <Text style={s.headerTitle}>New Post</Text>
          <TouchableOpacity 
            style={s.draftsBtn}
            onPress={() => Alert.alert(
              'Drafts',
              `You have ${drafts.length} draft(s). Load most recent?`,
              [
                { text: 'Cancel' },
                { text: 'Load', onPress: () => loadDraft(drafts[0]) }
              ]
            )}
          >
            <Text style={s.draftsBtnText}>Drafts ({drafts.length})</Text>
          </TouchableOpacity>
        </View>

        <View style={s.newPickBody}>
          {/* Hero Section */}
          <View style={s.heroSection}>
            <View style={s.heroCircle}>
              <Ionicons name="camera" size={48} color="#fff" />
              <View style={s.questionMark}>
                <Text style={s.questionMarkText}>?</Text>
              </View>
            </View>
            <Text style={s.heroTitle}>Create Post</Text>
            <Text style={s.heroSub}>Choose how you want to create content</Text>
          </View>

          {/* Action Cards */}
          <View style={s.actionCards}>
            <TouchableOpacity style={s.actionCard} onPress={pickFromCamera}>
              <View style={s.cardLeft}>
                <View style={[s.cardIcon, { backgroundColor: BRAND }]}>
                  <Ionicons name="camera" size={24} color="#fff" />
                </View>
                <View style={s.cardText}>
                  <Text style={s.cardTitle}>Take Photo/Video</Text>
                  <Text style={s.cardSub}>Use camera with filters</Text>
                </View>
              </View>
              <TouchableOpacity style={s.cardRightBtn}>
                <Ionicons name="trash-outline" size={20} color="#999" />
              </TouchableOpacity>
            </TouchableOpacity>

            <TouchableOpacity style={s.actionCard} onPress={pickFromLibrary}>
              <View style={s.cardLeft}>
                <View style={[s.cardIcon, { backgroundColor: '#818cf8' }]}>
                  <Ionicons name="cloud-upload-outline" size={24} color="#fff" />
                </View>
                <View style={s.cardText}>
                  <Text style={s.cardTitle}>Upload Image</Text>
                  <Text style={s.cardSub}>From gallery or files</Text>
                </View>
              </View>
              <TouchableOpacity style={s.cardRightBtn}>
                <Ionicons name="add-outline" size={20} color="#999" />
              </TouchableOpacity>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    );
  }

  // ──────────────────────────────────────────────────────────────────────────
  // STAGE: EDIT (filters + text)
  // ──────────────────────────────────────────────────────────────────────────
  if (stage === 'edit') {
    return (
      <View style={{ flex: 1, backgroundColor: '#000' }}>
        <StatusBar barStyle="light-content" />

        {/* Full-screen preview */}
        <View style={StyleSheet.absoluteFill}>
          {media.type === 'video' ? (
            <Video
              ref={videoRef}
              source={{ uri: media.uri }}
              style={StyleSheet.absoluteFill}
              resizeMode={ResizeMode.COVER}
              shouldPlay
              isLooping
              isMuted
            />
          ) : (
            <Image
              source={{ uri: media.uri }}
              style={StyleSheet.absoluteFill}
              resizeMode="cover"
            />
          )}
          {/* Color filter overlay */}
          <View style={[StyleSheet.absoluteFill, { backgroundColor: filter.overlay }]} pointerEvents="none" />

          {/* Text overlays */}
          {overlays.map(ov => (
            <View key={ov.id} style={[s.textOvContainer, { left: `${ov.x}%`, top: `${ov.y}%` }]}>
              <View style={s.textOvPill}>
                <Text style={[s.textOvText, { color: ov.color }]}>{ov.text}</Text>
              </View>
              <TouchableOpacity
                style={s.textOvRemove}
                onPress={() => setOverlays(prev => prev.filter(o => o.id !== ov.id))}
              >
                <Ionicons name="close-circle" size={18} color="#fff" />
              </TouchableOpacity>
            </View>
          ))}
        </View>

        {/* Top bar */}
        <View style={[s.editTop, { top: insets.top + 8 }]}>
          <TouchableOpacity onPress={() => setStage('pick')} style={s.editIconBtn}>
            <Ionicons name="close" size={26} color="#fff" />
          </TouchableOpacity>
          <TouchableOpacity onPress={() => setStage('details')} style={s.nextPill}>
            <Text style={s.nextPillText}>Next →</Text>
          </TouchableOpacity>
        </View>

        {/* Right tools */}
        <View style={s.editTools}>
          <TouchableOpacity style={s.toolBtn} onPress={() => setTextModal(true)}>
            <Ionicons name="text" size={22} color="#fff" />
            <Text style={s.toolLabel}>Text</Text>
          </TouchableOpacity>
          <TouchableOpacity style={s.toolBtn} onPress={pickFromLibrary}>
            <Ionicons name="images" size={22} color="#fff" />
            <Text style={s.toolLabel}>Change</Text>
          </TouchableOpacity>
        </View>

        {/* Filter bar (bottom) */}
        <View style={s.filterBar}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 12, gap: 10 }}>
            {FILTERS.map(f => (
              <TouchableOpacity
                key={f.id}
                onPress={() => setFilter(f)}
                style={[s.filterChip, filter.id === f.id && s.filterChipActive]}
              >
                <Text style={[s.filterChipText, filter.id === f.id && s.filterChipTextActive]}>
                  {f.name}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* Text overlay modal */}
        <Modal visible={textModal} transparent animationType="fade">
          <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={s.modalBg}>
            <View style={s.textModalBox}>
              <Text style={s.textModalTitle}>Add Text</Text>
              <TextInput
                style={[s.textModalInput, { color: textColor }]}
                placeholder="Type something..."
                placeholderTextColor="rgba(255,255,255,0.4)"
                value={inputText}
                onChangeText={setInputText}
                autoFocus
                multiline
              />
              <View style={s.colorRow}>
                {TEXT_COLORS.map(c => (
                  <TouchableOpacity
                    key={c}
                    onPress={() => setTextColor(c)}
                    style={[s.colorCircle, { backgroundColor: c, borderWidth: textColor === c ? 3 : 0, borderColor: '#FFD700' }]}
                  />
                ))}
              </View>
              <View style={s.modalBtns}>
                <TouchableOpacity onPress={() => { setTextModal(false); setInputText(''); }}>
                  <Text style={{ color: '#aaa', fontSize: 15 }}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={() => {
                  if (!inputText.trim()) return;
                  setOverlays(prev => [...prev, { id: Date.now(), text: inputText.trim(), color: textColor, x: 50, y: 50 }]);
                  setInputText('');
                  setTextModal(false);
                }}>
                  <Text style={{ color: BRAND, fontSize: 15, fontWeight: '800' }}>Done</Text>
                </TouchableOpacity>
              </View>
            </View>
          </KeyboardAvoidingView>
        </Modal>
      </View>
    );
  }

  // ──────────────────────────────────────────────────────────────────────────
  // STAGE: DETAILS
  // ──────────────────────────────────────────────────────────────────────────
  if (stage === 'details') {
    return (
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={s.container}>
        <StatusBar barStyle="dark-content" />
        <View style={[s.header, { paddingTop: insets.top + 8 }]}>
          <TouchableOpacity onPress={() => setStage('edit')}>
            <Ionicons name="arrow-back" size={24} color="#000" />
          </TouchableOpacity>
          <Text style={s.headerTitle}>Post Details</Text>
          <TouchableOpacity onPress={handlePost} style={s.postBtn}>
            <Text style={s.postBtnText}>Post</Text>
          </TouchableOpacity>
        </View>

        <ScrollView contentContainerStyle={s.detailsScroll}>
          {/* Preview thumbnail */}
          <View style={s.thumb}>
            <Image source={{ uri: media.uri }} style={StyleSheet.absoluteFill} resizeMode="cover" />
            <View style={[StyleSheet.absoluteFill, { backgroundColor: filter.overlay }]} pointerEvents="none" />
            {media.type === 'video' && (
              <View style={s.videoIcon}>
                <Ionicons name="videocam" size={18} color="#fff" />
              </View>
            )}
          </View>

          <TextInput
            style={s.captionInput}
            placeholder="Write a caption..."
            placeholderTextColor="#aaa"
            value={caption}
            onChangeText={setCaption}
            multiline
          />

          <View style={s.hashRow}>
            <Text style={s.hashSymbol}>#</Text>
            <TextInput
              style={s.hashInput}
              placeholder="Add hashtags (e.g. fun flipstar)"
              placeholderTextColor="#aaa"
              value={hashtags}
              onChangeText={setHashtags}
              autoCapitalize="none"
            />
          </View>

          {overlays.length > 0 && (
            <View style={s.overlaySummary}>
              <Ionicons name="text" size={14} color={BRAND} />
              <Text style={{ color: BRAND, marginLeft: 6, fontSize: 13, fontWeight: '600' }}>
                {overlays.length} text overlay{overlays.length > 1 ? 's' : ''} added
              </Text>
            </View>
          )}

          <TouchableOpacity style={s.draftBtn} onPress={handleSaveDraft}>
            <Ionicons name="bookmark-outline" size={16} color="#666" />
            <Text style={s.draftBtnText}>Save as Draft</Text>
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    );
  }

  // ──────────────────────────────────────────────────────────────────────────
  // STAGE: UPLOADING
  // ──────────────────────────────────────────────────────────────────────────
  return (
    <View style={[s.container, { alignItems: 'center', justifyContent: 'center' }]}>
      <View style={s.uploadCard}>
        <ActivityIndicator size="large" color={BRAND} />
        <Text style={s.uploadTitle}>Posting your reel...</Text>
        <View style={s.progressTrack}>
          <View style={[s.progressFill, { width: `${uploadProgress}%` }]} />
        </View>
        <Text style={s.uploadPct}>{uploadProgress}%</Text>
      </View>
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },

  header: {
    minHeight: 58,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#e0e0e0',
  },
  headerTitle: { fontSize: 17, fontWeight: '800' },
  draftBadge: { flexDirection: 'row', alignItems: 'center', backgroundColor: BRAND + '18', paddingHorizontal: 10, paddingVertical: 5, borderRadius: 12, gap: 4 },
  draftBadgeText: { fontSize: 12, fontWeight: '700', color: BRAND },

  // Header styles for new design
  newHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: 60,
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
    backgroundColor: '#fff',
  },
  headerBtn: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  draftsBtn: {
    backgroundColor: BRAND + '15',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  draftsBtnText: {
    fontSize: 13,
    fontWeight: '600',
    color: BRAND,
  },

  // Body styles for new design
  newPickBody: {
    flex: 1,
    backgroundColor: '#f8f9fa',
    paddingHorizontal: 20,
  },
  heroSection: {
    alignItems: 'center',
    paddingTop: 60,
    paddingBottom: 40,
  },
  heroCircle: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: BRAND,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
    shadowColor: BRAND,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 10,
    position: 'relative',
  },
  questionMark: {
    position: 'absolute',
    bottom: -5,
    right: -5,
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  questionMarkText: {
    fontSize: 18,
    fontWeight: '700',
    color: BRAND,
  },
  heroTitle: {
    fontSize: 28,
    fontWeight: '800',
    marginBottom: 8,
    color: '#000',
  },
  heroSub: {
    fontSize: 15,
    color: '#666',
    textAlign: 'center',
    lineHeight: 20,
  },

  // Action cards
  actionCards: {
    gap: 16,
  },
  actionCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
    borderWidth: 1,
    borderColor: '#f0f0f0',
  },
  cardLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  cardIcon: {
    width: 50,
    height: 50,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  cardText: {
    flex: 1,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 2,
    color: '#000',
  },
  cardSub: {
    fontSize: 13,
    color: '#666',
  },
  cardRightBtn: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },

  editTop: { position: 'absolute', top: Platform.OS === 'android' ? StatusBar.currentHeight + 8 : 50, left: 0, right: 0, flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 14, zIndex: 10 },
  editIconBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(0,0,0,0.4)', alignItems: 'center', justifyContent: 'center' },
  nextPill: { backgroundColor: BRAND, paddingHorizontal: 20, paddingVertical: 9, borderRadius: 22 },
  nextPillText: { color: '#fff', fontWeight: '800', fontSize: 14 },
  editTools: { position: 'absolute', top: Platform.OS === 'android' ? (StatusBar.currentHeight || 24) + 70 : 110, right: 14, gap: 0, zIndex: 10 },
  toolBtn: { alignItems: 'center', marginBottom: 18 },
  toolLabel: { color: '#fff', fontSize: 11, fontWeight: '700', marginTop: 3, textShadowColor: '#000', textShadowRadius: 4 },
  filterBar: { position: 'absolute', bottom: 30, left: 0, right: 0, zIndex: 10 },
  filterChip: { paddingHorizontal: 14, paddingVertical: 7, borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.2)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.3)', marginRight: 8 },
  filterChipActive: { backgroundColor: BRAND, borderColor: BRAND },
  filterChipText: { color: '#fff', fontWeight: '700', fontSize: 13 },
  filterChipTextActive: { color: '#fff' },

  textOvContainer: { position: 'absolute', transform: [{ translateX: -50 }, { translateY: -50 }] },
  textOvPill: { backgroundColor: 'rgba(0,0,0,0.45)', paddingHorizontal: 10, paddingVertical: 5, borderRadius: 8 },
  textOvText: { fontSize: 20, fontWeight: '800' },
  textOvRemove: { position: 'absolute', top: -8, right: -8 },

  modalBg: { flex: 1, backgroundColor: 'rgba(0,0,0,0.85)', justifyContent: 'center', padding: 24 },
  textModalBox: { alignItems: 'center' },
  textModalTitle: { color: '#fff', fontSize: 18, fontWeight: '800', marginBottom: 20 },
  textModalInput: { fontSize: 28, fontWeight: '800', textAlign: 'center', width: '100%', minHeight: 80, marginBottom: 24 },
  colorRow: { flexDirection: 'row', gap: 10, marginBottom: 32 },
  colorCircle: { width: 32, height: 32, borderRadius: 16 },
  modalBtns: { flexDirection: 'row', gap: 40 },

  detailsScroll: { padding: 16, gap: 16 },
  thumb: { width: '100%', height: 200, borderRadius: 16, overflow: 'hidden', backgroundColor: '#000', marginBottom: 8 },
  videoIcon: { position: 'absolute', top: 10, right: 10, backgroundColor: 'rgba(0,0,0,0.5)', borderRadius: 6, padding: 4 },
  captionInput: { fontSize: 15, color: '#000', borderBottomWidth: 1, borderBottomColor: '#eee', paddingBottom: 12, minHeight: 80 },
  hashRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#f5f5f5', borderRadius: 12, paddingHorizontal: 12, height: 48 },
  hashSymbol: { fontSize: 20, fontWeight: '800', color: BRAND, marginRight: 6 },
  hashInput: { flex: 1, fontSize: 14, color: '#000' },
  overlaySummary: { flexDirection: 'row', alignItems: 'center', backgroundColor: BRAND + '15', padding: 12, borderRadius: 10 },
  postBtn: { backgroundColor: BRAND, paddingHorizontal: 18, paddingVertical: 8, borderRadius: 20 },
  postBtnText: { color: '#fff', fontWeight: '800', fontSize: 14 },
  draftBtn: { flexDirection: 'row', alignItems: 'center', alignSelf: 'center', marginTop: 20, gap: 6 },
  draftBtnText: { color: '#666', fontSize: 14, fontWeight: '600' },

  uploadCard: { alignItems: 'center', padding: 32 },
  uploadTitle: { fontSize: 18, fontWeight: '800', marginTop: 20, marginBottom: 20 },
  progressTrack: { width: width * 0.7, height: 8, backgroundColor: '#eee', borderRadius: 4, overflow: 'hidden', marginBottom: 10 },
  progressFill: { height: '100%', backgroundColor: BRAND },
  uploadPct: { fontSize: 14, color: '#666', fontWeight: '600' },
});
