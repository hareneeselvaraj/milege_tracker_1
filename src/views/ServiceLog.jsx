import React, { useState, useRef, useEffect } from 'react';
import GlassCard from '../components/common/GlassCard';
import EmptyState from '../components/common/EmptyState';
import { Wrench, Plus, Trash2, Pencil, Calendar, Download } from 'lucide-react';
import { exportServicePDF } from '../lib/exportUtils';

const ServiceLog = ({ vehicles, services, onAddClick, onEdit, onDelete }) => {
  const [scrolled, setScrolled] = useState(false);
  const contentRef = useRef(null);

  useEffect(() => {
    const el = contentRef.current;
    if (!el) return;
    const handler = () => setScrolled(el.scrollTop > 8);
    el.addEventListener('scroll', handler, { passive: true });
    return () => el.removeEventListener('scroll', handler);
  }, []);

  return (
    <div className="view-container">
      {/* FIXED HEADER */}
      <div className={`view-header ${scrolled ? 'scrolled' : ''}`}>
        <div>
          <h1 className="view-title">Service History</h1>
          <span className="view-subtitle">Maintenance Records</span>
        </div>
        <div className="header-actions">
          {services.length > 0 && (
            <button className="header-icon-btn" onClick={() => exportServicePDF(services, vehicles)}>
              <Download size={20} />
            </button>
          )}
          <button className="header-icon-btn primary" onClick={onAddClick}>
            <Plus size={22} />
          </button>
        </div>
      </div>

      {/* SCROLLABLE CONTENT */}
      <div className="view-content" ref={contentRef}>
        <div className="flex flex-col gap-4 animate-fade-up">
          {services.length === 0 ? (
            <EmptyState icon={Wrench} title="No Services Logged" subtitle="Keep track of your vehicle maintenance." actionLabel="Log Service" onAction={onAddClick} />
          ) : (
            services.map(service => {
              const vehicle = vehicles.find(v => v.id === service.vehicleId);
              return (
                <GlassCard key={service.id} style={{ padding: 'var(--space-xl)' }}>
                  <div className="flex justify-between items-start mb-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-2xl bg-accent-soft border-theme flex items-center justify-center shrink-0">
                        <Wrench size={18} className="text-accent" />
                      </div>
                      <div>
                        <div className="font-black text-sm text-primary">{vehicle ? vehicle.name : 'Unknown'}</div>
                        <div className="text-xs text-secondary opacity-70 flex items-center gap-1">
                          <Calendar size={11} />
                          {new Date(service.date).toLocaleDateString(undefined, { day: '2-digit', month: 'short', year: 'numeric' })}
                        </div>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <button className="action-btn" onClick={() => onEdit(service)}><Pencil size={14} /></button>
                      <button className="action-btn" onClick={() => onDelete(service.id)}><Trash2 size={14} /></button>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-2 mb-4">
                    <div className="bg-secondary border-theme rounded-xl p-3">
                      <div style={{ fontSize: 'var(--type-caption)' }} className="font-black tracking-widest opacity-40 text-primary mb-1">Odometer</div>
                      <div className="font-black text-primary">{Number(service.odometer).toLocaleString()} KM</div>
                    </div>
                    <div className="bg-secondary border-theme rounded-xl p-3">
                      <div style={{ fontSize: 'var(--type-caption)' }} className="font-black tracking-widest opacity-40 text-primary mb-1">Cost</div>
                      <div className="font-black text-rose-400">₹{Number(service.cost).toLocaleString()}</div>
                    </div>
                  </div>
                  {service.notes && (
                    <div className="text-xs font-bold text-secondary opacity-80 border-t pt-3 mt-2">{service.notes}</div>
                  )}
                </GlassCard>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};

export default ServiceLog;
