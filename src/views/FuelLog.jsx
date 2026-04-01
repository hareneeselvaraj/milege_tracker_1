import React, { useState, useRef, useEffect, useMemo } from 'react';
import EmptyState from '../components/common/EmptyState';
import SwipeableCard from '../components/common/SwipeableCard';
import { Fuel, Download, Trash2, Edit3, Bike, Plus } from 'lucide-react';
import { exportFuelPDF, exportCSV } from '../lib/exportUtils';
import { calculateEfficiency } from '../lib/analytics';

const FuelLog = ({ vehicles, entries, onAddClick, onEdit, onDelete }) => {
  const [activeVehicleId, setActiveVehicleId] = useState('all');
  const [scrolled, setScrolled] = useState(false);
  const contentRef = useRef(null);

  useEffect(() => {
    const el = contentRef.current;
    if (!el) return;
    const handler = () => setScrolled(el.scrollTop > 8);
    el.addEventListener('scroll', handler, { passive: true });
    return () => el.removeEventListener('scroll', handler);
  }, []);

  const entriesWithAnalytics = useMemo(() => {
    const byVehicle = {};
    entries.forEach(e => {
       if (!byVehicle[e.vehicleId]) byVehicle[e.vehicleId] = [];
       byVehicle[e.vehicleId].push(e);
    });
    
    const processed = [];
    Object.values(byVehicle).forEach(vehicleEntries => {
      vehicleEntries.sort((a,b) => new Date(a.date) - new Date(b.date));
      vehicleEntries.forEach((entry, i) => {
         const efficiency = i > 0 ? calculateEfficiency(entry, vehicleEntries[i-1]) : null;
         processed.push({ ...entry, efficiency });
      });
    });

    return processed
      .filter(entry => activeVehicleId === 'all' || entry.vehicleId === activeVehicleId)
      .sort((a, b) => new Date(b.date) - new Date(a.date));
  }, [entries, activeVehicleId]);

  const groupedEntries = useMemo(() => {
    const groups = {};
    entriesWithAnalytics.forEach(entry => {
      const date = new Date(entry.date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: '2-digit' });
      if (!groups[date]) groups[date] = [];
      groups[date].push(entry);
    });
    return groups;
  }, [entriesWithAnalytics]);

  const stats = useMemo(() => {
    const totalCost = entriesWithAnalytics.reduce((sum, e) => sum + Number(e.cost), 0);
    const totalLiters = entriesWithAnalytics.reduce((sum, e) => sum + Number(e.liters), 0);
    const avgPPL = totalLiters > 0 ? (totalCost / totalLiters).toFixed(1) : '--';
    
    let totalEff = 0;
    let validCount = 0;
    entriesWithAnalytics.forEach(e => {
       if (e.efficiency > 0) {
         totalEff += e.efficiency;
         validCount++;
       }
    });
    const avgKML = validCount > 0 ? (totalEff / validCount).toFixed(1) : '--';
    
    return { cost: totalCost.toLocaleString(), liters: totalLiters.toFixed(1), count: entriesWithAnalytics.length, avgPPL, avgKML };
  }, [entriesWithAnalytics]);

  const filterLabel = activeVehicleId === 'all'
    ? 'All Units'
    : vehicles.find(v => v.id === activeVehicleId)?.name || 'Unknown';

  return (
    <div className="view-container">
      {/* FIXED HEADER */}
      <div className={`view-header ${scrolled ? 'scrolled' : ''}`}>
        <div>
          <h1 className="view-title">Fuel Archive</h1>
          <span className="view-subtitle">Secure Logs</span>
        </div>
        <div className="header-actions">
          <button className="header-icon-btn" onClick={() => exportFuelPDF(filteredEntries, vehicles, filterLabel)}>
            <Download size={20} />
          </button>
          <button className="header-icon-btn primary" onClick={onAddClick}>
            <Plus size={22} />
          </button>
        </div>
      </div>

      {/* SCROLLABLE CONTENT */}
      <div className="view-content" ref={contentRef}>
        <div className="flex flex-col gap-6 animate-fade-up">
          {/* FILTERS */}
          <div className="action-scroll">
            <button
              onClick={() => setActiveVehicleId('all')}
              className={`action-chip ${activeVehicleId === 'all' ? 'bg-lavender border-none' : ''}`}
              style={activeVehicleId === 'all' ? { color: 'var(--bg-primary)' } : {}}
            >All Units</button>
            {vehicles.map(v => (
              <button
                key={v.id}
                onClick={() => setActiveVehicleId(v.id)}
                className={`action-chip ${activeVehicleId === v.id ? 'bg-lavender border-none' : ''}`}
                style={activeVehicleId === v.id ? { color: 'var(--bg-primary)' } : {}}
              >{v.name}</button>
            ))}
          </div>

          {/* SUMMARY */}
          {stats.count > 0 && (
            <div className="grid grid-cols-2 gap-3">
              <div className="summary-card flex justify-between items-center">
                <div className="text-xs font-black opacity-40 tracking-widest text-primary uppercase">Liters</div>
                <div className="text-lg font-black text-primary tracking-tighter">{stats.liters} L</div>
              </div>
              <div className="summary-card flex justify-between items-center">
                <div className="text-xs font-black opacity-40 tracking-widest text-primary uppercase">Spend</div>
                <div className="text-lg font-black text-danger tracking-tighter">₹{stats.cost}</div>
              </div>
              <div className="summary-card border border-success-border bg-success-soft flex justify-between items-center">
                <div className="text-xs font-black text-success tracking-widest uppercase">Avg KM/L</div>
                <div className="text-xl font-black text-success tracking-tighter">{stats.avgKML}</div>
              </div>
              <div className="summary-card flex justify-between items-center">
                <div className="text-xs font-black opacity-40 tracking-widest text-primary uppercase">Logs</div>
                <div className="text-lg font-black text-primary tracking-tighter">{stats.count}</div>
              </div>
            </div>
          )}

          {/* LOGS */}
          <div className="flex flex-col gap-8 mt-2">
            {Object.keys(groupedEntries).length > 0 ? (
              Object.entries(groupedEntries).map(([date, dayEntries]) => (
                <div key={date} className="flex flex-col gap-4">
                  <div className="date-divider">{date}</div>
                  <div className="flex flex-col gap-3">
                    {dayEntries.map((entry, idx) => {
                      const vehicle = vehicles.find(v => v.id === entry.vehicleId);
                      const ppl = entry.liters > 0 ? (Number(entry.cost) / Number(entry.liters)).toFixed(1) : null;
                      return (
                        <SwipeableCard 
                          key={entry.id} 
                          onEdit={() => onEdit(entry)} 
                          onDelete={() => onDelete(entry.id)}
                          className="transaction-card stagger-item"
                        >
                          <div className={`icon-box ${vehicle?.type === 'bike' ? 'bg-warning-soft text-warning' : 'bg-blue-soft text-blue-soft'}`}>
                            {vehicle?.type === 'bike' ? <Bike size={20} /> : <Fuel size={20} />}
                          </div>
                          <div className="flex-1">
                            <div className="flex justify-between items-start">
                              <h3 className="font-black text-sm tracking-tight text-primary">{vehicle?.name || 'Unknown'}</h3>
                              <span className="font-black text-sm text-primary">₹{Number(entry.cost).toLocaleString()}</span>
                            </div>
                            <div className="flex justify-between items-center mt-2">
                              <span className="text-xs font-bold text-secondary tracking-widest uppercase">
                                {entry.odometer} KM • {entry.liters} L
                              </span>
                              {entry.efficiency > 0 && (
                                <span className="text-[10px] font-black tracking-widest text-success bg-success-soft px-2 py-0.5 rounded-full border border-success-border">
                                  {entry.efficiency} KM/L
                                </span>
                              )}
                            </div>
                            {entry.photo && (
                              <div style={{ marginTop: 6 }}>
                                <img src={entry.photo} alt="receipt" style={{ width: 48, height: 36, objectFit: 'cover', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)' }} />
                              </div>
                            )}
                          </div>
                        </SwipeableCard>
                      );
                    })}
                  </div>
                </div>
              ))
            ) : (
              <EmptyState
                icon={Fuel}
                title="No Fuel Logs"
                subtitle="Start tracking your fuel consumption by adding your first entry."
                actionLabel="Add Fuel Log"
                onAction={onAddClick}
              />
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default FuelLog;
