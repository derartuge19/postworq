import { useState, useRef } from "react";
import config from "../config";
import { useLegacyT } from "../contexts/ThemeContext";

const mediaUrl = (url) => {
  if (!url) return null;
  if (url.startsWith('http')) return url;
  return `${config.API_BASE_URL.replace('/api', '')}${url}`;
};

// Mirrors overlayCSS from EnhancedPostPage
const overlayCSS = (ov) => {
  const base = { 
    fontWeight: 800, 
    fontSize: `${ov.fontSize || 22}px`, 
    color: ov.color || '#fff', 
    textAlign: ov.align || 'center', 
    whiteSpace: 'pre-wrap', 
    maxWidth: '260px', 
    display: 'inline-block',
    lineHeight: 1.2,
    userSelect: 'none'
  };
  switch (ov.style) {
    case 'plain':     return { ...base, textShadow: '0 2px 8px rgba(0,0,0,0.9)', background: 'transparent', padding: '4px 6px', borderRadius: 0 };
    case 'outline':   return { ...base, textShadow: 'none', WebkitTextStroke: `2px ${ov.color}`, color: 'transparent', background: 'transparent', padding: '4px 6px' };
    case 'neon':      return { ...base, textShadow: `0 0 8px ${ov.color}, 0 0 20px ${ov.color}, 0 0 40px ${ov.color}`, background: 'transparent', padding: '4px 6px' };
    case 'highlight': return { ...base, background: ov.color, color: (ov.color === '#fff' || ov.color === '#ffffff') ? '#000' : '#fff', padding: '4px 12px', borderRadius: 6 };
    default:          return { ...base, background: 'rgba(0,0,0,0.45)', backdropFilter: 'blur(4px)', padding: '4px 10px', borderRadius: 8, textShadow: '0 1px 4px rgba(0,0,0,0.6)' };
  }
};

const LONG_PRESS_MS = 500;

