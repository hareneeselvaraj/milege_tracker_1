import React, { useState, useRef, useEffect, useMemo } from 'react';
import EmptyState from '../components/common/EmptyState';
import SwipeableCard from '../components/common/SwipeableCard';
import { Fuel, Download, Trash2, Edit3, Bike, Plus } from 'lucide-react';
import { exportFuelPDF, exportCSV } from '../lib/exportUtils';

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

  const filteredEntries = useMemo(() => {
    return entries
      .filter(entry => activeVehicleId === 'all' || entry.vehicleId === activeVehicleId)
      .slice()
      .reverse();
  }, [entries, activeVehicleId]);

  const groupedEntries = useMemo(() => {
    const groups = {};
    filteredEntries.forEach(entry => {
      const date = new Date(entry.date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: '2-digit' });
      if (!groups[date]) groups[date] = [];
      groups[date].push(entry);
    });
    return groups;
  }, [filteredEntries]);

  const stats = useMemo(() => {
    const totalCost = filteredEntries.reduce((sum, e) => sum + Number(e.cost), 0);
    const totalLiters = filteredEntries.reduce((sum, e) => sum + Number(e.liters), 0);
    const avgPPL = totalLiters > 0 ? (totalCost / totalLiters).toFixed(1) : '--';
    return { cost: totalCost.toLocaleString(), liters: totalLiters.toFixed(1), count: filteredEntries.length, avgPPL };
  }, [filteredEntries]);

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
            <div className="grid grid-cols-4 gap-2">
              <div className="summary-card col-span-1">
                <div className="text-xs font-black opacity-40 tracking-widest mb-1 text-primary">Liters</div>
                <div className="text-sm font-black text-primary">{stats.liters}</div>
              </div>
              <div className="summary-card col-span-1">
                <div className="text-xs font-black opacity-40 tracking-widest mb-1 text-primary">Spend</div>
                <div className="text-sm font-black text-danger">₹{stats.cost}</div>
              </div>
              <div className="summary-card col-span-1">
                <div className="text-xs font-black opacity-40 tracking-widest mb-1 text-primary">₹/Liter</div>
                <div className="text-sm font-black text-warning">{stats.avgPPL}</div>
              </div>
              <div className="summary-card col-span-1 bg-success-soft">
                <div className="text-xs font-black text-success tracking-widest mb-1">Logs</div>
                <div className="text-sm font-black text-success">{stats.count}</div>
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
                            <div className="flex justify-between items-center mt-1">
                              <span className="text-xs font-bold text-secondary tracking-widest">
                                {entry.odometer} KM • {entry.liters} L {ppl ? `• ₹${ppl}/L` : ''}
                              </span>
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
