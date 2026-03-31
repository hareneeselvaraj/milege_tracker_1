import React, { useMemo, useState, useRef } from 'react';
import GlassCard from '../components/common/GlassCard';
import TrendChart from '../components/analytics/TrendChart';
import ReminderBanner from '../components/common/ReminderBanner';
import { Fuel, TrendingUp, TrendingDown, Minus, AlertTriangle, Activity, Plus, ShieldCheck, Zap, Gauge, Car, Bike, Route, Settings, Wrench, Bell } from 'lucide-react';
import { checkAlerts, getMonthlyTrends, calculateEfficiency, getVehicleStats, getTripStats } from '../lib/analytics';

const Dashboard = ({ vehicles, entries, trips, user, isSynced, onAddClick, onMarkServiced, onSettingsClick, onViewChange, onNotificationsClick, theme, expenses = [], income = [], budgets = [] }) => {
  const alerts = checkAlerts(vehicles, entries);
  const isLight = theme === 'light';

  const headerColor = isLight ? 'var(--text-primary)' : 'white';
  const headerSoftColor = isLight ? 'var(--text-secondary)' : 'rgba(255,255,255,0.7)';
  const iconBg = isLight ? 'rgba(0, 0, 0, 0.05)' : 'rgba(255, 255, 255, 0.15)';
  const iconBorder = isLight ? '1px solid rgba(0, 0, 0, 0.08)' : '1px solid rgba(255, 255, 255, 0.2)';

  // Financial calculations
  const currentMonth = new Date().toISOString().substring(0, 7);
  const monthlyExpenses = expenses.filter(e => e.date.startsWith(currentMonth)).reduce((sum, e) => sum + Number(e.amount), 0);
  const monthlyBudget = budgets.filter(b => b.month === currentMonth).reduce((sum, b) => sum + Number(b.limit), 0);
  const budgetUtilization = monthlyBudget > 0 ? (monthlyExpenses / monthlyBudget) * 100 : 0;
  const budgetStatus = budgetUtilization > 90 ? 'danger' : budgetUtilization > 75 ? 'warning' : 'success';
  const trends = getMonthlyTrends(entries);
  const vehicleStats = useMemo(() => getVehicleStats(vehicles, entries), [vehicles, entries]);
  const tripStats = useMemo(() => getTripStats(trips), [trips]);
  const [scrollY, setScrollY] = useState(0);
  const contentRef = useRef(null);

  // Build profile safely
  let profileName = 'User';
  let profileImg = null;
  let profileInitials = 'U';
  try {
    if (user?.getBasicProfile) {
      const profile = user.getBasicProfile();
      profileName = profile.getName() || 'User';
      profileImg = profile.getImageUrl() || null;
      profileInitials = profileName.substring(0, 2).toUpperCase();
    } else if (user?.name) {
      profileName = user.name;
      profileInitials = profileName.substring(0, 2).toUpperCase();
      profileImg = user.picture || null;
    }
  } catch (e) { /* offline user */ }

  const totalKm = vehicleStats.reduce((s, vs) => s + vs.totalKm, 0);
  const totalFuelForMileage = vehicleStats.reduce((s, vs) => s + vs.fuelForMileage, 0);
  const totalFuelSpend = vehicleStats.reduce((s, vs) => s + vs.totalCost, 0);
  const totalTripsKm = trips.reduce((s, t) => s + (Number(t.endOdometer) - Number(t.startOdometer)), 0);
  const avgEfficiency = totalFuelForMileage > 0 ? (totalKm / totalFuelForMileage).toFixed(1) : '--';

  const TrendIcon = ({ trend, size = 14 }) => {
    if (trend === 'up') return <TrendingUp size={size} className="text-success" />;
    if (trend === 'down') return <TrendingDown size={size} className="text-danger" />;
    return <Minus size={size} className="opacity-30" />;
  };

  return (
    <div className="view-container" style={{ position: 'relative' }}>
      {/* Layer 1: Fixed gradient background — parallax */}
      <div
        className="dashboard-gradient"
        style={{
          opacity: Math.max(0, 1 - scrollY / 200),
          transform: `translateY(${-scrollY * 0.3}px)`
        }}
      />

      {/* Layer 2: Fixed header */}
      <div className="dashboard-header" style={{ padding: 'var(--space-lg) var(--space-2xl)' }}>
        <div className="flex items-center gap-4">
          <div style={{
            width: 48, height: 48,
            borderRadius: 'var(--radius-lg)',
            border: '2px solid rgba(255,255,255,0.4)',
            overflow: 'hidden',
            background: 'rgba(255,255,255,0.15)',
            backdropFilter: 'blur(10px)',
            flexShrink: 0,
          }}>
            {profileImg ? (
              <img src={profileImg} alt="User" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            ) : (
              <div className="flex items-center justify-center w-full h-full" style={{ color: headerColor, fontSize: 'var(--type-footnote)', fontWeight: 900 }}>
                {profileInitials}
              </div>
            )}
          </div>
          <div>
            <div style={{ color: headerSoftColor, fontSize: 'var(--type-caption)', fontWeight: 900, letterSpacing: '0.2em', textTransform: 'uppercase' }}>
              Dashboard
            </div>
            <h1 style={{ color: headerColor, fontSize: 'var(--type-title2)', fontWeight: 900, letterSpacing: '-0.5px' }}>
              {profileName}
            </h1>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {/* Notification bell */}
          <button
            onClick={onNotificationsClick}
            style={{
              width: 44, height: 44, borderRadius: 'var(--radius-md)',
              background: iconBg,
              backdropFilter: 'blur(20px)',
              border: iconBorder,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: headerColor, cursor: 'pointer',
              position: 'relative',
            }}
          >
            <Bell size={20} />
            {alerts.length > 0 && (
              <span style={{
                position: 'absolute', top: 6, right: 6,
                width: 8, height: 8, borderRadius: '50%',
                background: 'var(--danger)',
                border: `2px solid ${isLight ? 'white' : 'rgba(255,255,255,0.3)'}`,
              }} />
            )}
          </button>
          <button
            onClick={onSettingsClick}
            style={{
              width: 44, height: 44, borderRadius: 'var(--radius-md)',
              background: iconBg,
              backdropFilter: 'blur(20px)',
              border: iconBorder,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: headerColor, cursor: 'pointer',
            }}
          >
            <Settings size={20} />
          </button>
        </div>
      </div>

      {/* Layer 3: Scrollable content */}
      <div
        className="view-content"
        ref={contentRef}
        onScroll={(e) => setScrollY(e.target.scrollTop)}
        style={{ paddingTop: 'var(--space-lg)' }}
      >
        <div className="flex flex-col gap-6 animate-fade-up">
          {/* SERVICE REMINDERS */}
          {alerts.length > 0 && (
            <ReminderBanner alerts={alerts} onMarkServiced={onMarkServiced} />
          )}

          {/* HERO CARD */}
          <div className="glass-card relative overflow-hidden" style={{
            borderRadius: 'var(--radius-3xl)',
            padding: 'var(--space-4xl) var(--space-2xl)',
            background: 'var(--bg-card)',
            textAlign: 'center',
          }}>
            <div style={{ position: 'absolute', top: -20, right: -20, width: 120, height: 120, borderRadius: '100%', background: 'var(--accent-soft)', filter: 'blur(40px)', pointerEvents: 'none' }} />
            <div className="relative" style={{ zIndex: 1 }}>
              <div style={{
                width: 72, height: 72, borderRadius: 'var(--radius-2xl)',
                background: 'var(--accent-soft)', border: '1px solid var(--border)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                margin: '0 auto var(--space-md)',
                color: 'var(--accent)',
              }}>
                <Gauge size={36} strokeWidth={2} />
              </div>
              <div style={{ fontSize: 'var(--type-caption)', fontWeight: 900, color: 'var(--text-secondary)', letterSpacing: '0.3em', textTransform: 'uppercase', marginBottom: 'var(--space-lg)' }}>
                Total Distance
              </div>
              <div className="flex items-baseline justify-center gap-2" style={{ marginBottom: 'var(--space-sm)' }}>
                <span style={{ fontSize: 'clamp(40px, 12vw, 64px)', fontWeight: 900, letterSpacing: '-2px', color: 'var(--text-primary)', lineHeight: 1 }}>
                  {totalKm.toLocaleString()}
                </span>
                <span style={{ fontSize: 'var(--type-footnote)', fontWeight: 900, opacity: 0.3, letterSpacing: '0.15em' }}>KM</span>
              </div>
              {totalFuelSpend > 0 && (
                <div className="flex justify-center" style={{ marginTop: 'var(--space-lg)' }}>
                  <div style={{
                    fontSize: 'var(--type-caption)', fontWeight: 900,
                    background: 'var(--accent-soft)', padding: '8px 20px',
                    borderRadius: 'var(--radius-pill)', border: '1px solid var(--border)',
                    display: 'flex', alignItems: 'center', gap: 'var(--space-sm)',
                    color: 'var(--text-primary)',
                  }}>
                    <Fuel size={14} className="text-accent" />
                    ₹{totalFuelSpend.toLocaleString()} <span className="opacity-40">spend</span>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* QUICK ACTIONS */}
          <div className="grid grid-cols-4 gap-4" style={{ padding: '0 var(--space-xs)' }}>
            {[
              { label: 'Add', icon: Plus, color: 'var(--accent)', onClick: onAddClick, filled: true },
              { label: 'Garage', icon: Car, onClick: () => onViewChange('vehicles') },
              { label: 'Trips', icon: Route, onClick: () => onViewChange('trips') },
              { label: 'Service', icon: Wrench, onClick: () => onViewChange('services') },
            ].map(({ label, icon: Icon, color, onClick, filled }) => (
              <div key={label} onClick={onClick} className="flex flex-col items-center gap-2 cursor-pointer" style={{ WebkitTapHighlightColor: 'transparent' }}>
                <div style={{
                  width: 56, height: 56, borderRadius: 'var(--radius-xl)',
                  background: filled ? (color || 'var(--accent)') : 'var(--bg-card)',
                  border: `1px solid ${filled ? 'transparent' : 'var(--border)'}`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  color: filled ? 'white' : 'var(--accent)',
                  boxShadow: filled ? '0 8px 24px -4px rgba(99, 102, 241, 0.35)' : 'var(--card-shadow)',
                  transition: 'transform 0.2s',
                }}>
                  <Icon size={22} />
                </div>
                <span style={{ fontSize: 'var(--type-caption)', fontWeight: 800, letterSpacing: '0.08em', color: 'var(--text-secondary)', textTransform: 'uppercase' }}>
                  {label}
                </span>
              </div>
            ))}
          </div>

          {/* STAT GRID */}
          <div className="stat-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 'var(--space-md)', padding: '0 var(--space-xs)' }}>
            {[
              { icon: TrendingUp, iconColor: 'var(--success)', label: 'KM/L Avg', value: avgEfficiency, badge: 'Opti', badgeColor: 'var(--success)' },
              { icon: Fuel, iconColor: 'var(--danger)', label: 'Fuel Logs', value: entries.length, badge: 'Data', badgeColor: 'var(--danger)' },
              { icon: Route, iconColor: '#60A5FA', label: `${totalTripsKm.toLocaleString()} KM`, value: trips.length, badge: 'Trips', badgeColor: '#60A5FA' },
              { icon: Car, iconColor: 'var(--accent)', label: 'Machines', value: vehicles.length, badge: 'Fleet', badgeColor: 'var(--accent)' },
            ].map(({ icon: Icon, iconColor, label, value, badge, badgeColor }) => (
              <GlassCard key={label} style={{ padding: 'var(--space-md)', display: 'flex', flexDirection: 'column', gap: 'var(--space-sm)' }}>
                <div className="flex justify-between items-start">
                  <Icon size={16} style={{ color: iconColor }} />
                  <div style={{ fontSize: '9px', fontWeight: 900, background: `${badgeColor}15`, color: badgeColor, padding: '2px 6px', borderRadius: 'var(--radius-sm)' }}>
                    {badge}
                  </div>
                </div>
                <div className="flex flex-col gap-0.5">
                  <div style={{ fontSize: 'var(--type-title2)', fontWeight: 900, color: 'var(--text-primary)', lineHeight: 1 }}>{value}</div>
                  <div style={{ fontSize: '10px', fontWeight: 900, opacity: 0.4, letterSpacing: '0.1em', textTransform: 'uppercase' }}>{label}</div>
                </div>
              </GlassCard>
            ))}
          </div>

          {/* PER-VEHICLE FLEET */}
          {vehicleStats.filter(s => s.avgEff !== null).length > 0 && (
            <div className="flex flex-col gap-4">
              <h2 style={{ fontSize: 'var(--type-caption)', fontWeight: 900, letterSpacing: '0.15em', padding: '0 var(--space-sm)', opacity: 0.5 }}>Fleet Performance</h2>
              <div className="flex flex-col gap-3">
                {vehicleStats.filter(s => s.avgEff !== null).map(({ vehicle, avgEff, costPerKm, logsCount, trend }) => (
                  <GlassCard key={vehicle.id} style={{ padding: 'var(--space-xl)' }}>
                    <div className="flex justify-between items-center">
                      <div className="flex items-center gap-3">
                        <div className="icon-box bg-accent-soft border-theme">
                          {vehicle.type === 'bike' ? <Bike size={18} className="text-accent" /> : <Car size={18} className="text-accent" />}
                        </div>
                        <div>
                          <div className="font-black text-sm text-primary">{vehicle.name}</div>
                          <div style={{ fontSize: 'var(--type-caption)' }} className="text-secondary">{logsCount} logs</div>
                        </div>
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        <div className="flex items-center justify-end gap-1">
                          <TrendIcon trend={trend} />
                          <span style={{ fontSize: 'var(--type-title2)', fontWeight: 900 }}>{avgEff}</span>
                          <span style={{ fontSize: 'var(--type-caption)', opacity: 0.4 }}>km/L</span>
                        </div>
                        {costPerKm !== null && (
                          <div style={{ fontSize: 'var(--type-caption)', opacity: 0.4 }}>₹{costPerKm}/km</div>
                        )}
                      </div>
                    </div>
                  </GlassCard>
                ))}
              </div>
            </div>
          )}

          {/* TRIP BREAKDOWN */}
          {Object.keys(tripStats).length > 0 && (
            <div className="flex flex-col gap-4">
              <h2 style={{ fontSize: 'var(--type-caption)', fontWeight: 900, letterSpacing: '0.15em', padding: '0 var(--space-sm)', opacity: 0.5 }}>Trip Breakdown</h2>
              <GlassCard style={{ padding: 'var(--space-xl)' }}>
                <div className="flex flex-col gap-3">
                  {Object.entries(tripStats).map(([purpose, stat]) => (
                    <div key={purpose} className="flex justify-between items-center text-primary">
                      <span style={{ fontSize: 'var(--type-caption)', fontWeight: 900, letterSpacing: '0.08em', opacity: 0.6 }}>{purpose}</span>
                      <div style={{ textAlign: 'right' }}>
                        <span className="font-black text-sm">{stat.km.toLocaleString()} KM</span>
                        <span style={{ fontSize: 'var(--type-caption)', marginLeft: 8 }} className="text-secondary">({stat.count} trips)</span>
                      </div>
                    </div>
                  ))}
                </div>
              </GlassCard>
            </div>
          )}

          {/* SYSTEM ALERTS */}
          <div className="flex flex-col gap-4">
            <h2 style={{ fontSize: 'var(--type-caption)', fontWeight: 900, letterSpacing: '0.15em', padding: '0 var(--space-sm)', opacity: 0.5 }}>System Insights</h2>
            <GlassCard style={{ padding: 'var(--space-2xl)' }}>
              {alerts.length > 0 ? (
                <div className="flex flex-col gap-4">
                  {alerts.map((alert, idx) => (
                    <div key={idx} className="flex gap-4 items-start">
                      <AlertTriangle size={20} className="text-warning shrink-0" />
                      <p style={{ fontSize: 'var(--type-subhead)', fontWeight: 700, opacity: 0.9, lineHeight: 1.4 }}>{alert.message}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="flex gap-4 items-center">
                  <ShieldCheck size={20} className="text-success shrink-0" />
                  <div>
                    <div style={{ fontSize: 'var(--type-caption)', fontWeight: 900, letterSpacing: '0.1em' }} className="text-success mb-1">Status Optimized</div>
                    <p style={{ fontSize: 'var(--type-subhead)', fontWeight: 700, opacity: 0.5 }}>No anomalies detected in current archive.</p>
                  </div>
                </div>
              )}
            </GlassCard>
          </div>

          {/* TREND CHART */}
          {trends.length > 0 && (
            <div className="flex flex-col gap-4">
              <h2 style={{ fontSize: 'var(--type-caption)', fontWeight: 900, letterSpacing: '0.15em', padding: '0 var(--space-sm)', opacity: 0.5 }}>Efficiency Trends</h2>
              <GlassCard style={{ padding: 'var(--space-2xl)' }}>
                <div style={{ height: 160, width: '100%' }}>
                  <TrendChart data={trends} />
                </div>
              </GlassCard>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
