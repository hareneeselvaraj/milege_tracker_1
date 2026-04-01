import React, { useState, useEffect, useCallback, useMemo } from 'react';
import BottomNav from './components/layout/BottomNav';
import Dashboard from './views/Dashboard';
import FuelLog from './views/FuelLog';
import TripLog from './views/TripLog';
import VehicleManager from './views/VehicleManager';
import Settings from './views/Settings';
import GlassCard from './components/common/GlassCard';
import Modal from './components/common/Modal';
import ErrorBoundary from './components/common/ErrorBoundary';
import ServiceLog from './views/ServiceLog';
import NotificationCenter from './components/common/NotificationCenter';
import PhotoCapture from './components/common/PhotoCapture';
import Select from './components/common/Select';
import { initClient, getFile, createFile, updateFile } from './lib/gdrive';
import { generateId, validateFuelEntry, validateTrip, validateVehicle, validateService, validateExpense, validateBudget, ensureIds, checkDataConsistency } from './lib/validators';
import { migrateData } from './lib/migrations';
import { checkAlerts } from './lib/analytics';
import { Car, RefreshCcw, LogOut, ChevronRight, Bike, Fuel, Plus, Route, X, AlertTriangle, Sun, Moon, Zap, Wifi, WifiOff, Bell } from 'lucide-react';

const PURPOSES = ['Commute', 'Business', 'Personal', 'Errand', 'Long Drive', 'Other'];

