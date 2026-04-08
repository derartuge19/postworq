import { useState, useRef, useEffect } from "react";
import { Camera, Upload, Sparkles, X, Play, Square, RotateCw, Check, Image, Video, RefreshCw, Music, Plus, ChevronLeft, ChevronRight } from "lucide-react";
import api from "../api";

const T = { pri:"#DA9B2A", txt:"#1C1917", sub:"#78716C", bg:"#FAFAF7", dark:"#0C1A12", border:"#E7E5E4" };

const FILTERS = [
  { id: 'none', name: 'Original', filter: 'none' },
  { id: 'grayscale', name: 'B&W', filter: 'grayscale(100%)' },
  { id: 'sepia', name: 'Vintage', filter: 'sepia(80%)' },
  { id: 'warm', name: 'Warm', filter: 'saturate(1.3) hue-rotate(-10deg)' },
  { id: 'cool', name: 'Cool', filter: 'saturate(1.2) hue-rotate(10deg)' },
  { id: 'vibrant', name: 'Vibrant', filter: 'saturate(1.5) contrast(1.1)' },
  { id: 'fade', name: 'Fade', filter: 'brightness(1.1) contrast(0.9)' },
  { id: 'dramatic', name: 'Drama', filter: 'contrast(1.3) brightness(0.9)' },
];

const TEMPLATES = [
  { id: 'story', name: '📱 Story', ratio: '9/16', desc: 'Vertical story format' },
  { id: 'post', name: '📷 Post', ratio: '1/1', desc: 'Square post format' },
  { id: 'landscape', name: '🎬 Landscape', ratio: '16/9', desc: 'Horizontal video' },
  { id: 'reel', name: '🎥 Reel', ratio: '9/16', desc: 'Short-form vertical' },
];

