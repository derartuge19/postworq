export function Inp({ label, type="text", value, onChange, placeholder, icon, right }) {
  const T = { txt:"#1C1917", sub:"#78716C", border:"#E7E5E4", pri:"#DA9B2A" };
  
  return (
    <div style={{ marginBottom:14 }}>
      {label && <div style={{ fontSize:11, fontWeight:700, color:T.sub, textTransform:"uppercase", letterSpacing:"0.5px", marginBottom:6 }}>{label}</div>}
      <div style={{ display:"flex", alignItems:"center", gap:10, border:`1.5px solid ${T.border}`, borderRadius:14, padding:"12px 14px", background:"#fff" }}>
        {icon && <span style={{ fontSize:18 }}>{icon}</span>}
        <input type={type} value={value} onChange={onChange} placeholder={placeholder} style={{ flex:1, border:"none", outline:"none", fontSize:14, fontFamily:"inherit", color:T.txt }} />
        {right && <div>{right}</div>}
      </div>
    </div>
  );
}
