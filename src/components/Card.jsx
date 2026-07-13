import React from 'react';
import './components.css';

export const Card = ({ children, className = '', title, ...props }) => {
  return (
    <div className={`card glass-panel ${className}`} {...props}>
      {title && <div className="card-header"><h3 className="card-title">{title}</h3></div>}
      <div className="card-body">
        {children}
      </div>
    </div>
  );
};
