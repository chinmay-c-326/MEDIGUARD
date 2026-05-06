import { useState, useEffect, useRef } from "react";
import "./App.css";
import FloatingLines from "./FloatingLines";
import { GoogleLogin } from '@react-oauth/google';
import { jwtDecode } from 'jwt-decode';

/* ─── Constants ──────────────────────────────────────────────── */
const SCREENS = { HOME: "home", CHAT: "chat", CAMERA: "camera", VITALS: "vitals", REPORT: "report", REMINDERS: "reminders", RESULT: "result", HISTORY: "history" };
const RED_FLAGS = [
  { keywords: ["chest pain", "chest tightness", "chest pressure"], action: "CALL 911 IMMEDIATELY — Chest pain may indicate a heart attack. Do not wait." },
  { keywords: ["can't breathe", "cannot breathe", "shortness of breath", "difficulty breathing"], action: "CALL 911 IMMEDIATELY — Breathing difficulty requires emergency care." },
  { keywords: ["stroke", "face drooping", "arm weakness", "speech difficulty", "sudden numbness"], action: "CALL 911 IMMEDIATELY — These are stroke symptoms. Every second counts." },
  { keywords: ["unconscious", "not breathing", "unresponsive", "seizure"], action: "CALL 911 IMMEDIATELY — This is a life-threatening emergency." },
  { keywords: ["severe bleeding", "bleeding won't stop"], action: "CALL 911 IMMEDIATELY — Severe bleeding requires emergency care." },
];
function checkRedFlags(t) { const l = t.toLowerCase(); for (const f of RED_FLAGS) { if (f.keywords.some(k => l.includes(k))) return f.action; } return null; }
const REMINDER_MESSAGES = [
  { time: "6 hours", label: "Early Check", q: "How are you feeling compared to earlier? Better, same, or worse?" },
  { time: "24 hours", label: "Next Day Check", q: "Did your symptoms improve overnight? Any new symptoms?" },
  { time: "48 hours", label: "48hr Follow-Up", q: "Has your condition resolved or are you still experiencing symptoms?" },
];

/* ─── useWindowSize hook ─────────────────────────────────────── */
function useWindowSize() {
  const [size, setSize] = useState({ width: typeof window !== "undefined" ? window.innerWidth : 1200 });
  useEffect(() => {
    const handler = () => setSize({ width: window.innerWidth });
    window.addEventListener("resize", handler);
    return () => window.removeEventListener("resize", handler);
  }, []);
  return size;
}

/* ─── Design Tokens ──────────────────────────────────────────── */
const T = {
  red: "#38bdf8", redDk: "#0ea5e9", pink: "#67e8f9", rose: "#22d3ee",
  white: "rgba(10,15,30,0.5)", bg: "rgba(255,255,255,0.06)", border: "rgba(255,255,255,0.15)", borderDk: "rgba(255,255,255,0.25)",
  text: "#ffffff", textMd: "#e2e8f0", textXs: "#94a3b8", pinkLt: "rgba(56,189,248,0.1)",
  sidebar: "rgba(10,15,30,0.7)",
  glass: "rgba(10,15,30,0.1)",
  glassBorder: "rgba(255,255,255,0.18)",
  glassHover: "rgba(255,255,255,0.15)",
};

const LANDING_T = {
  blue: "#00d4ff", blueDk: "#007aff", bg: "#000000", border: "#1a1a1a", text: "#ffffff", textMd: "#a1a1a1"
};

/* ─── Global CSS lives in App.css ──────────────────────── */

/* ─── Reusable Components ────────────────────────────────────── */
const Card = ({ children, style = {}, className = "", ...p }) => (
  <div className={`glass-card ${className}`} style={{ background: T.glass, border: `1px solid ${T.glassBorder}`, borderRadius: 18, padding: 20, backdropFilter: "blur(20px) saturate(1.4)", WebkitBackdropFilter: "blur(20px) saturate(1.4)", ...style }} {...p}>
    {children}
  </div>
);
const Pill = ({ children, color = T.red, style = {} }) => (
  <span style={{ display: "inline-flex", alignItems: "center", gap: 4, background: `${color}22`, color, fontSize: 10, fontWeight: 700, letterSpacing: .9, textTransform: "uppercase", padding: "3px 9px", borderRadius: 999, border: `1px solid ${color}33`, ...style }}>
    {children}
  </span>
);
const PrimaryBtn = ({ children, style = {}, ...p }) => (
  <button style={{ background: `linear-gradient(135deg, rgba(56,189,248,0.3), rgba(14,165,233,0.3))`, color: "#fff", fontWeight: 700, fontSize: 14, padding: "13px 22px", borderRadius: 14, display: "flex", alignItems: "center", justifyContent: "center", gap: 8, border: `1px solid rgba(255,255,255,0.2)`, cursor: "pointer", transition: "all .2s", boxShadow: "0 4px 20px rgba(56,189,248,0.25), inset 0 1px 0 rgba(255,255,255,0.15)", backdropFilter: "blur(8px)", ...style }}
    onMouseOver={e => { e.currentTarget.style.transform = "translateY(-1px)"; e.currentTarget.style.boxShadow = "0 8px 30px rgba(56,189,248,0.4), inset 0 1px 0 rgba(255,255,255,0.2)" }}
    onMouseOut={e => { e.currentTarget.style.transform = "translateY(0)"; e.currentTarget.style.boxShadow = "0 4px 20px rgba(56,189,248,0.25), inset 0 1px 0 rgba(255,255,255,0.15)" }}
    {...p}>{children}</button>
);
const GhostBtn = ({ children, style = {}, ...p }) => (
  <button style={{ background: "rgba(255,255,255,0.05)", color: T.red, fontWeight: 600, fontSize: 13, padding: "10px 16px", borderRadius: 12, border: `1px solid ${T.glassBorder}`, cursor: "pointer", transition: "all .15s", backdropFilter: "blur(8px)", ...style }}
    onMouseOver={e => { e.currentTarget.style.background = "rgba(255,255,255,0.12)"; e.currentTarget.style.borderColor = T.red }}
    onMouseOut={e => { e.currentTarget.style.background = "rgba(255,255,255,0.05)"; e.currentTarget.style.borderColor = T.glassBorder }}
    {...p}>{children}</button>
);
const SectionLabel = ({ children, style = {} }) => (
  <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: 1.6, textTransform: "uppercase", color: "rgba(148,163,184,0.7)", marginBottom: 10, ...style }}>{children}</div>
);

/* ─── SVG Icons ──────────────────────────────────────────────── */
const Ico = {
  heart: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" /></svg>,
  chat: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" /></svg>,
  cam: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" /><circle cx="12" cy="13" r="4" /></svg>,
  pulse: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12" /></svg>,
  bell: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" /><path d="M13.73 21a2 2 0 0 1-3.46 0" /></svg>,
  file: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><polyline points="14 2 14 8 20 8" /><line x1="16" y1="13" x2="8" y2="13" /><line x1="16" y1="17" x2="8" y2="17" /></svg>,
  home: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" /><polyline points="9 22 9 12 15 12 15 22" /></svg>,
  alert: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" /></svg>,
  check: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12" /></svg>,
  mic: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z" /><path d="M19 10v2a7 7 0 0 1-14 0v-2" /><line x1="12" y1="19" x2="12" y2="23" /><line x1="8" y1="23" x2="16" y2="23" /></svg>,
  send: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="22" y1="2" x2="11" y2="13" /><polygon points="22 2 15 22 11 13 2 9 22 2" /></svg>,
  share: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="18" cy="5" r="3" /><circle cx="6" cy="12" r="3" /><circle cx="18" cy="19" r="3" /><line x1="8.59" y1="13.51" x2="15.42" y2="17.49" /><line x1="15.41" y1="6.51" x2="8.59" y2="10.49" /></svg>,
  cross: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>,
  right: <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="5" y1="12" x2="19" y2="12" /><polyline points="12 5 19 12 12 19" /></svg>,
  scan: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 7V5a2 2 0 0 1 2-2h2" /><path d="M17 3h2a2 2 0 0 1 2 2v2" /><path d="M21 17v2a2 2 0 0 1-2 2h-2" /><path d="M7 21H5a2 2 0 0 1-2-2v-2" /><line x1="8" y1="12" x2="16" y2="12" /></svg>,
};

/* ─── Emergency Modal ────────────────────────────────────────── */
function EmergencyModal({ redFlag, onDismiss }) {
  if (!redFlag) return null;
  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 9999, background: "rgba(0,0,0,.55)", display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}>
      <div className="fadeUp" style={{ background: T.white, borderRadius: 20, padding: 28, maxWidth: 340, width: "100%", textAlign: "center", boxShadow: "0 24px 60px rgba(220,38,38,.2)" }}>
        <div style={{ width: 52, height: 52, borderRadius: "50%", background: "#fef2f2", border: "1.5px solid #fecaca", margin: "0 auto 14px", display: "flex", alignItems: "center", justifyContent: "center", color: "#dc2626" }}>{Ico.alert}</div>
        <div style={{ fontFamily: "Playfair Display", fontSize: 20, fontWeight: 900, color: "#dc2626", marginBottom: 10 }}>Emergency Alert</div>
        <div style={{ fontSize: 13, lineHeight: 1.7, color: T.textMd, marginBottom: 22 }}>{redFlag}</div>
        <a href="tel:911" style={{ display: "block", background: `linear-gradient(135deg,${T.red},${T.redDk})`, color: "#fff", fontWeight: 800, fontSize: 17, padding: "13px 0", borderRadius: 12, textDecoration: "none", marginBottom: 10, boxShadow: `0 6px 18px ${T.red}40` }}>
          Call 911 Now
        </a>
        <button onClick={onDismiss} style={{ color: T.textXs, fontSize: 12, background: "none", border: "none", cursor: "pointer" }}>Dismiss</button>
      </div>
    </div>
  );
}

