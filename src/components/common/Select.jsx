import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown, Check } from 'lucide-react';

const Select = ({ value, onChange, options = [], label, placeholder = 'Select option', icon: Icon }) => {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef(null);

  const selectedOption = options.find(opt => opt.value === value);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (containerRef.current && !containerRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelect = (val) => {
    onChange({ target: { value: val } }); // Mock event for compatibility
    setIsOpen(false);
  };

  return (
    <div className="select-container" ref={containerRef}>
      {label && <label className="select-label">{label}</label>}
      
      <div 
        className={`select-trigger ${isOpen ? 'active' : ''}`} 
        onClick={() => setIsOpen(!isOpen)}
      >
        <div className="flex items-center gap-3 truncate">
          {Icon && <Icon size={18} className="text-accent opacity-70" />}
          <span className={!selectedOption ? 'opacity-40' : ''}>
            {selectedOption ? selectedOption.label : placeholder}
          </span>
        </div>
        <ChevronDown 
          size={18} 
          className={`transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`} 
        />
      </div>

      {isOpen && (
        <div className="select-dropdown fade-in">
          {options.map((option) => (
            <div 
              key={option.value}
              className={`select-option ${value === option.value ? 'selected' : ''}`}
              onClick={() => handleSelect(option.value)}
            >
              <div className="flex items-center gap-3">
                {option.icon && <option.icon size={16} />}
                <span>{option.label}</span>
              </div>
              {value === option.value && <Check size={16} className="text-accent" />}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Select;
