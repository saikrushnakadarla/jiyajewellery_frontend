import React, { useState, useRef, useEffect } from 'react';
import { FaChevronDown } from 'react-icons/fa';
import './CustomDropdown.css';

/**
 * CustomDropdown
 * Drop-in replacement for a native <select>. Fully styleable
 * on mobile because the option list is regular DOM, not a
 * browser-native popup.
 *
 * Props:
 *  - options: [{ value, label, icon (optional), disabled (optional) }]
 *  - value: currently selected value
 *  - onChange: (value) => void
 *  - placeholder: string shown when nothing selected
 */
const CustomDropdown = ({ options, value, onChange, placeholder = 'Select...' }) => {
  const [isOpen, setIsOpen] = useState(false);
  const wrapperRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('touchstart', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('touchstart', handleClickOutside);
    };
  }, []);

  const selectedOption = options.find(opt => String(opt.value) === String(value));

  const handleSelect = (opt) => {
    if (opt.disabled) return;
    onChange(opt.value);
    setIsOpen(false);
  };

  return (
    <div className="cd-wrapper" ref={wrapperRef}>
      <button
        type="button"
        className={`cd-control ${isOpen ? 'cd-control-open' : ''}`}
        onClick={() => setIsOpen(prev => !prev)}
      >
        <span className={`cd-control-text ${!selectedOption ? 'cd-placeholder' : ''}`}>
          {selectedOption ? (
            <>{selectedOption.icon && <span className="cd-icon">{selectedOption.icon}</span>} {selectedOption.label}</>
          ) : placeholder}
        </span>
        <FaChevronDown className={`cd-chevron ${isOpen ? 'cd-chevron-open' : ''}`} />
      </button>

      {isOpen && (
        <div className="cd-menu">
          {options.map((opt, idx) => (
            <div
              key={idx}
              className={`cd-option ${String(opt.value) === String(value) ? 'cd-option-selected' : ''} ${opt.disabled ? 'cd-option-disabled' : ''}`}
              onClick={() => handleSelect(opt)}
            >
              {opt.icon && <span className="cd-icon">{opt.icon}</span>}
              <span className="cd-option-label">{opt.label}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default CustomDropdown;