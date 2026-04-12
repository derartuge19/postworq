// ─── TikTok-grade Create Page ──────────────────────────────────────────────
import { useState, useRef, useEffect, useCallback } from "react";
import {
  X, Check, Music, Type, Sliders, Play, Pause, Upload, Zap, ZapOff,
  Square, ArrowLeft, RefreshCw, ChevronLeft, Image, Video, Scissors
} from "lucide-react";
import api from "../api";

// ── Tokens ──────────────────────────────────────────────────────────────────
const T = {
  pri: '#DA9B2A', bg: '#000', card: '#111', border: '#2a2a2a',
  white: '#fff', sub: 'rgba(255,255,255,0.55)', red: '#FF3B57',
};

const FILTERS = [
  { id:'none',      name:'Original', css:'none' },
  { id:'grayscale', name:'B&W',      css:'grayscale(100%)' },
  { id:'sepia',     name:'Vintage',  css:'sepia(70%)' },
  { id:'warm',      name:'Warm',     css:'saturate(1.5) hue-rotate(-15deg)' },
  { id:'cool',      name:'Cool',     css:'saturate(1.3) hue-rotate(20deg)' },
  { id:'vibrant',   name:'Vibrant',  css:'saturate(2) contrast(1.1)' },
  { id:'fade',      name:'Fade',     css:'brightness(1.15) contrast(0.82) saturate(0.7)' },
  { id:'drama',     name:'Drama',    css:'contrast(1.5) brightness(0.85)' },
  { id:'neon',      name:'Neon',     css:'saturate(2.2) hue-rotate(280deg) brightness(1.15)' },
  { id:'golden',    name:'Golden',   css:'sepia(55%) saturate(1.4) hue-rotate(-10deg)' },
];

const SPEEDS = ['0.3x', '0.5x', '1x', '2x', '3x'];
const MAX_REC = 60;

const SAMPLE_SOUNDS = [
  { id: 's1', name: 'Chill Beats',    artist: 'LoFi Studio',   dur: '0:15' },
  { id: 's2', name: 'Trending Vibe',  artist: 'Beat Factory',  dur: '0:30' },
  { id: 's3', name: 'Energetic Drop', artist: 'Bass House',    dur: '0:20' },
  { id: 's4', name: 'Romantic Keys',  artist: 'Piano Mood',    dur: '0:25' },
  { id: 's5', name: 'Hip Hop Loop',   artist: 'Urban Beats',   dur: '0:15' },
];

const TEXT_COLORS = ['#fff','#000','#FF3B57','#DA9B2A','#3B82F6','#10B981','#8B5CF6','#F97316'];

// ── SVG Progress Ring ────────────────────────────────────────────────────────
function ProgressRing({ radius, stroke, progress, color }) {
  const r = radius - stroke / 2;
  const circ = r * 2 * Math.PI;
  const offset = circ - (progress / 100) * circ;
  return (
    <svg width={radius*2} height={radius*2}
      style={{ position:'absolute', top:0, left:0, transform:'rotate(-90deg)', pointerEvents:'none' }}>
      <circle stroke={color} fill="none" strokeWidth={stroke} r={r} cx={radius} cy={radius}
        strokeDasharray={`${circ} ${circ}`} strokeDashoffset={offset}
        strokeLinecap="round" style={{ transition:'stroke-dashoffset 0.5s linear' }} />
    </svg>
  );
}

