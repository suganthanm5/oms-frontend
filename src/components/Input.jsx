import React from 'react';
import './components.css';

export const Input = React.forwardRef(({ 
  label, 
  error, 
  className = '', 
  ...props 
}, ref) => {
  const inputClass = `input ${error ? 'input-error' : ''} ${className}`;
  
  return (
    <div className="input-wrapper">
      {label && <label className="input-label">{label}</label>}
      <input ref={ref} className={inputClass} {...props} />
      {error && <span className="input-error-msg">{error}</span>}
    </div>
  );
});

Input.displayName = 'Input';
