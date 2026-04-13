// ─── TikTok-grade Create Page ──────────────────────────────────────────────
import { useState, useRef, useEffect, useCallback } from "react";
import {
  X, Check, Music, Type, Sliders, Play, Pause, Upload, Zap, ZapOff,
  Square, ArrowLeft, RefreshCw, ChevronLeft, Image, Video, Scissors,
  Bookmark, Eye, FileText
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
const MAX_REC = 480;

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
  const [textStyle, setTextStyle] = useState('bold');   // bold|plain|outline|neon|highlight
  const [textAlign, setTextAlign] = useState('center'); // left|center|right
  const [textFontSize, setTextFontSize] = useState(22);
  const [dragging, setDragging] = useState(null); // { id, startX, startY, origX, origY }

  // Toast
  const [successMsg, setSuccessMsg] = useState('');

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
  const liveRef = useRef({ filter: 'none', overlays: [] });
  const isRecordingRef = useRef(false); // sync ref so onMouseDown guard doesn't rely on stale state
  const recordingStartRef = useRef(0);  // timestamp when recording began (for ghost-click guard)
  const audioCtxRef = useRef(null);     // Web Audio context for mic+bg mixing into recorder
  const monitorAudioRef = useRef(null); // separate Audio element so user hears bg WITHOUT routing through mic
  const fileInputRef = useRef(null);
  const audioFileInputRef = useRef(null);
  const previewContainerRef = useRef(null);

  // ── Drafts state ─────────────────────────────────────────────────────────
  const [drafts, setDrafts] = useState(() => {
    try { return JSON.parse(localStorage.getItem('ep_drafts') || '[]'); } catch { return []; }
  });
  const [showDrafts, setShowDrafts] = useState(false);
  const [showPreview, setShowPreview] = useState(false);

  // ── Keep liveRef synced ──────────────────────────────────────────────────
  useEffect(() => { liveRef.current.filter = selectedFilter; }, [selectedFilter]);
  useEffect(() => { liveRef.current.overlays = textOverlays; }, [textOverlays]);

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
      // ── Bake text overlays into the canvas frame ──
      ctx.filter = 'none';
      (liveRef.current.overlays || []).forEach(ov => {
        const px = ov.x / 100 * cvs.width;
        const py = ov.y / 100 * cvs.height;
        const fs = ov.fontSize * (cvs.width / 360);
        ctx.save();
        ctx.font = `800 ${fs}px system-ui, sans-serif`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        const tw = ctx.measureText(ov.text).width;
        const pad = fs * 0.35;
        ctx.fillStyle = 'rgba(0,0,0,0.28)';
        ctx.beginPath();
        if (ctx.roundRect) ctx.roundRect(px - tw/2 - pad, py - fs/2 - pad*0.5, tw + pad*2, fs + pad, fs*0.3);
        else ctx.rect(px - tw/2 - pad, py - fs/2 - pad*0.5, tw + pad*2, fs + pad);
        ctx.fill();
        ctx.shadowColor = 'rgba(0,0,0,0.6)';
        ctx.shadowBlur = 8;
        ctx.shadowOffsetY = 2;
        ctx.fillStyle = ov.color;
        ctx.fillText(ov.text, px, py);
        ctx.restore();
      });
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

  // ── Cleanup helper ──────────────────────────────────────────────────────
  const _cleanupAudio = () => {
    // Stop monitor playback (separate element used so user hears bg during recording)
    if (monitorAudioRef.current) {
      monitorAudioRef.current.pause();
      monitorAudioRef.current.src = '';
      monitorAudioRef.current = null;
    }
    // Close Web Audio context (stops AudioBufferSource feeding the recorder)
    if (audioCtxRef.current) {
      try { audioCtxRef.current.close(); } catch (_) {}
      audioCtxRef.current = null;
    }
  };

  // ── Recording ───────────────────────────────────────────────────────────
  const startRecording = async () => {
    // ── LOCK IMMEDIATELY before any async work so no re-entrant calls slip through ──
    if (isRecordingRef.current) return;
    if (!streamRef.current) {
      alert('Camera not ready. Please wait a moment and try again.');
      return;
    }
    isRecordingRef.current = true;   // set lock NOW — before awaits
    recordingStartRef.current = Date.now();

    // Kill any stale timer / audio from a previous session
    clearInterval(timerRef.current);
    _cleanupAudio();
    chunksRef.current = [];
    setRecTime(0);
    setRecProgress(0);

    // ── Step 1: canvas video track ───────────────────────────────────────
    let videoTrack = null;
    try {
      const cvs = canvasRef.current;
      if (cvs && cvs.captureStream) {
        videoTrack = cvs.captureStream(30).getVideoTracks()[0] || null;
      }
    } catch (_) {}

    // ── Step 2: audio track ──────────────────────────────────────────────
    // Strategy: mix mic (origVol%) + bg audio (addedVol%) into recorder.
    // ECHO FIX: bg audio goes ONLY into the recorder (dest), NOT ctx.destination.
    // A separate Audio element is used for monitoring so the user hears the music
    // without routing it through ctx.destination → speaker → mic → echo loop.
    let audioTracks = streamRef.current.getAudioTracks();
    if (customAudioFile) {
      try {
        const ctx = new (window.AudioContext || window.webkitAudioContext)();
        audioCtxRef.current = ctx;
        const dest = ctx.createMediaStreamDestination();

        // Mic at origVol (0 = full lipsync, 100 = full voice)
        if (audioTracks.length > 0) {
          const micSrc  = ctx.createMediaStreamSource(new MediaStream(audioTracks));
          const micGain = ctx.createGain();
          micGain.gain.value = origVol / 100;
          micSrc.connect(micGain);
          micGain.connect(dest);
        }

        // Decode bg file into AudioBuffer — loop it, feed ONLY into recorder (not speakers)
        const arrayBuf = await customAudioFile.arrayBuffer();
        const audioBuf = await ctx.decodeAudioData(arrayBuf);
        const bgSrc = ctx.createBufferSource();
        bgSrc.buffer = audioBuf;
        bgSrc.loop = true;
        const bgGain = ctx.createGain();
        bgGain.gain.value = addedVol / 100;
        bgSrc.connect(bgGain);
        bgGain.connect(dest); // recorder only — no ctx.destination → no mic echo
        bgSrc.start(0);

        audioTracks = dest.stream.getAudioTracks();

        // Separate Audio element for monitoring (user hears music but mic doesn't double-pick it up)
        const monitor = new Audio();
        monitor.src = URL.createObjectURL(customAudioFile);
        monitor.volume = addedVol / 100;
        monitor.loop = true;
        monitor.play().catch(() => {});
        monitorAudioRef.current = monitor;

        console.log('[RECORDER] mix: mic', origVol + '%, bg', addedVol + '%');
      } catch (mixErr) {
        console.warn('[RECORDER] Web Audio mix failed, raw mic fallback:', mixErr);
        _cleanupAudio();
        audioTracks = streamRef.current.getAudioTracks();
      }
    }

    // ── Step 3: assemble MediaStream ─────────────────────────────────────
    const tracks = [
      ...(videoTrack ? [videoTrack] : []),
      ...audioTracks,
    ];
    const recordStream = tracks.length > 0 ? new MediaStream(tracks) : streamRef.current;

    // ── Step 4: pick best mimeType ───────────────────────────────────────
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
      catch (e2) {
        _cleanupAudio();
        isRecordingRef.current = false;
        alert('Recording not supported on this browser: ' + e2.message);
        return;
      }
    }

    const actualMime = mr.mimeType || mimeType || 'video/webm';
    const ext = actualMime.includes('mp4') ? 'mp4' : 'webm';

    // ── Step 5: wire events ──────────────────────────────────────────────
    mr.ondataavailable = e => { if (e.data && e.data.size > 0) chunksRef.current.push(e.data); };

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
      stopCamera();
      setSelectedFile(file);
      setPreview(url);
      setIsVideoFile(true);
      setCaptureMode('upload');
      setStage('details');
      isRecordingRef.current = false;
      setIsRecording(false);
    };

    mr.onerror = e => {
      console.error('[RECORDER] error', e);
      _cleanupAudio();
      isRecordingRef.current = false;
      setIsRecording(false);
      alert('Recording error: ' + (e.error?.message || 'unknown'));
    };

    // ── Step 6: go ───────────────────────────────────────────────────────
    mediaRecorderRef.current = mr;
    mr.start(250);
    setIsRecording(true);

    timerRef.current = setInterval(() => {
      setRecTime(t => {
        const next = t + 1;
        setRecProgress((next / MAX_REC) * 100);
        if (next >= MAX_REC) stopRecording();
        return next;
      });
    }, 1000);
  };

  const stopRecording = () => {
    if (!isRecordingRef.current) return;
    // Ghost-click guard: ignore stop calls within 1s of start
    if (Date.now() - recordingStartRef.current < 1000) return;

    clearInterval(timerRef.current);
    _cleanupAudio(); // stop monitor + AudioContext immediately (no music after stop)

    const mr = mediaRecorderRef.current;
    if (mr && mr.state === 'recording') {
      try { mr.requestData(); } catch (_) {}
      mr.stop(); // triggers onstop asynchronously
    } else {
      isRecordingRef.current = false;
      setIsRecording(false);
    }
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

  // ── Overlay drag helpers ─────────────────────────────────────────────────
  const startOverlayDrag = (e, id) => {
    e.stopPropagation();
    const pt = e.touches?.[0] || e;
    const ov = textOverlays.find(o => o.id === id);
    if (!ov) return;
    setDragging({ id, sx: pt.clientX, sy: pt.clientY, ox: ov.x, oy: ov.y });
  };
  const moveOverlayDrag = (e) => {
    if (!dragging) return;
    const pt = e.touches?.[0] || e;
    const el = previewContainerRef.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    const dx = ((pt.clientX - dragging.sx) / r.width) * 100;
    const dy = ((pt.clientY - dragging.sy) / r.height) * 100;
    setTextOverlays(prev => prev.map(o => o.id === dragging.id
      ? { ...o, x: Math.max(5, Math.min(95, dragging.ox + dx)), y: Math.max(5, Math.min(95, dragging.oy + dy)) }
      : o));
  };
  const endOverlayDrag = () => setDragging(null);

  // ── Overlay CSS helper ────────────────────────────────────────────────────
  const overlayCSS = (ov) => {
    const base = { fontWeight: 800, fontSize: ov.fontSize, color: ov.color, textAlign: ov.align || 'center', userSelect: 'none', cursor: 'move', whiteSpace: 'pre-wrap', maxWidth: 260 };
    switch (ov.style) {
      case 'plain':     return { ...base, textShadow: '0 2px 8px rgba(0,0,0,0.9)', background: 'transparent', padding: '4px 6px', borderRadius: 0 };
      case 'outline':   return { ...base, textShadow: 'none', WebkitTextStroke: `2px ${ov.color}`, color: 'transparent', background: 'transparent', padding: '4px 6px' };
      case 'neon':      return { ...base, textShadow: `0 0 8px ${ov.color}, 0 0 20px ${ov.color}, 0 0 40px ${ov.color}`, background: 'transparent', padding: '4px 6px' };
      case 'highlight': return { ...base, background: ov.color, color: ov.color === '#fff' || ov.color === '#ffffff' ? '#000' : '#fff', padding: '4px 12px', borderRadius: 6 };
      default:          return { ...base, background: 'rgba(0,0,0,0.45)', backdropFilter: 'blur(4px)', padding: '4px 10px', borderRadius: 8, textShadow: '0 1px 4px rgba(0,0,0,0.6)' };
    }
  };

  // ── Draft helpers ─────────────────────────────────────────────────────
  const saveDraft = async () => {
    const draftId = Date.now();
    let thumbData = null;
    if (preview && !isVideoFile) {
      try {
        const resp = await fetch(preview);
        const blob = await resp.blob();
        thumbData = await new Promise(r => { const fr = new FileReader(); fr.onload = () => r(fr.result); fr.readAsDataURL(blob); });
      } catch {}
    }
    const draft = { id: draftId, thumbData, isVideo: isVideoFile, caption, hashtags, selectedFilter, textOverlays, createdAt: new Date().toISOString() };
    const updated = [draft, ...drafts].slice(0, 10);
    setDrafts(updated);
    try {
      localStorage.setItem('ep_drafts', JSON.stringify(updated.map(d => ({ ...d, thumbData: d.isVideo ? null : d.thumbData }))));
    } catch { try { localStorage.setItem('ep_drafts', JSON.stringify(updated.map(d => ({ ...d, thumbData: null })))); } catch {} }
    setSuccessMsg('Draft saved!');
    setTimeout(() => { setSuccessMsg(''); onBack?.(); }, 1200);
  };

  const loadDraft = (draft) => {
    setCaption(draft.caption || '');
    setHashtags(draft.hashtags || '');
    setSelectedFilter(draft.selectedFilter || 'none');
    setTextOverlays(draft.textOverlays || []);
    if (draft.thumbData) {
      setPreview(draft.thumbData);
      setIsVideoFile(draft.isVideo || false);
      setStage('details');
    }
    setShowDrafts(false);
  };

  const deleteDraft = (id) => {
    const updated = drafts.filter(d => d.id !== id);
    setDrafts(updated);
    try { localStorage.setItem('ep_drafts', JSON.stringify(updated)); } catch {}
  };

  // ── Text overlay ────────────────────────────────────────────────────────
  const addTextOverlay = () => {
    if (!currentText.trim()) return;
    setTextOverlays(prev => [...prev, {
      id: Date.now(), text: currentText, color: textColor,
      style: textStyle, align: textAlign, fontSize: textFontSize,
      x: 50, y: 50,
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
            <div ref={previewContainerRef} style={{ position: 'absolute', inset: 0, touchAction: 'none' }}
              onMouseMove={moveOverlayDrag} onMouseUp={endOverlayDrag} onMouseLeave={endOverlayDrag}
              onTouchMove={moveOverlayDrag} onTouchEnd={endOverlayDrag}>
              {/* Hidden video source */}
              <video ref={videoRef} playsInline muted
                style={{ position: 'absolute', opacity: 0, width: 1, height: 1 }} />
              {/* Filtered canvas */}
              <canvas ref={canvasRef}
                style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />

              {/* Text overlays ON camera preview — draggable */}
              {textOverlays.map(ov => (
                <div key={ov.id}
                  style={{ position: 'absolute', left: `${ov.x}%`, top: `${ov.y}%`, transform: 'translate(-50%,-50%)', zIndex: 20, touchAction: 'none' }}
                  onMouseDown={e => startOverlayDrag(e, ov.id)}
                  onTouchStart={e => startOverlayDrag(e, ov.id)}
                >
                  <div style={{ position: 'relative', ...overlayCSS(ov) }}>
                    {ov.text}
                    <div style={{ position: 'absolute', top: -10, right: -10, width: 20, height: 20, borderRadius: '50%', background: T.red, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', fontSize: 11, zIndex: 21 }}
                      onMouseDown={e => e.stopPropagation()}
                      onTouchStart={e => e.stopPropagation()}
                      onClick={() => removeOverlay(ov.id)}>×</div>
                  </div>
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
                      onClick={camMode === 'video'
                        ? () => { isRecording ? stopRecording() : startRecording().catch(console.error); }
                        : takePhoto}
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
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                padding: '52px 20px 16px', borderBottom: `1px solid ${T.border}`,
              }}>
                <button className="ep-btn" onClick={onBack}
                  style={{ background: 'rgba(255,255,255,0.07)', borderRadius: '50%', width: 40, height: 40, display: 'flex', alignItems: 'center', justifyContent: 'center', marginRight: 12 }}>
                  <X size={20} color={T.white} />
                </button>
                <span style={{ fontSize: 18, fontWeight: 800, color: T.white }}>New Post</span>
                {drafts.length > 0 ? (
                  <button className="ep-btn" onClick={() => setShowDrafts(true)}
                    style={{ background: 'rgba(218,155,42,0.15)', borderRadius: 20, padding: '8px 14px', color: T.pri, fontSize: 13, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 6, border: `1px solid ${T.pri}40` }}>
                    <FileText size={14} /> Drafts ({drafts.length})
                  </button>
                ) : <div style={{ width: 40 }} />}
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
                    <div style={{ fontSize: 13, color: T.sub }}>Use your camera · Up to 8 min</div>
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
            <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
              <button className="ep-btn" onClick={() => setShowPreview(true)}
                style={{ background: 'rgba(255,255,255,0.1)', borderRadius: 20, padding: '8px 14px', color: T.white, fontSize: 13, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 6 }}>
                <Eye size={15} /> Preview
              </button>
              <button className="ep-btn" onClick={saveDraft}
                style={{ background: 'rgba(255,255,255,0.1)', borderRadius: 20, padding: '8px', color: T.white, display: 'flex', alignItems: 'center' }}>
                <Bookmark size={17} />
              </button>
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
                {/* Text overlays on preview thumbnail */}
                {textOverlays.map(ov => (
                  <div key={ov.id} style={{
                    position: 'absolute',
                    left: `${ov.x}%`, top: `${ov.y}%`,
                    transform: 'translate(-50%,-50%)',
                    color: ov.color, fontSize: ov.fontSize * 0.42,
                    fontWeight: 800, whiteSpace: 'nowrap', pointerEvents: 'none',
                    textShadow: '0 1px 4px rgba(0,0,0,0.7)',
                    background: 'rgba(0,0,0,0.28)', borderRadius: 4, padding: '1px 4px',
                  }}>{ov.text}</div>
                ))}
                {/* Filter label */}
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
          padding: 20, animation: 'ep-fade-in 0.2s ease',
        }} onClick={() => setShowTextInput(false)}>
          <div style={{ width: '100%', maxWidth: 420 }} onClick={e => e.stopPropagation()}>
            {/* Live preview of the text style */}
            <div style={{ textAlign: 'center', marginBottom: 16, minHeight: 52, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              {currentText ? (
                <span style={{ ...overlayCSS({ color: textColor, style: textStyle, align: textAlign, fontSize: Math.min(textFontSize * 1.2, 36), fontWeight: 800 }), cursor: 'default' }}>
                  {currentText}
                </span>
              ) : <span style={{ color: T.sub, fontSize: 14 }}>Preview appears here</span>}
            </div>
            <textarea
              autoFocus
              value={currentText}
              onChange={e => setCurrentText(e.target.value)}
              placeholder="Type your text..."
              rows={2}
              style={{
                width: '100%', background: 'rgba(255,255,255,0.08)', border: `1px solid ${T.border}`,
                borderRadius: 16, padding: 14, color: textColor,
                fontSize: textFontSize, fontWeight: 800, outline: 'none', resize: 'none', boxSizing: 'border-box',
                textAlign: textAlign,
              }}
            />
            {/* Style row */}
            <div style={{ display: 'flex', gap: 8, marginTop: 14, justifyContent: 'center' }}>
              {[['bold','Aa'],['plain','A'],['outline','Ø'],['neon','✦'],['highlight','▮']].map(([s,lbl]) => (
                <button key={s} className="ep-btn" onClick={() => setTextStyle(s)}
                  style={{ width: 44, height: 44, borderRadius: 12, fontSize: 15, fontWeight: 800,
                    background: textStyle === s ? T.pri : 'rgba(255,255,255,0.1)',
                    color: textStyle === s ? '#000' : T.white,
                    border: textStyle === s ? 'none' : `1px solid ${T.border}` }}>
                  {lbl}
                </button>
              ))}
            </div>
            {/* Alignment */}
            <div style={{ display: 'flex', gap: 8, marginTop: 10, justifyContent: 'center' }}>
              {[['left','◀'],['center','≡'],['right','▶']].map(([a,lbl]) => (
                <button key={a} className="ep-btn" onClick={() => setTextAlign(a)}
                  style={{ width: 44, height: 36, borderRadius: 10, fontSize: 15,
                    background: textAlign === a ? 'rgba(255,255,255,0.25)' : 'rgba(255,255,255,0.07)',
                    color: T.white, border: textAlign === a ? `1px solid ${T.white}` : `1px solid ${T.border}` }}>
                  {lbl}
                </button>
              ))}
              <div style={{ flex: 1 }} />
              <span style={{ color: T.sub, fontSize: 12, alignSelf: 'center' }}>Size</span>
              <input type="range" min={14} max={56} value={textFontSize}
                onChange={e => setTextFontSize(Number(e.target.value))}
                style={{ width: 90, accentColor: T.pri }} />
            </div>
            {/* Color row */}
            <div style={{ display: 'flex', gap: 8, marginTop: 12, justifyContent: 'center' }}>
              {TEXT_COLORS.map(c => (
                <button key={c} className="ep-btn" onClick={() => setTextColor(c)}
                  style={{ width: 30, height: 30, borderRadius: '50%', background: c,
                    border: textColor === c ? `3px solid ${T.white}` : '3px solid transparent',
                    boxShadow: textColor === c ? `0 0 0 2px ${T.pri}` : 'none' }} />
              ))}
            </div>
            <div style={{ display: 'flex', gap: 12, marginTop: 18 }}>
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

      {/* ── PREVIEW MODAL — mirrors actual VideoCard UI ──────────────────────── */}
      {showPreview && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 9000, background: '#000', display: 'flex', flexDirection: 'column' }}>
          {/* Media fills screen */}
          <div style={{ position: 'relative', flex: 1, overflow: 'hidden', background: 'linear-gradient(135deg,#1a1a1a,#2a2a2a)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            {preview && (isVideoFile
              ? <video src={preview} style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }} autoPlay loop muted playsInline />
              : <img src={preview} alt="" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }} />
            )}
            {/* Text overlays at exact positions */}
            {textOverlays.map(ov => (
              <div key={ov.id} style={{ position: 'absolute', left: `${ov.x}%`, top: `${ov.y}%`, transform: 'translate(-50%,-50%)', pointerEvents: 'none', zIndex: 5 }}>
                <span style={{ ...overlayCSS(ov), cursor: 'default' }}>{ov.text}</span>
              </div>
            ))}
            {/* Safe-zone guide */}
            <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', zIndex: 6 }}>
              <div style={{ position: 'absolute', top: 130, left: 0, right: 0, borderBottom: '1.5px dashed rgba(255,220,0,0.65)' }}>
                <span style={{ position: 'absolute', left: 8, top: 2, fontSize: 9, color: 'rgba(255,220,0,0.9)', fontWeight: 700, background: 'rgba(0,0,0,0.45)', padding: '1px 4px', borderRadius: 3 }}>TOP SAFE ↓</span>
              </div>
              <div style={{ position: 'absolute', bottom: 220, left: 0, right: 0, borderTop: '1.5px dashed rgba(255,220,0,0.65)' }}>
                <span style={{ position: 'absolute', left: 8, bottom: 2, fontSize: 9, color: 'rgba(255,220,0,0.9)', fontWeight: 700, background: 'rgba(0,0,0,0.45)', padding: '1px 4px', borderRadius: 3 }}>BOTTOM SAFE ↑</span>
              </div>
              <div style={{ position: 'absolute', right: 56, top: 130, bottom: 220, borderRight: '1.5px dashed rgba(255,220,0,0.45)' }} />
            </div>
            {/* ── Creator info overlay (bottom gradient) — exact VideoCard layout ── */}
            <div style={{
              position: 'absolute', bottom: 0, left: 0, right: 0,
              background: 'linear-gradient(to top, rgba(0,0,0,0.82) 0%, transparent 100%)',
              padding: '20px 16px', pointerEvents: 'none', zIndex: 7,
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
                <div style={{ width: 36, height: 36, borderRadius: '50%', background: T.pri, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18 }}>👤</div>
                <div>
                  <div style={{ fontSize: 14, fontWeight: 700, color: '#fff' }}>{user?.username || 'you'}</div>
                  <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.7)' }}>@{user?.username || 'you'}</div>
                </div>
                <div style={{ marginLeft: 'auto', background: T.pri, borderRadius: 20, color: '#fff', padding: '6px 16px', fontSize: 12, fontWeight: 700 }}>Follow</div>
              </div>
              {caption ? <div style={{ fontSize: 13, color: '#fff', lineHeight: 1.4 }}>{caption}</div> : <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.5)' }}>Your caption...</div>}
              {backgroundSound && <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 6 }}><span style={{ fontSize: 12 }}>🎵</span><span style={{ fontSize: 12, color: '#fff' }}>{backgroundSound.name}</span></div>}
            </div>
            {/* ── Actions sidebar — exact VideoCard layout ── */}
            <div style={{ position: 'absolute', right: 12, bottom: 80, display: 'flex', flexDirection: 'column', gap: 16, zIndex: 8, pointerEvents: 'none' }}>
              {[['❤️', '0'], ['💬', '0'], ['📤', '0'], ['🔖', '']].map(([ic, ct]) => (
                <div key={ic} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
                  <div style={{ fontSize: 32 }}>{ic}</div>
                  {ct && <div style={{ fontSize: 12, fontWeight: 600, color: '#fff' }}>{ct}</div>}
                </div>
              ))}
            </div>
            {/* Close button */}
            <button className="ep-btn" onClick={() => setShowPreview(false)}
              style={{ position: 'absolute', top: 52, left: 16, zIndex: 20, background: 'rgba(0,0,0,0.55)', borderRadius: '50%', width: 40, height: 40, display: 'flex', alignItems: 'center', justifyContent: 'center', backdropFilter: 'blur(8px)' }}>
              <X size={20} color={T.white} />
            </button>
            <span style={{ position: 'absolute', top: 58, left: 64, zIndex: 20, background: 'rgba(0,0,0,0.55)', backdropFilter: 'blur(8px)', borderRadius: 20, padding: '5px 10px', fontSize: 11, color: 'rgba(255,220,0,0.9)', fontWeight: 700 }}>⚡ Preview · dashed = safe zones</span>
          </div>
        </div>
      )}

      {/* ── DRAFTS SHEET ─────────────────────────────────────────────────────── */}
      {showDrafts && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 8500, background: 'rgba(0,0,0,0.75)', display: 'flex', alignItems: 'flex-end' }}
          onClick={() => setShowDrafts(false)}>
          <div style={{ width: '100%', background: T.card, borderRadius: '24px 24px 0 0', padding: '20px 20px 40px', maxHeight: '80vh', overflowY: 'auto' }}
            onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
              <span style={{ fontSize: 18, fontWeight: 800, color: T.white }}>Drafts ({drafts.length})</span>
              <button className="ep-btn" onClick={() => setShowDrafts(false)}
                style={{ background: 'rgba(255,255,255,0.1)', borderRadius: '50%', width: 36, height: 36, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <X size={18} color={T.white} />
              </button>
            </div>
            {drafts.length === 0 && <div style={{ textAlign: 'center', color: T.sub, padding: '32px 0' }}>No drafts saved yet</div>}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {drafts.map(d => (
                <div key={d.id} style={{ display: 'flex', gap: 14, alignItems: 'center', background: 'rgba(255,255,255,0.05)', borderRadius: 14, padding: '12px 14px' }}>
                  {/* Thumb */}
                  <div style={{ width: 56, height: 76, borderRadius: 10, overflow: 'hidden', background: T.bg, flexShrink: 0, position: 'relative' }}>
                    {d.thumbData
                      ? <img src={d.thumbData} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      : <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22 }}>{d.isVideo ? '🎬' : '🖼️'}</div>
                    }
                  </div>
                  {/* Info */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 14, fontWeight: 700, color: T.white, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {d.caption || '(no caption)'}
                    </div>
                    <div style={{ fontSize: 12, color: T.sub, marginTop: 2 }}>
                      {d.isVideo ? 'Video' : 'Photo'} · {new Date(d.createdAt).toLocaleDateString()}
                    </div>
                    {d.textOverlays?.length > 0 && <div style={{ fontSize: 11, color: T.pri, marginTop: 2 }}>{d.textOverlays.length} text overlay{d.textOverlays.length > 1 ? 's' : ''}</div>}
                  </div>
                  {/* Actions */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    <button className="ep-btn" onClick={() => loadDraft(d)}
                      style={{ background: T.pri, borderRadius: 10, padding: '6px 14px', fontSize: 13, fontWeight: 700, color: '#000' }}>
                      Resume
                    </button>
                    <button className="ep-btn" onClick={() => deleteDraft(d.id)}
                      style={{ background: 'rgba(239,68,68,0.2)', borderRadius: 10, padding: '6px 14px', fontSize: 13, fontWeight: 700, color: '#EF4444' }}>
                      Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ── TOAST ──────────────────────────────────────────────────────────── */}
      {successMsg && (
        <div style={{ position: 'fixed', top: 60, left: '50%', transform: 'translateX(-50%)', zIndex: 99999,
          background: 'rgba(30,30,30,0.95)', borderRadius: 24, padding: '10px 22px',
          color: T.white, fontSize: 14, fontWeight: 700, boxShadow: '0 4px 20px rgba(0,0,0,0.4)',
          backdropFilter: 'blur(12px)', animation: 'ep-fade-in 0.2s ease' }}>
          {successMsg}
        </div>
      )}

      {/* Hidden audio player */}
      <audio ref={audioRef} onEnded={() => setIsPlayingSound(false)} style={{ display: 'none' }} />
    </div>
  );
}
