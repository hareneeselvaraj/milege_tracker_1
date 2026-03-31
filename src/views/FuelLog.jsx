import React, { useState, useMemo } from 'react';
import GlassCard from '../components/common/GlassCard';
import { Fuel, Search, Download, Plus, Trash2, Edit3, Bike, Info, FileText } from 'lucide-react';
import { exportFuelPDF, exportCSV } from '../lib/exportUtils';

const FuelLog = ({ vehicles, entries, onAddClick, onEdit, onDelete }) => {
  const [activeVehicleId, setActiveVehicleId] = useState('all');

  const filteredEntries = useMemo(() => {
    return entries
      .filter(entry => {
        const vehicleMatch = activeVehicleId === 'all' || entry.vehicleId === activeVehicleId;
        return vehicleMatch;
      })
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
    return {
      cost: totalCost.toLocaleString(),
      liters: totalLiters.toFixed(1),
      count: filteredEntries.length,
      avgPPL,
    };
  }, [filteredEntries]);

  const filterLabel = activeVehicleId === 'all'
    ? 'All Units'
    : vehicles.find(v => v.id === activeVehicleId)?.name || 'Unknown';

  return (
    <div className="flex flex-col gap-6 animate-in pb-32">
      <header className="relative w-full px-1">
        <div className="flex flex-col">
          <h1 className="title-large text-3xl font-black tracking-tighter text-primary">Fuel Archive</h1>
          <span className="label-small opacity-50 text-secondary">Secure Logs</span>
        </div>
        
        {/* Absolute buttons aligned perfectly with the title container */}
        <div style={{ position: 'absolute', top: '0px', right: '0px', display: 'flex', gap: '12px' }}>
          <button 
            onClick={() => exportFuelPDF(filteredEntries, vehicles, filterLabel)} 
            className="header-btn"
            style={{ position: 'relative', top: 'auto', right: 'auto', width: '48px', height: '48px', background: 'var(--bg-secondary)', color: 'var(--text-primary)' }}
          >
            <Download size={22} strokeWidth={2.5} />
          </button>
          <button 
            onClick={onAddClick} 
            className="header-btn"
            style={{ position: 'relative', top: 'auto', right: 'auto', width: '48px', height: '48px', background: 'var(--accent)', color: 'var(--bg-primary)', boxShadow: '0 10px 30px rgba(167, 139, 250, 0.3)' }}
          >
            <Plus size={24} strokeWidth={3} />
          </button>
        </div>
      </header>



      {/* FILTERS */}
      <div className="action-scroll">
        <button
          onClick={() => setActiveVehicleId('all')}
          className={`action-chip ${activeVehicleId === 'all' ? 'bg-lavender border-none' : ''}`}
          style={activeVehicleId === 'all' ? { color: 'var(--bg-primary)' } : {}}
        >
          All Units
        </button>
        {vehicles.map(v => (
          <button
            key={v.id}
            onClick={() => setActiveVehicleId(v.id)}
            className={`action-chip ${activeVehicleId === v.id ? 'bg-lavender border-none' : ''}`}
            style={activeVehicleId === v.id ? { color: 'var(--bg-primary)' } : {}}
          >
            {v.name}
          </button>
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
      <div className="flex flex-col gap-8 mt-4">
        {Object.keys(groupedEntries).length > 0 ? (
          Object.entries(groupedEntries).map(([date, dayEntries]) => (
            <div key={date} className="flex flex-col gap-4">
              <div className="date-divider">{date}</div>
              <div className="flex flex-col gap-3">
                {dayEntries.map((entry, idx) => {
                  const vehicle = vehicles.find(v => v.id === entry.vehicleId);
                  const ppl = entry.liters > 0 ? (Number(entry.cost) / Number(entry.liters)).toFixed(1) : null;
                  return (
                    <div key={idx} className="transaction-card">
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
                          <div className="flex gap-2">
                            <button onClick={() => onEdit(entry, idx)} className="action-btn !w-8 !h-8 bg-secondary"><Edit3 size={14} className="text-accent" /></button>
                            <button onClick={() => onDelete(idx)} className="action-btn !w-8 !h-8 bg-secondary"><Trash2 size={14} className="text-danger" /></button>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))
        ) : (
          <div className="flex flex-col items-center justify-center py-20 gap-4 opacity-20 text-primary">
            <Info size={48} />
            <div className="text-center">
              <div className="font-black text-sm tracking-widest">No Logs</div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default FuelLog;
