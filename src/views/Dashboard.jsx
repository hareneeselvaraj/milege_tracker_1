import React, { useMemo } from 'react';
import GlassCard from '../components/common/GlassCard';
import TrendChart from '../components/analytics/TrendChart';
import ReminderBanner from '../components/common/ReminderBanner';
import { Fuel, TrendingUp, TrendingDown, Minus, AlertTriangle, Activity, Plus, ShieldCheck, Zap, Gauge, Car, Bike, Route, Settings } from 'lucide-react';
import { checkAlerts, getMonthlyTrends, calculateEfficiency, getVehicleStats, getTripStats } from '../lib/analytics';

const Dashboard = ({ vehicles, entries, trips, user, isSynced, onAddClick, onMarkServiced, onSettingsClick, onViewChange }) => {
  const alerts = checkAlerts(vehicles, entries);
  const trends = getMonthlyTrends(entries);
  const vehicleStats = useMemo(() => getVehicleStats(vehicles, entries), [vehicles, entries]);
  const tripStats = useMemo(() => getTripStats(trips), [trips]);
  const profile = user.getBasicProfile();

  const totalKm = vehicleStats.reduce((s, vs) => s + vs.totalKm, 0);
  const totalFuelForMileage = vehicleStats.reduce((s, vs) => s + vs.fuelForMileage, 0);
  const totalFuelSpend = vehicleStats.reduce((s, vs) => s + vs.totalCost, 0);
  const totalTripsKm = trips.reduce((s, t) => s + (Number(t.endOdometer) - Number(t.startOdometer)), 0);

  const avgEfficiency = totalFuelForMileage > 0 
    ? (totalKm / totalFuelForMileage).toFixed(1) 
    : '--';

  const TrendIcon = ({ trend, size = 14 }) => {
    if (trend === 'up') return <TrendingUp size={size} className="text-emerald-400" />;
    if (trend === 'down') return <TrendingDown size={size} className="text-rose-400" />;
    return <Minus size={size} className="opacity-30" />;
  };

  return (
    <div className="flex flex-col gap-6 fade-in pb-32 relative">
      <div className="absolute -top-[100px] -left-6 -right-6 h-[320px] bg-gradient-to-br from-[#38BDF8] via-[#3B82F6] to-[#8B5CF6] rounded-b-[60px] z-0 opacity-90" style={{ boxShadow: '0 20px 40px rgba(59, 130, 246, 0.2)' }}></div>
      <div className="relative z-10 flex flex-col gap-6 pt-2">
        {/* HEADER */}
        <header className="flex items-center justify-between px-2 pt-6">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-full border-[3px] border-white/50 shadow-2xl overflow-hidden bg-gradient-to-br from-cyan/30 to-accent/30 p-0.5 relative group">
              {profile.getImageUrl() ? (
                <img src={profile.getImageUrl()} alt="User" className="w-full h-full rounded-full object-cover" />
              ) : (
                <div className="w-full h-full rounded-full flex items-center justify-center bg-white/20 backdrop-blur-md text-[10px] font-black text-white">
                  {profile.getName()?.substring(0, 2).toUpperCase() || 'U'}
                </div>
              )}
              <div className="absolute inset-0 bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity"></div>
            </div>
            <div className="text-white">
              <div className="text-[10px] uppercase tracking-[0.3em] font-black opacity-30 mb-0.5">Vanguard Mode</div>
              <h1 className="text-2xl font-black tracking-tighter leading-none" style={{ textShadow: '0 4px 12px rgba(0,0,0,0.2)' }}>{profile.getName()}</h1>
            </div>
          </div>
          <div className="flex items-center">
            <button onClick={onSettingsClick} className="w-12 h-12 rounded-2xl bg-white/10 backdrop-blur-2xl flex items-center justify-center hover:bg-white/20 transition-all border border-white/20 shadow-xl active:scale-90">
              <Settings size={22} className="text-white opacity-80" />
            </button>
          </div>
        </header>

        {/* SERVICE REMINDERS */}
        {alerts.length > 0 && (
          <ReminderBanner alerts={alerts} onMarkServiced={onMarkServiced} />
        )}

        {/* HERO / FLOAT CARD */}
        <div className="glass-card mt-2 shadow-2xl relative overflow-hidden !py-12 bg-white/10 border-white/20" style={{ borderRadius: '48px' }}>
          <div className="absolute top-0 right-0 w-32 h-32 bg-cyan/10 rounded-full blur-3xl -mr-10 -mt-10 animate-pulse"></div>
          <div className="relative z-10 flex flex-col items-center">
            <div className="w-20 h-20 rounded-[32px] bg-white/10 border border-white/20 flex items-center justify-center text-cyan mb-3 shadow-inner backdrop-blur-md">
              <Gauge size={40} strokeWidth={2} />
            </div>
            <div className="text-[12px] font-black text-white/40 uppercase tracking-[0.4em] mb-4">Total Distance</div>
            <div className="text-7xl font-black tracking-tighter text-white flex items-baseline gap-2 mb-2">
              {totalKm.toLocaleString()}
              <span className="text-[12px] opacity-30 font-black tracking-[0.2em]">KM</span>
            </div>
            {totalFuelSpend > 0 && (
              <div className="mt-4 flex justify-center">
                <div className="text-[11px] font-black text-white bg-white/10 backdrop-blur-md px-6 py-2 rounded-full border border-white/20 flex items-center gap-2 shadow-lg">
                  <Fuel size={14} className="text-cyan" />
                  ₹{totalFuelSpend.toLocaleString()} <span className="opacity-40">spend</span>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* QUICK ACTIONS */}
        <div className="grid grid-cols-4 gap-4 mt-2 px-1">
          <div onClick={onAddClick} className="flex flex-col items-center gap-3 group cursor-pointer">
            <div className="w-16 h-16 rounded-[24px] bg-cyan border border-white/30 flex items-center justify-center text-white shadow-xl shadow-cyan/30 group-active:scale-95 transition-all">
              <Plus size={24} strokeWidth={3} />
            </div>
            <span className="font-black text-[9px] tracking-widest uppercase text-primary/60">Add</span>
          </div>
          <div onClick={() => onViewChange('vehicles')} className="flex flex-col items-center gap-3 group cursor-pointer">
            <div className="w-16 h-16 rounded-[24px] bg-white/10 backdrop-blur-3xl border border-white/20 flex items-center justify-center text-accent shadow-xl group-active:scale-95 transition-all">
              <Car size={24} />
            </div>
            <span className="font-black text-[9px] tracking-widest uppercase text-primary/60">Garage</span>
          </div>
          <div onClick={() => onViewChange('trips')} className="flex flex-col items-center gap-3 group cursor-pointer">
            <div className="w-16 h-16 rounded-[24px] bg-white/10 backdrop-blur-3xl border border-white/20 flex items-center justify-center text-blue-500 shadow-xl group-active:scale-95 transition-all">
              <Route size={24} />
            </div>
            <span className="font-black text-[9px] tracking-widest uppercase text-primary/60">Trips</span>
          </div>
          <div onClick={() => onViewChange('services')} className="flex flex-col items-center gap-3 group cursor-pointer">
            <div className="w-16 h-16 rounded-[24px] bg-white/10 backdrop-blur-3xl border border-white/20 flex items-center justify-center text-emerald-500 shadow-xl group-active:scale-95 transition-all">
              <Activity size={24} />
            </div>
            <span className="font-black text-[9px] tracking-widest uppercase text-primary/60">Services</span>
          </div>
        </div>

        {/* STAT GRID */}
        <div className="stat-grid">
          <GlassCard className="mini-stat-card">
            <div className="flex justify-between items-start">
              <TrendingUp size={18} className="text-emerald-400" />
              <div className="text-[8px] font-black bg-emerald-400/10 text-emerald-400 px-1.5 py-0.5 rounded">Opti</div>
            </div>
            <div>
              <div className="text-4xl font-black tracking-tight">{avgEfficiency}</div>
              <div className="text-[9px] font-black opacity-40 tracking-widest">KM/L Avg</div>
            </div>
            <Activity className="mini-stat-icon text-emerald-400" />
          </GlassCard>

          <GlassCard className="mini-stat-card">
            <div className="flex justify-between items-start">
              <Fuel size={18} className="text-rose-400" />
              <div className="text-[8px] font-black bg-rose-400/10 text-rose-400 px-1.5 py-0.5 rounded">Data</div>
            </div>
            <div>
              <div className="text-4xl font-black tracking-tight">{entries.length}</div>
              <div className="text-[9px] font-black opacity-40 tracking-widest">Fuel Logs</div>
            </div>
            <Fuel className="mini-stat-icon text-rose-400" />
          </GlassCard>

          <GlassCard className="mini-stat-card">
            <div className="flex justify-between items-start">
              <Route size={18} className="text-blue-400" />
              <div className="text-[8px] font-black bg-blue-400/10 text-blue-400 px-1.5 py-0.5 rounded">Trips</div>
            </div>
            <div>
              <div className="text-4xl font-black tracking-tight">{trips.length}</div>
              <div className="text-[9px] font-black opacity-40 tracking-widest">{totalTripsKm.toLocaleString()} KM</div>
            </div>
            <Route className="mini-stat-icon text-blue-400" />
          </GlassCard>

          <GlassCard className="mini-stat-card">
            <div className="flex justify-between items-start">
              <Car size={18} className="text-lavender" />
              <div className="text-[8px] font-black bg-lavender/10 text-lavender px-1.5 py-0.5 rounded">Fleet</div>
            </div>
            <div>
              <div className="text-4xl font-black tracking-tight">{vehicles.length}</div>
              <div className="text-[9px] font-black opacity-40 tracking-widest">Machines</div>
            </div>
            <Car className="mini-stat-icon text-lavender" />
          </GlassCard>
        </div>

        {/* PER-VEHICLE EFFICIENCY */}
        {vehicleStats.filter(s => s.avgEff !== null).length > 0 && (
          <div className="flex flex-col gap-4">
            <h2 className="text-[10px] font-black tracking-[0.2em] px-2 opacity-50">Fleet Performance</h2>
            <div className="flex flex-col gap-3">
              {vehicleStats.filter(s => s.avgEff !== null).map(({ vehicle, avgEff, costPerKm, logsCount, trend }) => (
                <GlassCard key={vehicle.id} className="!p-5">
                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-2xl bg-accent-soft border border-theme flex items-center justify-center">
                        {vehicle.type === 'bike' ? <Bike size={18} className="text-accent" /> : <Car size={18} className="text-accent" />}
                      </div>
                      <div>
                        <div className="font-black text-sm text-primary">{vehicle.name}</div>
                        <div className="text-[10px] text-secondary tracking-widest">{logsCount} logs</div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        <TrendIcon trend={trend} />
                        <span className="font-black text-xl">{avgEff}</span>
                        <span className="text-xs opacity-40">km/L</span>
                      </div>
                      {costPerKm !== null && (
                        <div className="text-[10px] opacity-40">₹{costPerKm}/km</div>
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
            <h2 className="text-[10px] font-black tracking-[0.2em] px-2 opacity-50">Trip Breakdown</h2>
            <GlassCard className="!p-5">
              <div className="flex flex-col gap-3">
                {Object.entries(tripStats).map(([purpose, stat]) => (
                  <div key={purpose} className="flex justify-between items-center text-primary">
                    <span className="text-xs font-black tracking-widest opacity-60">{purpose}</span>
                    <div className="text-right">
                      <span className="font-black text-sm">{stat.km.toLocaleString()} KM</span>
                      <span className="text-[10px] text-secondary ml-2">({stat.count} trips)</span>
                    </div>
                  </div>
                ))}
              </div>
            </GlassCard>
          </div>
        )}

        {/* SYSTEM ALERTS */}
        <div className="flex flex-col gap-4">
          <h2 className="text-[10px] font-black tracking-[0.2em] px-2 opacity-50">System Insights</h2>
          <GlassCard className="!p-6">
            {alerts.length > 0 ? (
              <div className="flex flex-col gap-4">
                {alerts.map((alert, idx) => (
                  <div key={idx} className="flex gap-4 items-start">
                    <AlertTriangle size={20} className="text-amber-400 shrink-0" />
                    <p className="text-xs font-bold leading-tight opacity-90">{alert.message}</p>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex gap-4 items-center">
                <ShieldCheck size={20} className="text-emerald-400 shrink-0" />
                <div>
                  <div className="text-[10px] font-black tracking-widest text-emerald-400 mb-1">Status Optimized</div>
                  <p className="text-xs font-bold opacity-50">No anomalies detected in current archive.</p>
                </div>
              </div>
            )}
          </GlassCard>
        </div>

        {/* TREND CHART */}
        {trends.length > 0 && (
          <div className="flex flex-col gap-4">
            <h2 className="text-[10px] font-black tracking-[0.2em] px-2 opacity-50">Efficiency Channels</h2>
            <GlassCard className="!p-6">
              <div className="h-40 w-full">
                <TrendChart data={trends} />
              </div>
            </GlassCard>
          </div>
        )}
      </div>
    </div>
  );
};

export default Dashboard;
