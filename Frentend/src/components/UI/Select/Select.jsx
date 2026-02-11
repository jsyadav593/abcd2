import React from "react";
import "./Select.css";

const Select = ({
  label,
  value,
  onChange,
  options = [],
  name,
  placeholder,
  required = false,
  disabled = false,
}) => (
  <div className="ui-field">
    {label && (
      <label className="ui-label">
        {label}
        {required && <span className="required-star">*</span>}
      </label>
    )}
    <select
      className="ui-input ui-select"
      name={name}
      value={value}
      onChange={(e) => onChange?.(e.target.value)}
      required={required}
      disabled={disabled}
    >
      {placeholder && <option value="">{placeholder}</option>}
      {options.map((opt) => (
        <option key={opt.value ?? opt} value={opt.value ?? opt}>
          {opt.label ?? opt}
        </option>
      ))}
    </select>
  </div>
);

export default Select;