// ── Main Component ────────────────────────────────────────────────────────────
export function EnhancedPostPage({ user, onBack }) {
  // Stage
  const [stage, setStage] = useState('capture'); // 'capture' | 'details'
  const [captureMode, setCaptureMode] = useState('upload'); // 'upload' | 'camera'
  const [camMode, setCamMode] = useState('video'); // 'video' | 'photo'

  // File
  const [selectedFile, setSelectedFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [isVideoFile, setIsVideoFile] = useState(false);

  // Camera
  const [facingMode, setFacingMode] = useState('user');
  const [flashOn, setFlashOn] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [recTime, setRecTime] = useState(0);
  const [recProgress, setRecProgress] = useState(0);
  const [selectedFilter, setSelectedFilter] = useState('none');
  const [selectedSpeed, setSelectedSpeed] = useState('1x');
  const [showFilters, setShowFilters] = useState(false);
  const [showSpeeds, setShowSpeeds] = useState(false);

  // Text overlays
  const [textOverlays, setTextOverlays] = useState([]);
  const [showTextInput, setShowTextInput] = useState(false);
  const [currentText, setCurrentText] = useState('');
  const [textColor, setTextColor] = useState('#ffffff');
  const [dragging, setDragging] = useState(null); // { id, startX, startY, origX, origY }

  // Sound
  const [backgroundSound, setBackgroundSound] = useState(null);
  const [showSoundSheet, setShowSoundSheet] = useState(false);
  const [isPlayingSound, setIsPlayingSound] = useState(false);
  const [origVol, setOrigVol] = useState(100);
  const [addedVol, setAddedVol] = useState(80);
  const [showVolMixer, setShowVolMixer] = useState(false);
  const [customAudioFile, setCustomAudioFile] = useState(null);

  // Post
  const [caption, setCaption] = useState('');
  const [hashtags, setHashtags] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [showSuccess, setShowSuccess] = useState(false);

  // Refs
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const animFrameRef = useRef(null);
  const mediaRecorderRef = useRef(null);
  const timerRef = useRef(null);
  const chunksRef = useRef([]);
  const audioRef = useRef(null);
  const streamRef = useRef(null);
  const liveRef = useRef({ filter: 'none' });
  const isRecordingRef = useRef(false); // sync ref so onMouseDown guard doesn't rely on stale state
  const fileInputRef = useRef(null);
  const audioFileInputRef = useRef(null);
  const previewContainerRef = useRef(null);

  // ── Keep liveRef synced ──────────────────────────────────────────────────
  useEffect(() => { liveRef.current.filter = selectedFilter; }, [selectedFilter]);

  // ── Canvas draw loop ─────────────────────────────────────────────────────
  const startDrawLoop = useCallback(() => {
    const draw = () => {
      const vid = videoRef.current;
      const cvs = canvasRef.current;
      if (!vid || !cvs) return;
      const ctx = cvs.getContext('2d');
      cvs.width = vid.videoWidth || 360;
      cvs.height = vid.videoHeight || 640;
      const f = liveRef.current.filter;
      ctx.filter = f === 'none' ? 'none' : (FILTERS.find(x => x.id === f)?.css || 'none');
      ctx.drawImage(vid, 0, 0, cvs.width, cvs.height);
      animFrameRef.current = requestAnimationFrame(draw);
    };
    draw();
  }, []);

  const stopDrawLoop = useCallback(() => {
    if (animFrameRef.current) { cancelAnimationFrame(animFrameRef.current); animFrameRef.current = null; }
  }, []);

  // ── Camera start/stop ───────────────────────────────────────────────────
  const startCamera = useCallback(async () => {
    try {
      if (streamRef.current) { streamRef.current.getTracks().forEach(t => t.stop()); }
      const s = await navigator.mediaDevices.getUserMedia({
        video: { facingMode, width: { ideal: 1080 }, height: { ideal: 1920 } },
        audio: true,
      });
      streamRef.current = s;
      if (videoRef.current) { videoRef.current.srcObject = s; await videoRef.current.play(); }
      startDrawLoop();
    } catch (e) { console.error('Camera error', e); }
  }, [facingMode, startDrawLoop]);

  const stopCamera = useCallback(() => {
    stopDrawLoop();
    if (streamRef.current) { streamRef.current.getTracks().forEach(t => t.stop()); streamRef.current = null; }
    if (videoRef.current) { videoRef.current.srcObject = null; }
    clearInterval(timerRef.current);
  }, [stopDrawLoop]);

  useEffect(() => {
    if (captureMode === 'camera') { startCamera(); }
    else { stopCamera(); }
    return () => stopCamera();
  }, [captureMode, facingMode]);

  // ── Recording ───────────────────────────────────────────────────────────
  const startRecording = () => {
    // CRITICAL: guard with ref (state is async and may be stale on re-render)
    if (isRecordingRef.current) return;
    if (!streamRef.current) {
      alert('Camera not ready. Please wait a moment and try again.');
      return;
    }

    chunksRef.current = [];

    // Build the record stream: canvas video (filtered) + mic audio from camera
    let recordStream = streamRef.current;
    try {
      const cvs = canvasRef.current;
      if (cvs && cvs.captureStream) {
        const canvasStream = cvs.captureStream(30);
        const audioTracks  = streamRef.current.getAudioTracks();
        const videoTrack   = canvasStream.getVideoTracks()[0];
        const tracks = [
          ...(videoTrack ? [videoTrack] : []),
          ...audioTracks,
        ];
        if (tracks.length > 0) recordStream = new MediaStream(tracks);
      }
    } catch (_) { /* keep raw camera stream */ }

    // Pick best supported mimeType for this browser
    const MIME_CANDIDATES = [
      'video/webm;codecs=vp9,opus',
      'video/webm;codecs=vp8,opus',
      'video/webm',
      'video/mp4',
    ];
    const mimeType = MIME_CANDIDATES.find(m => MediaRecorder.isTypeSupported(m)) || '';
    let mr;
    try {
      mr = new MediaRecorder(recordStream, mimeType ? { mimeType } : {});
    } catch (_) {
      try { mr = new MediaRecorder(streamRef.current, mimeType ? { mimeType } : {}); }
      catch (e2) { alert('Recording not supported on this browser: ' + e2.message); return; }
    }

    const actualMime = mr.mimeType || mimeType || 'video/webm';
    const ext = actualMime.includes('mp4') ? 'mp4' : 'webm';

    mr.ondataavailable = e => {
      if (e.data && e.data.size > 0) chunksRef.current.push(e.data);
    };

    mr.onstop = () => {
      const chunks = chunksRef.current;
      if (!chunks.length) {
        alert('Recording produced no data. Please try again.');
        isRecordingRef.current = false;
        setIsRecording(false);
        return;
      }
      const blob = new Blob(chunks, { type: actualMime });
      if (blob.size === 0) {
        alert('Recorded file is empty. Please try again.');
        isRecordingRef.current = false;
        setIsRecording(false);
        return;
      }
      const file = new File([blob], `rec_${Date.now()}.${ext}`, { type: actualMime });
      const url  = URL.createObjectURL(blob);
      // Stop camera BEFORE setting state to avoid re-render race
      stopCamera();
      setSelectedFile(file);
      setPreview(url);
      setIsVideoFile(true);
      setCaptureMode('upload');
      setStage('details');
      isRecordingRef.current = false;
      setIsRecording(false);
    };

    mr.onerror = (e) => {
      console.error('[RECORDER] error', e);
      isRecordingRef.current = false;
      setIsRecording(false);
      alert('Recording error: ' + (e.error?.message || 'unknown'));
    };

    mediaRecorderRef.current = mr;
    mr.start(250); // emit chunks every 250ms
    isRecordingRef.current = true;
    setIsRecording(true);
    setRecTime(0);
    setRecProgress(0);

    timerRef.current = setInterval(() => {
      setRecTime(t => {
        const next = t + 1;
        setRecProgress((next / MAX_REC) * 100);
        if (next >= MAX_REC) stopRecording();
        return next;
      });
    }, 1000);

    // Play background audio if a custom audio file was picked (sample sounds have no real URL)
    if (audioRef.current && customAudioFile) {
      audioRef.current.volume = addedVol / 100;
      audioRef.current.play().catch(() => {});
    }
  };

  const stopRecording = () => {
    if (!isRecordingRef.current) return;
    clearInterval(timerRef.current);
    const mr = mediaRecorderRef.current;
    if (mr && mr.state === 'recording') {
      try { mr.requestData(); } catch (_) {} // flush any buffered chunk
      mr.stop();
    }
    if (audioRef.current) { audioRef.current.pause(); audioRef.current.currentTime = 0; }
    // isRecordingRef + setIsRecording are set inside onstop to avoid race
  };

  // ── Photo capture ───────────────────────────────────────────────────────
  const takePhoto = () => {
    const cvs = canvasRef.current;
    if (!cvs) return;
    cvs.toBlob(blob => {
      const file = new File([blob], `photo_${Date.now()}.jpg`, { type: 'image/jpeg' });
      const url = URL.createObjectURL(blob);
      setSelectedFile(file);
      setPreview(url);
      setIsVideoFile(false);
      stopCamera();
      setCaptureMode('upload');
      setStage('details');
    }, 'image/jpeg', 0.92);
  };

  // ── File upload from device ─────────────────────────────────────────────
  const handleFileSelect = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const url = URL.createObjectURL(file);
    setSelectedFile(file);
    setPreview(url);
    setIsVideoFile(file.type.startsWith('video/'));
    setStage('details');
  };

  // ── Text overlay ────────────────────────────────────────────────────────
  const addTextOverlay = () => {
    if (!currentText.trim()) return;
    setTextOverlays(prev => [...prev, {
      id: Date.now(), text: currentText, color: textColor,
      x: 50, y: 50, fontSize: 22,
    }]);
    setCurrentText('');
    setShowTextInput(false);
  };

  const removeOverlay = (id) => setTextOverlays(prev => prev.filter(o => o.id !== id));

  // ── Sound ───────────────────────────────────────────────────────────────
  const selectSound = (s) => {
    setBackgroundSound(s);
    setShowSoundSheet(false);
    if (audioRef.current && s.url) {
      audioRef.current.src = s.url;
      audioRef.current.volume = addedVol / 100;
    }
  };

  const toggleSoundPlay = () => {
    if (!audioRef.current) return;
    if (isPlayingSound) { audioRef.current.pause(); setIsPlayingSound(false); }
    else { audioRef.current.play().catch(() => {}); setIsPlayingSound(true); }
  };

  const handleCustomAudio = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const sound = { id: 'custom', name: file.name, artist: 'Your audio', dur: '?', url: URL.createObjectURL(file) };
    setCustomAudioFile(file);
    selectSound(sound);
  };

  // ── Post / upload ───────────────────────────────────────────────────────
  const handlePost = async () => {
    if (!selectedFile || isUploading) return;
    // Guard: file must have actual content
    if (selectedFile.size === 0) {
      alert('The recorded file is empty. Please record again.');
      return;
    }
    console.log('[POST] file:', selectedFile.name, selectedFile.type, selectedFile.size, 'bytes');
    setIsUploading(true);
    setUploadProgress(0);
    try {
      const fd = new FormData();
      fd.append('file', selectedFile, selectedFile.name);
      fd.append('caption', caption);
      if (hashtags) fd.append('hashtags', hashtags);
      if (customAudioFile) {
        fd.append('audio_file', customAudioFile);
        fd.append('audio_volume_level', addedVol);
        fd.append('original_volume_level', origVol);
      }
      if (textOverlays.length) {
        fd.append('overlay_text', JSON.stringify(textOverlays));
      }
      const prog = setInterval(() => setUploadProgress(p => Math.min(p + 8, 90)), 300);
      await api.createPost(fd);
      clearInterval(prog);
      setUploadProgress(100);
      setShowSuccess(true);
      setTimeout(() => { setShowSuccess(false); onBack?.(); }, 2000);
    } catch (e) {
      console.error('Upload failed', e);
      const detail = e?.traceback || e?.error || e?.message || String(e);
      alert(`Upload failed: ${e?.error || e?.message || 'Server error'}\n\nSee console for details.`);
      console.error('[UPLOAD TRACEBACK]', detail);
    } finally {
      setIsUploading(false);
    }
  };

  const fmtTime = (s) => `${Math.floor(s/60)}:${String(s%60).padStart(2,'0')}`;
  const activeFilter = FILTERS.find(f => f.id === selectedFilter);

  // ── Render ───────────────────────────────────────────────────────────────
  return (
    <div style={{
      position: 'fixed', inset: 0, background: T.bg, zIndex: 4000,
      display: 'flex', flexDirection: 'column', color: T.white, fontFamily: 'system-ui, sans-serif',
    }}>
      <style>{`
        @keyframes ep-pulse { 0%,100%{transform:scale(1)} 50%{transform:scale(1.05)} }
        @keyframes ep-fade-in { from{opacity:0;transform:translateY(16px)} to{opacity:1;transform:translateY(0)} }
        @keyframes ep-spin { from{transform:rotate(0deg)} to{transform:rotate(360deg)} }
        @keyframes ep-success { 0%{transform:scale(0.7);opacity:0} 60%{transform:scale(1.1)} 100%{transform:scale(1);opacity:1} }
        .ep-btn { border:none; cursor:pointer; transition:all 0.15s; }
        .ep-btn:active { transform:scale(0.94); }
        .ep-filter-scroll::-webkit-scrollbar { display:none; }
        .ep-hash { color:${T.pri}; font-weight:700; }
      `}</style>

      {/* ── CAPTURE STAGE ─────────────────────────────────────────────── */}
      {stage === 'capture' && (
        <div style={{ flex: 1, position: 'relative', overflow: 'hidden' }}>

          {captureMode === 'camera' ? (
            /* ── CAMERA VIEW (fullscreen 9:16) ── */
            <div style={{ position: 'absolute', inset: 0 }}>
              {/* Hidden video source */}
              <video ref={videoRef} playsInline muted
                style={{ position: 'absolute', opacity: 0, width: 1, height: 1 }} />
              {/* Filtered canvas */}
              <canvas ref={canvasRef}
                style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />

              {/* Text overlays ON camera preview */}
              {textOverlays.map(ov => (
                <div key={ov.id}
                  style={{
                    position: 'absolute', left: `${ov.x}%`, top: `${ov.y}%`,
                    transform: 'translate(-50%,-50%)',
                    color: ov.color, fontSize: ov.fontSize,
                    fontWeight: 800, textShadow: '0 2px 8px rgba(0,0,0,0.6)',
                    cursor: 'move', userSelect: 'none', padding: '4px 8px',
                    background: 'rgba(0,0,0,0.25)', borderRadius: 8,
                    backdropFilter: 'blur(2px)',
                  }}
                  onDoubleClick={() => removeOverlay(ov.id)}
                >
                  {ov.text}
                  <div style={{
                    position: 'absolute', top: -10, right: -10,
                    width: 20, height: 20, borderRadius: '50%',
                    background: T.red, display: 'flex', alignItems: 'center',
                    justifyContent: 'center', cursor: 'pointer', fontSize: 11,
                  }} onClick={() => removeOverlay(ov.id)}>×</div>
                </div>
              ))}

              {/* Top bar */}
              <div style={{
                position: 'absolute', top: 0, left: 0, right: 0,
                padding: '52px 20px 16px',
                background: 'linear-gradient(to bottom, rgba(0,0,0,0.6) 0%, transparent 100%)',
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              }}>
                <button className="ep-btn" onClick={() => { stopCamera(); setCaptureMode('upload'); }}
                  style={{ background: 'rgba(0,0,0,0.4)', borderRadius: '50%', width: 40, height: 40, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <X size={20} color={T.white} />
                </button>

                {/* Mode tabs */}
                <div style={{ display: 'flex', gap: 6, background: 'rgba(0,0,0,0.4)', borderRadius: 24, padding: '4px 6px' }}>
                  {['photo','video'].map(m => (
                    <button key={m} className="ep-btn" onClick={() => setCamMode(m)}
                      style={{
                        padding: '6px 14px', borderRadius: 20,
                        background: camMode === m ? T.white : 'transparent',
                        color: camMode === m ? T.bg : T.white,
                        fontSize: 13, fontWeight: 700,
                      }}>
                      {m.charAt(0).toUpperCase() + m.slice(1)}
                    </button>
                  ))}
                </div>

                {/* Flash */}
                <button className="ep-btn" onClick={() => setFlashOn(f => !f)}
                  style={{ background: 'rgba(0,0,0,0.4)', borderRadius: '50%', width: 40, height: 40, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  {flashOn ? <Zap size={18} color={T.pri} fill={T.pri} /> : <ZapOff size={18} color={T.white} />}
                </button>
              </div>

              {/* Recording timer */}
              {isRecording && (
                <div style={{
                  position: 'absolute', top: 110, left: 0, right: 0, textAlign: 'center',
                }}>
                  <div style={{
                    display: 'inline-flex', alignItems: 'center', gap: 8,
                    background: 'rgba(0,0,0,0.5)', borderRadius: 20, padding: '6px 16px',
                    backdropFilter: 'blur(8px)',
                  }}>
                    <div style={{ width: 8, height: 8, borderRadius: '50%', background: T.red, animation: 'ep-pulse 1s infinite' }} />
                    <span style={{ fontWeight: 700, fontSize: 16, fontVariantNumeric: 'tabular-nums' }}>
                      {fmtTime(recTime)} / {fmtTime(MAX_REC)}
                    </span>
                  </div>
                  {/* Progress bar at top */}
                  <div style={{ position: 'absolute', top: -8, left: 0, right: 0, height: 3, background: 'rgba(255,255,255,0.2)' }}>
                    <div style={{ height: '100%', width: `${recProgress}%`, background: T.red, transition: 'width 0.5s linear' }} />
                  </div>
                </div>
              )}

              {/* Right side toolbar */}
              <div style={{
                position: 'absolute', right: 14, top: '50%', transform: 'translateY(-50%)',
                display: 'flex', flexDirection: 'column', gap: 20, alignItems: 'center',
              }}>
                {[
                  { icon: <RefreshCw size={22} color={T.white} />, label: 'Flip', action: () => setFacingMode(f => f === 'user' ? 'environment' : 'user') },
                  { icon: <Type size={22} color={T.white} />, label: 'Text', action: () => setShowTextInput(true) },
                  { icon: <Music size={22} color={backgroundSound ? T.pri : T.white} />, label: 'Sound', action: () => setShowSoundSheet(true) },
                  { icon: <svg width={22} height={22} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><circle cx="12" cy="12" r="3"/><circle cx="12" cy="12" r="8"/></svg>, label: 'Filter', action: () => setShowFilters(f => !f) },
                  { icon: <span style={{ fontSize: 13, fontWeight: 800, color: T.white }}>{selectedSpeed}</span>, label: 'Speed', action: () => setShowSpeeds(s => !s) },
                ].map((item, i) => (
                  <button key={i} className="ep-btn" onClick={item.action}
                    style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4, background: 'none', padding: 0 }}>
                    <div style={{ width: 44, height: 44, borderRadius: '50%', background: 'rgba(0,0,0,0.45)', backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      {item.icon}
                    </div>
                    <span style={{ fontSize: 11, fontWeight: 600, color: T.white, textShadow: '0 1px 4px rgba(0,0,0,0.8)' }}>{item.label}</span>
                  </button>
                ))}
              </div>

              {/* Speed selector */}
              {showSpeeds && (
                <div style={{
                  position: 'absolute', left: 16, top: '50%', transform: 'translateY(-50%)',
                  display: 'flex', flexDirection: 'column', gap: 8,
                  background: 'rgba(0,0,0,0.6)', borderRadius: 16, padding: '10px 8px',
                  backdropFilter: 'blur(12px)',
                }}>
                  {SPEEDS.map(sp => (
                    <button key={sp} className="ep-btn" onClick={() => { setSelectedSpeed(sp); setShowSpeeds(false); }}
                      style={{
                        padding: '6px 14px', borderRadius: 12,
                        background: selectedSpeed === sp ? T.pri : 'rgba(255,255,255,0.1)',
                        color: T.white, fontSize: 13, fontWeight: 700,
                      }}>{sp}</button>
                  ))}
                </div>
              )}

              {/* Filter strip */}
              {showFilters && (
                <div style={{
                  position: 'absolute', bottom: 130, left: 0, right: 0,
                  overflowX: 'auto', display: 'flex', gap: 12, padding: '8px 16px',
                  scrollbarWidth: 'none',
                }}>
                  {FILTERS.map(f => (
                    <button key={f.id} className="ep-btn" onClick={() => setSelectedFilter(f.id)}
                      style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6, background: 'none', flexShrink: 0 }}>
                      <div style={{
                        width: 58, height: 58, borderRadius: 12,
                        background: `conic-gradient(${T.pri}, #3B82F6, #10B981, ${T.pri})`,
                        filter: f.css,
                        border: selectedFilter === f.id ? `3px solid ${T.white}` : '3px solid transparent',
                        boxShadow: selectedFilter === f.id ? `0 0 0 2px ${T.pri}` : 'none',
                        transition: 'all 0.2s',
                      }} />
                      <span style={{ fontSize: 11, color: selectedFilter === f.id ? T.white : T.sub, fontWeight: 600 }}>{f.name}</span>
                    </button>
                  ))}
                </div>
              )}

              {/* Bottom controls */}
              <div style={{
                position: 'absolute', bottom: 0, left: 0, right: 0,
                background: 'linear-gradient(to top, rgba(0,0,0,0.85) 0%, transparent 100%)',
                padding: '0 24px 48px',
                display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 24,
              }}>
                {/* Upload from gallery shortcut */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
                  <button className="ep-btn" onClick={() => fileInputRef.current?.click()}
                    style={{ background: 'rgba(255,255,255,0.15)', borderRadius: 12, padding: 6, backdropFilter: 'blur(8px)' }}>
                    <div style={{ width: 52, height: 52, borderRadius: 10, background: 'rgba(255,255,255,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <Upload size={22} color={T.white} />
                    </div>
                  </button>

                  {/* Record / Shutter button */}
                  <div style={{ position: 'relative', width: 80, height: 80 }}>
                    {camMode === 'video' && isRecording && (
                      <ProgressRing radius={40} stroke={4} progress={recProgress} color={T.red} />
                    )}
                    <button className="ep-btn"
                      onMouseDown={camMode === 'video' && !isRecording ? startRecording : undefined}
                      onTouchStart={camMode === 'video' && !isRecording ? (e) => { e.preventDefault(); startRecording(); } : undefined}
                      onClick={camMode === 'video' ? (isRecording ? stopRecording : undefined) : takePhoto}
                      style={{
                        width: 80, height: 80, borderRadius: '50%',
                        background: camMode === 'video' ? (isRecording ? T.red : T.white) : T.white,
                        border: `4px solid rgba(255,255,255,0.5)`,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        boxShadow: isRecording ? `0 0 0 6px ${T.red}55` : '0 4px 20px rgba(0,0,0,0.4)',
                        transition: 'all 0.2s',
                      }}>
                      {camMode === 'video'
                        ? (isRecording
                          ? <Square size={26} color={T.white} fill={T.white} />
                          : <div style={{ width: 20, height: 20, borderRadius: '50%', background: T.red }} />)
                        : <div style={{ width: 56, height: 56, borderRadius: '50%', background: T.white, border: '3px solid #ddd' }} />
                      }
                    </button>
                  </div>

                  {/* Flip camera shortcut */}
                  <button className="ep-btn" onClick={() => setFacingMode(f => f === 'user' ? 'environment' : 'user')}
                    style={{ background: 'rgba(255,255,255,0.15)', borderRadius: '50%', width: 52, height: 52, display: 'flex', alignItems: 'center', justifyContent: 'center', backdropFilter: 'blur(8px)' }}>
                    <RefreshCw size={22} color={T.white} />
                  </button>
                </div>

                {/* Background sound pill */}
                {backgroundSound && (
                  <div style={{
                    display: 'flex', alignItems: 'center', gap: 10,
                    background: 'rgba(0,0,0,0.55)', borderRadius: 24, padding: '8px 14px',
                    backdropFilter: 'blur(10px)',
                  }}>
                    <div style={{ width: 6, height: 6, borderRadius: '50%', background: T.pri, animation: isRecording ? 'ep-pulse 1s infinite' : 'none' }} />
                    <Music size={14} color={T.pri} />
                    <span style={{ fontSize: 13, fontWeight: 600 }}>{backgroundSound.name}</span>
                    <button className="ep-btn" onClick={() => setBackgroundSound(null)}
                      style={{ background: 'rgba(255,255,255,0.15)', borderRadius: '50%', width: 20, height: 20, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <X size={11} color={T.white} />
                    </button>
                  </div>
                )}
              </div>

              {/* Hidden input */}
              <input ref={fileInputRef} type="file" accept="image/*,video/*"
                onChange={handleFileSelect} style={{ display: 'none' }} />
            </div>

          ) : (
            /* ── UPLOAD / PICK MODE ── */
            <div style={{
              flex: 1, display: 'flex', flexDirection: 'column',
              height: '100%', background: T.bg,
            }}>
              {/* Header */}
              <div style={{
                display: 'flex', alignItems: 'center', padding: '52px 20px 16px',
                borderBottom: `1px solid ${T.border}`,
              }}>
                <button className="ep-btn" onClick={onBack}
                  style={{ background: 'rgba(255,255,255,0.07)', borderRadius: '50%', width: 40, height: 40, display: 'flex', alignItems: 'center', justifyContent: 'center', marginRight: 12 }}>
                  <X size={20} color={T.white} />
                </button>
                <span style={{ fontSize: 18, fontWeight: 800, color: T.white }}>New Post</span>
              </div>

              {/* Two big cards */}
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 16, padding: 24, justifyContent: 'center' }}>
                {/* Camera card */}
                <button className="ep-btn" onClick={() => setCaptureMode('camera')}
                  style={{
                    padding: '40px 24px',
                    background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%)',
                    border: `1px solid ${T.border}`, borderRadius: 24,
                    display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 14,
                    cursor: 'pointer',
                  }}>
                  <div style={{
                    width: 72, height: 72, borderRadius: '50%',
                    background: 'rgba(255,255,255,0.08)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    border: `2px solid rgba(255,255,255,0.15)`,
                  }}>
                    <Video size={32} color={T.white} />
                  </div>
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: 20, fontWeight: 800, color: T.white, marginBottom: 6 }}>Record Video</div>
                    <div style={{ fontSize: 13, color: T.sub }}>Use your camera · Up to 60s</div>
                  </div>
                </button>

                {/* Upload card */}
                <label style={{
                  padding: '40px 24px',
                  background: 'linear-gradient(135deg, #0d1b0f 0%, #1a2e1a 50%, #0f3020 100%)',
                  border: `2px dashed ${T.border}`, borderRadius: 24,
                  display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 14,
                  cursor: 'pointer',
                }}>
                  <div style={{
                    width: 72, height: 72, borderRadius: '50%',
                    background: 'rgba(255,255,255,0.08)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    border: `2px solid rgba(255,255,255,0.15)`,
                  }}>
                    <Upload size={32} color={T.white} />
                  </div>
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: 20, fontWeight: 800, color: T.white, marginBottom: 6 }}>Upload File</div>
                    <div style={{ fontSize: 13, color: T.sub }}>Video or Photo · MP4, MOV, JPG, PNG</div>
                  </div>
                  <input ref={fileInputRef} type="file" accept="image/*,video/*"
                    onChange={handleFileSelect} style={{ display: 'none' }} />
                </label>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── DETAILS STAGE ──────────────────────────────────────────────────── */}
      {stage === 'details' && (
        <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column' }}>
          {/* Top bar */}
          <div style={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            padding: '52px 20px 16px',
            borderBottom: `1px solid ${T.border}`,
            position: 'sticky', top: 0, background: T.bg, zIndex: 10,
          }}>
            <button className="ep-btn" onClick={() => { setStage('capture'); setPreview(null); setSelectedFile(null); }}
              style={{ background: 'rgba(255,255,255,0.07)', borderRadius: '50%', width: 40, height: 40, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <ArrowLeft size={20} color={T.white} />
            </button>
            <span style={{ fontSize: 18, fontWeight: 800, color: T.white }}>Post</span>
            <button className="ep-btn" onClick={handlePost} disabled={isUploading}
              style={{
                background: isUploading ? 'rgba(218,155,42,0.4)' : T.pri,
                borderRadius: 24, padding: '10px 22px',
                fontSize: 15, fontWeight: 800, color: '#000',
                opacity: isUploading ? 0.7 : 1,
              }}>
              {isUploading ? 'Posting...' : 'Post'}
            </button>
          </div>

          {/* Upload progress bar */}
          {isUploading && (
            <div style={{ height: 3, background: T.border }}>
              <div style={{ height: '100%', width: `${uploadProgress}%`, background: T.pri, transition: 'width 0.3s' }} />
            </div>
          )}

          <div style={{ padding: '20px 20px 40px', display: 'flex', flexDirection: 'column', gap: 20 }}>
            {/* Preview + caption row */}
            <div style={{ display: 'flex', gap: 16, alignItems: 'flex-start' }}>
              {/* Media preview */}
              <div style={{
                width: 100, height: 138, borderRadius: 14, overflow: 'hidden',
                background: T.card, flexShrink: 0, position: 'relative',
                border: `1px solid ${T.border}`,
              }}>
                {preview && (
                  isVideoFile
                    ? <video src={preview} style={{ width: '100%', height: '100%', objectFit: 'cover' }} muted playsInline />
                    : <img src={preview} alt="preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                )}
                {/* Filter preview overlay */}
                {selectedFilter !== 'none' && (
                  <div style={{
                    position: 'absolute', inset: 0,
                    background: 'rgba(218,155,42,0.12)',
                    display: 'flex', alignItems: 'flex-end', justifyContent: 'center',
                    padding: 6,
                  }}>
                    <span style={{ fontSize: 10, fontWeight: 700, color: T.white, background: 'rgba(0,0,0,0.5)', padding: '2px 6px', borderRadius: 8 }}>
                      {activeFilter?.name}
                    </span>
                  </div>
                )}
              </div>

              {/* Caption */}
              <div style={{ flex: 1 }}>
                <textarea
                  value={caption}
                  onChange={e => setCaption(e.target.value)}
                  placeholder="Describe your video..."
                  rows={5}
                  style={{
                    width: '100%', background: 'transparent', border: 'none', outline: 'none',
                    color: T.white, fontSize: 15, lineHeight: 1.5, resize: 'none',
                    boxSizing: 'border-box',
                  }}
                />
              </div>
            </div>

            {/* Hashtags */}
            <div style={{
              background: T.card, borderRadius: 16, padding: '14px 16px',
              display: 'flex', alignItems: 'center', gap: 10,
              border: `1px solid ${T.border}`,
            }}>
              <span style={{ color: T.pri, fontSize: 18, fontWeight: 800 }}>#</span>
              <input
                value={hashtags}
                onChange={e => setHashtags(e.target.value)}
                placeholder="Add hashtags..."
                style={{
                  flex: 1, background: 'transparent', border: 'none', outline: 'none',
                  color: T.white, fontSize: 14,
                }}
              />
            </div>

            {/* Sound section */}
            <div style={{ background: T.card, borderRadius: 16, overflow: 'hidden', border: `1px solid ${T.border}` }}>
              <button className="ep-btn" onClick={() => setShowSoundSheet(true)}
                style={{
                  width: '100%', padding: '16px 20px', background: 'transparent',
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div style={{ width: 40, height: 40, borderRadius: '50%', background: 'rgba(218,155,42,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Music size={18} color={T.pri} />
                  </div>
                  <div style={{ textAlign: 'left' }}>
                    <div style={{ fontSize: 14, fontWeight: 700, color: T.white }}>
                      {backgroundSound ? backgroundSound.name : 'Add Sound'}
                    </div>
                    <div style={{ fontSize: 12, color: T.sub }}>
                      {backgroundSound ? backgroundSound.artist : 'Pick background music'}
                    </div>
                  </div>
                </div>
                <span style={{ color: T.sub, fontSize: 20 }}>›</span>
              </button>

              {backgroundSound && (
                <div style={{ borderTop: `1px solid ${T.border}`, padding: '12px 20px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                    <button className="ep-btn" onClick={toggleSoundPlay}
                      style={{ display: 'flex', alignItems: 'center', gap: 8, background: 'rgba(218,155,42,0.15)', borderRadius: 24, padding: '6px 14px' }}>
                      {isPlayingSound ? <Pause size={14} color={T.pri} /> : <Play size={14} color={T.pri} />}
                      <span style={{ fontSize: 13, fontWeight: 600, color: T.pri }}>Preview</span>
                    </button>
                    <button className="ep-btn" onClick={() => setShowVolMixer(v => !v)}
                      style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'rgba(255,255,255,0.07)', borderRadius: 24, padding: '6px 14px' }}>
                      <Sliders size={14} color={T.white} />
                      <span style={{ fontSize: 13, fontWeight: 600, color: T.white }}>Mix</span>
                    </button>
                  </div>

                  {showVolMixer && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 14, animation: 'ep-fade-in 0.2s ease' }}>
                      {[
                        { label: 'Original sound', val: origVol, set: setOrigVol },
                        { label: 'Added sound', val: addedVol, set: setAddedVol },
                      ].map(({ label, val, set }) => (
                        <div key={label}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                            <span style={{ fontSize: 13, color: T.sub }}>{label}</span>
                            <span style={{ fontSize: 13, fontWeight: 700, color: T.white }}>{val}%</span>
                          </div>
                          <input type="range" min={0} max={100} value={val}
                            onChange={e => set(+e.target.value)}
                            style={{ width: '100%', accentColor: T.pri }} />
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Text overlays summary */}
            {textOverlays.length > 0 && (
              <div style={{ background: T.card, borderRadius: 16, padding: '16px 20px', border: `1px solid ${T.border}` }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                  <span style={{ fontSize: 14, fontWeight: 700, color: T.white }}>Text overlays</span>
                  <button className="ep-btn" onClick={() => setShowTextInput(true)}
                    style={{ background: 'rgba(255,255,255,0.07)', borderRadius: 20, padding: '4px 12px', fontSize: 13, color: T.white }}>
                    + Add
                  </button>
                </div>
                {textOverlays.map(ov => (
                  <div key={ov.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                    <span style={{ fontSize: 14, color: ov.color, fontWeight: 700 }}>{ov.text}</span>
                    <button className="ep-btn" onClick={() => removeOverlay(ov.id)}
                      style={{ background: 'rgba(255,59,87,0.15)', borderRadius: '50%', width: 28, height: 28, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <X size={13} color={T.red} />
                    </button>
                  </div>
                ))}
              </div>
            )}

            {/* Add text CTA if none yet */}
            {textOverlays.length === 0 && (
              <button className="ep-btn" onClick={() => setShowTextInput(true)}
                style={{
                  padding: '16px', background: T.card, border: `1px dashed ${T.border}`,
                  borderRadius: 16, display: 'flex', alignItems: 'center', gap: 12,
                  cursor: 'pointer',
                }}>
                <div style={{ width: 40, height: 40, borderRadius: '50%', background: 'rgba(255,255,255,0.07)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Type size={18} color={T.white} />
                </div>
                <span style={{ fontSize: 14, fontWeight: 700, color: T.white }}>Add text overlay</span>
              </button>
            )}
          </div>
        </div>
      )}

      {/* ── TEXT INPUT MODAL ─────────────────────────────────────────────────── */}
      {showTextInput && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.92)', zIndex: 9000,
          display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
          padding: 24, animation: 'ep-fade-in 0.2s ease',
        }} onClick={() => setShowTextInput(false)}>
          <div style={{ width: '100%', maxWidth: 420 }} onClick={e => e.stopPropagation()}>
            <textarea
              autoFocus
              value={currentText}
              onChange={e => setCurrentText(e.target.value)}
              placeholder="Type your text..."
              rows={3}
              style={{
                width: '100%', background: 'rgba(255,255,255,0.08)', border: `1px solid ${T.border}`,
                borderRadius: 16, padding: 16, color: textColor,
                fontSize: 24, fontWeight: 800, outline: 'none', resize: 'none', boxSizing: 'border-box',
                textAlign: 'center', textShadow: '0 2px 8px rgba(0,0,0,0.6)',
              }}
            />
            <div style={{ display: 'flex', gap: 10, marginTop: 16, justifyContent: 'center' }}>
              {TEXT_COLORS.map(c => (
                <button key={c} className="ep-btn" onClick={() => setTextColor(c)}
                  style={{
                    width: 32, height: 32, borderRadius: '50%', background: c,
                    border: textColor === c ? `3px solid ${T.white}` : '3px solid transparent',
                    boxShadow: textColor === c ? `0 0 0 2px ${T.pri}` : 'none',
                  }} />
              ))}
            </div>
            <div style={{ display: 'flex', gap: 12, marginTop: 20 }}>
              <button className="ep-btn" onClick={() => setShowTextInput(false)}
                style={{ flex: 1, padding: 14, background: 'rgba(255,255,255,0.08)', borderRadius: 16, color: T.white, fontSize: 15, fontWeight: 700 }}>
                Cancel
              </button>
              <button className="ep-btn" onClick={addTextOverlay}
                style={{ flex: 2, padding: 14, background: T.pri, borderRadius: 16, color: '#000', fontSize: 15, fontWeight: 800 }}>
                Add Text
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── SOUND SELECTOR SHEET ─────────────────────────────────────────────── */}
      {showSoundSheet && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', zIndex: 9000,
          display: 'flex', alignItems: 'flex-end', animation: 'ep-fade-in 0.2s ease',
        }} onClick={() => setShowSoundSheet(false)}>
          <div style={{
            width: '100%', maxHeight: '70vh', background: '#111',
            borderRadius: '24px 24px 0 0', overflow: 'hidden', display: 'flex', flexDirection: 'column',
            animation: 'ep-fade-in 0.25s ease',
          }} onClick={e => e.stopPropagation()}>
            {/* Sheet handle */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '12px 0 4px' }}>
              <div style={{ width: 40, height: 4, borderRadius: 4, background: T.border }} />
            </div>

            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 20px 16px' }}>
              <span style={{ fontSize: 18, fontWeight: 800, color: T.white }}>Select Sound</span>
              <button className="ep-btn" onClick={() => setShowSoundSheet(false)}
                style={{ background: 'rgba(255,255,255,0.1)', borderRadius: '50%', width: 36, height: 36, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <X size={18} color={T.white} />
              </button>
            </div>

            <div style={{ overflowY: 'auto', padding: '0 20px 32px', flex: 1 }}>
              {/* Upload custom */}
              <label style={{
                display: 'flex', alignItems: 'center', gap: 14, padding: '14px 0',
                borderBottom: `1px solid ${T.border}`, cursor: 'pointer',
              }}>
                <div style={{ width: 48, height: 48, borderRadius: 12, background: 'rgba(218,155,42,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <Upload size={20} color={T.pri} />
                </div>
                <div>
                  <div style={{ fontSize: 15, fontWeight: 700, color: T.white }}>Upload your own</div>
                  <div style={{ fontSize: 12, color: T.sub }}>MP3, AAC, WAV</div>
                </div>
                <input ref={audioFileInputRef} type="file" accept="audio/*"
                  onChange={handleCustomAudio} style={{ display: 'none' }} />
              </label>

              {/* Trending sounds */}
              <div style={{ fontSize: 13, fontWeight: 700, color: T.sub, margin: '16px 0 8px', textTransform: 'uppercase', letterSpacing: 1 }}>Trending</div>
              {SAMPLE_SOUNDS.map(s => (
                <button key={s.id} className="ep-btn" onClick={() => selectSound(s)}
                  style={{
                    width: '100%', padding: '12px 0', background: 'transparent',
                    display: 'flex', alignItems: 'center', gap: 14,
                    borderBottom: `1px solid ${T.border}`,
                  }}>
                  <div style={{
                    width: 48, height: 48, borderRadius: 12, flexShrink: 0,
                    background: `linear-gradient(135deg, ${T.pri}55, #3B82F655)`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    border: backgroundSound?.id === s.id ? `2px solid ${T.pri}` : '2px solid transparent',
                  }}>
                    <Music size={20} color={backgroundSound?.id === s.id ? T.pri : T.white} />
                  </div>
                  <div style={{ flex: 1, textAlign: 'left' }}>
                    <div style={{ fontSize: 15, fontWeight: 700, color: T.white }}>{s.name}</div>
                    <div style={{ fontSize: 12, color: T.sub }}>{s.artist} · {s.dur}</div>
                  </div>
                  {backgroundSound?.id === s.id && <Check size={18} color={T.pri} />}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ── SUCCESS OVERLAY ──────────────────────────────────────────────────── */}
      {showSuccess && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)', zIndex: 9999,
          display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
          gap: 20, animation: 'ep-fade-in 0.3s ease',
        }}>
          <div style={{
            width: 96, height: 96, borderRadius: '50%',
            background: 'linear-gradient(135deg, #10B981, #059669)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            animation: 'ep-success 0.4s cubic-bezier(0.175,0.885,0.32,1.275)',
          }}>
            <Check size={48} color={T.white} strokeWidth={3} />
          </div>
          <div style={{ fontSize: 22, fontWeight: 800, color: T.white }}>Video is Live! 🎉</div>
          <div style={{ fontSize: 15, color: T.sub }}>Your post has been uploaded</div>
        </div>
      )}

      {/* Hidden audio player */}
      <audio ref={audioRef} onEnded={() => setIsPlayingSound(false)} style={{ display: 'none' }} />
    </div>
  );
}