export function EnhancedPostPage({ user, onBack }) {
  const [activeTab, setActiveTab] = useState('upload'); // upload, camera, templates
  const [caption, setCaption] = useState("");
  const [hashtags, setHashtags] = useState("");
  const [selectedFile, setSelectedFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  
  // Camera states
  const [isRecording, setIsRecording] = useState(false);
  const [recordedChunks, setRecordedChunks] = useState([]);
  const [stream, setStream] = useState(null);
  const [facingMode, setFacingMode] = useState('user');
  const [recordingTime, setRecordingTime] = useState(0);
  const [cameraMode, setCameraMode] = useState('photo'); // 'photo' or 'video'
  
  // Effects states
  const [selectedFilter, setSelectedFilter] = useState('none');
  const [selectedTemplate, setSelectedTemplate] = useState(null);
  
  // TikTok-style features
  const [selectedPhotos, setSelectedPhotos] = useState([]); // Multiple photos
  const [currentPhotoIndex, setCurrentPhotoIndex] = useState(0); // For horizontal scrolling
  const [backgroundSound, setBackgroundSound] = useState(null); // Background sound file
  const [soundPreview, setSoundPreview] = useState(null); // Sound preview URL
  const [isPlayingSound, setIsPlayingSound] = useState(false);
  const [showSoundSelector, setShowSoundSelector] = useState(false);
  
  // Refs
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const animFrameRef = useRef(null);
  const mediaRecorderRef = useRef(null);
  const timerRef = useRef(null);
  const chunksRef = useRef([]);
  const audioRef = useRef(null);
  // streamRef always holds the live MediaStream so cleanup never reads stale state
  const streamRef = useRef(null);
  // Stable ref so rAF loop never captures stale filter/facingMode
  const liveRef = useRef({ filter: 'none', facingMode: 'user' });

// Sample background sounds (TikTok-style)
const SAMPLE_SOUNDS = [
  { id: 'trending1', name: 'Trending Beat 1', duration: '15s', url: '/sounds/trending1.mp3' },
  { id: 'trending2', name: 'Trending Beat 2', duration: '15s', url: '/sounds/trending2.mp3' },
  { id: 'viral1', name: 'Viral Sound', duration: '10s', url: '/sounds/viral1.mp3' },
  { id: 'chill1', name: 'Chill Vibes', duration: '12s', url: '/sounds/chill1.mp3' },
  { id: 'energetic1', name: 'Energetic', duration: '15s', url: '/sounds/energetic1.mp3' },
  { id: 'romantic1', name: 'Romantic', duration: '14s', url: '/sounds/romantic1.mp3' },
];

  // Keep liveRef in sync so the rAF loop never captures stale values
  useEffect(() => { liveRef.current.filter = selectedFilter; }, [selectedFilter]);
  useEffect(() => { liveRef.current.facingMode = facingMode; }, [facingMode]);

  // Canvas draw loop — renders filtered frames from hidden <video> into visible <canvas>
  const startDrawLoop = () => {
    const draw = () => {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      if (!video || !canvas) {
        animFrameRef.current = requestAnimationFrame(draw);
        return;
      }
      if (video.readyState >= 2 && video.videoWidth > 0) {
        if (canvas.width !== video.videoWidth) canvas.width = video.videoWidth;
        if (canvas.height !== video.videoHeight) canvas.height = video.videoHeight;
        const ctx = canvas.getContext('2d');
        ctx.save();
        const filterStr = FILTERS.find(f => f.id === liveRef.current.filter)?.filter || 'none';
        ctx.filter = filterStr;
        if (liveRef.current.facingMode === 'user') {
          ctx.translate(canvas.width, 0);
          ctx.scale(-1, 1);
        }
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        ctx.restore();
      }
      animFrameRef.current = requestAnimationFrame(draw);
    };
    animFrameRef.current = requestAnimationFrame(draw);
  };

  const stopDrawLoop = () => {
    if (animFrameRef.current) {
      cancelAnimationFrame(animFrameRef.current);
      animFrameRef.current = null;
    }
  };

  // Start camera — stream goes to hidden <video>, draw loop renders filtered frames to <canvas>
  const startCamera = async () => {
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode, width: { ideal: 1080 }, height: { ideal: 1920 } },
        audio: true,
      });
      streamRef.current = mediaStream;
      setStream(mediaStream);
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
        videoRef.current.onloadedmetadata = () => {
          videoRef.current.play();
          startDrawLoop();
        };
      }
    } catch (error) {
      console.error('Error accessing camera:', error);
      alert('Could not access camera. Please check permissions.');
    }
  };

  // Stop camera — reads from streamRef so it always has the current stream
  const stopCamera = () => {
    stopDrawLoop();
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    setStream(null);
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
  };

  // Switch camera
  const switchCamera = () => {
    stopCamera();
    setFacingMode(prev => prev === 'user' ? 'environment' : 'user');
  };

  // Capture photo — canvas already has the filtered frame baked in
  const capturePhoto = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    canvas.toBlob((blob) => {
      if (blob) {
        const file = new File([blob], `photo-${Date.now()}.jpg`, { type: 'image/jpeg' });
        setSelectedFile(file);
        const url = URL.createObjectURL(blob);
        setPreview(url);
        stopCamera();
        setActiveTab('upload');
      }
    }, 'image/jpeg', 0.92);
  };

  // Start recording — record from canvas stream (filtered) + audio from original stream
  const startRecording = () => {
    if (!stream || !canvasRef.current) return;

    chunksRef.current = [];

    // Capture filtered canvas at 30fps
    const canvasStream = canvasRef.current.captureStream(30);

    // Add audio tracks from original camera stream
    stream.getAudioTracks().forEach(track => canvasStream.addTrack(track));

    // Pick best supported mime type
    const mimeType = [
      'video/webm;codecs=vp9,opus',
      'video/webm;codecs=vp8,opus',
      'video/webm',
    ].find(t => MediaRecorder.isTypeSupported(t)) || '';

    const mediaRecorder = new MediaRecorder(canvasStream, mimeType ? { mimeType } : {});
    mediaRecorderRef.current = mediaRecorder;

    mediaRecorder.ondataavailable = (event) => {
      if (event.data && event.data.size > 0) chunksRef.current.push(event.data);
    };

    mediaRecorder.onstop = () => {
      if (chunksRef.current.length === 0) {
        alert('Recording failed. Please try again.');
        return;
      }
      const blob = new Blob(chunksRef.current, { type: 'video/webm' });
      if (blob.size === 0) {
        alert('Recording failed — empty video. Please try again.');
        return;
      }
      const file = new File([blob], `recorded-${Date.now()}.webm`, { type: 'video/webm' });
      setSelectedFile(file);
      setPreview(URL.createObjectURL(blob));
      setActiveTab('upload');
    };

    mediaRecorder.onerror = (e) => alert('Recording error: ' + e.error);

    mediaRecorder.start(100);
    setIsRecording(true);
    setRecordingTime(0);
    timerRef.current = setInterval(() => setRecordingTime(prev => prev + 1), 1000);
  };

  // Stop recording
  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      console.log('⏹️ Stopping recording...');
      
      // Request final data before stopping
      if (mediaRecorderRef.current.state === 'recording') {
        mediaRecorderRef.current.requestData();
        
        // Small delay to ensure final chunk is collected
        setTimeout(() => {
          mediaRecorderRef.current.stop();
          console.log('✅ MediaRecorder stopped');
        }, 100);
      }
      
      setIsRecording(false);
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    }
  };

  // Handle file upload
  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (file) {
      console.log('File selected:', file.name, file.type, file.size);
      
      if (!file.type.startsWith('video/') && !file.type.startsWith('image/')) {
        alert("Please select a video or image file");
        return;
      }
      
      if (file.size > 50 * 1024 * 1024) {
        alert("File size must be less than 50MB");
        return;
      }
      
      if (file.size === 0) {
        alert("File is empty. Please try recording again.");
        return;
      }
      
      setSelectedFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  // Handle post
  const handlePost = async () => {
    if (!selectedFile) {
      alert("Please select or record a video/image to post");
      return;
    }
    
    setIsUploading(true);
    
    try {
      const formData = new FormData();
      
      // Handle multiple photos or single file
      if (selectedPhotos.length > 0) {
        selectedPhotos.forEach((photo, index) => {
          formData.append(`photos_${index}`, photo.file);
        });
        formData.append("media_type", "photos");
        formData.append("photo_count", selectedPhotos.length);
      } else {
        formData.append("file", selectedFile);
        formData.append("media_type", selectedFile.type.startsWith('video/') ? "video" : "photo");
      }
      
      // Add background sound if selected
      console.log('[UPLOAD] Background sound:', backgroundSound);
      if (backgroundSound && backgroundSound.file) {
        console.log('[UPLOAD] Adding custom background sound file:', backgroundSound.file.name);
        formData.append("background_sound", backgroundSound.file);
      } else if (backgroundSound && backgroundSound.id !== 'custom') {
        console.log('[UPLOAD] Adding background sound ID:', backgroundSound.id);
        formData.append("background_sound_id", backgroundSound.id);
      } else {
        console.log('[UPLOAD] No background sound selected');
      }
      
      formData.append("caption", caption);
      formData.append("hashtags", hashtags);
      
      console.log('TikTok-style FormData prepared, calling api.createPost...');
      const response = await api.createPost(formData);
      console.log('Post created successfully:', response);
      
      // Show success modal
      setShowSuccessModal(true);
      
      // Reset after a delay
      setTimeout(() => {
        setCaption("");
        setHashtags("");
        setSelectedFile(null);
        setPreview(null);
        setSelectedPhotos([]);
        setCurrentPhotoIndex(0);
        setBackgroundSound(null);
        setSoundPreview(null);
        setSelectedFilter('none');
        setShowSuccessModal(false);
        
        if (window.refreshFeed) {
          window.refreshFeed();
        }
        
        onBack();
      }, 2000);
    } catch (error) {
      console.error('Upload error:', error);
      setIsUploading(false);
    }
  };

  // TikTok-style functions for sound and photo handling
  
  // Handle multiple photo upload
  const handleMultiplePhotoUpload = (files) => {
    const photoFiles = Array.from(files).filter(file => file.type.startsWith('image/'));
    const newPhotos = photoFiles.map(file => ({
      file,
      preview: URL.createObjectURL(file)
    }));
    
    setSelectedPhotos(prev => [...prev, ...newPhotos]);
    if (selectedPhotos.length === 0) {
      setCurrentPhotoIndex(0);
    }
  };

  // Remove photo from selection
  const removePhoto = (index) => {
    const newPhotos = selectedPhotos.filter((_, i) => i !== index);
    setSelectedPhotos(newPhotos);
    
    // Adjust current index if needed
    if (currentPhotoIndex >= newPhotos.length && newPhotos.length > 0) {
      setCurrentPhotoIndex(newPhotos.length - 1);
    }
  };

  // Navigate photos
  const navigatePhoto = (direction) => {
    if (direction === 'next' && currentPhotoIndex < selectedPhotos.length - 1) {
      setCurrentPhotoIndex(prev => prev + 1);
    } else if (direction === 'prev' && currentPhotoIndex > 0) {
      setCurrentPhotoIndex(prev => prev - 1);
    }
  };

  // Handle background sound selection
  const handleSoundSelection = (sound) => {
    console.log('[SOUND] Selecting background sound:', sound);
    setBackgroundSound(sound);
    setSoundPreview(sound.url);
    setShowSoundSelector(false);
  };

  // Play/pause sound preview
  const toggleSoundPreview = () => {
    if (!audioRef.current) return;
    
    if (isPlayingSound) {
      audioRef.current.pause();
      setIsPlayingSound(false);
    } else {
      audioRef.current.play();
      setIsPlayingSound(true);
    }
  };

  // Handle custom sound upload
  const handleCustomSoundUpload = (file) => {
    console.log('[SOUND] Custom sound upload:', file);
    if (file && file.type.startsWith('audio/')) {
      const soundFile = {
        id: 'custom',
        name: file.name,
        duration: 'Custom',
        url: URL.createObjectURL(file),
        file: file
      };
      console.log('[SOUND] Created sound file object:', soundFile);
      setBackgroundSound(soundFile);
      setSoundPreview(soundFile.url);
      setShowSoundSelector(false);
    } else {
      console.log('[SOUND] Invalid file type:', file?.type);
    }
  };

    // Start/stop camera when tab or facing mode changes
  useEffect(() => {
    if (activeTab === 'camera') {
      startCamera();
    } else {
      stopCamera();
    }
    return () => stopCamera();
  }, [activeTab, facingMode]);

  // Guaranteed cleanup on unmount — stops camera/mic even if tab never changed
  useEffect(() => {
    return () => {
      stopDrawLoop();
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
        streamRef.current = null;
      }
      if (videoRef.current) {
        videoRef.current.srcObject = null;
      }
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
      if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
        mediaRecorderRef.current.stop();
      }
    };
  }, []); // empty deps = runs only on unmount

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const template = TEMPLATES.find(t => t.id === selectedTemplate) || { ratio: '9/16' };

  return (
    <div style={{
      position: "fixed",
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      background: "#FFFFFF",
      zIndex: 4000,
      display: "flex",
      flexDirection: "column",
    }}>
      {/* Header */}
      <div style={{
        display: "flex",
        alignItems: "center",
        padding: "16px 20px",
        background: "#FFFFFF",
        borderBottom: `1px solid ${T.border}`,
      }}>
        <button
          onClick={onBack}
          style={{
            background: T.bg,
            border: `1px solid ${T.border}`,
            borderRadius: "50%",
            width: 40,
            height: 40,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            cursor: "pointer",
            marginRight: 16,
          }}
        >
          <X size={20} color={T.txt} />
        </button>
        <div style={{ fontSize: 18, fontWeight: 700, color: T.txt }}>
          Create
        </div>
        <div style={{ flex: 1 }} />
        <button
          onClick={handlePost}
          disabled={!selectedFile || isUploading}
          style={{
            background: selectedFile && !isUploading ? T.pri : T.border,
            border: "none",
            borderRadius: 20,
            color: selectedFile && !isUploading ? "#fff" : T.sub,
            padding: "10px 24px",
            fontSize: 14,
            fontWeight: 700,
            cursor: selectedFile && !isUploading ? "pointer" : "not-allowed",
            display: "flex",
            alignItems: "center",
            gap: 8,
          }}
        >
          {isUploading ? "Posting..." : (
            <>
              <Check size={16} />
              Post
            </>
          )}
        </button>
      </div>

      {/* Tab Navigation */}
      <div style={{
        display: "flex",
        gap: 8,
        padding: "12px 20px",
        background: T.bg,
        borderBottom: `1px solid ${T.border}`,
      }}>
        {[
          { id: 'upload', icon: Upload, label: 'Upload' },
          { id: 'camera', icon: Camera, label: 'Camera' },
          { id: 'templates', icon: Sparkles, label: 'Templates' },
        ].map(tab => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              style={{
                flex: 1,
                padding: "12px",
                background: isActive ? T.pri + "15" : "#FFFFFF",
                border: isActive ? `2px solid ${T.pri}` : `2px solid ${T.border}`,
                borderRadius: 12,
                color: isActive ? T.pri : T.txt,
                fontSize: 13,
                fontWeight: 600,
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 8,
                transition: "all 0.2s",
              }}
            >
              <Icon size={18} />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Content Area */}
      <div style={{ flex: 1, overflowY: "auto", padding: "20px" }}>
        {/* Upload Tab */}
        {activeTab === 'upload' && (
          <div style={{ maxWidth: 600, margin: "0 auto" }}>
            {/* Preview */}
            <div style={{
              width: "100%",
              aspectRatio: template.ratio,
              background: T.bg,
              border: `2px solid ${T.border}`,
              borderRadius: 16,
              overflow: "hidden",
              marginBottom: 24,
              position: "relative",
            }}>
              {selectedPhotos.length > 0 ? (
                <div style={{ position: "relative", width: "100%", height: "100%" }}>
                  {/* Multiple Photos with Horizontal Scrolling */}
                  <div style={{ position: "relative", width: "100%", height: "100%" }}>
                    <img
                      src={selectedPhotos[currentPhotoIndex]?.preview}
                      alt={`Photo ${currentPhotoIndex + 1}`}
                      style={{
                        width: "100%",
                        height: "100%",
                        objectFit: "cover",
                        filter: FILTERS.find(f => f.id === selectedFilter)?.filter,
                      }}
                    />
                    
                    {/* Navigation Arrows */}
                    {selectedPhotos.length > 1 && (
                      <>
                        <button
                          onClick={() => navigatePhoto('prev')}
                          disabled={currentPhotoIndex === 0}
                          style={{
                            position: "absolute",
                            left: 10,
                            top: "50%",
                            transform: "translateY(-50%)",
                            width: 40,
                            height: 40,
                            borderRadius: "50%",
                            background: "rgba(0,0,0,0.5)",
                            border: "none",
                            color: "white",
                            cursor: currentPhotoIndex === 0 ? "not-allowed" : "pointer",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                          }}
                        >
                          <ChevronLeft size={20} />
                        </button>
                        
                        <button
                          onClick={() => navigatePhoto('next')}
                          disabled={currentPhotoIndex === selectedPhotos.length - 1}
                          style={{
                            position: "absolute",
                            right: 10,
                            top: "50%",
                            transform: "translateY(-50%)",
                            width: 40,
                            height: 40,
                            borderRadius: "50%",
                            background: "rgba(0,0,0,0.5)",
                            border: "none",
                            color: "white",
                            cursor: currentPhotoIndex === selectedPhotos.length - 1 ? "not-allowed" : "pointer",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                          }}
                        >
                          <ChevronRight size={20} />
                        </button>
                      </>
                    )}
                    
                    {/* Photo Counter */}
                    {selectedPhotos.length > 1 && (
                      <div style={{
                        position: "absolute",
                        bottom: 10,
                        right: 10,
                        background: "rgba(0,0,0,0.7)",
                        color: "white",
                        padding: "4px 8px",
                        borderRadius: 12,
                        fontSize: 12,
                      }}>
                        {currentPhotoIndex + 1}/{selectedPhotos.length}
                      </div>
                    )}
                  </div>
                </div>
              ) : preview ? (
                <div style={{ position: "relative", width: "100%", height: "100%" }}>
                  {selectedFile?.type.startsWith('video/') ? (
                    <video
                      src={preview}
                      controls
                      style={{
                        width: "100%",
                        height: "100%",
                        objectFit: "cover",
                        filter: FILTERS.find(f => f.id === selectedFilter)?.filter,
                      }}
                    />
                  ) : (
                    <img
                      src={preview}
                      alt="Preview"
                      style={{
                        width: "100%",
                        height: "100%",
                        objectFit: "cover",
                        filter: FILTERS.find(f => f.id === selectedFilter)?.filter,
                      }}
                    />
                  )}
                </div>
              ) : (
                <label style={{
                  width: "100%",
                  height: "100%",
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  justifyContent: "center",
                  cursor: "pointer",
                  gap: 16,
                }}>
                  <Upload size={48} color={T.pri} />
                  <div style={{ fontSize: 16, fontWeight: 600, color: T.txt }}>
                    Click to upload
                  </div>
                  <div style={{ fontSize: 13, color: T.sub }}>
                    Video, Images (Multiple photos supported)
                  </div>
                  <input
                    type="file"
                    accept="video/*,image/*"
                    multiple
                    onChange={(e) => {
                      if (e.target.files.length > 1) {
                        // Multiple photos
                        handleMultiplePhotoUpload(e.target.files);
                      } else if (e.target.files.length === 1) {
                        // Single file
                        handleFileSelect(e);
                      }
                    }}
                    style={{ display: "none" }}
                  />
                </label>
              )}
            </div>

            {/* Filters */}
            {preview && (
              <div style={{ marginBottom: 24 }}>
                <div style={{ fontSize: 14, fontWeight: 600, color: T.txt, marginBottom: 12 }}>
                  Filters
                </div>
                <div style={{ display: "flex", gap: 12, overflowX: "auto", paddingBottom: 8 }}>
                  {FILTERS.map(filter => (
                    <button
                      key={filter.id}
                      onClick={() => setSelectedFilter(filter.id)}
                      style={{
                        minWidth: 80,
                        padding: "8px 16px",
                        background: selectedFilter === filter.id ? T.pri : "rgba(255,255,255,0.1)",
                        border: "none",
                        borderRadius: 20,
                        color: "#fff",
                        fontSize: 12,
                        fontWeight: 600,
                        cursor: "pointer",
                        whiteSpace: "nowrap",
                      }}
                    >
                      {filter.name}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Background Sound (TikTok-style) */}
            <div style={{ marginBottom: 24 }}>
              <div style={{ fontSize: 14, fontWeight: 600, color: T.txt, marginBottom: 12 }}>
                <Music size={16} style={{ marginRight: 8, verticalAlign: 'middle' }} />
                Background Sound
              </div>
              
              {backgroundSound ? (
                <div style={{
                  background: "#FFFFFF",
                  border: `2px solid ${T.border}`,
                  borderRadius: 12,
                  padding: 16,
                  display: "flex",
                  alignItems: "center",
                  gap: 12,
                }}>
                  <Music size={20} color={T.pri} />
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 14, fontWeight: 600, color: T.txt }}>
                      {backgroundSound.name}
                    </div>
                    <div style={{ fontSize: 12, color: T.sub }}>
                      {backgroundSound.duration}
                    </div>
                  </div>
                  <button
                    onClick={toggleSoundPreview}
                    style={{
                      width: 40,
                      height: 40,
                      borderRadius: "50%",
                      background: T.pri,
                      border: "none",
                      color: "white",
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    {isPlayingSound ? <Square size={16} /> : <Play size={16} />}
                  </button>
                  <button
                    onClick={() => {
                      setBackgroundSound(null);
                      setSoundPreview(null);
                      setIsPlayingSound(false);
                    }}
                    style={{
                      width: 40,
                      height: 40,
                      borderRadius: "50%",
                      background: "#F5F5F5",
                      border: "none",
                      color: T.txt,
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    <X size={16} />
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => setShowSoundSelector(true)}
                  style={{
                    width: "100%",
                    padding: 16,
                    background: "#FFFFFF",
                    border: `2px solid ${T.border}`,
                    borderRadius: 12,
                    color: T.txt,
                    fontSize: 14,
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: 8,
                  }}
                >
                  <Plus size={16} />
                  Add Background Sound
                </button>
              )}
            </div>

            {/* Caption */}
            <div style={{ marginBottom: 16 }}>
              <textarea
                value={caption}
                onChange={(e) => setCaption(e.target.value)}
                placeholder="Write a caption..."
                rows={3}
                style={{
                  width: "100%",
                  padding: 16,
                  background: "#FFFFFF",
                  border: `2px solid ${T.border}`,
                  borderRadius: 12,
                  color: T.txt,
                  fontSize: 14,
                  resize: "none",
                  outline: "none",
                }}
              />
            </div>

            {/* Hashtags */}
            <div>
              <input
                type="text"
                value={hashtags}
                onChange={(e) => setHashtags(e.target.value)}
                placeholder="#hashtags"
                style={{
                  width: "100%",
                  padding: 16,
                  background: "#FFFFFF",
                  border: `2px solid ${T.border}`,
                  borderRadius: 12,
                  color: T.txt,
                  fontSize: 14,
                  outline: "none",
                }}
              />
            </div>
          </div>
        )}

        {/* Camera Tab */}
        {activeTab === 'camera' && (
          <div style={{ maxWidth: 600, margin: "0 auto" }}>
            <div style={{
              width: "100%",
              aspectRatio: "9/16",
              background: T.bg,
              border: `2px solid ${T.border}`,
              borderRadius: 16,
              overflow: "hidden",
              position: "relative",
            }}>
              {/* Hidden video — raw camera stream source */}
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                style={{ display: 'none' }}
              />
              {/* Visible canvas — filtered output drawn by rAF loop */}
              <canvas
                ref={canvasRef}
                style={{
                  width: "100%",
                  height: "100%",
                  objectFit: "cover",
                  display: "block",
                }}
              />
              
              {/* Recording indicator */}
              {isRecording && (
                <div style={{
                  position: "absolute",
                  top: 20,
                  left: 20,
                  background: "rgba(255,0,0,0.8)",
                  padding: "8px 16px",
                  borderRadius: 20,
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                }}>
                  <div style={{
                    width: 8,
                    height: 8,
                    borderRadius: "50%",
                    background: "#fff",
                    animation: "pulse 1s infinite",
                  }} />
                  <span style={{ color: "#fff", fontSize: 14, fontWeight: 700 }}>
                    {formatTime(recordingTime)}
                  </span>
                </div>
              )}

              {/* Photo / Video mode toggle */}
              <div style={{
                position: "absolute",
                bottom: 120,
                left: 0,
                right: 0,
                display: "flex",
                justifyContent: "center",
                gap: 0,
              }}>
                <div style={{
                  display: "flex",
                  background: "rgba(0,0,0,0.4)",
                  borderRadius: 20,
                  padding: 3,
                  backdropFilter: "blur(8px)",
                }}>
                  <button
                    onClick={() => setCameraMode('photo')}
                    style={{
                      padding: "6px 18px",
                      borderRadius: 16,
                      border: "none",
                      background: cameraMode === 'photo' ? '#fff' : 'transparent',
                      color: cameraMode === 'photo' ? T.txt : '#fff',
                      fontSize: 13,
                      fontWeight: 700,
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      gap: 5,
                      transition: "all 0.2s",
                    }}
                  >
                    <Image size={14} /> Photo
                  </button>
                  <button
                    onClick={() => setCameraMode('video')}
                    style={{
                      padding: "6px 18px",
                      borderRadius: 16,
                      border: "none",
                      background: cameraMode === 'video' ? '#fff' : 'transparent',
                      color: cameraMode === 'video' ? T.txt : '#fff',
                      fontSize: 13,
                      fontWeight: 700,
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      gap: 5,
                      transition: "all 0.2s",
                    }}
                  >
                    <Video size={14} /> Video
                  </button>
                </div>
              </div>

              {/* Controls */}
              <div style={{
                position: "absolute",
                bottom: 30,
                left: 0,
                right: 0,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 28,
              }}>
                {/* Switch camera (front/back) */}
                <button
                  onClick={switchCamera}
                  disabled={isRecording}
                  style={{
                    width: 46,
                    height: 46,
                    borderRadius: "50%",
                    background: "rgba(255,255,255,0.2)",
                    border: "1px solid rgba(255,255,255,0.3)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    cursor: isRecording ? "not-allowed" : "pointer",
                    opacity: isRecording ? 0.5 : 1,
                    backdropFilter: "blur(6px)",
                    flexDirection: "column",
                    gap: 0,
                  }}
                  title={facingMode === 'user' ? 'Switch to back camera' : 'Switch to front camera'}
                >
                  <RefreshCw size={20} color="#fff" />
                </button>

                {/* Capture / Record button */}
                {cameraMode === 'photo' ? (
                  <button
                    onClick={capturePhoto}
                    style={{
                      width: 68,
                      height: 68,
                      borderRadius: "50%",
                      background: "#fff",
                      border: "4px solid rgba(255,255,255,0.3)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      cursor: "pointer",
                      transition: "all 0.15s",
                      boxShadow: "0 2px 12px rgba(0,0,0,0.3)",
                    }}
                  >
                    <div style={{
                      width: 56,
                      height: 56,
                      borderRadius: "50%",
                      background: "#fff",
                      border: "2px solid #ddd",
                    }} />
                  </button>
                ) : (
                  <button
                    onClick={isRecording ? stopRecording : startRecording}
                    style={{
                      width: 68,
                      height: 68,
                      borderRadius: "50%",
                      background: isRecording ? "#ff0000" : "#fff",
                      border: isRecording ? "none" : "4px solid rgba(255,255,255,0.3)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      cursor: "pointer",
                      transition: "all 0.2s",
                      boxShadow: "0 2px 12px rgba(0,0,0,0.3)",
                    }}
                  >
                    {isRecording ? (
                      <Square size={26} color="#fff" fill="#fff" />
                    ) : (
                      <div style={{
                        width: 56,
                        height: 56,
                        borderRadius: "50%",
                        background: "#ff0000",
                      }} />
                    )}
                  </button>
                )}

                {/* Placeholder for symmetry */}
                <div style={{ width: 46, height: 46 }} />
              </div>
            </div>

            {/* Filter selection for camera */}
            <div style={{ marginTop: 16 }}>
              <div style={{ fontSize: 14, fontWeight: 600, color: T.txt, marginBottom: 10 }}>
                Live Filters
              </div>
              <div style={{ display: "flex", gap: 10, overflowX: "auto", paddingBottom: 8, scrollbarWidth: 'none' }}>
                {FILTERS.map(filter => {
                  const swatchColors = {
                    none: 'linear-gradient(135deg, #f5a623, #e91e8c, #7b2ff7)',
                    grayscale: 'linear-gradient(135deg, #888, #bbb, #444)',
                    sepia: 'linear-gradient(135deg, #c8a27a, #a0784e, #7a5a34)',
                    warm: 'linear-gradient(135deg, #ff8c42, #ffb347, #e8521a)',
                    cool: 'linear-gradient(135deg, #4fc3f7, #7986cb, #26c6da)',
                    vibrant: 'linear-gradient(135deg, #ff1744, #00e676, #2979ff)',
                    fade: 'linear-gradient(135deg, #d4a0c0, #b8c4d4, #c0d4b8)',
                    dramatic: 'linear-gradient(135deg, #1a1a2e, #16213e, #0f3460)',
                  };
                  const isActive = selectedFilter === filter.id;
                  return (
                    <button
                      key={filter.id}
                      onClick={() => setSelectedFilter(filter.id)}
                      style={{
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        gap: 6,
                        background: 'none',
                        border: 'none',
                        cursor: 'pointer',
                        padding: '4px 2px',
                        flexShrink: 0,
                      }}
                    >
                      <div style={{
                        width: 58,
                        height: 58,
                        borderRadius: 12,
                        background: swatchColors[filter.id] || swatchColors.none,
                        border: isActive ? `3px solid ${T.pri}` : '3px solid transparent',
                        boxShadow: isActive ? `0 0 0 2px ${T.pri}40` : '0 2px 8px rgba(0,0,0,0.15)',
                        transition: 'all 0.2s',
                        transform: isActive ? 'scale(1.1)' : 'scale(1)',
                      }} />
                      <span style={{
                        fontSize: 11,
                        fontWeight: isActive ? 700 : 500,
                        color: isActive ? T.pri : T.sub,
                        whiteSpace: 'nowrap',
                      }}>
                        {filter.name}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* Templates Tab */}
        {activeTab === 'templates' && (
          <div style={{ maxWidth: 600, margin: "0 auto" }}>
            <div style={{ fontSize: 16, fontWeight: 700, color: T.txt, marginBottom: 20 }}>
              Choose Format
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
              {TEMPLATES.map(temp => (
                <button
                  key={temp.id}
                  onClick={() => {
                    setSelectedTemplate(temp.id);
                    setActiveTab('upload');
                  }}
                  style={{
                    padding: 20,
                    background: selectedTemplate === temp.id ? T.pri + "15" : "#FFFFFF",
                    border: selectedTemplate === temp.id ? `2px solid ${T.pri}` : `2px solid ${T.border}`,
                    borderRadius: 16,
                    cursor: "pointer",
                    textAlign: "left",
                  }}
                >
                  <div style={{ fontSize: 32, marginBottom: 8 }}>{temp.name.split(' ')[0]}</div>
                  <div style={{ fontSize: 16, fontWeight: 700, color: T.txt, marginBottom: 4 }}>
                    {temp.name.split(' ').slice(1).join(' ')}
                  </div>
                  <div style={{ fontSize: 12, color: T.sub }}>{temp.desc}</div>
                  <div style={{ fontSize: 11, color: T.pri, marginTop: 8, fontWeight: 600 }}>
                    {temp.ratio}
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Success Modal */}
      {showSuccessModal && (
        <div style={{
          position: "fixed",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: "rgba(0,0,0,0.5)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          zIndex: 5000,
        }}>
          <div style={{
            background: "#FFFFFF",
            borderRadius: 16,
            padding: 40,
            textAlign: "center",
            maxWidth: 400,
            animation: "slideUp 0.3s ease-out",
          }}>
            <div style={{ fontSize: 48, marginBottom: 16 }}>✅</div>
            <div style={{ fontSize: 20, fontWeight: 700, color: T.txt, marginBottom: 8 }}>
              Post Uploaded Successfully!
            </div>
            <div style={{ fontSize: 14, color: T.sub }}>
              Your content is now live
            </div>
          </div>
        </div>
      )}

      {/* Sound Selector Modal */}
      {showSoundSelector && (
        <div style={{
          position: "fixed",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: "rgba(0,0,0,0.7)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          zIndex: 1000,
          padding: 20,
        }} onClick={() => setShowSoundSelector(false)}>
          <div style={{
            background: "#FFFFFF",
            borderRadius: 20,
            padding: 24,
            maxWidth: 500,
            width: "100%",
            maxHeight: "80vh",
            overflowY: "auto",
          }} onClick={e => e.stopPropagation()}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
              <h3 style={{ margin: 0, color: T.txt, fontSize: 18 }}>
                <Music size={20} style={{ marginRight: 8, verticalAlign: 'middle' }} />
                Choose Background Sound
              </h3>
              <button
                onClick={() => setShowSoundSelector(false)}
                style={{ background: "none", border: "none", cursor: "pointer" }}
              >
                <X size={24} color={T.sub} />
              </button>
            </div>

            {/* Sample Sounds */}
            <div style={{ marginBottom: 20 }}>
              <div style={{ fontSize: 14, fontWeight: 600, color: T.txt, marginBottom: 12 }}>
                Trending Sounds
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {SAMPLE_SOUNDS.map(sound => (
                  <button
                    key={sound.id}
                    onClick={() => handleSoundSelection(sound)}
                    style={{
                      width: "100%",
                      padding: 12,
                      background: "#FAFAF7",
                      border: `1px solid ${T.border}`,
                      borderRadius: 8,
                      color: T.txt,
                      fontSize: 14,
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      gap: 12,
                      textAlign: "left",
                    }}
                  >
                    <Music size={16} color={T.pri} />
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: 600 }}>{sound.name}</div>
                      <div style={{ fontSize: 12, color: T.sub }}>{sound.duration}</div>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Custom Upload */}
            <div>
              <div style={{ fontSize: 14, fontWeight: 600, color: T.txt, marginBottom: 12 }}>
                Upload Your Own
              </div>
              <label style={{
                width: "100%",
                padding: 16,
                background: "#FAFAF7",
                border: `2px dashed ${T.border}`,
                borderRadius: 8,
                color: T.txt,
                fontSize: 14,
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 8,
              }}>
                <Upload size={16} />
                Upload Audio File
                <input
                  type="file"
                  accept="audio/*"
                  onChange={(e) => {
                    if (e.target.files[0]) {
                      handleCustomSoundUpload(e.target.files[0]);
                    }
                  }}
                  style={{ display: "none" }}
                />
              </label>
            </div>
          </div>
        </div>
      )}

      {/* Hidden Audio Element for Sound Preview */}
      <audio
        ref={audioRef}
        src={soundPreview}
        onEnded={() => setIsPlayingSound(false)}
        style={{ display: "none" }}
      />
    </div>
  );
}
