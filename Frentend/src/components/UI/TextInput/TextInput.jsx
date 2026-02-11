import React from 'react';
import './TextInput.css';

const TextInput = ({ 
  label, 
  value, 
  onChange, 
  placeholder, 
  name, 
  type = 'text',
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
    <input
      className="ui-input"
      name={name}
      value={value}
      onChange={(e) => onChange?.(e)}
      placeholder={placeholder}
      type={type}
      required={required}
      disabled={disabled}
    />
  </div>
);

export default TextInput;
