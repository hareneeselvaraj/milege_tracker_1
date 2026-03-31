import React from 'react';
import { Home, Fuel, Car, Wrench, Route } from 'lucide-react';

const BottomNav = ({ activeView, setActiveView, badges = {} }) => {
  const navItems = [
    { id: 'dashboard', label: 'Home', icon: Home },
    { id: 'fuel', label: 'Fuel', icon: Fuel },
    { id: 'trips', label: 'Trips', icon: Route },
    { id: 'vehicles', label: 'Garage', icon: Car },
    { id: 'services', label: 'Service', icon: Wrench },
  ];

  return (
    <nav className="bottom-nav">
      {navItems.map((item) => (
        <div
          key={item.id}
          className={`nav-item ${activeView === item.id ? 'active' : ''}`}
          onClick={() => {
            if (activeView === item.id) {
              // Already on this tab — scroll to top (native behavior)
              document.querySelector('.view-content')?.scrollTo({ top: 0, behavior: 'smooth' });
            } else {
              setActiveView(item.id);
            }
            if (navigator.vibrate) navigator.vibrate(5);
          }}
        >
          <item.icon size={22} strokeWidth={activeView === item.id ? 2.5 : 1.8} />
          <span className="nav-label">{item.label}</span>
          {badges[item.id] > 0 && (
            <span className="nav-badge">{badges[item.id]}</span>
          )}
        </div>
      ))}
    </nav>
  );
};

export default BottomNav;
