import React, { useRef, useState } from 'react';
import { Camera, X, Image as ImageIcon } from 'lucide-react';

/**
 * PhotoCapture — allows users to attach receipt photos to fuel/service entries.
 * Uses native camera capture on mobile, file picker on desktop.
 * Stores as base64 data URL.
 */
const PhotoCapture = ({ value, onChange, label = 'Receipt Photo' }) => {
  const inputRef = useRef(null);
  const [preview, setPreview] = useState(value || null);

  const handleCapture = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Compress and convert to base64
    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new window.Image();
      img.onload = () => {
        // Resize to max 800px width to keep data small
        const canvas = document.createElement('canvas');
        const maxW = 800;
        let w = img.width;
        let h = img.height;
        if (w > maxW) {
          h = (h * maxW) / w;
          w = maxW;
        }
        canvas.width = w;
        canvas.height = h;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, w, h);
        const dataUrl = canvas.toDataURL('image/webp', 0.7);
        setPreview(dataUrl);
        onChange?.(dataUrl);
        if (navigator.vibrate) navigator.vibrate([5, 30, 5]);
      };
      img.src = event.target.result;
    };
    reader.readAsDataURL(file);
  };

  const clearPhoto = () => {
    setPreview(null);
    onChange?.(null);
    if (inputRef.current) inputRef.current.value = '';
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-sm)' }}>
      <label style={{
        fontSize: 'var(--type-caption)',
        fontWeight: 800,
        letterSpacing: '1.5px',
        color: 'var(--text-secondary)',
        textTransform: 'uppercase',
      }}>{label}</label>

      {preview ? (
        <div style={{ position: 'relative', borderRadius: 'var(--radius-lg)', overflow: 'hidden' }}>
          <img 
            src={preview} 
            alt="Receipt" 
            style={{ 
              width: '100%', 
              maxHeight: 200, 
              objectFit: 'cover',
              borderRadius: 'var(--radius-lg)',
              border: '1px solid var(--border)',
            }} 
          />
          <button 
            type="button"
            onClick={clearPhoto} 
            style={{
              position: 'absolute', top: 8, right: 8,
              width: 28, height: 28, borderRadius: 'var(--radius-full)',
              background: 'rgba(0,0,0,0.6)', color: 'white',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              border: 'none', cursor: 'pointer',
            }}
          >
            <X size={14} />
          </button>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 'var(--space-sm)',
            padding: 'var(--space-2xl)',
            background: 'var(--bg-card)',
            border: '2px dashed var(--border)',
            borderRadius: 'var(--radius-lg)',
            color: 'var(--text-secondary)',
            cursor: 'pointer',
            transition: 'all 0.2s',
          }}
        >
          <div style={{
            width: 48, height: 48, borderRadius: 'var(--radius-lg)',
            background: 'var(--accent-soft)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: 'var(--accent)',
          }}>
            <Camera size={22} />
          </div>
          <span style={{ fontSize: 'var(--type-subhead)', fontWeight: 700 }}>
            Tap to capture receipt
          </span>
          <span style={{ fontSize: 'var(--type-caption)', opacity: 0.5 }}>
            Camera or gallery
          </span>
        </button>
      )}

      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        capture="environment"
        onChange={handleCapture}
        style={{ display: 'none' }}
      />
    </div>
  );
};

export default PhotoCapture;
