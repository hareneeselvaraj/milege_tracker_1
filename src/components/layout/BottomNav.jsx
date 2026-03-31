import React from 'react';
import { Home, Fuel, Car, Settings, Route } from 'lucide-react';

const BottomNav = ({ activeView, setActiveView }) => {
  const navItems = [
    { id: 'dashboard', label: 'Home', icon: Home },
    { id: 'fuel', label: 'Fuel', icon: Fuel },
    { id: 'trips', label: 'Trips', icon: Route },
    { id: 'vehicles', label: 'Garage', icon: Car },
    { id: 'services', label: 'Services', icon: Settings },
  ];

  return (
    <nav className="bottom-nav">
      {navItems.map((item) => (
        <div
          key={item.id}
          className={`nav-item ${activeView === item.id ? 'active' : ''}`}
          onClick={() => setActiveView(item.id)}
        >
          <item.icon size={24} strokeWidth={activeView === item.id ? 2.5 : 2} />
        </div>
      ))}
    </nav>
  );
};

export default BottomNav;
