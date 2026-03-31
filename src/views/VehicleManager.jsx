import React, { useState, useRef, useEffect } from 'react';
import GlassCard from '../components/common/GlassCard';
import { Car, Trash2, Bike, ShieldCheck, Plus, Pencil, Wrench, AlertTriangle, CheckCircle, IndianRupee, ChevronDown, Fuel } from 'lucide-react';

const VehicleManager = ({ vehicles, entries, services, trips, onDeleteVehicle, onAddClick, onEdit, onMarkServiced }) => {
  const [activeTab, setActiveTab] = useState('fleet');
  const [expandedVehicle, setExpandedVehicle] = useState(null);
  const [scrolled, setScrolled] = useState(false);
  const contentRef = useRef(null);

  useEffect(() => {
    const el = contentRef.current;
    if (!el) return;
    const handler = () => setScrolled(el.scrollTop > 8);
    el.addEventListener('scroll', handler, { passive: true });
    return () => el.removeEventListener('scroll', handler);
  }, []);
  const getServiceStatus = (vehicle) => {
    if (!vehicle.serviceInterval) return null;
    const ve = entries
      .filter(e => e.vehicleId === vehicle.id)
      .sort((a, b) => new Date(a.date) - new Date(b.date));
    if (ve.length === 0) return null;
    const latestOdo = Number(ve[ve.length - 1].odometer);
    const lastServiceOdo = Number(vehicle.lastServiceOdo || 0);
    const kmSince = latestOdo - lastServiceOdo;
    const interval = Number(vehicle.serviceInterval);
    if (kmSince >= interval) return { label: 'OVERDUE', color: 'text-danger bg-danger-soft' };
    if (kmSince >= interval * 0.85) return { label: 'DUE SOON', color: 'text-warning bg-warning-soft' };
    return { label: 'OK', color: 'text-success bg-success-soft' };
  };

  const getTotalKm = (vehicle) => {
    let maxOdo = 0;
    
    // Check fuel entries
    const ve = entries.filter(e => e.vehicleId === vehicle.id);
    ve.forEach(e => { if (Number(e.odometer) > maxOdo) maxOdo = Number(e.odometer); });
    
    // Check services
    const vs = (services || []).filter(s => s.vehicleId === vehicle.id);
    vs.forEach(s => { if (Number(s.odometer) > maxOdo) maxOdo = Number(s.odometer); });
    
    // Check trips
    const vt = (trips || []).filter(t => t.vehicleId === vehicle.id);
    vt.forEach(t => { if (Number(t.endOdometer) > maxOdo) maxOdo = Number(t.endOdometer); });
    
    if (maxOdo === 0) return null;
    return maxOdo;
  };

  const getOwnershipData = (vehicle) => {
    const vEntries = entries.filter(e => e.vehicleId === vehicle.id);
    const vServices = (services || []).filter(s => s.vehicleId === vehicle.id);
    const totalFuelCost = vEntries.reduce((sum, e) => sum + Number(e.cost || 0), 0);
    const totalServiceCost = vServices.reduce((sum, s) => sum + Number(s.cost || 0), 0);
    const purchaseCost = Number(vehicle.cost || 0);

    const totalKm = getTotalKm(vehicle) || 0;
    const totalSpend = purchaseCost + totalFuelCost + totalServiceCost;

    // To calculate cost properly we need totalKm > 0.
    const costPerKm = totalKm > 0 ? (totalSpend / totalKm).toFixed(2) : '--';

    return { totalSpend, purchaseCost, totalFuelCost, totalServiceCost, totalKm, costPerKm };
  };

  return (
    <div className="view-container">
      {/* FIXED HEADER */}
      <div className={`view-header ${scrolled ? 'scrolled' : ''}`}>
        <div>
          <h1 className="view-title">Garage</h1>
          <span className="view-subtitle">Secure Unit Storage</span>
        </div>
        <div className="header-actions">
          <button className="header-icon-btn primary" onClick={onAddClick}>
            <Plus size={22} />
          </button>
        </div>
      </div>

      {/* SCROLLABLE CONTENT */}
      <div className="view-content" ref={contentRef}>
      <div className="segmented-control mt-2 mb-2">
        <div onClick={() => setActiveTab('fleet')} className={`segmented-item ${activeTab === 'fleet' ? 'active' : ''}`}>Current Garage</div>
        <div onClick={() => setActiveTab('ownership')} className={`segmented-item ${activeTab === 'ownership' ? 'active' : ''}`}>Ownership Cost</div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0 4px' }}>
          <h2 className="label-small">{activeTab === 'fleet' ? 'Active Fleet' : 'Cost Analysis'}</h2>
          <ShieldCheck size={16} className="text-accent opacity-30" />
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {vehicles.map((vehicle) => {
            const serviceStatus = getServiceStatus(vehicle);
            const totalKm = getTotalKm(vehicle);
            const ownership = getOwnershipData(vehicle);
            const isExpanded = expandedVehicle === vehicle.id;

            return (
              <div key={vehicle.id} className="glass-card" style={{ padding: '20px', gap: '14px', transition: 'all 0.4s cubic-bezier(0.16, 1, 0.3, 1)' }}>
                <div 
                  style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: activeTab === 'ownership' ? 'pointer' : 'default' }}
                  onClick={() => { if(activeTab === 'ownership') setExpandedVehicle(isExpanded ? null : vehicle.id); }}
                  className="hover:opacity-90 transition-opacity"
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                    <div className="bg-primary border-theme" style={{ width: '48px', height: '48px', borderRadius: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, position: 'relative', overflow: 'hidden', boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }}>
                      <div className="absolute inset-0 bg-gradient-to-br from-accent-soft to-transparent opacity-80"></div>
                      {vehicle.type === 'bike'
                        ? <Bike className="text-accent relative z-10" size={24} />
                        : <Car className="text-accent relative z-10" size={24} />}
                    </div>
                    <div>
                      <div className="text-primary tracking-tight" style={{ fontWeight: 900, fontSize: '18px', marginBottom: '2px' }}>{vehicle.name}</div>
                      <div style={{ fontSize: '10px', color: 'var(--text-secondary)', fontWeight: 800, letterSpacing: '1px' }}>
                        {vehicle.regNo} • {vehicle.fuelType}
                      </div>
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: '12px', alignItems: 'center', flexShrink: 0 }}>
                    {activeTab !== 'ownership' && (
                      <div style={{ display: 'flex', gap: '4px' }}>
                        <button onClick={(e) => { e.stopPropagation(); onEdit(vehicle); }} className="action-btn bg-white-50 backdrop-blur-md"><Pencil size={16} /></button>
                        <button onClick={(e) => { e.stopPropagation(); onDeleteVehicle(vehicle.id); }} className="action-btn bg-danger-soft backdrop-blur-md"><Trash2 size={16} className="text-danger" /></button>
                      </div>
                    )}
                    {activeTab === 'ownership' && (
                      <div className={`transform transition-transform duration-[400ms] flex items-center justify-center w-8 h-8 rounded-[12px] border ${isExpanded ? 'rotate-180 bg-accent border-accent text-bg-primary shadow-lavender' : 'bg-secondary border-theme text-accent opacity-70'}`}>
                        <ChevronDown size={18} strokeWidth={3} />
                      </div>
                    )}
                  </div>
                </div>

                {(activeTab !== 'ownership' || isExpanded) && (
                  <div className="flex flex-col gap-4 animate-in">
                    {/* Stats Row */}
                    <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                      {totalKm !== null && (
                        <div className="bg-secondary border-theme text-primary" style={{ fontSize: '10px', fontWeight: 800, padding: '4px 10px', borderRadius: '99px' }}>
                          {totalKm.toLocaleString()} KM TRACKED
                        </div>
                      )}
                      {vehicle.serviceInterval && (
                        <div className="bg-secondary border-theme text-primary" style={{ fontSize: '10px', fontWeight: 800, padding: '4px 10px', borderRadius: '99px' }}>
                          SVS: Every {Number(vehicle.serviceInterval).toLocaleString()} KM
                        </div>
                      )}
                    </div>

                    {/* Service Status */}
                    {serviceStatus && (
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div className={`text-xs font-black px-3 py-1 rounded-full border ${serviceStatus.color}`} style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                          {serviceStatus.label === 'OK'
                            ? <CheckCircle size={12} />
                            : <AlertTriangle size={12} />}
                          {serviceStatus.label}
                        </div>
                        {serviceStatus.label !== 'OK' && onMarkServiced && (
                          <button
                            onClick={(e) => { e.stopPropagation(); onMarkServiced(vehicle.id); }}
                            style={{ fontSize: '10px', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '4px', opacity: 0.6 }}
                            className="hover:opacity-100 transition-opacity"
                          >
                            <Wrench size={12} /> Mark Serviced
                          </button>
                        )}
                      </div>
                    )}

                    {activeTab === 'ownership' && (
                      <div className="flex flex-col mt-4 border-t border-theme pt-5">
                        <div className="grid grid-cols-2 gap-3 mb-3">
                          <div className="bg-secondary border-theme rounded-[20px] p-4 flex flex-col justify-between shadow-sm relative overflow-hidden" style={{ minHeight: '90px' }}>
                             <div className="absolute -right-4 -bottom-4" style={{ opacity: 0.05 }}><Car size={80} /></div>
                             <div className="flex items-center gap-2 mb-2 relative z-10">
                               <div className="w-6 h-6 rounded-full bg-accent-soft text-accent flex items-center justify-center shrink-0">
                                 <IndianRupee size={12} strokeWidth={3} />
                               </div>
                               <span className="text-[9px] font-black tracking-widest text-primary opacity-50">Value</span>
                             </div>
                             <div className="text-lg font-black text-primary relative z-10">₹{ownership.purchaseCost.toLocaleString()}</div>
                          </div>
                          
                          <div className="bg-secondary border-theme rounded-[20px] p-4 flex flex-col justify-between shadow-sm relative overflow-hidden" style={{ minHeight: '90px' }}>
                             <div className="absolute -right-4 -bottom-4" style={{ opacity: 0.05 }}><Wrench size={80} /></div>
                             <div className="flex items-center gap-2 mb-2 relative z-10">
                               <div className="w-6 h-6 rounded-full bg-blue-soft text-blue-soft flex items-center justify-center shrink-0">
                                 <Wrench size={12} strokeWidth={3} />
                               </div>
                               <span className="text-[9px] font-black tracking-widest text-primary opacity-50">Service</span>
                             </div>
                             <div className="text-lg font-black text-primary relative z-10">₹{ownership.totalServiceCost.toLocaleString()}</div>
                          </div>
                          
                          <div className="bg-secondary border-theme rounded-[20px] p-4 flex flex-col justify-between col-span-2 shadow-sm relative overflow-hidden" style={{ minHeight: '80px' }}>
                             <div className="absolute -right-2 -bottom-6" style={{ opacity: 0.05 }}><Fuel size={120} /></div>
                             <div className="flex items-center justify-between relative z-10 w-full">
                                <div className="flex items-center gap-3">
                                  <div className="w-8 h-8 rounded-full bg-danger-soft text-danger flex items-center justify-center shrink-0">
                                    <Fuel size={16} strokeWidth={3} />
                                  </div>
                                  <span className="text-[10px] font-black tracking-widest text-primary opacity-60">Fuel Spend</span>
                                </div>
                                <div className="text-xl font-black text-danger tracking-tight">₹{ownership.totalFuelCost.toLocaleString()}</div>
                             </div>
                          </div>
                        </div>

                        <div className="hero-box py-6 px-5 rounded-[24px] border-theme flex justify-between items-center bg-gradient-to-br from-accent-soft to-transparent relative overflow-hidden mt-1" style={{ boxShadow: '0 10px 30px rgba(167, 139, 250, 0.1)' }}>
                          <div className="z-10 flex flex-col items-start text-left">
                            <div className="text-[9px] font-black tracking-widest text-accent mb-1 flex items-center gap-1.5 opacity-80">
                               True Ownership Score
                            </div>
                            <div className="text-4xl font-black text-primary tracking-tighter shadow-sm flex items-baseline gap-1 mb-1">
                              {ownership.costPerKm !== '--' ? `₹${ownership.costPerKm}` : '--'}
                              {ownership.costPerKm !== '--' && <span className="text-[12px] font-bold text-primary opacity-40 tracking-widest ml-1 hidden sm:inline">/ KM</span>}
                            </div>
                            <div className="text-[9px] font-bold text-primary opacity-40 tracking-widest">
                              Tracked over {ownership.totalKm.toLocaleString()} KM
                            </div>
                          </div>
                          {ownership.totalKm > 0 && (
                            <div className="z-10 bg-accent text-bg-primary font-black text-[10px] px-3 py-2 rounded-full tracking-widest h-fit opacity-90 shadow-lavender shrink-0">
                               Score
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                )}

                <div className="card-bg-icon">
                  {vehicle.type === 'bike' ? <Bike size={100} /> : <Car size={100} />}
                </div>
              </div>
            );
          })}
          {vehicles.length === 0 && (
            <div className="text-primary" style={{ padding: '80px 0', textAlign: 'center', opacity: 0.2 }}>
              <Car size={64} strokeWidth={1} style={{ marginBottom: '16px' }} />
              <p className="label-small">Hangar Empty</p>
            </div>
          )}
        </div>
      </div>
      </div>
    </div>
  );
};

export default VehicleManager;
