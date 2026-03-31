import React, { useState, useRef, useEffect, useMemo } from 'react';
import EmptyState from '../components/common/EmptyState';
import { Route, Plus, Trash2, Edit3, Download, Car, Bike, Navigation } from 'lucide-react';
import { exportTripPDF } from '../lib/exportUtils';

const PURPOSES = ['Commute', 'Business', 'Personal', 'Errand', 'Long Drive', 'Other'];

const TripLog = ({ vehicles, trips, onAddClick, onEdit, onDelete }) => {
  const [activeVehicleId, setActiveVehicleId] = useState('all');
  const [activePurpose, setActivePurpose] = useState('all');
  const [scrolled, setScrolled] = useState(false);
  const contentRef = useRef(null);

  useEffect(() => {
    const el = contentRef.current;
    if (!el) return;
    const handler = () => setScrolled(el.scrollTop > 8);
    el.addEventListener('scroll', handler, { passive: true });
    return () => el.removeEventListener('scroll', handler);
  }, []);

  const filteredTrips = useMemo(() => {
    return [...trips]
      .filter(t => {
        const vehicleMatch = activeVehicleId === 'all' || t.vehicleId === activeVehicleId;
        const purposeMatch = activePurpose === 'all' || t.purpose === activePurpose;
        return vehicleMatch && purposeMatch;
      })
      .sort((a, b) => new Date(b.date) - new Date(a.date));
  }, [trips, activeVehicleId, activePurpose]);

  const stats = useMemo(() => {
    const totalKm = filteredTrips.reduce((s, t) => s + (Number(t.endOdometer) - Number(t.startOdometer)), 0);
    return { totalKm, count: filteredTrips.length };
  }, [filteredTrips]);

  const groupedTrips = useMemo(() => {
    const groups = {};
    filteredTrips.forEach(trip => {
      const date = new Date(trip.date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: '2-digit' });
      if (!groups[date]) groups[date] = [];
      groups[date].push(trip);
    });
    return groups;
  }, [filteredTrips]);

  const purposeColors = {
    Commute: 'text-blue-soft bg-blue-soft',
    Business: 'text-success bg-success-soft',
    Personal: 'text-accent bg-accent-soft',
    Errand: 'text-warning bg-warning-soft',
    'Long Drive': 'text-danger bg-danger-soft',
    Other: 'text-secondary bg-secondary',
  };

  return (
    <div className="view-container">
      {/* FIXED HEADER */}
      <div className={`view-header ${scrolled ? 'scrolled' : ''}`}>
        <div>
          <h1 className="view-title">Trip Log</h1>
          <span className="view-subtitle">Distance Archive</span>
        </div>
        <div className="header-actions">
          <button className="header-icon-btn" onClick={() => exportTripPDF(filteredTrips, vehicles)}>
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
          {/* VEHICLE FILTERS */}
          <div className="action-scroll">
            <button onClick={() => setActiveVehicleId('all')} className={`action-chip ${activeVehicleId === 'all' ? 'bg-lavender border-none' : ''}`} style={activeVehicleId === 'all' ? { color: 'var(--bg-primary)' } : {}}>All Units</button>
            {vehicles.map(v => (
              <button key={v.id} onClick={() => setActiveVehicleId(v.id)} className={`action-chip ${activeVehicleId === v.id ? 'bg-lavender border-none' : ''}`} style={activeVehicleId === v.id ? { color: 'var(--bg-primary)' } : {}}>{v.name}</button>
            ))}
          </div>

          {/* PURPOSE FILTERS */}
          <div className="action-scroll">
            <button onClick={() => setActivePurpose('all')} className={`action-chip ${activePurpose === 'all' ? 'bg-lavender border-none' : ''}`} style={activePurpose === 'all' ? { color: 'var(--bg-primary)' } : {}}>ALL</button>
            {PURPOSES.map(p => (
              <button key={p} onClick={() => setActivePurpose(p)} className={`action-chip ${activePurpose === p ? 'bg-lavender border-none' : ''}`} style={activePurpose === p ? { color: 'var(--bg-primary)' } : {}}>{p}</button>
            ))}
          </div>

          {/* SUMMARY */}
          {stats.count > 0 && (
            <div className="grid grid-cols-2 gap-3">
              <div className="summary-card">
                <div className="text-xs font-black opacity-40 tracking-widest mb-1 text-primary">Total Distance</div>
                <div className="text-lg font-black text-primary">{stats.totalKm.toLocaleString()} KM</div>
              </div>
              <div className="summary-card bg-success-soft">
                <div className="text-xs font-black text-success tracking-widest mb-1">Trips</div>
                <div className="text-lg font-black text-success">{stats.count}</div>
              </div>
            </div>
          )}

          {/* Trips */}
          <div className="flex flex-col gap-8 mt-2">
            {Object.keys(groupedTrips).length > 0 ? (
              Object.entries(groupedTrips).map(([date, dayTrips]) => (
                <div key={date} className="flex flex-col gap-4">
                  <div className="date-divider">{date}</div>
                  <div className="flex flex-col gap-3">
                    {dayTrips.map(trip => {
                      const vehicle = vehicles.find(v => v.id === trip.vehicleId);
                      const dist = Number(trip.endOdometer) - Number(trip.startOdometer);
                      const colorClass = purposeColors[trip.purpose] || purposeColors.Other;
                      return (
                        <div key={trip.id} className="transaction-card">
                          <div className={`icon-box ${colorClass}`}>
                            {vehicle?.type === 'bike' ? <Bike size={20} /> : <Navigation size={20} />}
                          </div>
                          <div className="flex-1">
                            <div className="flex justify-between items-start">
                              <h3 className="font-black text-sm tracking-tight text-primary">{vehicle?.name || 'Unknown'}</h3>
                              <span className={`text-xs font-black px-2 py-1 rounded-full ${colorClass}`}>{trip.purpose || 'Other'}</span>
                            </div>
                            <div className="flex justify-between items-center mt-1">
                              <span className="text-xs font-bold text-secondary tracking-widest">{dist.toLocaleString()} KM • {trip.startOdometer}→{trip.endOdometer}</span>
                              <div className="flex gap-2">
                                <button onClick={() => onEdit(trip)} className="action-btn"><Edit3 size={14} className="text-accent" /></button>
                                <button onClick={() => onDelete(trip.id)} className="action-btn"><Trash2 size={14} className="text-danger" /></button>
                              </div>
                            </div>
                            {trip.notes && <div className="mt-1 text-xs opacity-30 italic truncate">{trip.notes}</div>}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))
            ) : (
              <EmptyState icon={Route} title="No Trips Logged" subtitle="Start mapping your journeys by logging your first trip." actionLabel="Log Trip" onAction={onAddClick} />
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default TripLog;