/* ─── Desktop Sidebar ────────────────────────────────────────── */
function DesktopSidebar({ screen, setScreen, navItems, handleLogout }) {
  return (
    <div style={{ width: 240, flexShrink: 0, display: "flex", flexDirection: "column", background: "rgba(10,15,30,0.75)", backdropFilter: "blur(30px) saturate(1.4)", WebkitBackdropFilter: "blur(30px) saturate(1.4)", borderRight: `1px solid ${T.glassBorder}`, height: "100vh", position: "sticky", top: 0, overflow: "hidden" }}>
      {/* Logo */}
      <div style={{ padding: "28px 24px 24px", borderBottom: `1px solid ${T.border}` }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div className="hpulse" style={{ width: 38, height: 38, borderRadius: "50%", background: `linear-gradient(135deg,${T.red},${T.redDk})`, display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", flexShrink: 0, boxShadow: `0 4px 12px ${T.red}40` }}>
            {Ico.heart}
          </div>
          <div>
            <div style={{ fontFamily: "Playfair Display", fontSize: 18, fontWeight: 900, background: `linear-gradient(135deg,${T.red},${T.pink})`, WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", lineHeight: 1.1 }}>MediGuard</div>
            <div style={{ fontSize: 9, color: T.textXs, letterSpacing: 1.4, textTransform: "uppercase", fontWeight: 600, marginTop: 1 }}>AI Triage Companion</div>
          </div>
        </div>
      </div>

      {/* Nav */}
      <div style={{ flex: 1, padding: "16px 12px", overflowY: "auto" }}>
        <SectionLabel style={{ paddingLeft: 8 }}>Navigation</SectionLabel>
        {navItems.map(item => {
          const active = screen === item.id;
          return (
            <button key={item.id} onClick={() => setScreen(item.id)}
              style={{ width: "100%", display: "flex", alignItems: "center", gap: 12, padding: "10px 12px", borderRadius: 11, marginBottom: 4, border: "none", cursor: "pointer", background: active ? `${T.red}10` : "transparent", color: active ? T.red : T.textMd, fontWeight: active ? 700 : 500, fontSize: 14, transition: "all .15s", textAlign: "left" }}
              onMouseOver={e => { if (!active) { e.currentTarget.style.background = T.pinkLt; e.currentTarget.style.color = T.red; } }}
              onMouseOut={e => { if (!active) { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = T.textMd; } }}>
              <div style={{ width: 32, height: 32, borderRadius: 9, display: "flex", alignItems: "center", justifyContent: "center", background: active ? `${T.red}18` : T.bg, flexShrink: 0, transition: "background .15s" }}>
                {item.icon}
              </div>
              {item.label}
              {active && <div style={{ marginLeft: "auto", width: 4, height: 16, borderRadius: 2, background: T.red }}></div>}
            </button>
          );
        })}
      </div>

      {/* Logout Section */}
      <div style={{ padding: "8px 12px", borderTop: `1px solid ${T.border}` }}>
        <button onClick={handleLogout}
          style={{ width: "100%", display: "flex", alignItems: "center", gap: 12, padding: "10px 12px", borderRadius: 11, border: "none", cursor: "pointer", background: "transparent", color: T.textXs, fontSize: 13, transition: "all .15s" }}
          onMouseOver={e => { e.currentTarget.style.background = "rgba(255,255,255,0.05)"; e.currentTarget.style.color = T.red; }}
          onMouseOut={e => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = T.textXs; }}>
          <div style={{ width: 32, height: 32, borderRadius: 9, display: "flex", alignItems: "center", justifyContent: "center", background: T.bg, flexShrink: 0 }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" /><polyline points="16 17 21 12 16 7" /><line x1="21" y1="12" x2="9" y2="12" /></svg>
          </div>
          Logout
        </button>
      </div>
    </div>
  );
}

function LoginScreen({ onLogin }) {
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSuccess = async (credentialResponse) => {
    try {
      await onLogin(credentialResponse.credential);
    } catch (e) {
      console.error("Login Error:", e);
    }
  };

  const navLinkStyle = { color: "#fff", textDecoration: "none", fontSize: 14, fontWeight: 600, cursor: "pointer", transition: "color .2s" };

  return (
    <div style={{ background: LANDING_T.bg, color: LANDING_T.text, minHeight: "100vh", fontFamily: "'DM Sans', sans-serif" }}>
      {/* Fixed Header */}
      <nav style={{ position: "fixed", top: 0, left: 0, right: 0, height: 72, background: "rgba(0,0,0,0.8)", backdropFilter: "blur(20px)", borderBottom: `1px solid ${LANDING_T.border}`, display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0 24px", zIndex: 1000 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 24 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div className="hpulse" style={{ width: 32, height: 32, borderRadius: "50%", background: LANDING_T.blue, display: "flex", alignItems: "center", justifyContent: "center", color: "#000" }}>{Ico.heart}</div>
            <div style={{ fontFamily: "Playfair Display", fontSize: 20, fontWeight: 900, letterSpacing: -0.5 }}>MEDIGUARD</div>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
            <span style={navLinkStyle} onMouseOver={e => e.target.style.color = LANDING_T.blue} onMouseOut={e => e.target.style.color = "#fff"}>Login / Sign Up</span>
            <div style={{ position: "relative" }} ref={dropdownRef}>
              <button onClick={() => setDropdownOpen(!dropdownOpen)} style={{ background: "none", border: "none", color: "#fff", cursor: "pointer", display: "flex", alignItems: "center", padding: 8 }}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="1"/><circle cx="12" cy="5" r="1"/><circle cx="12" cy="19" r="1"/></svg>
              </button>
              {dropdownOpen && (
                <div className="fadeUp" style={{ position: "absolute", top: 40, left: 0, background: "#0a0a0a", border: `1px solid ${LANDING_T.border}`, borderRadius: 8, padding: "8px 0", minWidth: 160, boxShadow: "0 10px 30px rgba(0,0,0,0.5)" }}>
                  <a href="#how-it-works" onClick={() => setDropdownOpen(false)} style={{ display: "block", padding: "10px 16px", color: "#fff", textDecoration: "none", fontSize: 13, fontWeight: 500 }} onMouseOver={e => e.target.style.background = "#111"} onMouseOut={e => e.target.style.background = "transparent"}>How it works</a>
                  <a href="#about" onClick={() => setDropdownOpen(false)} style={{ display: "block", padding: "10px 16px", color: "#fff", textDecoration: "none", fontSize: 13, fontWeight: 500 }} onMouseOver={e => e.target.style.background = "#111"} onMouseOut={e => e.target.style.background = "transparent"}>About</a>
                </div>
              )}
            </div>
          </div>
        </div>
        <div style={{ display: "flex", gap: 16 }}>
          <a href="#how-it-works" style={navLinkStyle} onMouseOver={e => e.target.style.color = LANDING_T.blue} onMouseOut={e => e.target.style.color = "#fff"}>Features</a>
          <a href="#about" style={navLinkStyle} onMouseOver={e => e.target.style.color = LANDING_T.blue} onMouseOut={e => e.target.style.color = "#fff"}>Technology</a>
        </div>
      </nav>

      {/* Hero Section */}
      <header style={{ height: "100vh", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", textAlign: "center", padding: "0 20px", background: `linear-gradient(rgba(0,0,0,0.5), rgba(0,0,0,0.5)), url('./src/assets/landing_bg.jpg') center/cover no-repeat`, position: "relative", overflow: "hidden" }}>
        <div style={{ position: "absolute", top: 0, left: 0, right: 0, bottom: 0, background: "rgba(0,0,0,0.2)", pointerEvents: "none" }}></div>
        <div style={{ position: "absolute", top: "20%", left: "50%", transform: "translateX(-50%)", width: "60vw", height: "60vw", background: `radial-gradient(circle, ${LANDING_T.blue}15 0%, transparent 70%)`, filter: "blur(80px)", pointerEvents: "none" }}></div>

        <div className="fadeUp" style={{ maxWidth: 1000, position: "relative", zIndex: 10 }}>
          <Pill style={{ marginBottom: 24, fontSize: 12, padding: "6px 16px", background: "rgba(0,212,255,0.1)", color: LANDING_T.blue, border: `1px solid ${LANDING_T.blue}33` }}>Next-Gen Medical Intelligence</Pill>
          <h1 style={{ fontSize: "clamp(42px, 8vw, 84px)", fontWeight: 900, lineHeight: 1, letterSpacing: -2, marginBottom: 32 }}>
            More Healthy Years. <br /><span style={{ color: LANDING_T.blue }}>Built With You.</span>
          </h1>
          <p style={{ fontSize: 20, color: "#fff", maxWidth: 750, margin: "0 auto 48px", lineHeight: 1.6, fontWeight: 500, textShadow: "0 2px 10px rgba(0,0,0,0.8)" }}>
            Personalized, proactive health journeys, guided by doctors and powered by AI, designed to help you move better, think clearer, and stay healthier longer.
          </p>
          
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 20 }}>
            <div style={{ background: "#111", padding: "8px", borderRadius: 12, border: "1px solid #222" }}>
              <GoogleLogin 
                onSuccess={handleSuccess} 
                onError={() => console.log('Login Failed')} 
                theme="filled_blue" 
                text="continue_with" 
                shape="pill" 
              />
            </div>
            <p style={{ fontSize: 12, color: "#555" }}>Secure. Encrypted. Hippa-Compliant Logic Ready.</p>
          </div>
        </div>

        <div style={{ position: "absolute", bottom: 40, left: "50%", transform: "translateX(-50%)", animation: "fadeUp 1s infinite alternate" }}>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#333" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M7 13l5 5 5-5M7 6l5 5 5-5"/></svg>
        </div>
      </header>

      {/* Features Grid */}
      <section id="how-it-works" style={{ padding: "120px 24px", background: "#050505" }}>
        <div style={{ maxWidth: 1200, margin: "0 auto" }}>
          <div style={{ marginBottom: 80 }}>
            <h2 style={{ fontSize: 48, fontWeight: 900, marginBottom: 16 }}>Core Capabilities</h2>
            <div style={{ width: 60, height: 4, background: LANDING_T.blue }}></div>
          </div>
          
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: 32 }}>
            {[
              { title: "Symptom Triage", desc: "Advanced AI dialogue to assess the severity of your condition in seconds.", icon: Ico.chat },
              { title: "Vital Monitoring", desc: "Monitor heart rate and respiratory patterns using only your camera lens.", icon: Ico.pulse },
              { title: "Dermal Scanning", desc: "Identify potential skin issues or monitor wound healing with guided photography.", icon: Ico.cam },
              { title: "Smart Reminders", desc: "Automated follow-ups to ensure your recovery is on the right track.", icon: Ico.bell },
            ].map((f, i) => (
              <div key={i} className="landing-hc-card" style={{ padding: 40, borderRadius: 16, transition: "transform .3s" }} onMouseOver={e => e.currentTarget.style.transform = "translateY(-10px)"} onMouseOut={e => e.currentTarget.style.transform = "translateY(0)"}>
                <div style={{ width: 48, height: 48, borderRadius: 12, background: `${LANDING_T.blue}10`, color: LANDING_T.blue, display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 24, border: `1px solid ${LANDING_T.blue}33` }}>
                  {f.icon}
                </div>
                <h3 style={{ fontSize: 24, fontWeight: 800, marginBottom: 16 }}>{f.title}</h3>
                <p style={{ color: LANDING_T.textMd, lineHeight: 1.6 }}>{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* About Section */}
      <section id="about" style={{ padding: "120px 24px", background: "#000", borderTop: `1px solid ${LANDING_T.border}` }}>
        <div style={{ maxWidth: 1200, margin: "0 auto", display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(400px, 1fr))", gap: 64, alignItems: "center" }}>
          <div>
            <h2 style={{ fontSize: 48, fontWeight: 900, marginBottom: 24 }}>High-End Tech. <br /><span style={{ color: LANDING_T.blue }}>Human-Centric Care.</span></h2>
            <p style={{ fontSize: 18, color: LANDING_T.textMd, lineHeight: 1.8, marginBottom: 32 }}>
              MediGuard isn't just an app; it's a medical-grade companion designed to bridge the gap between home care and professional medical attention. Our algorithms are trained on vast datasets to provide the most accurate triage possible.
            </p>
            <div style={{ display: "flex", gap: 40 }}>
              <div>
                <div style={{ fontSize: 32, fontWeight: 900, color: LANDING_T.blue }}>99.9%</div>
                <div style={{ fontSize: 12, color: "#555", textTransform: "uppercase", fontWeight: 700, letterSpacing: 1 }}>Uptime</div>
              </div>
              <div>
                <div style={{ fontSize: 32, fontWeight: 900, color: LANDING_T.blue }}>256-bit</div>
                <div style={{ fontSize: 12, color: "#555", textTransform: "uppercase", fontWeight: 700, letterSpacing: 1 }}>Encryption</div>
              </div>
            </div>
          </div>
          <div style={{ background: "#0a0a0a", border: `1px solid ${LANDING_T.border}`, borderRadius: 24, padding: 40, height: 400, display: "flex", alignItems: "center", justifyContent: "center", position: "relative" }}>
            <div className="hpulse" style={{ width: 120, height: 120, borderRadius: "50%", background: `radial-gradient(circle, ${LANDING_T.blue}33 0%, transparent 70%)`, display: "flex", alignItems: "center", justifyContent: "center", color: LANDING_T.blue }}>
              <svg width="60" height="60" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer style={{ padding: "80px 24px", borderTop: `1px solid ${LANDING_T.border}`, textAlign: "center", background: "#050505" }}>
        <div style={{ marginBottom: 32 }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 10, marginBottom: 16 }}>
            <div style={{ width: 24, height: 24, borderRadius: "50%", background: LANDING_T.blue, display: "flex", alignItems: "center", justifyContent: "center", color: "#000" }}>{Ico.heart}</div>
            <div style={{ fontWeight: 900, letterSpacing: -0.5 }}>MEDIGUARD</div>
          </div>
          <p style={{ color: LANDING_T.textMd, fontSize: 14 }}>© 2026 MediGuard Health Tech. All rights reserved.</p>
        </div>
        <div style={{ display: "flex", justifyContent: "center", gap: 24 }}>
          <span style={{ fontSize: 12, color: "#333", cursor: "pointer" }}>Privacy Policy</span>
          <span style={{ fontSize: 12, color: "#333", cursor: "pointer" }}>Terms of Service</span>
          <span style={{ fontSize: 12, color: "#333", cursor: "pointer" }}>Contact</span>
        </div>
      </footer>
    </div>
  );
}

/* ─── History Screen ────────────────────────────────────────── */
function HistoryScreen({ history, isDesktop }) {
  return (
    <div style={{ padding: isDesktop ? "32px 36px 40px" : "24px 20px 0" }}>
      <SectionLabel>Medical History</SectionLabel>
      <div style={{ fontFamily: "Playfair Display", fontSize: 24, fontWeight: 900, color: T.text, marginBottom: 20 }}>
        Your <span style={{ color: T.red }}>Records</span>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: isDesktop ? "1fr 1fr" : "1fr", gap: 20 }}>
        <div>
          <SectionLabel>Triage Reports</SectionLabel>
          {(!history.reports || history.reports.length === 0) && <div style={{ fontSize: 13, color: T.textXs }}>No reports yet</div>}
          {history.reports?.map((r, i) => (
            <Card key={i} style={{ marginBottom: 12 }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                <div style={{ fontSize: 14, fontWeight: 700, color: T.text }}>{r.triageData.label}</div>
                <div style={{ fontSize: 11, color: T.textXs }}>{new Date(r.createdAt).toLocaleDateString()}</div>
              </div>
              <div style={{ fontSize: 13, color: T.textMd, lineHeight: 1.5 }}>{r.triageData.explanation}</div>
            </Card>
          ))}
        </div>
        <div>
          <SectionLabel>Skin Scans</SectionLabel>
          {(!history.scans || history.scans.length === 0) && <div style={{ fontSize: 13, color: T.textXs }}>No scans yet</div>}
          {history.scans?.map((s, i) => (
            <Card key={i} style={{ marginBottom: 12 }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                <div style={{ fontSize: 14, fontWeight: 700, color: T.text }}>{s.analysis.label}</div>
                <div style={{ fontSize: 11, color: T.textXs }}>{new Date(s.createdAt).toLocaleDateString()}</div>
              </div>
              <div style={{ fontSize: 13, color: T.textMd }}>Confidence: {s.analysis.confidence}</div>
              <div style={{ fontSize: 12, color: T.textXs, marginTop: 4 }}>{s.analysis.action}</div>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ─── App Shell ──────────────────────────────────────────────── */
export default function MedicalTriageApp() {
  const { width } = useWindowSize();
  const isDesktop = width >= 1024;
  const [isAuthenticated, setIsAuthenticated] = useState(!!localStorage.getItem("token"));
  const [user, setUser] = useState(JSON.parse(localStorage.getItem("user")) || null);
  const [history, setHistory] = useState([]);

  useEffect(() => {
    const token = localStorage.getItem("token");
    const storedUser = localStorage.getItem("user");
    if (token && storedUser) {
      setIsAuthenticated(true);
      setUser(JSON.parse(storedUser));
      fetchHistory(token);
    }
  }, []);

  const fetchHistory = async (token) => {
    try {
      const [scanRes, reportRes] = await Promise.all([
        fetch("http://localhost:5000/api/scans", { headers: { "Authorization": `Bearer ${token}` } }),
        fetch("http://localhost:5000/api/triage", { headers: { "Authorization": `Bearer ${token}` } })
      ]);
      const scanData = await scanRes.json();
      const reportData = await reportRes.json();
      setHistory({ scans: scanData.data || [], reports: reportData.data || [] });
    } catch (e) { console.error("History Load Error:", e); }
  };

  const handleBackendLogin = async (credential) => {
    try {
      const response = await fetch("http://localhost:5000/api/auth/google", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ credential }),
      });
      const data = await response.json();
      if (data.success) {
        localStorage.setItem("token", data.token);
        localStorage.setItem("user", JSON.stringify(data.user));
        setUser(data.user);
        setIsAuthenticated(true);
        fetchHistory(data.token);
      }
    } catch (error) { console.error(error); }
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    setIsAuthenticated(false);
    setUser(null);
    setScreen(SCREENS.HOME);
  };

  const [screen, setScreen] = useState(SCREENS.HOME);
  const [messages, setMessages] = useState([
    { role: "assistant", content: "Hello! I'm MediGuard. Tell me what's bothering you today, and I'll help you determine the right level of care. Describe your symptoms in your own words." }
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [triageResult, setTriageResult] = useState(null);
  const [redFlag, setRedFlag] = useState(null);
  const [patient, setPatient] = useState({ age: "", sex: "", conditions: "", medications: "" });
  const [profileDone, setProfileDone] = useState(false);
  const [profileStep, setProfileStep] = useState(0);
  const [vitals, setVitals] = useState({ hr: null, rr: null, measuring: false, progress: 0, done: false });
  const [camera, setCamera] = useState({ active: false, captured: false, analyzing: false, result: null });
  const [sound, setSound] = useState({ recording: false, progress: 0, done: false, result: null });
  const [reportShared, setReportShared] = useState(false);
  const [reminders, setReminders] = useState(REMINDER_MESSAGES.map((r, i) => ({ ...r, active: i === 0, completed: false, response: null })));
  const [activeReminder, setActiveReminder] = useState(null);
  const [reminderNote, setReminderNote] = useState("");
  const chatEndRef = useRef(null);
  const vRef = useRef(null);
  const sRef = useRef(null);
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);

  const handleStartAudio = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaRecorderRef.current = new MediaRecorder(stream);
      audioChunksRef.current = [];

      mediaRecorderRef.current.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorderRef.current.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        const formData = new FormData();
        formData.append('audio', audioBlob, 'cough.webm');
        formData.append('heartRate', vitals.hr || 0);
        formData.append('respiratoryRate', vitals.rr || 0);

        setSound(s => ({ ...s, recording: false, analyzing: true }));

        try {
          const res = await fetch("http://localhost:5000/api/vitals", {
            method: "POST",
            headers: {
              "Authorization": `Bearer ${localStorage.getItem('token')}`
            },
            body: formData
          });

          const data = await res.json();
          if (data.success) {
            setSound({ recording: false, progress: 100, done: true, result: { type: "Audio Saved", detail: "Cough recording uploaded for analysis.", color: T.red } });
          }
        } catch (err) {
          console.error("Audio Upload Error:", err);
        }
      };

      mediaRecorderRef.current.start();
      setSound({ recording: true, progress: 0, done: false, result: null });
      
      let p = 0;
      const interval = setInterval(() => {
        p += 5;
        setSound(s => ({ ...s, progress: p }));
        if (p >= 100) {
          clearInterval(interval);
          handleStopAudio();
        }
      }, 250);
      sRef.current = interval;

    } catch (err) {
      console.error("Microphone Access Error:", err);
      alert("Could not access microphone.");
    }
  };

  const handleStopAudio = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
      mediaRecorderRef.current.stream.getTracks().forEach(track => track.stop());
      clearInterval(sRef.current);
    }
  };

  useEffect(() => { chatEndRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages]);

  const handleCapturePhoto = async () => {
    const video = document.getElementById('camera-feed');
    if (!video) return;

    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext('2d');
    ctx.drawImage(video, 0, 0);

    const stream = video.srcObject;
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
    }

    setCamera(c => ({ ...c, captured: true, analyzing: true }));

    canvas.toBlob(async (blob) => {
      const formData = new FormData();
      formData.append('scan', blob, 'scan.jpg');

      try {
        const res = await fetch("http://localhost:5000/api/scans/upload", {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${localStorage.getItem('token')}`
          },
          body: formData
        });

        const data = await res.json();
        if (data.success) {
          setCamera(c => ({ ...c, analyzing: false, result: data.data.analysis }));
        } else {
          alert("Analysis failed: " + data.message);
          setCamera(c => ({ ...c, captured: false, active: false, analyzing: false }));
        }
      } catch (err) {
        console.error("Upload Error:", err);
        alert("Server error during analysis.");
        setCamera(c => ({ ...c, captured: false, active: false, analyzing: false }));
      }
    }, 'image/jpeg');
  };

  const sendMessage = async () => {
    if (!input.trim() || loading) return;
    const text = input.trim();
    setInput("");
    const flag = checkRedFlags(text);
    if (flag) { setRedFlag(flag); return; }
    const msgs = [...messages, { role: "user", content: text }];
    setMessages(msgs);
    setLoading(true);
    const sys = `You are MediGuard, a compassionate AI triage assistant.
Patient: Age ${patient.age || "unknown"}, Sex ${patient.sex || "unknown"}, Conditions: ${patient.conditions || "none"}, Medications: ${patient.medications || "none"}.
Ask about onset, severity 1-10, duration, associated factors. After 3-4 exchanges output triage JSON wrapped in <TRIAGE>:
<TRIAGE>{"tier":1|2|3,"label":"GO TO ER NOW"|"SEE DOCTOR (24-48 hrs)"|"MANAGE AT HOME","confidence":"high"|"moderate"|"low","topSymptoms":["s1","s2","s3"],"explanation":"plain language reason","caveats":"what system cannot assess"}</TRIAGE>
Until ready, ask one focused follow-up question. Be warm, concise, never diagnose.`;
    try {
      const res = await fetch("http://localhost:5000/api/triage/chat", {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          "Authorization": `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ messages: msgs, patientProfile: patient })
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || "Server Error");
      }
      const txt = data.content || "I'm having trouble thinking right now. Please try again.";
      const match = txt.match(/<TRIAGE>(.*?)<\/TRIAGE>/s);
      if (match) {
        try {
          const parsed = JSON.parse(match[1]);
          setTriageResult(parsed);
          
          await fetch("http://localhost:5000/api/triage/process", {
            method: "POST",
            headers: { 
              "Content-Type": "application/json",
              "Authorization": `Bearer ${localStorage.getItem('token')}`
            },
            body: JSON.stringify({ messages: [...msgs, { role: "assistant", content: txt }], patientProfile: patient })
          });

          const clean = txt.replace(/<TRIAGE>.*?<\/TRIAGE>/s, "").trim();
          setMessages([...msgs, { role: "assistant", content: clean || "Here is your triage assessment." }]);
          setTimeout(() => setScreen(SCREENS.RESULT), 1200);
        } catch (err) { 
          console.error("Triage Parse Error:", err);
          setMessages([...msgs, { role: "assistant", content: txt }]); 
        }
      } else { 
        setMessages([...msgs, { role: "assistant", content: txt }]); 
      }
    } catch (err) { 
      console.error("Chat API Error:", err);
      setMessages([...msgs, { role: "assistant", content: `Error: ${err.message || "Could not connect to server"}` }]); 
    }
    setLoading(false);
  };

  const startVitals = () => {
    setVitals({ hr: null, rr: null, measuring: true, progress: 0, done: false });
    let p = 0;
    vRef.current = setInterval(() => {
      p += 2; setVitals(v => ({ ...v, progress: p }));
      if (p >= 100) { clearInterval(vRef.current); setVitals({ hr: 66 + Math.floor(Math.random() * 28), rr: 13 + Math.floor(Math.random() * 7), measuring: false, progress: 100, done: true }); }
    }, 60);
  };

  const startSound = () => {
    setSound({ recording: true, progress: 0, done: false, result: null });
    let p = 0;
    const opts = [
      { type: "Dry Cough", severity: "Mild", detail: "Non-productive cough detected. Likely upper respiratory irritation.", color: "#d97706" },
      { type: "Wet Cough", severity: "Moderate", detail: "Productive cough pattern. Consider seeing a doctor if it persists.", color: "#ea580c" },
      { type: "Wheezing", severity: "Concerning", detail: "Airway narrowing detected. Medical evaluation is recommended.", color: "#dc2626" },
    ];
    sRef.current = setInterval(() => {
      p += 10; setSound(s => ({ ...s, progress: p }));
      if (p >= 100) { clearInterval(sRef.current); setSound({ recording: false, progress: 100, done: true, result: opts[Math.floor(Math.random() * opts.length)] }); }
    }, 100);
  };

  const tierMeta = {
    1: { color: "#dc2626", bg: "#fff1f2", border: "#fecdd3" },
    2: { color: "#d97706", bg: "#fffbeb", border: "#fde68a" },
    3: { color: "#16a34a", bg: "#f0fdf4", border: "#bbf7d0" },
  };

  const navItems = [
    { id: SCREENS.HOME, icon: Ico.home, label: "Home" },
    { id: SCREENS.CHAT, icon: Ico.chat, label: "Symptom Triage" },
    { id: SCREENS.VITALS, icon: Ico.pulse, label: "Vital Signs" },
    { id: SCREENS.CAMERA, icon: Ico.cam, label: "Skin Scanner" },
    { id: SCREENS.HISTORY, icon: Ico.file, label: "History" },
    { id: SCREENS.REMINDERS, icon: Ico.bell, label: "Follow-Up" },
  ];

  const screenProps = {
    screen, setScreen, patient, setPatient, profileDone, setProfileDone,
    profileStep, setProfileStep, triageResult, vitals, tierMeta,
    messages, input, setInput, loading, sendMessage, chatEndRef,
    camera, setCamera, sound, setSound, startVitals,
    reminders, setReminders, activeReminder, setActiveReminder,
    reminderNote, setReminderNote, reported: reportShared, setReported: setReportShared,
    history,
    isDesktop,
    capturePhoto: handleCapturePhoto,
    cameraActive: camera.active,
    startAudio: handleStartAudio,
    stopAudio: handleStopAudio
  };

  const renderScreen = () => {
    if (screen === SCREENS.HOME) return <HomeScreen {...screenProps} user={user} />;
    if (screen === SCREENS.CHAT) return <ChatScreen {...screenProps} />;
    if (screen === SCREENS.CAMERA) return <CameraScreen {...screenProps} />;
    if (screen === SCREENS.VITALS) return <VitalsScreen {...screenProps} />;
    if (screen === SCREENS.REPORT) return <ReportScreen {...screenProps} />;
    if (screen === SCREENS.REMINDERS) return <RemindersScreen {...screenProps} />;
    if (screen === SCREENS.RESULT && triageResult) return <ResultScreen {...screenProps} />;
    if (screen === SCREENS.HISTORY) return <HistoryScreen {...screenProps} />;
    return null;
  };

  if (!isAuthenticated) {
    return <LoginScreen onLogin={handleBackendLogin} />;
  }

  /* ── DESKTOP LAYOUT ── */
  if (isDesktop) {
    return (
      <div style={{ display: "flex", width: "100%", height: "100vh", background: "transparent", overflow: "hidden", fontFamily: "'DM Sans', sans-serif" }}>
        <div style={{ position: "fixed", inset: 0, zIndex: 0 }}>
          <FloatingLines linesGradient={["#67e8f9", "#22d3ee", "#0ea5e9", "#0284c7", "#38bdf8"]} />
        </div>
        <EmergencyModal redFlag={redFlag} onDismiss={() => setRedFlag(null)} />
        <div style={{ zIndex: 1, position: "relative" }}>
          <DesktopSidebar screen={screen} setScreen={setScreen} navItems={navItems} handleLogout={handleLogout} />
        </div>
        <div style={{ flex: 1, overflowY: "auto", height: "100vh", background: "rgba(10,15,30,0.55)", backdropFilter: "blur(6px)", paddingBottom: 40, zIndex: 1, position: "relative" }}>
          {renderScreen()}
        </div>
      </div>
    );
  }

  /* ── MOBILE LAYOUT ── */
  return (
    <div style={{ width: "100%", minHeight: "100svh", display: "flex", justifyContent: "center", alignItems: "flex-start", background: "transparent", fontFamily: "'DM Sans', sans-serif" }}>
      <div style={{ position: "fixed", inset: 0, zIndex: 0 }}>
        <FloatingLines linesGradient={["#67e8f9", "#22d3ee", "#0ea5e9", "#0284c7", "#38bdf8"]} />
      </div>
      <EmergencyModal redFlag={redFlag} onDismiss={() => setRedFlag(null)} />
      <div style={{ width: "100%", maxWidth: 480, minHeight: "100svh", background: "rgba(10,15,30,0.55)", backdropFilter: "blur(6px)", display: "flex", flexDirection: "column", position: "relative", overflow: "hidden", zIndex: 1 }}>
        {/* Mobile Header */}
        <div style={{ padding: "16px 20px 13px", background: T.white, borderBottom: `1px solid ${T.border}`, flexShrink: 0 }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <div className="hpulse" style={{ width: 34, height: 34, borderRadius: "50%", background: `linear-gradient(135deg,${T.red},${T.redDk})`, display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", flexShrink: 0, boxShadow: `0 4px 12px ${T.red}40` }}>
                {Ico.heart}
              </div>
              <div>
                <div style={{ fontFamily: "Playfair Display", fontSize: 18, fontWeight: 900, background: `linear-gradient(135deg,${T.red},${T.pink})`, WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", lineHeight: 1.1 }}>MediGuard</div>
                <div style={{ fontSize: 9, color: T.textXs, letterSpacing: 1.2, textTransform: "uppercase", fontWeight: 600 }}>AI Triage</div>
              </div>
            </div>
            <button onClick={handleLogout} style={{ background: "rgba(255,255,255,0.05)", border: `1px solid ${T.border}`, borderRadius: 8, padding: "6px 10px", color: T.textXs, fontSize: 11, fontWeight: 600 }}>Logout</button>
          </div>
        </div>
        {/* Mobile Content */}
        <div style={{ flex: 1, overflowY: "auto", paddingBottom: 68 }}>
          {renderScreen()}
        </div>
        {/* Mobile Bottom Nav */}
        <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, background: T.white, borderTop: `1px solid ${T.border}`, padding: "6px 0 max(6px, env(safe-area-inset-bottom))", zIndex: 50 }}>
          <div style={{ display: "flex", justifyContent: "space-around" }}>
            {navItems.map(item => {
              const active = screen === item.id;
              return (
                <button key={item.id} onClick={() => setScreen(item.id)}
                  style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 2, padding: "4px 6px", flex: 1, background: "none", border: "none", cursor: "pointer", color: active ? T.red : T.textXs, transition: "color .15s" }}>
                  <div style={{ width: 30, height: 30, borderRadius: 9, display: "flex", alignItems: "center", justifyContent: "center", background: active ? `${T.red}12` : "transparent", transition: "background .2s" }}>{item.icon}</div>
                  <span style={{ fontSize: 9, fontWeight: active ? 700 : 500, letterSpacing: .3 }}>{item.label.split(" ")[0]}</span>
                  {active && <div style={{ width: 16, height: 2, borderRadius: 2, background: T.red }}></div>}
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

/* ─── Home Screen ────────────────────────────────────────────── */
function HomeScreen({ setScreen, patient, setPatient, profileDone, setProfileDone, profileStep, setProfileStep, triageResult, vitals, tierMeta, isDesktop, user }) {
  const steps = [
    { key: "age", label: "How old are you?", placeholder: "e.g. 45", type: "number" },
    { key: "sex", label: "Biological sex?", placeholder: "Male / Female / Other", type: "text" },
    { key: "conditions", label: "Any chronic conditions?", placeholder: "Diabetes, or None", type: "text" },
    { key: "medications", label: "Current medications?", placeholder: "Metformin, or None", type: "text" },
  ];
  const features = [
    { icon: Ico.cam, title: "Skin & Wound Scan", desc: "AI-guided photo analysis", screen: SCREENS.CAMERA },
    { icon: Ico.pulse, title: "Vital Signs Check", desc: "Camera-based HR & breathing", screen: SCREENS.VITALS },
    { icon: Ico.file, title: "Doctor Report", desc: "One-tap shareable summary", screen: SCREENS.REPORT },
    { icon: Ico.bell, title: "Follow-Up Reminders", desc: "6h / 24h / 48h check-ins", screen: SCREENS.REMINDERS },
  ];

  return (
    <div style={{ padding: isDesktop ? "32px 36px 40px" : "24px 20px 0" }}>

      {/* Hero + Profile row */}
      <div style={{ display: "grid", gridTemplateColumns: isDesktop ? "1fr 1fr" : "1fr", gap: 20, marginBottom: 24, alignItems: "start" }}>
        {/* Hero Banner */}
        <div className="fadeUp" style={{ background: "linear-gradient(135deg, rgba(56,189,248,0.3), rgba(14,165,233,0.4), rgba(34,211,238,0.2))", borderRadius: 20, padding: "28px 28px 32px", position: "relative", overflow: "hidden", border: "1px solid rgba(255,255,255,0.15)", backdropFilter: "blur(20px)", boxShadow: "0 8px 32px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.1)" }}>
          <div style={{ position: "absolute", top: -50, right: -50, width: 160, height: 160, borderRadius: "50%", background: "rgba(255,255,255,.06)", pointerEvents: "none" }}></div>
          <div style={{ position: "absolute", bottom: -30, right: 30, width: 90, height: 90, borderRadius: "50%", background: "rgba(255,255,255,.04)", pointerEvents: "none" }}></div>
          <Pill color="#67e8f9" style={{ background: "rgba(103,232,249,.15)", color: "#67e8f9", marginBottom: 14, border: "1px solid rgba(103,232,249,0.2)" }}>Smart Medical Triage</Pill>
          <div style={{ fontFamily: "Playfair Display", fontSize: 28, fontWeight: 900, color: "#fff", lineHeight: 1.2, marginBottom: 12 }}>
            Welcome, {user?.name?.split(" ")[0] || "User"}
          </div>
          <div style={{ fontSize: 14, color: "rgba(255,255,255,.75)", lineHeight: 1.7, marginBottom: 24 }}>
            Describe your symptoms and receive instant AI-powered triage guidance — from home care to emergency alerts.
          </div>
          <PrimaryBtn onClick={() => setScreen(SCREENS.CHAT)} style={{ background: "rgba(255,255,255,.15)", color: "#fff", border: "1px solid rgba(255,255,255,0.25)", boxShadow: "0 4px 16px rgba(0,0,0,.2), inset 0 1px 0 rgba(255,255,255,0.15)" }}>
            Start Symptom Chat {Ico.right}
          </PrimaryBtn>
        </div>

        {/* Profile Setup */}
        <div>
          {!profileDone ? (
            <Card className="fadeUp" style={{ animationDelay: ".06s" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                <SectionLabel>Patient Profile</SectionLabel>
                <span style={{ fontSize: 11, color: T.textXs, fontWeight: 600 }}>Step {profileStep + 1}/{steps.length}</span>
              </div>
              <div style={{ height: 3, background: T.border, borderRadius: 2, marginBottom: 16, overflow: "hidden" }}>
                <div style={{ height: 3, background: `linear-gradient(90deg,${T.red},${T.pink})`, borderRadius: 2, width: `${((profileStep + 1) / steps.length) * 100}%`, transition: "width .4s ease" }}></div>
              </div>
              <div style={{ fontSize: 14, fontWeight: 600, color: T.text, marginBottom: 10 }}>{steps[profileStep].label}</div>
              <div style={{ display: "flex", gap: 8 }}>
                <input type={steps[profileStep].type} placeholder={steps[profileStep].placeholder}
                  value={patient[steps[profileStep].key]}
                  onChange={e => setPatient(p => ({ ...p, [steps[profileStep].key]: e.target.value }))}
                  onKeyDown={e => { if (e.key === "Enter") { if (profileStep < steps.length - 1) setProfileStep(s => s + 1); else setProfileDone(true); } }}
                  style={{ flex: 1, background: T.bg, border: `1.5px solid ${T.border}`, borderRadius: 10, padding: "10px 13px", fontSize: 14, color: T.text, outline: "none", transition: "border-color .2s" }}
                  onFocus={e => e.target.style.borderColor = T.red}
                  onBlur={e => e.target.style.borderColor = T.border}
                />
                <PrimaryBtn style={{ padding: "10px 14px", flexShrink: 0, fontSize: 13 }}
                  onClick={() => { if (profileStep < steps.length - 1) setProfileStep(s => s + 1); else setProfileDone(true); }}>
                  {profileStep < steps.length - 1 ? "Next" : "Done"} {Ico.right}
                </PrimaryBtn>
              </div>
            </Card>
          ) : (
            <div className="fadeUp" style={{ display: "flex", alignItems: "center", gap: 10, background: "#f0fdf4", border: "1px solid #bbf7d0", borderRadius: 12, padding: "14px 16px", marginBottom: 14 }}>
              <div style={{ width: 28, height: 28, borderRadius: "50%", background: "#dcfce7", display: "flex", alignItems: "center", justifyContent: "center", color: "#16a34a", flexShrink: 0 }}>{Ico.check}</div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 13, fontWeight: 600, color: "#15803d" }}>Profile Complete</div>
                <div style={{ fontSize: 11, color: "#4ade8099" }}>Age {patient.age} · {patient.sex} · Personalised triage enabled</div>
              </div>
              <button onClick={() => setProfileDone(false)} style={{ fontSize: 11, color: T.textXs, background: "none", border: "none", cursor: "pointer" }}>Edit</button>
            </div>
          )}

          {/* Active Status */}
          {(triageResult || vitals.done) && (
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginTop: 14 }}>
              {triageResult && (
                <button onClick={() => setScreen(SCREENS.RESULT)} style={{ background: tierMeta[triageResult.tier].bg, border: `1px solid ${tierMeta[triageResult.tier].border}`, borderRadius: 12, padding: "13px 14px", cursor: "pointer", textAlign: "left", transition: "all .15s" }}
                  onMouseOver={e => e.currentTarget.style.transform = "translateY(-1px)"}
                  onMouseOut={e => e.currentTarget.style.transform = "translateY(0)"}>
                  <div style={{ fontSize: 9, fontWeight: 700, letterSpacing: 1.2, textTransform: "uppercase", color: tierMeta[triageResult.tier].color, marginBottom: 3 }}>Last Triage</div>
                  <div style={{ fontSize: 12, fontWeight: 700, color: tierMeta[triageResult.tier].color, lineHeight: 1.3 }}>{triageResult.label}</div>
                </button>
              )}
              {vitals.done && (
                <button onClick={() => setScreen(SCREENS.VITALS)} style={{ background: T.pinkLt, border: `1px solid ${T.borderDk}`, borderRadius: 12, padding: "13px 14px", cursor: "pointer", textAlign: "left", transition: "all .15s" }}
                  onMouseOver={e => e.currentTarget.style.transform = "translateY(-1px)"}
                  onMouseOut={e => e.currentTarget.style.transform = "translateY(0)"}>
                  <div style={{ fontSize: 9, fontWeight: 700, letterSpacing: 1.2, textTransform: "uppercase", color: T.red, marginBottom: 3 }}>Vitals</div>
                  <div style={{ fontSize: 12, fontWeight: 700, color: T.textMd }}>{vitals.hr} bpm · {vitals.rr} br/min</div>
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Feature Grid */}
      <SectionLabel>Core Features</SectionLabel>
      <div className="fadeUp" style={{ display: "grid", gridTemplateColumns: isDesktop ? "repeat(4,1fr)" : "repeat(2,1fr)", gap: 12, marginBottom: 20, animationDelay: ".1s" }}>
        {features.map((f, i) => (
          <button key={i} onClick={() => setScreen(f.screen)}
            style={{ background: "rgba(10,15,30,0.5)", border: `1px solid rgba(255,255,255,0.15)`, borderRadius: 16, padding: "18px 15px", textAlign: "left", cursor: "pointer", transition: "all .2s", backdropFilter: "blur(16px)", boxShadow: "0 4px 16px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.08)" }}
            onMouseOver={e => { e.currentTarget.style.borderColor = "rgba(56,189,248,0.5)"; e.currentTarget.style.background = "rgba(10,15,30,0.6)"; e.currentTarget.style.transform = "translateY(-2px)"; e.currentTarget.style.boxShadow = "0 8px 24px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.12)" }}
            onMouseOut={e => { e.currentTarget.style.borderColor = "rgba(255,255,255,0.15)"; e.currentTarget.style.background = "rgba(10,15,30,0.5)"; e.currentTarget.style.transform = "translateY(0)"; e.currentTarget.style.boxShadow = "0 4px 16px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.08)" }}>
            <div style={{ width: 36, height: 36, borderRadius: 10, background: `linear-gradient(135deg, rgba(56,189,248,0.5), rgba(34,211,238,0.4))`, display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", marginBottom: 12, border: "1px solid rgba(255,255,255,0.15)" }}>
              {f.icon}
            </div>
            <div style={{ fontSize: 13, fontWeight: 700, color: "#ffffff", marginBottom: 3 }}>{f.title}</div>
            <div style={{ fontSize: 11, color: "#94a3b8", lineHeight: 1.4 }}>{f.desc}</div>
          </button>
        ))}
      </div>

      {/* Emergency Bar */}
      <div style={{ background: "rgba(220,38,38,0.1)", border: "1px solid rgba(220,38,38,0.2)", borderRadius: 16, padding: "14px 18px", display: "flex", alignItems: "center", gap: 14, marginBottom: 4, backdropFilter: "blur(12px)" }}>
        <div style={{ width: 36, height: 36, borderRadius: 10, background: "rgba(220,38,38,0.15)", display: "flex", alignItems: "center", justifyContent: "center", color: "#f87171", flexShrink: 0 }}>{Ico.alert}</div>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: "#f87171" }}>Life-Threatening Emergency?</div>
          <div style={{ fontSize: 11, color: "rgba(248,113,113,0.7)" }}>Do not wait — call emergency services immediately</div>
        </div>
        <a href="tel:911" style={{ background: "linear-gradient(135deg, rgba(220,38,38,0.6), rgba(185,28,28,0.7))", color: "#fff", fontWeight: 700, fontSize: 13, padding: "10px 18px", borderRadius: 12, textDecoration: "none", flexShrink: 0, border: "1px solid rgba(255,255,255,0.1)", boxShadow: "0 3px 12px rgba(220,38,38,0.3)" }}>
          Call 108
        </a>
      </div>
    </div>
  );
}

/* ─── Chat Screen ────────────────────────────────────────────── */
function ChatScreen({ messages, input, setInput, loading, sendMessage, chatEndRef, triageResult, setScreen, isDesktop }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", height: isDesktop ? "100vh" : "calc(100svh - 128px)" }}>
      <div style={{ flex: 1, overflowY: "auto", padding: "20px 20px 8px" }}>
        <div style={{ maxWidth: isDesktop ? 800 : "100%", margin: "0 auto" }}>
          {messages.map((msg, i) => (
            <div key={i} className="fadeUp" style={{ display: "flex", justifyContent: msg.role === "user" ? "flex-end" : "flex-start", marginBottom: 12, animationDelay: `${Math.min(i * .02, .3)}s` }}>
              {msg.role === "assistant" && (
                <div style={{ width: 28, height: 28, borderRadius: "50%", background: `linear-gradient(135deg,${T.red},${T.rose})`, display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", marginRight: 8, flexShrink: 0, marginTop: 2 }}>{Ico.heart}</div>
              )}
              <div style={{ maxWidth: "72%", background: msg.role === "user" ? `linear-gradient(135deg,${T.red},${T.redDk})` : T.bg, border: msg.role === "user" ? "none" : `1px solid ${T.border}`, borderRadius: msg.role === "user" ? "17px 17px 4px 17px" : "17px 17px 17px 4px", padding: "11px 15px", fontSize: 14, lineHeight: 1.65, color: msg.role === "user" ? "#fff" : T.text, boxShadow: msg.role === "user" ? `0 3px 10px ${T.red}30` : "0 1px 4px rgba(0,0,0,.04)" }}>
                {msg.content}
              </div>
            </div>
          ))}
          {loading && (
            <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "4px 0" }}>
              <div style={{ width: 28, height: 28, borderRadius: "50%", background: `linear-gradient(135deg,${T.red},${T.rose})`, display: "flex", alignItems: "center", justifyContent: "center", color: "#fff" }}>{Ico.heart}</div>
              <div style={{ background: T.bg, border: `1px solid ${T.border}`, borderRadius: "17px 17px 17px 4px", padding: "12px 14px", display: "flex", gap: 4, alignItems: "center" }}>
                {[0, 1, 2].map(j => <div key={j} className="waveBar" style={{ height: 13, animationName: "wave", animationDuration: "1s", animationDelay: `${j * .15}s`, animationIterationCount: "infinite" }}></div>)}
              </div>
            </div>
          )}
          {triageResult && (
            <div style={{ marginTop: 10 }}>
              <PrimaryBtn onClick={() => setScreen(SCREENS.RESULT)} style={{ width: "100%" }}>View Triage Result {Ico.right}</PrimaryBtn>
            </div>
          )}
          <div ref={chatEndRef}></div>
        </div>
      </div>
      <div style={{ padding: "10px 20px 14px", background: T.white, borderTop: `1px solid ${T.border}`, flexShrink: 0 }}>
        <div style={{ maxWidth: isDesktop ? 800 : "100%", margin: "0 auto" }}>
          <div style={{ display: "flex", gap: 8 }}>
            <input value={input} onChange={e => setInput(e.target.value)} onKeyDown={e => e.key === "Enter" && sendMessage()}
              placeholder="Describe your symptoms…"
              style={{ flex: 1, background: T.bg, border: `1.5px solid ${T.border}`, borderRadius: 11, padding: "10px 14px", fontSize: 14, color: T.text, outline: "none", transition: "border-color .2s" }}
              onFocus={e => e.target.style.borderColor = T.red}
              onBlur={e => e.target.style.borderColor = T.border}
            />
            <PrimaryBtn onClick={sendMessage} disabled={loading || !input.trim()} style={{ padding: "10px 14px", flexShrink: 0, opacity: loading || !input.trim() ? 0.55 : 1 }}>{Ico.send}</PrimaryBtn>
          </div>
          <div style={{ fontSize: 11, color: T.textXs, textAlign: "center", marginTop: 8 }}>Not a substitute for professional medical advice</div>
        </div>
      </div>
    </div>
  );
}

/* ─── Camera Screen ──────────────────────────────────────────── */
function CameraScreen({ camera, setCamera, isDesktop, capturePhoto, cameraActive }) {
  const [tip, setTip] = useState(0);
  const TIPS = ["Hold 6–8 inches from the affected area", "Ensure even natural or indoor lighting", "Keep the camera steady — avoid motion blur", "Centre the affected area within the frame"];
  
  useEffect(() => {
    if (cameraActive && !camera.captured) {
      const startCamera = async () => {
        try {
          const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" } });
          const video = document.getElementById('camera-feed');
          if (video) video.srcObject = stream;
        } catch (err) {
          console.error("Camera Access Error:", err);
        }
      };
      startCamera();
    }
  }, [cameraActive, camera.captured]);

  useEffect(() => { const t = setInterval(() => setTip(p => (p + 1) % TIPS.length), 2800); return () => clearInterval(t); }, []);

  return (
    <div style={{ padding: isDesktop ? "32px 36px 40px" : "24px 20px 0" }}>
      <SectionLabel>Skin & Wound Scanner</SectionLabel>
      <div style={{ fontFamily: "Playfair Display", fontSize: 24, fontWeight: 900, color: T.text, marginBottom: 4 }}>
        AI Photo <span style={{ color: T.red }}>Analysis</span>
      </div>
      <div style={{ fontSize: 13, color: T.textXs, marginBottom: 22 }}>Guided camera for dermatological assessment</div>

      {!camera.active && !camera.result && (
        <div className="fadeUp" style={{ display: "grid", gridTemplateColumns: isDesktop ? "1fr 1fr" : "1fr", gap: 20, alignItems: "start" }}>
          <div style={{ background: T.bg, border: `2px dashed ${T.borderDk}`, borderRadius: 18, padding: 40, textAlign: "center" }}>
            <div style={{ width: 54, height: 54, borderRadius: 14, background: `linear-gradient(135deg,${T.red},${T.rose})`, display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", margin: "0 auto 16px" }}>{Ico.cam}</div>
            <div style={{ fontSize: 16, fontWeight: 700, color: T.text, marginBottom: 8 }}>Smart Photo Guide</div>
            <div style={{ fontSize: 13, color: T.textXs, lineHeight: 1.7, marginBottom: 24 }}>
              Real-time guidance ensures you capture the clearest image possible for accurate AI analysis.
            </div>
            <PrimaryBtn onClick={() => setCamera(c => ({ ...c, active: true }))} style={{ margin: "0 auto" }}>
              Open Camera Guide {Ico.right}
            </PrimaryBtn>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
            {["Skin rash", "Open wound", "Swelling", "Mole change"].map((t, i) => (
              <button key={i} onClick={() => setCamera(c => ({ ...c, active: true }))}
                style={{ background: T.bg, border: `1px solid ${T.border}`, borderRadius: 11, padding: "16px 12px", cursor: "pointer", textAlign: "center", transition: "all .15s", fontSize: 13, fontWeight: 600, color: T.text }}
                onMouseOver={e => { e.currentTarget.style.borderColor = T.red; e.currentTarget.style.background = T.pinkLt }}
                onMouseOut={e => { e.currentTarget.style.borderColor = T.border; e.currentTarget.style.background = T.bg }}>
                {t}
              </button>
            ))}
          </div>
        </div>
      )}

      {camera.active && !camera.captured && !camera.result && (
        <div className="fadeUp" style={{ maxWidth: 500 }}>
          <div style={{ position: "relative", background: "#0f0f14", borderRadius: 18, overflow: "hidden", aspectRatio: "4/3", marginBottom: 16 }}>
            {/* Real Video Feed */}
            <video 
              id="camera-feed" 
              autoPlay 
              playsInline 
              style={{ width: "100%", height: "100%", objectFit: "cover" }}
            />
            
            <div style={{ position: "absolute", left: 0, right: 0, height: 1.5, background: `linear-gradient(90deg,transparent,${T.red},transparent)`, animation: "scanLine 2.2s linear infinite", opacity: .85 }}></div>
            <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", pointerEvents: "none" }}>
              <div style={{ width: 155, height: 155, position: "relative" }}>
                {[{ top: -1, left: -1, bt: 2.5, bl: 2.5 }, { top: -1, right: -1, bt: 2.5, br: 2.5 }, { bottom: -1, left: -1, bb: 2.5, bl: 2.5 }, { bottom: -1, right: -1, bb: 2.5, br: 2.5 }].map((p, i) => (
                  <div key={i} style={{
                    position: "absolute", width: 20, height: 20,
                    borderTopWidth: p.bt || 0, borderRightWidth: p.br || 0,
                    borderBottomWidth: p.bb || 0, borderLeftWidth: p.bl || 0,
                    borderStyle: "solid", borderColor: T.red, borderRadius: 3,
                    top: p.top, bottom: p.bottom, left: p.left, right: p.right
                  }}></div>
                ))}
              </div>
            </div>
          </div>
          <div style={{ background: T.pinkLt, border: `1px solid ${T.borderDk}`, borderRadius: 11, padding: "11px 14px", marginBottom: 14, minHeight: 42, display: "flex", alignItems: "center", justifyContent: "center", textAlign: "center" }}>
            <div key={tip} className="fadeIn" style={{ fontSize: 13, color: T.textMd, fontWeight: 500 }}>{TIPS[tip]}</div>
          </div>
          <PrimaryBtn onClick={capturePhoto} style={{ width: "100%" }}>{Ico.cam} Capture Photo</PrimaryBtn>
        </div>
      )}

      {camera.analyzing && (
        <div className="fadeUp" style={{ textAlign: "center", padding: "80px 20px" }}>
          <div style={{ position: "relative", width: 68, height: 68, margin: "0 auto 18px" }}>
            <div style={{ position: "absolute", inset: 0, borderRadius: "50%", border: `3px solid ${T.border}` }}></div>
            <div className="spin" style={{ position: "absolute", inset: 0, borderRadius: "50%", border: `3px solid transparent`, borderTopColor: T.red }}></div>
            <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", color: T.red }}>{Ico.scan}</div>
          </div>
          <div style={{ fontSize: 16, fontWeight: 700, color: T.text, marginBottom: 6 }}>Analysing Image…</div>
          <div style={{ fontSize: 13, color: T.textXs }}>AI model examining the photo</div>
        </div>
      )}

      {camera.result && (
        <div className="fadeUp" style={{ maxWidth: 600 }}>
          <div style={{ background: `${camera.result.color}0d`, border: `1px solid ${camera.result.color}2a`, borderRadius: 16, padding: 22, marginBottom: 14 }}>
            <Pill color={camera.result.color} style={{ marginBottom: 14 }}>Confidence: {camera.result.confidence}</Pill>
            <div style={{ fontSize: 18, fontWeight: 700, fontFamily: "Playfair Display", color: T.text, marginBottom: 14, lineHeight: 1.35 }}>{camera.result.label}</div>
            <div style={{ background: `${camera.result.color}14`, borderRadius: 10, padding: "13px 15px" }}>
              <div style={{ fontSize: 13, color: T.textMd, lineHeight: 1.6 }}>{camera.result.action}</div>
            </div>
          </div>
          <div style={{ background: "#fafafa", border: `1px solid ${T.border}`, borderRadius: 11, padding: 13, marginBottom: 14, fontSize: 12, color: T.textXs, lineHeight: 1.65 }}>
            This result is for guidance only and does not constitute a medical diagnosis. Consult a qualified healthcare provider for any concerns.
          </div>
          <GhostBtn onClick={() => setCamera({ active: false, captured: false, analyzing: false, result: null })} style={{ width: "100%" }}>
            Scan Another Area
          </GhostBtn>
        </div>
      )}
    </div>
  );
}

/* ─── Vitals Screen ──────────────────────────────────────────── */
function VitalsScreen({ vitals, startVitals, sound, setSound, isDesktop, startAudio, stopAudio }) {
  return (
    <div style={{ padding: isDesktop ? "32px 36px 40px" : "24px 20px 0" }}>
      <SectionLabel>Vital Signs Monitor</SectionLabel>
      <div style={{ fontFamily: "Playfair Display", fontSize: 24, fontWeight: 900, color: T.text, marginBottom: 4 }}>
        Camera-Based <span style={{ color: T.red }}>Vitals</span>
      </div>
      <div style={{ fontSize: 13, color: T.textXs, marginBottom: 22 }}>No additional devices required</div>

      <div style={{ display: "grid", gridTemplateColumns: isDesktop ? "1fr 1fr" : "1fr", gap: 20, alignItems: "start" }}>
        {/* HR / RR */}
        <Card>
          <SectionLabel>Heart Rate & Respiratory Rate</SectionLabel>
          {!vitals.measuring && !vitals.done && (
            <div style={{ textAlign: "center", padding: "10px 0" }}>
              <div style={{ position: "relative", width: 80, height: 80, margin: "0 auto 16px" }}>
                <div style={{ position: "absolute", inset: 0, borderRadius: "50%", border: `2px solid ${T.borderDk}` }}></div>
                <div style={{ position: "absolute", inset: 8, borderRadius: "50%", background: `linear-gradient(135deg,${T.red},${T.rose})`, display: "flex", alignItems: "center", justifyContent: "center", color: "#fff" }} className="hpulse">{Ico.heart}</div>
              </div>
              <div style={{ fontSize: 14, fontWeight: 600, color: T.text, marginBottom: 6 }}>Point camera at your fingertip</div>
              <div style={{ fontSize: 12, color: T.textXs, lineHeight: 1.7, marginBottom: 20 }}>
                Cover the lens with your fingertip and hold for 15 seconds. Photoplethysmography detects pulse via light changes.
              </div>
              <PrimaryBtn onClick={startVitals} style={{ margin: "0 auto" }}>{Ico.pulse} Start Measurement</PrimaryBtn>
            </div>
          )}
          {vitals.measuring && (
            <div style={{ textAlign: "center", padding: "10px 0" }}>
              <div style={{ position: "relative", width: 82, height: 82, margin: "0 auto 14px" }}>
                <svg width="82" height="82" style={{ position: "absolute", inset: 0, transform: "rotate(-90deg)" }}>
                  <circle cx="41" cy="41" r="35" fill="none" stroke={T.border} strokeWidth="7" />
                  <circle cx="41" cy="41" r="35" fill="none" stroke={T.red} strokeWidth="7" strokeLinecap="round"
                    strokeDasharray={`${2 * Math.PI * 35}`} strokeDashoffset={`${2 * Math.PI * 35 * (1 - vitals.progress / 100)}`}
                    style={{ transition: "stroke-dashoffset .12s linear" }} />
                </svg>
                <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
                  <div style={{ fontSize: 19, fontWeight: 800, color: T.red }}>{vitals.progress}<span style={{ fontSize: 10 }}>%</span></div>
                </div>
              </div>
              <div style={{ fontSize: 13, fontWeight: 600, color: T.red }}>Measuring…</div>
              <div style={{ fontSize: 12, color: T.textXs, marginTop: 4 }}>Hold still — detecting pulse pattern</div>
            </div>
          )}
          {vitals.done && (
            <div className="fadeUp">
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 14 }}>
                {[
                  { label: "Heart Rate", value: vitals.hr, unit: "bpm", ok: vitals.hr >= 60 && vitals.hr <= 100, low: vitals.hr < 60 },
                  { label: "Resp. Rate", value: vitals.rr, unit: "br/min", ok: vitals.rr >= 12 && vitals.rr <= 20, low: vitals.rr < 12 },
                ].map((s, i) => (
                  <div key={i} style={{ background: T.pinkLt, border: `1px solid ${T.borderDk}`, borderRadius: 13, padding: "15px 10px", textAlign: "center" }}>
                    <div style={{ fontSize: 9, fontWeight: 700, letterSpacing: 1.2, textTransform: "uppercase", color: T.textXs, marginBottom: 3 }}>{s.label}</div>
                    <div style={{ fontSize: 34, fontWeight: 900, fontFamily: "Playfair Display", color: T.red, lineHeight: 1 }}>{s.value}</div>
                    <div style={{ fontSize: 10, color: T.textXs, marginBottom: 7 }}>{s.unit}</div>
                    <Pill color={s.ok ? "#16a34a" : s.low ? "#d97706" : "#dc2626"} style={{ fontSize: 9 }}>
                      {s.ok ? "Normal" : s.low ? "Low" : "Elevated"}
                    </Pill>
                  </div>
                ))}
              </div>
              <div style={{ background: T.bg, borderRadius: 11, padding: "9px 13px", display: "flex", alignItems: "center", justifyContent: "center", gap: 2, height: 44 }}>
                {Array.from({ length: 32 }).map((_, i) => (
                  <div key={i} className="waveBar" style={{ height: `${9 + Math.sin(i * .55) * 7 + 1}px`, animationName: "wave", animationDuration: `${.7 + Math.random() * .4}s`, animationDelay: `${i * .04}s`, animationIterationCount: "infinite" }}></div>
                ))}
              </div>
            </div>
          )}
        </Card>

        {/* Sound Analysis */}
        <Card>
          <SectionLabel>Cough & Breathing Sound Analysis</SectionLabel>
          {!sound.recording && !sound.done && (
            <div style={{ textAlign: "center", padding: "10px 0" }}>
              <div style={{ width: 52, height: 52, borderRadius: 14, background: `linear-gradient(135deg,${T.red},${T.rose})`, display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", margin: "0 auto 14px" }}>{Ico.mic}</div>
              <div style={{ fontSize: 14, fontWeight: 600, color: T.text, marginBottom: 6 }}>10-Second Sound Analysis</div>
              <div style={{ fontSize: 12, color: T.textXs, lineHeight: 1.7, marginBottom: 20 }}>
                Detects dry cough, wet cough, wheezing, or abnormal breathing using your microphone.
              </div>
              <PrimaryBtn onClick={startAudio} style={{ margin: "0 auto" }}>{Ico.mic} Record Cough / Breath</PrimaryBtn>
            </div>
          )}
          {sound.recording && (
            <div style={{ textAlign: "center", padding: "10px 0" }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 2, height: 52, marginBottom: 14 }}>
                {Array.from({ length: 22 }).map((_, i) => (
                  <div key={i} className="waveBar" style={{ background: T.red, height: `${10 + Math.random() * 28}px`, animationName: "wave", animationDuration: `${.3 + Math.random() * .35}s`, animationDelay: `${i * .04}s`, animationIterationCount: "infinite" }}></div>
                ))}
              </div>
              <div style={{ background: T.bg, borderRadius: 7, height: 5, overflow: "hidden", marginBottom: 7 }}>
                <div style={{ background: `linear-gradient(90deg,${T.red},${T.pink})`, height: 5, borderRadius: 7, width: `${sound.progress}%`, transition: "width .1s linear" }}></div>
              </div>
              <div style={{ fontSize: 13, color: T.red, fontWeight: 600 }}>Recording… {sound.progress}%</div>
              <GhostBtn onClick={stopAudio} style={{ marginTop: 10, padding: "8px 16px", fontSize: 12 }}>Stop Recording</GhostBtn>
            </div>
          )}
          {sound.done && sound.result && (
            <div className="fadeUp">
              <div style={{ background: `${sound.result.color}0d`, border: `1px solid ${sound.result.color}28`, borderRadius: 13, padding: 16, marginBottom: 12 }}>
                <div style={{ display: "flex", gap: 12, alignItems: "flex-start" }}>
                  <div style={{ width: 40, height: 40, borderRadius: 10, background: `${sound.result.color}14`, display: "flex", alignItems: "center", justifyContent: "center", color: sound.result.color, flexShrink: 0 }}>{Ico.mic}</div>
                  <div>
                    <div style={{ fontSize: 16, fontWeight: 700, color: sound.result.color, marginBottom: 3 }}>{sound.result.type}</div>
                    <div style={{ fontSize: 11, color: T.textXs, marginBottom: 6 }}>Severity: {sound.result.severity}</div>
                    <div style={{ fontSize: 13, color: T.textMd, lineHeight: 1.6 }}>{sound.result.detail}</div>
                  </div>
                </div>
              </div>
              <GhostBtn onClick={() => setSound({ recording: false, progress: 0, done: false, result: null })} style={{ width: "100%" }}>Record Again</GhostBtn>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}

/* ─── Result Screen ──────────────────────────────────────────── */
function ResultScreen({ triageResult, tierMeta, setScreen, isDesktop }) {
  const meta = tierMeta[triageResult.tier];
  return (
    <div style={{ padding: isDesktop ? "32px 36px 40px" : "24px 20px 0", maxWidth: 800 }} className="fadeUp">
      <SectionLabel>Triage Assessment</SectionLabel>
      <div style={{ fontFamily: "Playfair Display", fontSize: 26, fontWeight: 900, color: T.text, marginBottom: 22 }}>
        Your <span style={{ color: T.red }}>Result</span>
      </div>

      <div style={{ background: meta.bg, border: `1.5px solid ${meta.border}`, borderRadius: 20, padding: 28, marginBottom: 14, textAlign: "center" }}>
        <Pill color={meta.color} style={{ marginBottom: 14 }}>Tier {triageResult.tier} Recommendation</Pill>
        <div style={{ fontFamily: "Playfair Display", fontSize: 24, fontWeight: 900, color: meta.color, marginBottom: 14, lineHeight: 1.2 }}>{triageResult.label}</div>
        <div style={{ fontSize: 15, color: T.textMd, lineHeight: 1.75, maxWidth: 560, margin: "0 auto" }}>{triageResult.explanation}</div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 14 }}>
        <Card style={{ padding: 16 }}>
          <SectionLabel>Confidence</SectionLabel>
          <div style={{ fontSize: 16, fontWeight: 700, color: { high: "#16a34a", moderate: "#d97706", low: "#dc2626" }[triageResult.confidence] || T.textMd }}>
            {triageResult.confidence ? triageResult.confidence.charAt(0).toUpperCase() + triageResult.confidence.slice(1) : "Moderate"}
          </div>
        </Card>
        <Card style={{ padding: 16 }}>
          <SectionLabel>Key Factors</SectionLabel>
          <div style={{ fontSize: 13, color: T.textMd, lineHeight: 1.5 }}>{(triageResult.topSymptoms || []).slice(0, 2).join(", ") || "Symptoms analysed"}</div>
        </Card>
      </div>

      {triageResult.caveats && (
        <Card style={{ marginBottom: 14, padding: 14, background: "#fffbeb", borderColor: "#fde68a" }}>
          <div style={{ display: "flex", gap: 10 }}>
            <div style={{ color: "#d97706", flexShrink: 0, marginTop: 1 }}>{Ico.alert}</div>
            <div style={{ fontSize: 12, color: "#92400e", lineHeight: 1.65 }}>{triageResult.caveats}</div>
          </div>
        </Card>
      )}

      <PrimaryBtn onClick={() => setScreen(SCREENS.REPORT)} style={{ width: "100%", marginBottom: 12 }}>{Ico.file} Generate Doctor Report</PrimaryBtn>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
        <GhostBtn onClick={() => setScreen(SCREENS.CHAT)}>Back to Chat</GhostBtn>
        <GhostBtn onClick={() => setScreen(SCREENS.REMINDERS)}>Set Follow-Up</GhostBtn>
      </div>
    </div>
  );
}

/* ─── Report Screen ──────────────────────────────────────────── */
function ReportScreen({ patient, triageResult, vitals, camera, sound, tierMeta, reported, setReported, isDesktop }) {
  const today = new Date();
  const dateStr = today.toLocaleDateString("en-US", { weekday: "long", year: "numeric", month: "long", day: "numeric" });
  const timeStr = today.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" });
  const tierColor = triageResult ? tierMeta[triageResult.tier].color : T.red;

  return (
    <div style={{ padding: isDesktop ? "32px 36px 40px" : "24px 20px 0" }}>
      <SectionLabel>Doctor Report</SectionLabel>
      <div style={{ fontFamily: "Playfair Display", fontSize: 24, fontWeight: 900, color: T.text, marginBottom: 4 }}>
        One-Tap <span style={{ color: T.red }}>Share</span>
      </div>
      <div style={{ fontSize: 13, color: T.textXs, marginBottom: 22 }}>Complete medical summary ready for your provider</div>

      <div style={{ display: "grid", gridTemplateColumns: isDesktop ? "1fr 1fr" : "1fr", gap: 20, marginBottom: 16, alignItems: "start" }}>
        {/* Left col */}
        <div>
          <Card style={{ marginBottom: 14, padding: 0, overflow: "hidden" }}>
            <div style={{ background: `linear-gradient(135deg,${T.red},${T.rose})`, padding: "18px 20px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                <div>
                  <div style={{ fontFamily: "Playfair Display", fontSize: 17, fontWeight: 700, color: "#fff" }}>MediGuard Report</div>
                  <div style={{ fontSize: 11, color: "rgba(255,255,255,.72)", marginTop: 3 }}>{dateStr}</div>
                  <div style={{ fontSize: 11, color: "rgba(255,255,255,.55)" }}>{timeStr}</div>
                </div>
                <div style={{ width: 36, height: 36, borderRadius: 9, background: "rgba(255,255,255,.18)", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff" }}>{Ico.file}</div>
              </div>
            </div>
            <div style={{ padding: 18 }}>
              <SectionLabel>Patient Information</SectionLabel>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 4 }}>
                {[{ l: "Age", v: patient.age || "Not provided" }, { l: "Sex", v: patient.sex || "Not provided" }, { l: "Conditions", v: patient.conditions || "None reported" }, { l: "Medications", v: patient.medications || "None reported" }].map((r, i) => (
                  <div key={i} style={{ background: T.bg, borderRadius: 8, padding: "9px 11px" }}>
                    <div style={{ fontSize: 9, color: T.textXs, marginBottom: 2, fontWeight: 600, letterSpacing: .8, textTransform: "uppercase" }}>{r.l}</div>
                    <div style={{ fontSize: 12, fontWeight: 600, color: T.text }}>{r.v}</div>
                  </div>
                ))}
              </div>
            </div>
          </Card>

          {vitals.done && (
            <Card style={{ padding: 16 }}>
              <SectionLabel>Measured Vitals</SectionLabel>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
                <div style={{ background: T.pinkLt, border: `1px solid ${T.borderDk}`, borderRadius: 9, padding: "12px 9px", textAlign: "center" }}>
                  <div style={{ fontSize: 24, fontWeight: 900, fontFamily: "Playfair Display", color: T.red }}>{vitals.hr}</div>
                  <div style={{ fontSize: 9, color: T.textXs }}>bpm · Heart Rate</div>
                </div>
                <div style={{ background: T.pinkLt, border: `1px solid ${T.borderDk}`, borderRadius: 9, padding: "12px 9px", textAlign: "center" }}>
                  <div style={{ fontSize: 24, fontWeight: 900, fontFamily: "Playfair Display", color: T.red }}>{vitals.rr}</div>
                  <div style={{ fontSize: 9, color: T.textXs }}>br/min · Resp. Rate</div>
                </div>
              </div>
            </Card>
          )}
        </div>

        {/* Right col */}
        <div>
          {triageResult ? (
            <Card style={{ marginBottom: 14 }}>
              <SectionLabel>Triage Recommendation</SectionLabel>
              <div style={{ background: `${tierColor}0d`, border: `1px solid ${tierColor}22`, borderRadius: 11, padding: 14 }}>
                <div style={{ fontSize: 14, fontWeight: 700, color: tierColor, marginBottom: 6 }}>{triageResult.label}</div>
                <div style={{ fontSize: 13, color: T.textMd, lineHeight: 1.65, marginBottom: 10 }}>{triageResult.explanation}</div>
                <div style={{ display: "flex", gap: 5, flexWrap: "wrap" }}>
                  {(triageResult.topSymptoms || []).map((s, i) => <Pill key={i} color={tierColor} style={{ fontSize: 9 }}>{s}</Pill>)}
                </div>
              </div>
            </Card>
          ) : (
            <Card style={{ marginBottom: 14, padding: 16, textAlign: "center" }}>
              <div style={{ fontSize: 13, color: T.textXs }}>Complete the symptom chat to include triage results</div>
            </Card>
          )}

          {(camera.result || sound.result) && (
            <Card>
              {camera.result && (
                <div style={{ marginBottom: sound.result ? 14 : 0 }}>
                  <SectionLabel>Skin Analysis</SectionLabel>
                  <div style={{ background: T.bg, borderRadius: 9, padding: 11 }}>
                    <div style={{ fontSize: 12, fontWeight: 600, color: T.text, marginBottom: 3 }}>{camera.result.label}</div>
                    <div style={{ fontSize: 11, color: T.textXs }}>Confidence: {camera.result.confidence} — {camera.result.action}</div>
                  </div>
                </div>
              )}
              {sound.result && (
                <div>
                  <SectionLabel>Respiratory Sound</SectionLabel>
                  <div style={{ background: T.bg, borderRadius: 9, padding: 11 }}>
                    <div style={{ fontSize: 12, fontWeight: 600, color: T.text, marginBottom: 3 }}>{sound.result.type} — {sound.result.severity}</div>
                    <div style={{ fontSize: 11, color: T.textXs }}>{sound.result.detail}</div>
                  </div>
                </div>
              )}
            </Card>
          )}
        </div>
      </div>

      <div style={{ background: T.bg, border: `1px solid ${T.border}`, borderRadius: 10, padding: "11px 16px", marginBottom: 16 }}>
        <div style={{ fontSize: 10, color: T.textXs, lineHeight: 1.55 }}>
          Generated by MediGuard AI as a decision-support tool only. Does not constitute a medical diagnosis or replace professional medical advice.
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10, marginBottom: reported ? 10 : 0 }}>
        <GhostBtn onClick={() => setReported(true)} style={{ fontSize: 12 }}>Email to Doctor</GhostBtn>
        <GhostBtn onClick={() => setReported(true)} style={{ fontSize: 12 }}>Send to Family</GhostBtn>
        <PrimaryBtn onClick={() => setReported(true)} style={{ fontSize: 12, padding: "10px" }}>{Ico.share} Copy Link</PrimaryBtn>
      </div>
      {reported && (
        <div className="fadeUp" style={{ background: "#f0fdf4", border: "1px solid #bbf7d0", borderRadius: 11, padding: 11, textAlign: "center", marginTop: 10 }}>
          <div style={{ fontSize: 13, fontWeight: 600, color: "#15803d", display: "flex", alignItems: "center", justifyContent: "center", gap: 6 }}>
            <span style={{ color: "#16a34a" }}>{Ico.check}</span> Report link copied to clipboard
          </div>
        </div>
      )}
    </div>
  );
}

/* ─── Reminders Screen ───────────────────────────────────────── */
function RemindersScreen({ reminders, setReminders, activeReminder, setActiveReminder, reminderNote, setReminderNote, isDesktop }) {
  const SC = { better: "#16a34a", same: "#d97706", worse: "#dc2626", noted: "#6b7280" };

  const respond = (idx, response) => {
    const updated = [...reminders];
    updated[idx].completed = true;
    updated[idx].response = response;
    if (idx + 1 < updated.length) updated[idx + 1].active = true;
    setReminders(updated);
    setActiveReminder(null);
    setReminderNote("");
  };

  return (
    <div style={{ padding: isDesktop ? "32px 36px 40px" : "24px 20px 0" }}>
      <SectionLabel>Automated Check-Ins</SectionLabel>
      <div style={{ fontFamily: "Playfair Display", fontSize: 24, fontWeight: 900, color: T.text, marginBottom: 4 }}>
        Follow-Up <span style={{ color: T.red }}>Tracker</span>
      </div>
      <div style={{ fontSize: 13, color: T.textXs, marginBottom: 22 }}>Your recovery progress over 48 hours</div>

      <Card style={{ marginBottom: 20, padding: "14px 18px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
          <div style={{ fontSize: 13, fontWeight: 600, color: T.textMd }}>Overall Progress</div>
          <div style={{ fontSize: 13, color: T.red, fontWeight: 700 }}>{reminders.filter(r => r.completed).length}/{reminders.length} completed</div>
        </div>
        <div style={{ background: T.border, borderRadius: 3, height: 5, overflow: "hidden" }}>
          <div style={{ background: `linear-gradient(90deg,${T.red},${T.pink})`, height: 5, borderRadius: 3, width: `${(reminders.filter(r => r.completed).length / reminders.length) * 100}%`, transition: "width .5s ease" }}></div>
        </div>
      </Card>

      <div style={{ position: "relative", maxWidth: isDesktop ? 700 : "100%" }}>
        <div style={{ position: "absolute", left: 19, top: 22, bottom: 22, width: 1.5, background: `linear-gradient(180deg,${T.red}80,${T.border})` }}></div>
        {reminders.map((r, idx) => {
          const isDue = r.active && !r.completed;
          return (
            <div key={idx} className="fadeUp" style={{ position: "relative", paddingLeft: 50, marginBottom: 14, animationDelay: `${idx * .07}s` }}>
              <div style={{
                position: "absolute", left: 11, top: 16, width: 18, height: 18, borderRadius: "50%",
                background: r.completed ? "#dcfce7" : isDue ? `${T.red}12` : T.bg,
                border: `2px solid ${r.completed ? "#16a34a" : isDue ? T.red : T.border}`,
                display: "flex", alignItems: "center", justifyContent: "center",
                color: r.completed ? "#16a34a" : T.red, transition: "all .3s"
              }}>
                {r.completed && <span style={{ transform: "scale(.8)" }}>{Ico.check}</span>}
                {isDue && !r.completed && <div style={{ width: 6, height: 6, borderRadius: "50%", background: T.red, animation: "pulseDot 1.4s ease infinite" }}></div>}
              </div>

              <Card style={{ padding: 18, border: isDue ? `1.5px solid ${T.red}28` : r.completed ? `1px solid #dcfce7` : `1px solid ${T.border}`, background: isDue ? T.pinkLt : T.white }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
                  <div style={{ fontSize: 14, fontWeight: 700, color: isDue ? T.red : r.completed ? "#16a34a" : T.textXs }}>{r.label}</div>
                  <Pill color={r.completed ? "#16a34a" : isDue ? T.red : "#94a3b8"} style={{ fontSize: 9 }}>
                    {r.completed ? "Complete" : isDue ? "Due Now" : "Pending"}
                  </Pill>
                </div>
                <div style={{ fontSize: 13, color: T.textXs, lineHeight: 1.55, marginBottom: isDue ? 14 : 0 }}>{r.q}</div>

                {r.completed && r.response && r.response !== "noted" && (
                  <div style={{ marginTop: 8, display: "flex", alignItems: "center", gap: 6 }}>
                    <span style={{ fontSize: 11, color: T.textXs }}>Response:</span>
                    <Pill color={SC[r.response]} style={{ fontSize: 9, textTransform: "capitalize" }}>{r.response}</Pill>
                  </div>
                )}

                {isDue && activeReminder !== idx && (
                  <PrimaryBtn onClick={() => setActiveReminder(idx)} style={{ fontSize: 13, padding: "10px 20px" }}>
                    Answer Check-In {Ico.right}
                  </PrimaryBtn>
                )}

                {activeReminder === idx && (
                  <div className="fadeUp">
                    <div style={{ fontSize: 13, fontWeight: 600, color: T.text, marginBottom: 12 }}>How are you feeling?</div>
                    <div style={{ display: "flex", gap: 10, marginBottom: 14 }}>
                      {["better", "same", "worse"].map(s => (
                        <button key={s} onClick={() => respond(idx, s)}
                          style={{ flex: 1, background: `${SC[s]}0d`, border: `1.5px solid ${SC[s]}28`, color: SC[s], fontWeight: 700, padding: "11px 8px", borderRadius: 10, cursor: "pointer", fontSize: 13, textTransform: "capitalize", transition: "all .15s" }}
                          onMouseOver={e => { e.currentTarget.style.background = `${SC[s]}18` }}
                          onMouseOut={e => { e.currentTarget.style.background = `${SC[s]}0d` }}>
                          {s.charAt(0).toUpperCase() + s.slice(1)}
                        </button>
                      ))}
                    </div>
                    <div style={{ fontSize: 12, color: T.textXs, marginBottom: 6 }}>Or describe in detail:</div>
                    <div style={{ display: "flex", gap: 8 }}>
                      <input value={reminderNote} onChange={e => setReminderNote(e.target.value)}
                        placeholder="Add notes…"
                        style={{ flex: 1, background: T.bg, border: `1.5px solid ${T.border}`, borderRadius: 9, padding: "9px 13px", fontSize: 13, color: T.text, outline: "none", transition: "border-color .2s" }}
                        onFocus={e => e.target.style.borderColor = T.red}
                        onBlur={e => e.target.style.borderColor = T.border}
                      />
                      <GhostBtn onClick={() => respond(idx, "noted")} style={{ flexShrink: 0, fontSize: 12, padding: "9px 14px" }}>Send</GhostBtn>
                    </div>
                  </div>
                )}
              </Card>
            </div>
          );
        })}
      </div>

      {reminders.some(r => r.completed) && (
        <Card className="fadeUp" style={{ marginTop: 4, marginBottom: 4, background: T.pinkLt, maxWidth: isDesktop ? 700 : "100%" }}>
          <SectionLabel>Recovery Trend</SectionLabel>
          <div style={{ display: "flex", gap: 10 }}>
            {reminders.filter(r => r.completed).map((r, i) => (
              <div key={i} style={{ flex: 1, background: T.white, border: `1px solid ${T.border}`, borderRadius: 9, padding: "12px 8px", textAlign: "center" }}>
                <div style={{ fontSize: 12, color: SC[r.response] || T.textXs, fontWeight: 700, marginBottom: 3, textTransform: "capitalize" }}>{r.response || "—"}</div>
                <div style={{ fontSize: 10, color: T.textXs, lineHeight: 1.3 }}>{r.time}</div>
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
}
