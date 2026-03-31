import React, { useState, useMemo, useEffect } from 'react';
import { Bell, X, AlertTriangle, Fuel, Wrench, Clock } from 'lucide-react';
import { checkAlerts } from '../../lib/analytics';

/**
 * In-app Notification Center
 * Shows service reminders, inactivity alerts, and system notifications.
 */
const NotificationCenter = ({ vehicles, entries, isOpen, onClose }) => {
  const alerts = useMemo(() => checkAlerts(vehicles, entries), [vehicles, entries]);
  
  // Check for inactivity (no fuel log in last 14 days)
  const inactivityAlert = useMemo(() => {
    if (entries.length === 0) return null;
    const lastEntry = [...entries].sort((a, b) => new Date(b.date) - new Date(a.date))[0];
    const daysSince = Math.floor((Date.now() - new Date(lastEntry.date).getTime()) / (1000 * 60 * 60 * 24));
    if (daysSince >= 14) {
      return { type: 'inactivity', message: `You haven't logged fuel in ${daysSince} days. Keep your records up to date!` };
    }
    return null;
  }, [entries]);

  const allNotifications = useMemo(() => {
    const notifs = [];
    alerts.forEach(a => notifs.push({ ...a, icon: a.type === 'service_overdue' || a.type === 'service_due' ? Wrench : AlertTriangle }));
    if (inactivityAlert) notifs.push({ ...inactivityAlert, icon: Clock });
    return notifs;
  }, [alerts, inactivityAlert]);

  if (!isOpen) return null;

  return (
    <div className="overlay-fixed" style={{ alignItems: 'flex-start' }}>
      <div className="backdrop" onClick={onClose} />
      <div className="modal-content" style={{
        position: 'relative',
        maxWidth: 480,
        maxHeight: '70dvh',
        borderRadius: '0 0 var(--radius-2xl) var(--radius-2xl)',
        animation: 'slideDown 0.35s cubic-bezier(0.16, 1, 0.3, 1) forwards',
      }}>
        <div style={{
          padding: 'var(--space-lg) var(--space-2xl)',
          borderBottom: '1px solid var(--border)',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-sm)' }}>
            <Bell size={18} style={{ color: 'var(--accent)' }} />
            <h2 style={{ fontSize: 'var(--type-headline)', fontWeight: 900 }}>Notifications</h2>
            {allNotifications.length > 0 && (
              <span style={{
                minWidth: 20, height: 20, borderRadius: 10,
                background: 'var(--danger)', color: 'white',
                fontSize: 'var(--type-caption)', fontWeight: 900,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                padding: '0 6px',
              }}>{allNotifications.length}</span>
            )}
          </div>
          <button onClick={onClose} style={{
            width: 32, height: 32, borderRadius: 'var(--radius-full)',
            background: 'var(--bg-secondary)', border: '1px solid var(--border)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: 'var(--text-secondary)', cursor: 'pointer',
          }}>
            <X size={16} />
          </button>
        </div>
        
        <div style={{ padding: 'var(--space-lg) var(--space-2xl)', overflowY: 'auto', maxHeight: '50dvh' }}>
          {allNotifications.length === 0 ? (
            <div style={{ textAlign: 'center', padding: 'var(--space-4xl) 0', opacity: 0.4 }}>
              <Bell size={40} style={{ margin: '0 auto var(--space-lg)' }} />
              <p style={{ fontSize: 'var(--type-subhead)', fontWeight: 700 }}>All clear! No notifications.</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-md)' }}>
              {allNotifications.map((n, idx) => {
                const Icon = n.icon || AlertTriangle;
                const isWarning = n.type === 'service_overdue' || n.type === 'efficiency_drop';
                return (
                  <div key={idx} style={{
                    display: 'flex', gap: 'var(--space-md)', alignItems: 'flex-start',
                    padding: 'var(--space-lg)',
                    background: isWarning ? 'rgba(239, 68, 68, 0.05)' : 'var(--bg-secondary)',
                    borderRadius: 'var(--radius-lg)',
                    border: `1px solid ${isWarning ? 'rgba(239, 68, 68, 0.1)' : 'var(--border)'}`,
                  }}>
                    <div style={{
                      width: 36, height: 36, borderRadius: 'var(--radius-md)',
                      background: isWarning ? 'rgba(239, 68, 68, 0.1)' : 'var(--accent-soft)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      flexShrink: 0,
                    }}>
                      <Icon size={16} style={{ color: isWarning ? 'var(--danger)' : 'var(--accent)' }} />
                    </div>
                    <p style={{ fontSize: 'var(--type-subhead)', fontWeight: 600, lineHeight: 1.5, color: 'var(--text-primary)' }}>
                      {n.message}
                    </p>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default NotificationCenter;
