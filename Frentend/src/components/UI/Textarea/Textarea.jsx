import React from 'react';
import './Textarea.css';

const Textarea = ({ 
  label, 
  value, 
  onChange, 
  placeholder, 
  name, 
  rows = 4,
  required = false,
  disabled = false
}) => (
  <div className="ui-field">
    {label && (
      <label className="ui-label">
        {label}
        {required && <span className="required-star">*</span>}
      </label>
    )}
    <textarea
      className="ui-textarea"
      name={name}
      value={value}
      onChange={(e) => onChange?.(e)}
      placeholder={placeholder}
      rows={rows}
      required={required}
      disabled={disabled}
    />
  </div>
);

export default Textarea;
