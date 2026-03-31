import React, { useState } from 'react';
import { AlertTriangle, X, Wrench } from 'lucide-react';

const ReminderBanner = ({ alerts, onMarkServiced }) => {
  const [dismissed, setDismissed] = useState([]);

  const visible = alerts.filter((a, i) => !dismissed.includes(i));
  if (visible.length === 0) return null;

  return (
    <div className="flex flex-col gap-3">
      {visible.map((alert, i) => (
        <div
          key={i}
          className={`flex items-start gap-3 p-4 rounded-3xl border animate-in ${
            alert.type === 'service_overdue'
              ? 'bg-rose-400/10 border-rose-400/30'
              : 'bg-amber-400/10 border-amber-400/30'
          }`}
        >
          <AlertTriangle
            size={18}
            className={`shrink-0 mt-0.5 ${alert.type === 'service_overdue' ? 'text-rose-400' : 'text-amber-400'}`}
          />
          <div className="flex-1">
            <div className={`text-xs font-black uppercase tracking-widest mb-1 ${
              alert.type === 'service_overdue' ? 'text-rose-400' : 'text-amber-400'
            }`}>
              {alert.type === 'service_overdue' ? 'Service Overdue' : 'Service Due Soon'}
            </div>
            <p className="text-xs font-bold opacity-80">{alert.message}</p>
            {onMarkServiced && alert.vehicleId && (
              <button
                onClick={() => {
                  onMarkServiced(alert.vehicleId);
                  setDismissed(prev => [...prev, i]);
                }}
                className="mt-2 flex items-center gap-1 text-xs font-black tracking-widest opacity-60 hover:opacity-100 transition-opacity"
              >
                <Wrench size={12} /> Mark as Serviced
              </button>
            )}
          </div>
          <button
            onClick={() => setDismissed(prev => [...prev, i])}
            className="shrink-0 opacity-40 hover:opacity-100 transition-opacity"
          >
            <X size={16} />
          </button>
        </div>
      ))}
    </div>
  );
};

export default ReminderBanner;
