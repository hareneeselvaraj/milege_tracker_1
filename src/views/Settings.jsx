import React, { useState, useRef, useEffect } from 'react';
import { ChevronLeft, LogOut, Fuel, Sun, Moon, Monitor } from 'lucide-react';

const Settings = ({ user, data, fileId, theme, setTheme, onLogout, onBack }) => {
  const [scrolled, setScrolled] = useState(false);
  const contentRef = useRef(null);

  useEffect(() => {
    const el = contentRef.current;
    if (!el) return;
    const handler = () => setScrolled(el.scrollTop > 8);
    el.addEventListener('scroll', handler, { passive: true });
    return () => el.removeEventListener('scroll', handler);
  }, []);

  // Build profile safely
  let profileName = 'User';
  let profileEmail = '';
  let profileImg = null;
  try {
    if (user?.getBasicProfile) {
      const profile = user.getBasicProfile();
      profileName = profile.getName() || 'User';
      profileEmail = profile.getEmail() || '';
      profileImg = profile.getImageUrl() || null;
    } else if (user?.name) {
      profileName = user.name;
      profileEmail = user.email || '';
      profileImg = user.picture || null;
    }
  } catch (e) { /* offline user */ }

  return (
    <div className="view-container">
      {/* FIXED HEADER */}
      <div className={`view-header ${scrolled ? 'scrolled' : ''}`}>
        <div className="flex items-center gap-3">
          <button onClick={onBack} style={{
            width: 40, height: 40, borderRadius: 'var(--radius-full)',
            background: 'var(--bg-card)', border: '1px solid var(--border)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: 'var(--text-secondary)', cursor: 'pointer',
          }}>
            <ChevronLeft size={20} />
          </button>
          <h1 className="view-title">Settings</h1>
        </div>
      </div>

      {/* SCROLLABLE CONTENT */}
      <div className="view-content" ref={contentRef}>
        <div className="flex flex-col gap-8 animate-fade-up">
          {/* ACCOUNT */}
          <div className="premium-card">
            <div className="flex items-center gap-5 mb-6">
              <div style={{
                width: 56, height: 56, borderRadius: 'var(--radius-xl)',
                background: 'var(--accent-soft)', border: '1px solid var(--border)',
                overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center',
                flexShrink: 0,
              }}>
                {profileImg ? (
                  <img src={profileImg} style={{ width: '100%', height: '100%', objectFit: 'cover' }} alt="profile" />
                ) : (
                  <div style={{ fontWeight: 900, fontSize: 'var(--type-title2)', color: 'var(--accent)' }}>
                    {profileName.substring(0, 2).toUpperCase()}
                  </div>
                )}
              </div>
              <div className="flex-1">
                <div style={{ fontSize: 'var(--type-headline)', fontWeight: 700, color: 'var(--text-primary)', marginBottom: 2 }}>{profileName}</div>
                <div style={{ fontSize: 'var(--type-caption)', fontWeight: 600, color: 'var(--text-secondary)', letterSpacing: '0.05em', textTransform: 'uppercase' }}>{profileEmail}</div>
              </div>
            </div>
            <button onClick={onLogout} className="btn-premium-danger w-full">
              <LogOut size={16} />
              <span>Deauthorize Device</span>
            </button>
          </div>

          {/* APPEARANCE */}
          <div className="flex flex-col gap-4">
            <div className="flex items-center justify-between px-2">
              <h2 style={{ fontSize: 'var(--type-caption)', fontWeight: 800, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--text-secondary)' }}>Visual Theme</h2>
              <div style={{ fontSize: 'var(--type-caption)', fontWeight: 900, color: 'var(--accent)' }}>{theme.toUpperCase()} MODE</div>
            </div>
            <div className="pill-segmented">
              <div onClick={() => setTheme('light')} className={`pill-item ${theme === 'light' ? 'active' : ''}`}>
                <Sun size={14} style={{ display: 'inline', marginRight: 6, verticalAlign: 'middle' }} />
                LIGHT
              </div>
              <div onClick={() => setTheme('dark')} className={`pill-item ${theme === 'dark' ? 'active' : ''}`}>
                <Moon size={14} style={{ display: 'inline', marginRight: 6, verticalAlign: 'middle' }} />
                DARK
              </div>
              <div onClick={() => setTheme('auto')} className={`pill-item ${theme === 'auto' ? 'active' : ''}`}>
                <Monitor size={14} style={{ display: 'inline', marginRight: 6, verticalAlign: 'middle' }} />
                AUTO
              </div>
            </div>
          </div>

          {/* STORAGE */}
          <div className="flex flex-col gap-4">
            <h2 style={{ fontSize: 'var(--type-caption)', fontWeight: 800, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--text-secondary)', padding: '0 var(--space-sm)' }}>Fleet Archive</h2>
            <div className="premium-card" style={{ padding: 'var(--space-3xl)' }}>
              <div className="flex items-center gap-6 mb-6">
                <div className="fintech-icon-box shrink-0">
                  <Fuel size={24} />
                </div>
                <div className="flex flex-col gap-1">
                  <div style={{ fontSize: 'var(--type-headline)', fontWeight: 800, color: 'var(--text-primary)' }}>{data.entries.length} Records</div>
                  <div style={{ fontSize: 'var(--type-caption)', fontWeight: 700, color: 'var(--text-secondary)', letterSpacing: '0.1em', opacity: 0.6, textTransform: 'uppercase' }}>
                    {data.vehicles.length} Machines • {(data.trips || []).length} Trips • {(data.services || []).length} Services
                  </div>
                </div>
              </div>

              <div style={{ height: 1, background: 'var(--border)', width: '100%', marginBottom: 'var(--space-2xl)', opacity: 0.5 }} />

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div style={{
                    width: 10, height: 10, borderRadius: '50%',
                    background: fileId ? 'var(--success)' : 'var(--warning)',
                    boxShadow: fileId ? '0 0 10px rgba(16,185,129,0.5)' : '0 0 10px rgba(245,158,11,0.5)',
                  }} className={!fileId ? 'animate-pulse' : ''} />
                  <div style={{ fontSize: 'var(--type-caption)', fontWeight: 900, color: 'var(--text-secondary)', letterSpacing: '0.15em', textTransform: 'uppercase' }}>
                    {fileId ? 'Cloud Sync Active' : 'Offline Mode'}
                  </div>
                </div>
                {fileId && (
                  <div style={{
                    fontSize: 'var(--type-caption)', fontWeight: 700,
                    color: 'var(--accent)', padding: '4px 12px',
                    background: 'var(--accent-soft)', borderRadius: 'var(--radius-pill)',
                  }}>SYNCED</div>
                )}
              </div>
            </div>
          </div>

          {/* DATA HEALTH */}
          <div className="flex flex-col gap-4">
            <h2 style={{ fontSize: 'var(--type-caption)', fontWeight: 800, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--text-secondary)', padding: '0 var(--space-sm)' }}>Data Health</h2>
            <div className="premium-card" style={{ padding: 'var(--space-2xl)' }}>
              <div className="grid grid-cols-4 gap-4">
                {[
                  { label: 'Vehicles', count: data.vehicles.length },
                  { label: 'Fuel Logs', count: data.entries.length },
                  { label: 'Trips', count: (data.trips || []).length },
                  { label: 'Services', count: (data.services || []).length },
                ].map(({ label, count }) => (
                  <div key={label} style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: 'var(--type-title1)', fontWeight: 900, color: 'var(--text-primary)' }}>{count}</div>
                    <div style={{ fontSize: 'var(--type-caption)', fontWeight: 900, letterSpacing: '0.08em', opacity: 0.4, marginTop: 4, textTransform: 'uppercase' }}>{label}</div>
                  </div>
                ))}
              </div>
              <div style={{ marginTop: 'var(--space-2xl)', textAlign: 'center' }}>
                <div style={{ fontSize: 'var(--type-caption)', fontWeight: 900, letterSpacing: '0.1em', color: 'var(--success)' }}>
                  Schema v{data.schemaVersion || 1}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Settings;
