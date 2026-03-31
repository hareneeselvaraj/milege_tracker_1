import React from 'react';
import GlassCard from '../components/common/GlassCard';
import { Wrench, Plus, Trash2, Pencil, Calendar, Settings } from 'lucide-react';

const ServiceLog = ({ vehicles, services, onAddClick, onEdit, onDelete }) => {
  return (
    <div className="flex flex-col gap-8 fade-in pb-32">
      <header className="relative w-full">
        <div className="flex flex-col">
          <h1 className="title-large text-primary">Service History</h1>
          <span className="label-small text-secondary">Maintenance Records</span>
        </div>
        <button className="header-btn flex items-center justify-center" onClick={onAddClick}>
          <Plus size={24} strokeWidth={3} />
        </button>
      </header>

      <div className="flex flex-col gap-4">
        {services.length === 0 ? (
          <div className="text-primary py-20 text-center opacity-20">
            <Settings size={64} strokeWidth={1} className="mx-auto mb-4" />
            <p className="label-small">No Services Logged</p>
          </div>
        ) : (
          services.map((service, index) => {
            const vehicle = vehicles.find(v => v.id === service.vehicleId);
            return (
              <GlassCard key={index} className="!p-5 !pb-4">
                <div className="flex justify-between items-start mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-2xl bg-accent-soft border border-theme flex items-center justify-center shrink-0">
                      <Wrench size={18} className="text-accent" />
                    </div>
                    <div>
                      <div className="font-black text-sm text-primary">{vehicle ? vehicle.name : 'Unknown Machine'}</div>
                      <div className="text-[10px] tracking-widest text-secondary opacity-70 flex items-center gap-1">
                        <Calendar size={10} />
                        {new Date(service.date).toLocaleDateString(undefined, { day: '2-digit', month: 'short', year: 'numeric' })}
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button className="action-btn" onClick={() => onEdit(service, index)}><Pencil size={14} /></button>
                    <button className="action-btn" onClick={() => onDelete(index)}><Trash2 size={14} /></button>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2 mb-4">
                  <div className="bg-secondary border-theme rounded-xl p-3">
                    <div className="text-[9px] font-black tracking-widest opacity-40 text-primary mb-1">Odometer</div>
                    <div className="font-black text-primary">{Number(service.odometer).toLocaleString()} KM</div>
                  </div>
                  <div className="bg-secondary border-theme rounded-xl p-3">
                    <div className="text-[9px] font-black tracking-widest opacity-40 text-primary mb-1">Cost</div>
                    <div className="font-black text-rose-400">₹{Number(service.cost).toLocaleString()}</div>
                  </div>
                </div>

                {service.notes && (
                  <div className="text-xs font-bold text-secondary opacity-80 border-t border-theme pt-3 mt-2">
                    {service.notes}
                  </div>
                )}
              </GlassCard>
            );
          })
        )}
      </div>
    </div>
  );
};

export default ServiceLog;