const App = () => {
  const [activeView, setActiveView] = useState('dashboard');
  const [user, setUser] = useState(null);
  const [clientId] = useState(localStorage.getItem('gdrive_client_id') || '936797203666-q5rqnu3g44rsm01fbsd9d344c4em98kp.apps.googleusercontent.com');
  const [data, setData] = useState({ 
    vehicles: [], entries: [], trips: [], services: [], 
    expenses: [], income: [], budgets: [], 
    accounts: [
      { id: 'acc_cash', name: 'Cash', type: 'Cash', balance: 0 },
      { id: 'acc_bank', name: 'Bank Account', type: 'Bank', balance: 0 },
      { id: 'acc_upi', name: 'UPI Wallet', type: 'Wallet', balance: 0 }
    ],
    schemaVersion: 3 
  });
  const [fileId, setFileId] = useState(null);
  const [loading, setLoading] = useState(false);
  const [syncStatus, setSyncStatus] = useState('idle'); // idle, syncing, synced, error
  const [modal, setModal] = useState({ open: false, type: 'fuel', mode: 'create', editId: null });
  const [toast, setToast] = useState(null);
  const [theme, setTheme] = useState(localStorage.getItem('ultralog_theme') || 'light');
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [formErrors, setFormErrors] = useState({});
  const [formWarnings, setFormWarnings] = useState([]);
  const [notificationsOpen, setNotificationsOpen] = useState(false);

  // Online/offline detection
  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Theme handling (with auto support)
  useEffect(() => {
    if (theme === 'auto') {
      const isDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      document.documentElement.setAttribute('data-theme', isDark ? 'dark' : 'light');

      const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
      const handler = (e) => document.documentElement.setAttribute('data-theme', e.matches ? 'dark' : 'light');
      mediaQuery.addEventListener('change', handler);
      return () => mediaQuery.removeEventListener('change', handler);
    } else {
      document.documentElement.setAttribute('data-theme', theme);
    }
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
  const [fuelForm, setFuelForm] = useState({ vehicleId: '', odometer: '', liters: '', cost: '', date: new Date().toISOString().split('T')[0], photo: null });
  const [tripForm, setTripForm] = useState({ vehicleId: '', startOdometer: '', endOdometer: '', purpose: 'Commute', notes: '', date: new Date().toISOString().split('T')[0] });
  const [serviceForm, setServiceForm] = useState({ vehicleId: '', odometer: '', cost: '', date: new Date().toISOString().split('T')[0], notes: '', photo: null });
  const [expenseForm, setExpenseForm] = useState({ accountId: '', amount: '', category: 'Other', date: new Date().toISOString().split('T')[0], notes: '', photo: null, splitWith: '' });
  const [budgetForm, setBudgetForm] = useState({ category: 'Other', limit: '', month: new Date().toISOString().substring(0, 7) });

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

  // Debounced save
  const saveTimeoutRef = React.useRef(null);

  const loadData = async () => {
    console.log('Loading data...');
    setLoading(true);
    try {
      let loaded = null;
      if (window.gapi?.client?.drive) {
        console.log('GDocs client detected, fetching file...');
        const result = await getFile('mileage_data.json');
        if (result) {
          console.log('File found, ID:', result.id);
          setFileId(result.id);
          loaded = result.data;
        } else {
          // FIX: Create file for new users
          console.log('No mileage_data.json found. Creating new file...');
          const initialData = { vehicles: [], entries: [], trips: [], services: [], schemaVersion: 2 };
          const createResult = await createFile('mileage_data.json', initialData);
          if (createResult?.id) {
            setFileId(createResult.id);
            console.log('Created new Drive file:', createResult.id);
          }
          loaded = initialData;
        }
      } else {
        console.log('Using local data fallback.');
        loaded = JSON.parse(localStorage.getItem('mileage_data_local')) ||
          { vehicles: [], entries: [], trips: [], services: [], schemaVersion: 2 };
      }

      // Run migration
      const { data: migrated, migrated: didMigrate } = migrateData(loaded);

      // Ensure all entities have IDs
      const withIds = ensureIds(migrated);

      // Run consistency checks
      const { cleaned, issues } = checkDataConsistency(withIds);
      if (issues.length > 0) {
        console.warn('[Data Health]', issues);
      }

      const safeData = { vehicles: [], entries: [], trips: [], services: [], ...cleaned };
      setData(safeData);
      setSyncStatus('synced');

      // If migrated, save back immediately
      if (didMigrate || issues.length > 0) {
        console.log('[Migration] Saving migrated data back...');
        if (fileId && window.gapi?.client?.drive) {
          await updateFile(fileId, safeData);
        } else {
          localStorage.setItem('mileage_data_local', JSON.stringify(safeData));
        }
      }
    } catch (err) {
      console.error('loadData error:', err);
      setSyncStatus('error');
    }
    setLoading(false);
  };

  const saveData = useCallback(async (newData) => {
    const safeData = { vehicles: [], entries: [], trips: [], services: [], schemaVersion: 2, ...newData };
    setData(safeData);
    setSyncStatus('syncing');

    // Debounce Drive saves (500ms)
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }

    saveTimeoutRef.current = setTimeout(async () => {
      try {
        if (fileId && window.gapi?.client?.drive) {
          await updateFile(fileId, safeData);
          setSyncStatus('synced');
        } else {
          localStorage.setItem('mileage_data_local', JSON.stringify(safeData));
          setSyncStatus('synced');
        }
      } catch (err) {
        console.error('saveData error:', err);
        setSyncStatus('error');
        // Fallback: save to localStorage on Drive failure
        localStorage.setItem('mileage_data_local', JSON.stringify(safeData));
        showToast('Cloud save failed. Saved locally.', 'error');
      }
    }, 500);
  }, [fileId]);

  const handleLogin = async () => {
    console.log('Initiating handleLogin with Client ID:', clientId);
    try {
      const auth = await initClient(clientId);
      if (auth) {
        if (auth.isSignedIn.get()) {
          const userObj = auth.currentUser.get();
          setUser(userObj);
          loadData();
        } else {
          const userObj = await auth.signIn({ prompt: 'select_account' });
          setUser(userObj);
          loadData();
        }
      }
    } catch (err) {
      console.error('Login process failed:', err);
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
    setUser(null); setFileId(null); setData({ vehicles: [], entries: [], trips: [], services: [], schemaVersion: 2 });
  };

  // ---- VEHICLE ----
  const submitVehicle = (e) => {
    e.preventDefault();
    const validation = validateVehicle(vehicleForm, data.vehicles);
    if (!validation.valid) {
      setFormErrors(validation.errors);
      return;
    }
    setFormErrors({});
    setFormWarnings(validation.warnings);

    let newData;
    if (modal.mode === 'edit') {
      newData = { ...data, vehicles: data.vehicles.map(v => v.id === modal.editId ? { ...vehicleForm, id: v.id } : v) };
    } else {
      newData = { ...data, vehicles: [...data.vehicles, { ...vehicleForm, id: generateId() }] };
    }
    saveData(newData);
    setModal({ ...modal, open: false });
    setVehicleForm({ name: '', regNo: '', fuelType: 'Petrol', serviceInterval: '', type: 'car', lastServiceOdo: '', cost: '' });
    showToast(modal.mode === 'edit' ? 'Vehicle updated' : 'Vehicle added');
  };

  // FIX: handleMarkServiced now also creates a service log entry
  const handleMarkServiced = (vehicleId) => {
    const ve = data.entries.filter(e => e.vehicleId === vehicleId).sort((a, b) => new Date(a.date) - new Date(b.date));
    const lastOdo = ve.length > 0 ? ve[ve.length - 1].odometer : '0';
    const today = new Date().toISOString().split('T')[0];

    const newService = {
      id: generateId(),
      vehicleId,
      odometer: lastOdo,
      cost: '0',
      date: today,
      notes: 'Routine service (marked from garage)'
    };

    const newData = {
      ...data,
      vehicles: data.vehicles.map(v => v.id === vehicleId ? { ...v, lastServiceOdo: lastOdo } : v),
      services: [...(data.services || []), newService].sort((a, b) => new Date(b.date) - new Date(a.date))
    };
    saveData(newData);
    showToast('Service record updated ✓');
  };

  // ---- FUEL ---- (FIX: ID-based CRUD)
  const submitFuel = (e) => {
    e.preventDefault();
    const validation = validateFuelEntry(fuelForm, data.entries, data.vehicles);
    if (!validation.valid) {
      setFormErrors(validation.errors);
      setFormWarnings(validation.warnings);
      return;
    }
    setFormErrors({});
    setFormWarnings(validation.warnings);

    let newData;
    if (modal.mode === 'edit') {
      // FIX: Use ID-based editing instead of index
      newData = { ...data, entries: data.entries.map(entry => entry.id === modal.editId ? { ...fuelForm, id: entry.id } : entry) };
    } else {
      newData = { ...data, entries: [...data.entries, { ...fuelForm, id: generateId() }].sort((a, b) => new Date(a.date) - new Date(b.date)) };
    }
    saveData(newData);
    setModal({ ...modal, open: false });
    setFuelForm({ vehicleId: '', odometer: '', liters: '', cost: '', date: new Date().toISOString().split('T')[0] });
    showToast(modal.mode === 'edit' ? 'Log updated' : 'Fuel log saved');
  };

  // FIX: ID-based delete
  const deleteEntry = (entryId) => {
    showConfirm('Delete this fuel log permanently?', () => {
      saveData({ ...data, entries: data.entries.filter(e => e.id !== entryId) });
      showToast('Log deleted', 'error');
    });
  };

  // ---- Trips ---- (FIX: ID-based CRUD)
  const submitTrip = (e) => {
    e.preventDefault();
    const validation = validateTrip(tripForm, data.vehicles);
    if (!validation.valid) {
      setFormErrors(validation.errors);
      setFormWarnings(validation.warnings);
      return;
    }
    setFormErrors({});
    setFormWarnings(validation.warnings);

    const trips = data.trips || [];
    let newTrips;
    if (modal.mode === 'edit') {
      newTrips = trips.map(t => t.id === modal.editId ? { ...tripForm, id: t.id } : t);
    } else {
      newTrips = [...trips, { ...tripForm, id: generateId() }].sort((a, b) => new Date(a.date) - new Date(b.date));
    }
    saveData({ ...data, trips: newTrips });
    setModal({ ...modal, open: false });
    setTripForm({ vehicleId: '', startOdometer: '', endOdometer: '', purpose: 'Commute', notes: '', date: new Date().toISOString().split('T')[0] });
    showToast(modal.mode === 'edit' ? 'Trip updated' : 'Trip logged');
  };

  // FIX: ID-based delete
  const deleteTrip = (tripId) => {
    showConfirm('Delete this trip log permanently?', () => {
      saveData({ ...data, trips: (data.trips || []).filter(t => t.id !== tripId) });
      showToast('Trip deleted', 'error');
    });
  };

  // ---- SERVICES ---- (FIX: ID-based CRUD)
  const submitService = (e) => {
    e.preventDefault();
    const validation = validateService(serviceForm, data.vehicles);
    if (!validation.valid) {
      setFormErrors(validation.errors);
      return;
    }
    setFormErrors({});

    const services = data.services || [];
    let newServices;
    if (modal.mode === 'edit') {
      newServices = services.map(s => s.id === modal.editId ? { ...serviceForm, id: s.id } : s);
    } else {
      newServices = [...services, { ...serviceForm, id: generateId() }].sort((a, b) => new Date(b.date) - new Date(a.date));
    }
    saveData({ ...data, services: newServices });
    setModal({ ...modal, open: false });
    setServiceForm({ vehicleId: '', odometer: '', cost: '', date: new Date().toISOString().split('T')[0], notes: '' });
    showToast(modal.mode === 'edit' ? 'Service updated' : 'Service logged');
  };

  // FIX: ID-based delete
  const deleteService = (serviceId) => {
    showConfirm('Delete this service record permanently?', () => {
      const services = data.services || [];
      saveData({ ...data, services: services.filter(s => s.id !== serviceId) });
      showToast('Service deleted', 'error');
    });
  };

  // FIX: openModal always uses ID for editId
  const openModal = (type, mode = 'create', dataToEdit = null) => {
    setFormErrors({});
    setFormWarnings([]);
    if (mode === 'edit' && dataToEdit) {
      if (type === 'vehicle') setVehicleForm(dataToEdit);
      else if (type === 'fuel') setFuelForm(dataToEdit);
      else if (type === 'trip') setTripForm(dataToEdit);
      else if (type === 'service') setServiceForm(dataToEdit);
    } else {
      if (type === 'vehicle') setVehicleForm({ name: '', regNo: '', fuelType: 'Petrol', serviceInterval: '', type: 'car', lastServiceOdo: '', cost: '' });
      else if (type === 'fuel') setFuelForm({ vehicleId: data.vehicles[0]?.id || '', odometer: '', liters: '', cost: '', date: new Date().toISOString().split('T')[0], photo: null });
      else if (type === 'trip') setTripForm({ vehicleId: data.vehicles[0]?.id || '', startOdometer: '', endOdometer: '', purpose: 'Commute', notes: '', date: new Date().toISOString().split('T')[0] });
      else if (type === 'service') setServiceForm({ vehicleId: data.vehicles[0]?.id || '', odometer: '', cost: '', date: new Date().toISOString().split('T')[0], notes: '', photo: null });
    }
    // FIX: Always use the entity's own ID for editing
    setModal({ open: true, type, mode, editId: mode === 'edit' ? dataToEdit?.id : null });
  };

  // Haptic feedback helper
  const haptic = (pattern = [10]) => {
    if (navigator.vibrate) navigator.vibrate(pattern);
  };

  // Login Screen — FIX: respects theme
  if (!user) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-6 relative" style={{ background: 'var(--bg-primary)' }}>
        <div className="premium-glass-card w-full max-w-md p-12 flex flex-col items-center text-center relative z-10 animate-fade-up" style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
          {/* Main Illustration/Icon */}
          <div className="mb-10">
            <div className="text-7xl drop-shadow-xl">🚗</div>
          </div>

          <h1 className="text-4xl font-extrabold tracking-tight mb-3 leading-tight" style={{ color: 'var(--text-primary)' }}>
            Welcome to <br /> Mileage Tracker
          </h1>

          <p className="text-[14px] font-medium mb-10 leading-relaxed px-4" style={{ color: 'var(--text-secondary)' }}>
            Sign in with your Google account to continue
          </p>

          <div className="w-full flex flex-col gap-4">
            <button
              onClick={() => { haptic(); handleLogin(); }}
              className="w-full flex items-center justify-center gap-4 font-bold py-5 px-6 rounded-3xl transition-all active:scale-[0.97] shadow-xl"
              style={{ background: 'var(--accent)', color: 'var(--bg-primary)' }}
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
              onClick={() => { haptic(); handleLocalLogin(); }}
              className="w-full py-5 px-6 text-xs font-black tracking-widest uppercase rounded-3xl border transition-all active:scale-[0.97] flex items-center justify-center gap-3"
              style={{ color: 'var(--text-secondary)', background: 'var(--bg-secondary)', borderColor: 'var(--border)' }}
            >
              <Zap size={14} style={{ opacity: 0.5 }} />
              <span>Offline Access</span>
            </button>
          </div>

          <div className="mt-12 text-[12px] font-medium leading-relaxed max-w-[240px]" style={{ color: 'var(--text-secondary)', opacity: 0.5 }}>
            Your data is stored securely in your personal Google Drive
          </div>
        </div>
      </div>
    );
  }

  const trips = data.trips || [];
  const services = data.services || [];

  // Form error display helper
  const FieldError = ({ field }) => {
    if (!formErrors[field]) return null;
    return <div className="text-xs font-bold text-danger mt-1">{formErrors[field]}</div>;
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>
      {loading && <div style={{ position: 'fixed', top: 0, left: 0, right: 0, height: 2, background: 'var(--accent)', zIndex: 20000 }} className="animate-pulse"></div>}

      {/* Offline Banner */}
      {!isOnline && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, height: 32, background: 'var(--warning)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, zIndex: 19000, fontSize: 'var(--type-caption)', fontWeight: 900, color: 'white' }}>
          <WifiOff size={14} />
          Offline Mode
        </div>
      )}

      {/* Sync Status */}
      {syncStatus === 'syncing' && (
        <div style={{ position: 'fixed', top: 8, right: 16, zIndex: 19000, fontSize: 'var(--type-caption)', fontWeight: 900, color: 'var(--accent)', display: 'flex', alignItems: 'center', gap: 4, background: 'var(--bg-card)', padding: '4px 12px', borderRadius: 'var(--radius-pill)', border: '1px solid var(--border)' }} className="animate-pulse">
          <RefreshCcw size={10} className="animate-spin" /> Syncing...
        </div>
      )}

      {/* Views — each view owns its own scroll via view-container/view-content */}
      <div key={activeView} className="page-transition" style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', position: 'relative' }}>
        {activeView === 'dashboard' && (
          <ErrorBoundary name="Dashboard">
            <Dashboard
              vehicles={data.vehicles}
              entries={data.entries}
              trips={trips}
              user={user}
              isSynced={!!fileId}
              onAddClick={() => { haptic(); openModal('fuel'); }}
              onMarkServiced={handleMarkServiced}
              onSettingsClick={() => setActiveView('settings')}
              onViewChange={setActiveView}
              onNotificationsClick={() => setNotificationsOpen(true)}
              theme={theme}
              expenses={data.expenses}
              income={data.income}
              budgets={data.budgets}
            />
          </ErrorBoundary>
        )}
        {activeView === 'fuel' && (
          <ErrorBoundary name="Fuel Log">
            <FuelLog
              vehicles={data.vehicles}
              entries={data.entries}
              onAddClick={() => { haptic(); openModal('fuel'); }}
              onEdit={(entry) => openModal('fuel', 'edit', entry)}
              onDelete={(entryId) => { haptic([15]); deleteEntry(entryId); }}
            />
          </ErrorBoundary>
        )}
        {activeView === 'trips' && (
          <ErrorBoundary name="Trip Log">
            <TripLog
              vehicles={data.vehicles}
              trips={trips}
              onAddClick={() => { haptic(); openModal('trip'); }}
              onEdit={(trip) => openModal('trip', 'edit', trip)}
              onDelete={(tripId) => { haptic([15]); deleteTrip(tripId); }}
            />
          </ErrorBoundary>
        )}
        {activeView === 'vehicles' && (
          <ErrorBoundary name="Garage">
            <VehicleManager
              vehicles={data.vehicles}
              entries={data.entries}
              services={services}
              trips={trips}
              onAddClick={() => { haptic(); openModal('vehicle'); }}
              onEdit={(v) => openModal('vehicle', 'edit', v)}
              onMarkServiced={handleMarkServiced}
              onDeleteVehicle={(id) => {
                const hasLogs = data.entries.some(e => e.vehicleId === id);
                if (hasLogs) { showToast('Vehicle has fuel logs. Cannot delete.', 'error'); return; }
                showConfirm('Permanently decommission this vehicle?', () => {
                  haptic([15]);
                  saveData({ ...data, vehicles: data.vehicles.filter(v => v.id !== id) });
                  showToast('Vehicle removed', 'error');
                });
              }}
            />
          </ErrorBoundary>
        )}
        {activeView === 'services' && (
          <ErrorBoundary name="Service Log">
            <ServiceLog
              vehicles={data.vehicles}
              services={services}
              onAddClick={() => { haptic(); openModal('service'); }}
              onEdit={(service) => openModal('service', 'edit', service)}
              onDelete={(serviceId) => { haptic([15]); deleteService(serviceId); }}
            />
          </ErrorBoundary>
        )}
        {activeView === 'settings' && (
          <ErrorBoundary name="Settings">
            <Settings
              user={user}
              data={data}
              fileId={fileId}
              theme={theme}
              setTheme={setTheme}
              onLogout={handleLogout}
              onBack={() => setActiveView('dashboard')}
            />
          </ErrorBoundary>
        )}
      </div>

      <BottomNav
        activeView={activeView}
        setActiveView={(view) => { haptic([5]); setActiveView(view); }}
        badges={{
          services: (() => {
            try { return checkAlerts(data.vehicles, data.entries).length; } catch (e) { return 0; }
          })()
        }}
      />

      {/* TOAST */}
      {toast && (
        <div className="toast-container">
          <div className={`toast ${toast.type === 'error' ? 'toast-error' : ''}`}>
            {toast.type === 'error' ? <AlertTriangle size={16} /> : <ChevronRight size={16} />}
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
        onClose={() => { setModal({ ...modal, open: false }); setFormErrors({}); setFormWarnings([]); }}
        title={
          modal.mode === 'edit'
            ? (modal.type === 'fuel' ? 'Edit Log' : modal.type === 'trip' ? 'Edit Trip' : modal.type === 'service' ? 'Edit Service' : 'Edit Vehicle')
            : (modal.type === 'fuel' ? 'New Fuel Log' : modal.type === 'trip' ? 'Log Trip' : modal.type === 'service' ? 'Log Service' : 'Add Vehicle')
        }
      >
        {/* Validation Warnings */}
        {formWarnings.length > 0 && (
          <div className="mb-4 p-3 rounded-2xl bg-warning-soft border border-warning/20">
            {formWarnings.map((w, i) => (
              <div key={i} className="text-xs font-bold text-warning flex items-start gap-2 mb-1 last:mb-0">
                <AlertTriangle size={12} className="shrink-0 mt-0.5" />
                {w}
              </div>
            ))}
          </div>
        )}

        {modal.type === 'fuel' && (
          <form onSubmit={submitFuel} className="flex flex-col gap-6">
            <div className="flex flex-col gap-2">
              <Select 
                label="Select Vehicle"
                value={fuelForm.vehicleId} 
                onChange={e => setFuelForm({ ...fuelForm, vehicleId: e.target.value })}
                options={data.vehicles.map(v => ({ 
                  value: v.id, 
                  label: v.name, 
                  icon: v.type === 'Bike' ? Bike : Car 
                }))}
                icon={Car}
              />
              <FieldError field="vehicleId" />
            </div>
            <div className="flex flex-col gap-2">
              <label className="label-small">Odometer (KM)</label>
              <input type="number" className="input-glass" value={fuelForm.odometer} onChange={e => setFuelForm({ ...fuelForm, odometer: e.target.value })} required />
              <FieldError field="odometer" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="flex flex-col gap-2">
                <label className="label-small">Liters</label>
                <input type="number" step="0.01" className="input-glass" value={fuelForm.liters} onChange={e => setFuelForm({ ...fuelForm, liters: e.target.value })} required />
                <FieldError field="liters" />
              </div>
              <div className="flex flex-col gap-2">
                <label className="label-small">Cost (₹)</label>
                <input type="number" step="0.01" className="input-glass" value={fuelForm.cost} onChange={e => setFuelForm({ ...fuelForm, cost: e.target.value })} required />
                <FieldError field="cost" />
              </div>
            </div>
            <div className="flex flex-col gap-2">
              <label className="label-small">Date</label>
              <input type="date" className="input-glass" value={fuelForm.date} onChange={e => setFuelForm({ ...fuelForm, date: e.target.value })} required />
              <FieldError field="date" />
            </div>
            {fuelForm.liters > 0 && fuelForm.cost > 0 && (
              <div className="text-xs font-black text-secondary text-center">
                ₹{(Number(fuelForm.cost) / Number(fuelForm.liters)).toFixed(2)} per liter
              </div>
            )}
            <PhotoCapture
              value={fuelForm.photo}
              onChange={(photo) => setFuelForm({ ...fuelForm, photo })}
              label="Receipt Photo (optional)"
            />
            <button type="submit" className="premium-btn w-full mt-2 text-bg-primary" style={{ color: 'var(--bg-primary)' }}>
              {modal.mode === 'edit' ? 'CONFIRM CHANGES' : 'SAVE ENTRY'}
            </button>
          </form>
        )}

        {modal.type === 'trip' && (
          <form onSubmit={submitTrip} className="flex flex-col gap-6">
            <div className="flex flex-col gap-2">
              <Select 
                label="Select Vehicle"
                value={tripForm.vehicleId} 
                onChange={e => setTripForm({ ...tripForm, vehicleId: e.target.value })}
                options={data.vehicles.map(v => ({ 
                  value: v.id, 
                  label: v.name, 
                  icon: v.type === 'Bike' ? Bike : Car 
                }))}
                icon={Car}
              />
              <FieldError field="vehicleId" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="flex flex-col gap-2">
                <label className="label-small">Start KM</label>
                <input type="number" className="input-glass" value={tripForm.startOdometer} onChange={e => setTripForm({ ...tripForm, startOdometer: e.target.value })} required />
                <FieldError field="startOdometer" />
              </div>
              <div className="flex flex-col gap-2">
                <label className="label-small">End KM</label>
                <input type="number" className="input-glass" value={tripForm.endOdometer} onChange={e => setTripForm({ ...tripForm, endOdometer: e.target.value })} required />
                <FieldError field="endOdometer" />
              </div>
            </div>
            {tripForm.startOdometer && tripForm.endOdometer && Number(tripForm.endOdometer) > Number(tripForm.startOdometer) && (
              <div className="text-xs font-black text-secondary text-center">
                {(Number(tripForm.endOdometer) - Number(tripForm.startOdometer)).toLocaleString()} KM distance
              </div>
            )}
            <div className="flex flex-col gap-2">
              <Select 
                label="Trip Purpose"
                value={tripForm.purpose} 
                onChange={e => setTripForm({ ...tripForm, purpose: e.target.value })}
                options={PURPOSES.map(p => ({ value: p, label: p }))}
                icon={Route}
              />
            </div>
            <div className="flex flex-col gap-2">
              <label className="label-small">Date</label>
              <input type="date" className="input-glass" value={tripForm.date} onChange={e => setTripForm({ ...tripForm, date: e.target.value })} required />
              <FieldError field="date" />
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
              <Select 
                label="Select Vehicle"
                value={serviceForm.vehicleId} 
                onChange={e => setServiceForm({ ...serviceForm, vehicleId: e.target.value })}
                options={data.vehicles.map(v => ({ 
                  value: v.id, 
                  label: v.name, 
                  icon: v.type === 'Bike' ? Bike : Car 
                }))}
                icon={Car}
              />
              <FieldError field="vehicleId" />
            </div>
            <div className="flex flex-col gap-2">
              <label className="label-small">Odometer (KM)</label>
              <input type="number" className="input-glass" value={serviceForm.odometer} onChange={e => setServiceForm({ ...serviceForm, odometer: e.target.value })} required />
              <FieldError field="odometer" />
            </div>
            <div className="flex flex-col gap-2">
              <label className="label-small">Cost (₹)</label>
              <input type="number" step="0.01" className="input-glass" value={serviceForm.cost} onChange={e => setServiceForm({ ...serviceForm, cost: e.target.value })} required />
              <FieldError field="cost" />
            </div>
            <div className="flex flex-col gap-2">
              <label className="label-small">Date</label>
              <input type="date" className="input-glass" value={serviceForm.date} onChange={e => setServiceForm({ ...serviceForm, date: e.target.value })} required />
              <FieldError field="date" />
            </div>
            <div className="flex flex-col gap-2">
              <label className="label-small">Notes (Maintenance Details)</label>
              <input className="input-glass" placeholder="e.g. Oil change, brake pads..." value={serviceForm.notes} onChange={e => setServiceForm({ ...serviceForm, notes: e.target.value })} />
            </div>
            <PhotoCapture
              value={serviceForm.photo}
              onChange={(photo) => setServiceForm({ ...serviceForm, photo })}
              label="Service Receipt (optional)"
            />
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
              <FieldError field="name" />
            </div>
            <div className="flex flex-col gap-2">
              <label className="label-small">Plate Number</label>
              <input className="input-glass" value={vehicleForm.regNo} onChange={e => setVehicleForm({ ...vehicleForm, regNo: e.target.value })} required />
              <FieldError field="regNo" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="flex flex-col gap-2">
                <Select 
                  label="Fuel Type"
                  value={vehicleForm.fuelType} 
                  onChange={e => setVehicleForm({ ...vehicleForm, fuelType: e.target.value })}
                  options={['Petrol', 'Diesel', 'Electric', 'CNG', 'LPG'].map(f => ({ value: f, label: f }))}
                  icon={Fuel}
                />
              </div>
              <div className="flex flex-col gap-2">
                <label className="label-small h-[28px] flex items-end">Service Interval</label>
                <input type="number" className="input-glass" value={vehicleForm.serviceInterval} onChange={e => setVehicleForm({ ...vehicleForm, serviceInterval: e.target.value })} />
                <FieldError field="serviceInterval" />
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

      {/* NOTIFICATION CENTER */}
      <NotificationCenter
        vehicles={data.vehicles}
        entries={data.entries}
        isOpen={notificationsOpen}
        onClose={() => setNotificationsOpen(false)}
      />
    </div>
  );
};

export default App;