export function VideoCard({ video, onLike, onComment, onShare }) {
  const T = useLegacyT();
  const [liked, setLiked] = useState(false);
  const [showComments, setShowComments] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const [toast, setToast] = useState('');
  const longPressTimer = useRef(null);

  // Parse overlays from JSON string
  let overlays = [];
  try { if (video?.overlay_text) overlays = JSON.parse(video.overlay_text); } catch {}

  const handleLike = () => { setLiked(!liked); onLike?.(); };

  const showToast = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(''), 2200);
  };

  // Long-press handlers
  const onPressStart = (e) => {
    longPressTimer.current = setTimeout(() => {
      setShowMenu(true);
      if (navigator.vibrate) navigator.vibrate(40);
    }, LONG_PRESS_MS);
  };
  const onPressEnd = () => { clearTimeout(longPressTimer.current); };

  const handleCopyLink = () => {
    const url = `${window.location.origin}/post/${video.id}`;
    navigator.clipboard?.writeText(url).then(() => showToast('🔗 Link copied!')).catch(() => showToast('Could not copy'));
    setShowMenu(false);
  };

  const handleShare = () => {
    const url = `${window.location.origin}/post/${video.id}`;
    if (navigator.share) {
      navigator.share({ title: video.caption || 'Check this out', url }).catch(() => {});
    } else {
      navigator.clipboard?.writeText(url).then(() => showToast('🔗 Link copied!'));
    }
    setShowMenu(false);
  };

  const handleDownload = () => {
    const src = mediaUrl(video.media || video.image);
    if (!src) { showToast('No media to download'); return; }
    const a = document.createElement('a');
    a.href = src; a.download = `flipstar_${video.id}`; a.target = '_blank';
    document.body.appendChild(a); a.click(); document.body.removeChild(a);
    showToast('⬇️ Downloading...');
    setShowMenu(false);
  };

  const handleNotInterested = () => { showToast('Got it — fewer like this'); setShowMenu(false); };

  return (
    <div style={{ background: "#000", borderRadius: 16, overflow: "hidden", marginBottom: 20, position: "relative", aspectRatio: "9/16", maxHeight: 620, display: "flex", flexDirection: "column" }}>

      {/* ── Media area (long-pressable) ── */}
      <div
        style={{ flex: 1, background: "linear-gradient(135deg,#1a1a1a,#2a2a2a)", position: "relative", overflow: "hidden", userSelect: 'none' }}
        onMouseDown={onPressStart} onMouseUp={onPressEnd} onMouseLeave={onPressEnd}
        onTouchStart={onPressStart} onTouchEnd={onPressEnd} onTouchCancel={onPressEnd}
      >
        {video?.media
          ? <video src={mediaUrl(video.media)} controls playsInline autoPlay muted loop style={{ width:"100%", height:"100%", objectFit:"cover" }} />
          : video?.image
            ? <img src={mediaUrl(video.image)} alt="" style={{ width:"100%", height:"100%", objectFit:"cover" }} />
            : <div style={{ textAlign:"center", color:"#666", padding: 40 }}><div style={{ fontSize:60 }}>🎬</div><div>No media</div></div>
        }

        {/* ── Text overlays rendered from stored JSON ── */}
        {overlays.map((ov, i) => (
          <div key={i} style={{ position:'absolute', left:`${ov.x}%`, top:`${ov.y}%`, transform:'translate(-50%,-50%)', pointerEvents:'none', zIndex:5 }}>
            <span style={overlayCSS(ov)}>{ov.text}</span>
          </div>
        ))}

        {/* ── Bottom gradient + creator info ── */}
        <div style={{ position:"absolute", bottom:0, left:0, right:0, background:"linear-gradient(to top,rgba(0,0,0,0.82),transparent)", padding:"20px 16px", pointerEvents:'none', zIndex:6 }}>
          <div style={{ display:"flex", alignItems:"center", gap:10, marginBottom:10 }}>
            <div style={{ width:36, height:36, borderRadius:"50%", background:T.pri, display:"flex", alignItems:"center", justifyContent:"center", fontSize:18 }}>👤</div>
            <div>
              <div style={{ fontSize:14, fontWeight:700, color:'#fff' }}>{video?.creator || "Creator"}</div>
              <div style={{ fontSize:12, color:"rgba(255,255,255,0.7)" }}>@{video?.handle || "handle"}</div>
            </div>
            <div style={{ marginLeft:'auto', background:T.pri, borderRadius:20, color:'#fff', padding:'6px 16px', fontSize:12, fontWeight:700 }}>Follow</div>
          </div>
          <div style={{ fontSize:13, color:"#fff", lineHeight:1.4 }}>{video?.caption || ""}</div>
        </div>
      </div>

      {/* ── Actions Sidebar ── */}
      <div style={{ position:"absolute", right:12, bottom:80, display:"flex", flexDirection:"column", gap:16, zIndex:10 }}>
        <button onClick={handleLike} style={{ background:"none", border:"none", cursor:"pointer", display:"flex", flexDirection:"column", alignItems:"center", gap:4, color: liked ? T.red : "#fff" }}>
          <div style={{ fontSize:32 }}>{liked ? "❤️" : "🤍"}</div>
          <div style={{ fontSize:12, fontWeight:600 }}>{video?.likes || 0}</div>
        </button>
        <button onClick={() => setShowComments(!showComments)} style={{ background:"none", border:"none", cursor:"pointer", display:"flex", flexDirection:"column", alignItems:"center", gap:4, color:"#fff" }}>
          <div style={{ fontSize:32 }}>💬</div>
          <div style={{ fontSize:12, fontWeight:600 }}>{video?.comments || 0}</div>
        </button>
        <button onClick={handleShare} style={{ background:"none", border:"none", cursor:"pointer", display:"flex", flexDirection:"column", alignItems:"center", gap:4, color:"#fff" }}>
          <div style={{ fontSize:32 }}>📤</div>
          <div style={{ fontSize:12, fontWeight:600 }}>{video?.shares || 0}</div>
        </button>
        <button style={{ background:"none", border:"none", cursor:"pointer", display:"flex", flexDirection:"column", alignItems:"center", gap:4, color:"#fff" }}>
          <div style={{ fontSize:32 }}>🔖</div>
        </button>
      </div>

      {/* ── Long-press context menu ── */}
      {showMenu && (
        <div style={{ position:'fixed', inset:0, zIndex:9800, background:'rgba(0,0,0,0.6)', display:'flex', alignItems:'flex-end' }}
          onClick={() => setShowMenu(false)}>
          <div style={{ width:'100%', background:'#1a1a1a', borderRadius:'24px 24px 0 0', padding:'20px 16px 36px', fontFamily:'system-ui,sans-serif' }}
            onClick={e => e.stopPropagation()}>
            {/* Handle */}
            <div style={{ width:36, height:4, borderRadius:2, background:'rgba(255,255,255,0.25)', margin:'0 auto 20px' }} />
            {/* Media thumbnail header */}
            <div style={{ display:'flex', alignItems:'center', gap:12, marginBottom:18, paddingBottom:16, borderBottom:'1px solid rgba(255,255,255,0.08)' }}>
              <div style={{ width:52, height:52, borderRadius:10, overflow:'hidden', background:'#000', flexShrink:0 }}>
                {video?.image && <img src={mediaUrl(video.image)} alt="" style={{ width:'100%', height:'100%', objectFit:'cover' }} />}
              </div>
              <div>
                <div style={{ fontSize:14, fontWeight:700, color:'#fff' }}>{video?.creator}</div>
                <div style={{ fontSize:12, color:'rgba(255,255,255,0.5)', marginTop:2 }}>{video?.caption?.slice(0,50) || 'No caption'}</div>
              </div>
            </div>
            {/* Action grid */}
            <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:12, marginBottom:16 }}>
              {[
                { icon:'⬇️', label:'Save', action: handleDownload },
                { icon:'🔗', label:'Copy link', action: handleCopyLink },
                { icon:'📤', label:'Share', action: handleShare },
                { icon:'🚫', label:'Not interested', action: handleNotInterested },
              ].map(item => (
                <button key={item.label} onClick={item.action}
                  style={{ background:'rgba(255,255,255,0.07)', border:'none', borderRadius:16, padding:'16px 8px', cursor:'pointer', display:'flex', flexDirection:'column', alignItems:'center', gap:8 }}>
                  <span style={{ fontSize:26 }}>{item.icon}</span>
                  <span style={{ fontSize:11, fontWeight:600, color:'rgba(255,255,255,0.8)', textAlign:'center' }}>{item.label}</span>
                </button>
              ))}
            </div>
            <button onClick={() => setShowMenu(false)}
              style={{ width:'100%', padding:14, background:'rgba(255,255,255,0.07)', border:'none', borderRadius:16, fontSize:15, fontWeight:700, color:'#fff', cursor:'pointer' }}>
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* ── Toast ── */}
      {toast && (
        <div style={{ position:'fixed', top:60, left:'50%', transform:'translateX(-50%)', zIndex:99999,
          background:'rgba(20,20,20,0.95)', borderRadius:24, padding:'10px 22px',
          color:'#fff', fontSize:14, fontWeight:700, boxShadow:'0 4px 20px rgba(0,0,0,0.4)',
          backdropFilter:'blur(12px)', whiteSpace:'nowrap' }}>
          {toast}
        </div>
      )}
    </div>
  );
}
