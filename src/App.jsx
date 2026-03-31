import React, { useState, useEffect } from 'react';
import BottomNav from './components/layout/BottomNav';
import Dashboard from './views/Dashboard';
import FuelLog from './views/FuelLog';
import TripLog from './views/TripLog';
import VehicleManager from './views/VehicleManager';
import GlassCard from './components/common/GlassCard';
import Modal from './components/common/Modal';
import { initClient, getFile, createFile, updateFile } from './lib/gdrive';
import { Car, RefreshCcw, LogOut, ChevronRight, Bike, Fuel, Plus, Route, X, AlertTriangle, Sun, Moon, Zap } from 'lucide-react';

const PURPOSES = ['Commute', 'Business', 'Personal', 'Errand', 'Long Drive', 'Other'];

const App = () => {
  const [activeView, setActiveView] = useState('dashboard');
  const [user, setUser] = useState(null);
  const [clientId] = useState(localStorage.getItem('gdrive_client_id') || '936797203666-q5rqnu3g44rsm01fbsd9d344c4em98kp.apps.googleusercontent.com');
  const [data, setData] = useState({ vehicles: [], entries: [], trips: [], services: [] });
  const [fileId, setFileId] = useState(null);
  const [loading, setLoading] = useState(false);
  const [modal, setModal] = useState({ open: false, type: 'fuel', mode: 'create', editId: null });
  const [toast, setToast] = useState(null);
  const [theme, setTheme] = useState(localStorage.getItem('ultralog_theme') || 'light');

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('ultralog_theme', theme);
  }, [theme]);

  // Glass confirm dialog state
  const [confirm, setConfirm] = useState({ open: false, message: '', onConfirm: null });

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  const showConfirm = (message, onConfirm) => {
    setConfirm({ open: true, message, onConfirm });
  };

  const [vehicleForm, setVehicleForm] = useState({ name: '', regNo: '', fuelType: 'Petrol', serviceInterval: '', type: 'car', lastServiceOdo: '', cost: '' });
  const [fuelForm, setFuelForm] = useState({ vehicleId: '', odometer: '', liters: '', cost: '', date: new Date().toISOString().split('T')[0] });
  const [tripForm, setTripForm] = useState({ vehicleId: '', startOdometer: '', endOdometer: '', purpose: 'Commute', notes: '', date: new Date().toISOString().split('T')[0] });
  const [serviceForm, setServiceForm] = useState({ vehicleId: '', odometer: '', cost: '', date: new Date().toISOString().split('T')[0], notes: '' });

  useEffect(() => {
    if (clientId) {
      initClient(clientId).then(auth => {
        if (auth?.isSignedIn?.get()) {
          setUser(auth.currentUser.get());
          loadData();
        }
      }).catch(err => console.error('GDrive Init Error:', err));
    }
  }, [clientId]);

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('ultralog_theme', theme);
  }, [theme]);

  const loadData = async () => {
    console.log('Loading data...');
    setLoading(true);
    try {
      if (window.gapi?.client?.drive) {
        console.log('GDocs client detected, fetching file...');
        const result = await getFile('mileage_data.json');
        if (result) {
          console.log('File found, ID:', result.id);
          setFileId(result.id);
          const loaded = result.data;
          setData({ vehicles: [], entries: [], trips: [], ...loaded });
        } else {
          console.log('No mileage_data.json found on Drive.');
        }
      } else {
        console.log('Using local data fallback.');
        const localData = JSON.parse(localStorage.getItem('mileage_data_local')) || { vehicles: [], entries: [], trips: [], services: [] };
        setData({ vehicles: [], entries: [], trips: [], services: [], ...localData });
      }
    } catch (err) {
      console.error('loadData error:', err);
    }
    setLoading(false);
  };

  const saveData = async (newData) => {
    const safeData = { vehicles: [], entries: [], trips: [], services: [], ...newData };
    setData(safeData);
    if (fileId && window.gapi?.client?.drive) {
      await updateFile(fileId, safeData);
    } else {
      localStorage.setItem('mileage_data_local', JSON.stringify(safeData));
    }
  };

  const handleLogin = async () => {
    console.log('Initiating handleLogin with Client ID:', clientId);
    try {
      const auth = await initClient(clientId);
      if (auth) {
        console.log('Auth instance obtained. Current user signed in:', auth.isSignedIn.get());
        if (auth.isSignedIn.get()) {
          console.log('User already signed in, retrieving profile...');
          const userObj = auth.currentUser.get();
          setUser(userObj);
          loadData();
        } else {
          console.log('Prompting for sign-in...');
          const userObj = await auth.signIn({ prompt: 'select_account' });
          console.log('Sign-in successful:', userObj.getBasicProfile().getName());
          setUser(userObj);
          loadData();
        }
      }
    } catch (err) {
      console.error('Login process failed:', err);
      // If server_error, it usually means Test User issue or configuration mismatch
      if (err.error === 'server_error' || err.error === 'idpiframe_initialization_failed') {
        alert("Google Error: Sign-in failed. If your app is in 'Testing' mode, please ensure your email is added as a 'Test User' in Google Cloud Console.");
      }
    }
  };

  const handleLocalLogin = () => {
    setUser({ getBasicProfile: () => ({ getName: () => 'Local User', getEmail: () => 'local@device', getImageUrl: () => 'https://ui-avatars.com/api/?name=LU&background=a78bfa&color=000' }) });
    loadData();
  };

  const handleLogout = () => {
    if (window.gapi?.auth2) window.gapi.auth2.getAuthInstance().signOut();
    setUser(null); setFileId(null); setData({ vehicles: [], entries: [], trips: [], services: [] });
  };

  // ---- VEHICLE ----
  const submitVehicle = (e) => {
    e.preventDefault();
    let newData;
    if (modal.mode === 'edit') {
      newData = { ...data, vehicles: data.vehicles.map(v => v.id === modal.editId ? { ...vehicleForm, id: v.id } : v) };
    } else {
      newData = { ...data, vehicles: [...data.vehicles, { ...vehicleForm, id: Date.now().toString() }] };
    }
    saveData(newData);
    setModal({ ...modal, open: false });
    setVehicleForm({ name: '', regNo: '', fuelType: 'Petrol', serviceInterval: '', type: 'car', lastServiceOdo: '', cost: '' });
    showToast(modal.mode === 'edit' ? 'Vehicle updated' : 'Vehicle added');
  };

  const handleMarkServiced = (vehicleId) => {
    const ve = data.entries.filter(e => e.vehicleId === vehicleId).sort((a, b) => new Date(a.date) - new Date(b.date));
    const lastOdo = ve.length > 0 ? ve[ve.length - 1].odometer : '0';
    const newData = { ...data, vehicles: data.vehicles.map(v => v.id === vehicleId ? { ...v, lastServiceOdo: lastOdo } : v) };
    saveData(newData);
    showToast('Service record updated ✓');
  };

  // ---- FUEL ----
  const submitFuel = (e) => {
    e.preventDefault();
    let newData;
    if (modal.mode === 'edit') {
      newData = { ...data, entries: data.entries.map((entry, idx) => idx === modal.editId ? fuelForm : entry) };
    } else {
      newData = { ...data, entries: [...data.entries, fuelForm].sort((a, b) => new Date(a.date) - new Date(b.date)) };
    }
    saveData(newData);
    setModal({ ...modal, open: false });
    setFuelForm({ vehicleId: '', odometer: '', liters: '', cost: '', date: new Date().toISOString().split('T')[0] });
    showToast(modal.mode === 'edit' ? 'Log updated' : 'Fuel log saved');
  };

  const deleteEntry = (index) => {
    showConfirm('Delete this fuel log permanently?', () => {
      const realIndex = data.entries.length - 1 - index;
      saveData({ ...data, entries: data.entries.filter((_, i) => i !== realIndex) });
      showToast('Log deleted', 'error');
    });
  };

  // ---- Trips ----
  const submitTrip = (e) => {
    e.preventDefault();
    const trips = data.trips || [];
    let newTrips;
    if (modal.mode === 'edit') {
      newTrips = trips.map((t, i) => i === modal.editId ? tripForm : t);
    } else {
      newTrips = [...trips, tripForm].sort((a, b) => new Date(a.date) - new Date(b.date));
    }
    saveData({ ...data, trips: newTrips });
    setModal({ ...modal, open: false });
    setTripForm({ vehicleId: '', startOdometer: '', endOdometer: '', purpose: 'Commute', notes: '', date: new Date().toISOString().split('T')[0] });
    showToast(modal.mode === 'edit' ? 'Trip updated' : 'Trip logged');
  };

  const deleteTrip = (index) => {
    showConfirm('Delete this trip log permanently?', () => {
      const sorted = [...(data.trips || [])].sort((a, b) => new Date(b.date) - new Date(a.date));
      const tripToDelete = sorted[index];
      saveData({ ...data, trips: (data.trips || []).filter(t => t !== tripToDelete) });
      showToast('Trip deleted', 'error');
    });
  };

  // ---- SERVICES ----
  const submitService = (e) => {
    e.preventDefault();
    const services = data.services || [];
    let newServices;
    if (modal.mode === 'edit') {
      newServices = services.map((s, i) => i === modal.editId ? serviceForm : s);
    } else {
      newServices = [...services, serviceForm].sort((a, b) => new Date(b.date) - new Date(a.date)); // Sort descending
    }
    saveData({ ...data, services: newServices });
    setModal({ ...modal, open: false });
    setServiceForm({ vehicleId: '', odometer: '', cost: '', date: new Date().toISOString().split('T')[0], notes: '' });
    showToast(modal.mode === 'edit' ? 'Service updated' : 'Service logged');
  };

  const deleteService = (index) => {
    showConfirm('Delete this service record permanently?', () => {
      const services = data.services || [];
      saveData({ ...data, services: services.filter((_, i) => i !== index) });
      showToast('Service deleted', 'error');
    });
  };

  const openModal = (type, mode = 'create', dataToEdit = null, index = null) => {
    if (mode === 'edit' && dataToEdit) {
      if (type === 'vehicle') setVehicleForm(dataToEdit);
      else if (type === 'fuel') setFuelForm(dataToEdit);
      else if (type === 'trip') setTripForm(dataToEdit);
      else if (type === 'service') setServiceForm(dataToEdit);
    } else {
      if (type === 'vehicle') setVehicleForm({ name: '', regNo: '', fuelType: 'Petrol', serviceInterval: '', type: 'car', lastServiceOdo: '', cost: '' });
      else if (type === 'fuel') setFuelForm({ vehicleId: data.vehicles[0]?.id || '', odometer: '', liters: '', cost: '', date: new Date().toISOString().split('T')[0] });
      else if (type === 'trip') setTripForm({ vehicleId: data.vehicles[0]?.id || '', startOdometer: '', endOdometer: '', purpose: 'Commute', notes: '', date: new Date().toISOString().split('T')[0] });
      else if (type === 'service') setServiceForm({ vehicleId: data.vehicles[0]?.id || '', odometer: '', cost: '', date: new Date().toISOString().split('T')[0], notes: '' });
    }
    setModal({ open: true, type, mode, editId: mode === 'edit' ? (dataToEdit?.id || index) : null });
  };

  if (!user) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-[#F8FAFC] p-6 relative">
        <div className="premium-glass-card w-full max-w-md p-12 flex flex-col items-center text-center relative z-10 animate-fade-up">
          {/* Main Illustration/Icon */}
          <div className="mb-10">
            <div className="text-7xl drop-shadow-xl">🚗</div>
          </div>

          <h1 className="text-4xl font-extrabold text-slate-900 tracking-tight mb-3 leading-tight">
            Welcome to <br /> Mileage Tracker
          </h1>

          <p className="text-[14px] font-medium text-slate-400 mb-10 leading-relaxed px-4">
            Sign in with your Google account to continue
          </p>

          <div className="w-full flex flex-col gap-4">
            <button
              onClick={handleLogin}
              className="w-full flex items-center justify-center gap-4 bg-indigo text-white font-bold py-5 px-6 rounded-3xl transition-all active:scale-[0.97] shadow-xl hover:bg-indigo/90"
            >
              <div className="w-6 h-6 bg-white rounded-full p-1 flex items-center justify-center">
                <img
                  src="https://www.svgrepo.com/show/475656/google-color.svg"
                  className="w-full h-full object-contain"
                  alt="Google"
                />
              </div>
              <span className="text-sm tracking-wide">Sign in with Google</span>
            </button>

            <button
              onClick={handleLocalLogin}
              className="w-full py-5 px-6 text-xs font-black tracking-widest uppercase text-slate-400 hover:text-slate-600 bg-slate-50 hover:bg-slate-100 rounded-3xl border border-slate-100 transition-all active:scale-[0.97] flex items-center justify-center gap-3"
            >
              <Zap size={14} className="text-slate-300" />
              <span>Offline Access</span>
            </button>
          </div>

          <div className="mt-12 text-[12px] font-medium text-slate-300 leading-relaxed max-w-[240px]">
            Your data is stored securely in your personal Google Drive
          </div>
        </div>
      </div>
    );
  }

  const trips = data.trips || [];
  const services = data.services || [];

  return (
    <div id="root">
      {loading && <div className="fixed top-0 left-0 right-0 h-1 bg-accent z-[20000] animate-pulse"></div>}

      <div className="scroll-container">
        <div className="relative z-10 flex flex-col gap-8">
          {activeView === 'dashboard' && (
            <Dashboard
              vehicles={data.vehicles}
              entries={data.entries}
              trips={trips}
              user={user}
              isSynced={!!fileId}
              onAddClick={() => openModal('fuel')}
              onMarkServiced={handleMarkServiced}
              onSettingsClick={() => setActiveView('settings')}
              onViewChange={setActiveView}
            />
          )}
          {activeView === 'fuel' && (
            <FuelLog
              vehicles={data.vehicles}
              entries={data.entries}
              onAddClick={() => openModal('fuel')}
              onEdit={(entry, idx) => openModal('fuel', 'edit', entry, idx)}
              onDelete={deleteEntry}
            />
          )}
          {activeView === 'trips' && (
            <TripLog
              vehicles={data.vehicles}
              trips={trips}
              onAddClick={() => openModal('trip')}
              onEdit={(trip, idx) => openModal('trip', 'edit', trip, idx)}
              onDelete={deleteTrip}
            />
          )}
          {activeView === 'vehicles' && (
            <VehicleManager
              vehicles={data.vehicles}
              entries={data.entries}
              services={services}
              onAddClick={() => openModal('vehicle')}
              onEdit={(v) => openModal('vehicle', 'edit', v)}
              onMarkServiced={handleMarkServiced}
              onDeleteVehicle={(id) => {
                const hasLogs = data.entries.some(e => e.vehicleId === id);
                if (hasLogs) { showToast('Vehicle has fuel logs. Cannot delete.', 'error'); return; }
                showConfirm('Permanently decommission this vehicle?', () => {
                  saveData({ ...data, vehicles: data.vehicles.filter(v => v.id !== id) });
                  showToast('Vehicle removed', 'error');
                });
              }}
            />
          )}
          {activeView === 'services' && (
            <React.Suspense fallback={<div>Loading...</div>}>
              {React.createElement(React.lazy(() => import('./views/ServiceLog')), {
                vehicles: data.vehicles,
                services: services,
                onAddClick: () => openModal('service'),
                onEdit: (service, idx) => openModal('service', 'edit', service, idx),
                onDelete: deleteService
              })}
            </React.Suspense>
          )}
          {activeView === 'settings' && (
            <div className="flex flex-col gap-10 px-2 animate-fade-up pb-32">
              <div className="flex items-center gap-5 pt-8">
                <button onClick={() => setActiveView('dashboard')} className="w-12 h-12 rounded-full bg-bg-card flex items-center justify-center border border-border shadow-sm active:scale-90 transition-all">
                  <ChevronRight size={20} className="rotate-180 text-text-secondary" />
                </button>
                <h1 className="text-4xl font-extrabold tracking-tight text-text-primary">Settings</h1>
              </div>

              {/* Account Section */}
              <div className="premium-card">
                <div className="flex items-center gap-6 mb-8">
                  <div className="w-16 h-16 rounded-2xl bg-accent-soft border border-border overflow-hidden flex items-center justify-center">
                    {user.getBasicProfile().getImageUrl() ? (
                      <img src={user.getBasicProfile().getImageUrl()} className="w-full h-full object-cover" alt="profile" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center font-black text-xl text-accent">
                        {user.getBasicProfile().getName()?.substring(0, 2).toUpperCase()}
                      </div>
                    )}
                  </div>
                  <div className="flex-1">
                    <div className="text-xl font-bold text-text-primary mb-1">{user.getBasicProfile().getName()}</div>
                    <div className="text-xs font-semibold text-text-secondary uppercase tracking-widest">{user.getBasicProfile().getEmail()}</div>
                  </div>
                </div>

                <button
                  onClick={handleLogout}
                  className="btn-premium-danger w-full"
                >
                  <LogOut size={16} />
                  <span>Deauthorize Device</span>
                </button>
              </div>

              {/* Appearance Section */}
              <div className="flex flex-col gap-5">
                <div className="flex items-center justify-between px-2">
                  <h2 className="text-xs font-bold uppercase tracking-widest text-text-secondary">Visual Theme</h2>
                  <div className="text-[10px] font-black text-accent">{theme.toUpperCase()} MODE</div>
                </div>
                <div className="pill-segmented">
                  <div
                    onClick={() => setTheme('light')}
                    className={`pill-item ${theme === 'light' ? 'active' : ''}`}
                  >
                    LIGHT
                  </div>
                  <div
                    onClick={() => setTheme('dark')}
                    className={`pill-item ${theme === 'dark' ? 'active' : ''}`}
                  >
                    DARK
                  </div>
                </div>
              </div>

              {/* Storage Section */}
              <div className="flex flex-col gap-5">
                <h2 className="text-xs font-bold uppercase tracking-widest text-text-secondary px-2">Fleet Archive</h2>
                <div className="premium-card !p-10">
                  <div className="flex items-center gap-8 mb-8">
                    <div className="fintech-icon-box shrink-0 shadow-lg">
                      <Fuel size={24} />
                    </div>
                    <div className="flex flex-col gap-1">
                      <div className="text-xl font-extrabold text-text-primary tracking-tight">{data.entries.length} Operational Records</div>
                      <div className="text-[11px] font-bold text-text-secondary uppercase tracking-[0.2em] opacity-60">{data.vehicles.length} Registered Machines</div>
                    </div>
                  </div>

                  <div className="h-[1px] bg-border w-full mb-8 opacity-50"></div>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className={`w-2.5 h-2.5 rounded-full ${fileId ? 'bg-success shadow-[0_0_10px_rgba(16,185,129,0.5)]' : 'bg-warning animate-pulse shadow-[0_0_10px_rgba(245,158,11,0.5)]'}`}></div>
                      <div className="text-[10px] font-black text-text-secondary uppercase tracking-[0.25em]">
                        {fileId ? 'Cloud Sync Active' : 'Offline Mode'}
                      </div>
                    </div>
                    {fileId && <div className="text-[10px] font-bold text-accent px-3 py-1 bg-accent-soft rounded-full">ENCRYPTED</div>}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      <BottomNav activeView={activeView} setActiveView={setActiveView} />

      {/* TOAST */}
      {toast && (
        <div className="toast-container">
          <div className={`toast ${toast.type === 'error' ? 'toast-error' : ''}`}>
            {toast.type === 'error' ? <LogOut size={16} /> : <ChevronRight size={16} />}
            {toast.message}
          </div>
        </div>
      )}

      {/* GLASS CONFIRM DIALOG */}
      {confirm.open && (
        <div className="overlay-fixed">
          <div className="backdrop" onClick={() => setConfirm({ open: false, message: '', onConfirm: null })}></div>
          <div className="modal-content !max-w-sm animate-slideUp text-primary">
            <div className="flex flex-col gap-6 p-8">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-warning-soft flex items-center justify-center">
                  <AlertTriangle size={20} className="text-warning" />
                </div>
                <p className="text-sm font-bold opacity-80 flex-1">{confirm.message}</p>
              </div>
              <div className="flex gap-3">
                <button
                  onClick={() => setConfirm({ open: false, message: '', onConfirm: null })}
                  className="flex-1 py-4 rounded-2xl bg-secondary border border-theme font-black text-xs tracking-widest text-primary"
                >
                  Cancel
                </button>
                <button
                  onClick={() => { confirm.onConfirm?.(); setConfirm({ open: false, message: '', onConfirm: null }); }}
                  className="flex-1 py-4 rounded-2xl bg-danger-soft border border-danger text-danger font-black text-xs tracking-widest"
                >
                  Confirm
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL */}
      <Modal
        isOpen={modal.open}
        onClose={() => setModal({ ...modal, open: false })}
        title={
          modal.mode === 'edit'
            ? (modal.type === 'fuel' ? 'Edit Log' : modal.type === 'trip' ? 'Edit Trip' : modal.type === 'service' ? 'Edit Service' : 'Edit Vehicle')
            : (modal.type === 'fuel' ? 'New Fuel Log' : modal.type === 'trip' ? 'Log Trip' : modal.type === 'service' ? 'Log Service' : 'Add Vehicle')
        }
      >
        {modal.type === 'fuel' && (
          <form onSubmit={submitFuel} className="flex flex-col gap-6">
            <div className="flex flex-col gap-2">
              <label className="label-small">Machine</label>
              <select className="input-glass" value={fuelForm.vehicleId} onChange={e => setFuelForm({ ...fuelForm, vehicleId: e.target.value })} required>
                <option value="" disabled>Select Vehicle</option>
                {data.vehicles.map(v => <option key={v.id} value={v.id}>{v.name}</option>)}
              </select>
            </div>
            <div className="flex flex-col gap-2">
              <label className="label-small">Odometer (KM)</label>
              <input type="number" className="input-glass" value={fuelForm.odometer} onChange={e => setFuelForm({ ...fuelForm, odometer: e.target.value })} required />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="flex flex-col gap-2">
                <label className="label-small">Liters</label>
                <input type="number" step="0.01" className="input-glass" value={fuelForm.liters} onChange={e => setFuelForm({ ...fuelForm, liters: e.target.value })} required />
              </div>
              <div className="flex flex-col gap-2">
                <label className="label-small">Cost (₹)</label>
                <input type="number" step="0.01" className="input-glass" value={fuelForm.cost} onChange={e => setFuelForm({ ...fuelForm, cost: e.target.value })} required />
              </div>
            </div>
            <div className="flex flex-col gap-2">
              <label className="label-small">Date</label>
              <input type="date" className="input-glass" value={fuelForm.date} onChange={e => setFuelForm({ ...fuelForm, date: e.target.value })} required />
            </div>
            {fuelForm.liters > 0 && fuelForm.cost > 0 && (
              <div className="text-xs font-black text-secondary text-center">
                ₹{(Number(fuelForm.cost) / Number(fuelForm.liters)).toFixed(2)} per liter
              </div>
            )}
            <button type="submit" className="premium-btn w-full mt-2 text-bg-primary" style={{ color: 'var(--bg-primary)' }}>
              {modal.mode === 'edit' ? 'CONFIRM CHANGES' : 'SAVE ENTRY'}
            </button>
          </form>
        )}

        {modal.type === 'trip' && (
          <form onSubmit={submitTrip} className="flex flex-col gap-6">
            <div className="flex flex-col gap-2">
              <label className="label-small">Vehicle</label>
              <select className="input-glass" value={tripForm.vehicleId} onChange={e => setTripForm({ ...tripForm, vehicleId: e.target.value })} required>
                <option value="" disabled>Select Vehicle</option>
                {data.vehicles.map(v => <option key={v.id} value={v.id}>{v.name}</option>)}
              </select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="flex flex-col gap-2">
                <label className="label-small">Start KM</label>
                <input type="number" className="input-glass" value={tripForm.startOdometer} onChange={e => setTripForm({ ...tripForm, startOdometer: e.target.value })} required />
              </div>
              <div className="flex flex-col gap-2">
                <label className="label-small">End KM</label>
                <input type="number" className="input-glass" value={tripForm.endOdometer} onChange={e => setTripForm({ ...tripForm, endOdometer: e.target.value })} required />
              </div>
            </div>
            {tripForm.startOdometer && tripForm.endOdometer && Number(tripForm.endOdometer) > Number(tripForm.startOdometer) && (
              <div className="text-xs font-black text-secondary text-center">
                {(Number(tripForm.endOdometer) - Number(tripForm.startOdometer)).toLocaleString()} KM distance
              </div>
            )}
            <div className="flex flex-col gap-2">
              <label className="label-small">Purpose</label>
              <select className="input-glass" value={tripForm.purpose} onChange={e => setTripForm({ ...tripForm, purpose: e.target.value })}>
                {PURPOSES.map(p => <option key={p} value={p}>{p}</option>)}
              </select>
            </div>
            <div className="flex flex-col gap-2">
              <label className="label-small">Date</label>
              <input type="date" className="input-glass" value={tripForm.date} onChange={e => setTripForm({ ...tripForm, date: e.target.value })} required />
            </div>
            <div className="flex flex-col gap-2">
              <label className="label-small">Notes (optional)</label>
              <input className="input-glass" placeholder="e.g. Client meeting, airport run..." value={tripForm.notes} onChange={e => setTripForm({ ...tripForm, notes: e.target.value })} />
            </div>
            <button type="submit" className="premium-btn w-full mt-2" style={{ color: 'var(--bg-primary)' }}>
              {modal.mode === 'edit' ? 'CONFIRM CHANGES' : 'Log Trip'}
            </button>
          </form>
        )}

        {modal.type === 'service' && (
          <form onSubmit={submitService} className="flex flex-col gap-6">
            <div className="flex flex-col gap-2">
              <label className="label-small">Machine</label>
              <select className="input-glass" value={serviceForm.vehicleId} onChange={e => setServiceForm({ ...serviceForm, vehicleId: e.target.value })} required>
                <option value="" disabled>Select Vehicle</option>
                {data.vehicles.map(v => <option key={v.id} value={v.id}>{v.name}</option>)}
              </select>
            </div>
            <div className="flex flex-col gap-2">
              <label className="label-small">Odometer (KM)</label>
              <input type="number" className="input-glass" value={serviceForm.odometer} onChange={e => setServiceForm({ ...serviceForm, odometer: e.target.value })} required />
            </div>
            <div className="flex flex-col gap-2">
              <label className="label-small">Cost (₹)</label>
              <input type="number" step="0.01" className="input-glass" value={serviceForm.cost} onChange={e => setServiceForm({ ...serviceForm, cost: e.target.value })} required />
            </div>
            <div className="flex flex-col gap-2">
              <label className="label-small">Date</label>
              <input type="date" className="input-glass" value={serviceForm.date} onChange={e => setServiceForm({ ...serviceForm, date: e.target.value })} required />
            </div>
            <div className="flex flex-col gap-2">
              <label className="label-small">Notes (Maintenance Details)</label>
              <input className="input-glass" placeholder="e.g. Oil change, brake pads..." value={serviceForm.notes} onChange={e => setServiceForm({ ...serviceForm, notes: e.target.value })} />
            </div>
            <button type="submit" className="premium-btn w-full mt-2" style={{ color: 'var(--bg-primary)' }}>
              {modal.mode === 'edit' ? 'UPDATE SERVICE' : 'LOG SERVICE'}
            </button>
          </form>
        )}

        {modal.type === 'vehicle' && (
          <form onSubmit={submitVehicle} className="flex flex-col gap-6">
            <div className="segmented-control">
              <div onClick={() => setVehicleForm({ ...vehicleForm, type: 'car' })} className={`segmented-item ${vehicleForm.type === 'car' ? 'active' : ''}`}><Car size={16} /> CAR</div>
              <div onClick={() => setVehicleForm({ ...vehicleForm, type: 'bike' })} className={`segmented-item ${vehicleForm.type === 'bike' ? 'active' : ''}`}><Bike size={16} /> BIKE</div>
            </div>
            <div className="flex flex-col gap-2">
              <label className="label-small">Vehicle Name</label>
              <input className="input-glass" value={vehicleForm.name} onChange={e => setVehicleForm({ ...vehicleForm, name: e.target.value })} required />
            </div>
            <div className="flex flex-col gap-2">
              <label className="label-small">Plate Number</label>
              <input className="input-glass" value={vehicleForm.regNo} onChange={e => setVehicleForm({ ...vehicleForm, regNo: e.target.value })} required />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="flex flex-col gap-2">
                <label className="label-small h-[28px] flex items-end">Propulsion</label>
                <select className="input-glass" value={vehicleForm.fuelType} onChange={e => setVehicleForm({ ...vehicleForm, fuelType: e.target.value })}>
                  <option>Petrol</option><option>Diesel</option><option>Electric</option><option>CNG</option>
                </select>
              </div>
              <div className="flex flex-col gap-2">
                <label className="label-small h-[28px] flex items-end">Service Interval</label>
                <input type="number" className="input-glass" value={vehicleForm.serviceInterval} onChange={e => setVehicleForm({ ...vehicleForm, serviceInterval: e.target.value })} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="flex flex-col gap-2">
                <label className="label-small h-[28px] flex items-end">Last Service (KM)</label>
                <input type="number" className="input-glass" placeholder="Odometer" value={vehicleForm.lastServiceOdo} onChange={e => setVehicleForm({ ...vehicleForm, lastServiceOdo: e.target.value })} />
              </div>
              <div className="flex flex-col gap-2">
                <label className="label-small h-[28px] flex items-end">Purchase Price (₹)</label>
                <input type="number" className="input-glass" placeholder="Purchase Cost" value={vehicleForm.cost} onChange={e => setVehicleForm({ ...vehicleForm, cost: e.target.value })} />
              </div>
            </div>
            <button type="submit" className="premium-btn w-full mt-2 font-bold" style={{ color: 'var(--bg-primary)' }}>
              {modal.mode === 'edit' ? 'UPDATE MACHINE' : 'DEPLOY VEHICLE'}
            </button>
          </form>
        )}
      </Modal>
    </div>
  );
};

export default App;
