import { useState } from "react";
import { Inp } from "./Inp";
import { GradBtn } from "./GradBtn";
import api from "../api";

const T = { txt:"#1C1917", sub:"#78716C", border:"#E7E5E4", pri:"#DA9B2A", red:"#EF4444", redL:"#FEE2E2", dark:"#0C1A12" };

export function LoginScreen({ onSuccess, onRegister, onBack }) {
  const [email, setEmail] = useState("");
  const [pw, setPw] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");

  const go = async () => {
    if(!email||!pw){setErr("Fill all fields");return;}
    setErr("");
    setLoading(true);
    try {
      // Try login with email first, then with email prefix as username
      let username = email.split("@")[0];
      console.log('Attempting login with:', { username, password: pw });
      
      try {
        const res = await api.login(username, pw);
        console.log('Login successful:', res);
        api.setToken(res.token);
        onSuccess({
          email,
          name: res.user.first_name || "Creator",
          init: (res.user.first_name || "C").slice(0,2).toUpperCase(),
          plan:"free",
          phone:"",
          marketingChoices:{sms:true,email:true,push:true,inApp:true},
          id: res.user.id
        });
      } catch(e) {
        // If login fails, show the error
        throw e;
      }
    } catch(e) {
      console.error('Login error:', e);
      setErr(e.message || "Login failed - check your email and password");
      setLoading(false);
    }
  };

  return (
    <div style={{ minHeight:"100vh", background:T.dark, display:"flex", flexDirection:"column" }}>
      <div style={{ padding:"52px 24px 0" }}>
        <button onClick={onBack} style={{ background:"rgba(255,255,255,0.12)", border:"none", borderRadius:"50%", width:36, height:36, cursor:"pointer", fontSize:17, color:"#fff" }}>←</button>
        <div style={{ textAlign:"center", marginTop:20 }}>
          <div style={{ fontSize:34, marginBottom:6 }}>⭐</div>
          <div style={{ fontSize:24, fontWeight:900, color:"#fff" }}>Welcome back!</div>
          <div style={{ fontSize:13, color:"rgba(255,255,255,0.55)", marginTop:4 }}>Log in to your account</div>
        </div>
      </div>
      <div style={{ flex:1, background:"#fff", borderRadius:"28px 28px 0 0", marginTop:30, padding:"28px 24px 40px" }}>
        <Inp label="Email" type="email" value={email} onChange={e=>setEmail(e.target.value)} placeholder="you@example.com" icon="📧" />
        <Inp label="Password" type={showPw?"text":"password"} value={pw} onChange={e=>setPw(e.target.value)} placeholder="Enter your password" icon="🔒" right={<span onClick={()=>setShowPw(!showPw)} style={{ cursor:"pointer" }}>{showPw?"🙈":"👁️"}</span>} />
        {err&&<div style={{ background:T.redL, borderRadius:10, padding:"8px 12px", fontSize:12, color:T.red, fontWeight:600, marginBottom:12 }}>⚠️ {err}</div>}
        <div style={{ textAlign:"right", marginBottom:16 }}><span style={{ fontSize:12, color:T.pri, fontWeight:700, cursor:"pointer" }}>Forgot password?</span></div>
        <GradBtn onClick={go} disabled={loading}>{loading?"Logging in…":"Log In 🚀"}</GradBtn>
        <div style={{ textAlign:"center", marginTop:16, fontSize:13, color:T.sub }}>Don't have an account? <span onClick={onRegister} style={{ color:T.pri, fontWeight:700, cursor:"pointer" }}>Sign up free</span></div>
      </div>
    </div>
  );
}
