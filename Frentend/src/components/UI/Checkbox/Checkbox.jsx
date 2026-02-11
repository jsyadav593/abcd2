import React from 'react';

const Checkbox = ({ label, checked, onChange, name }) => (
  <label style={{display:'flex',alignItems:'center',gap:8}}>
    <input type="checkbox" name={name} checked={checked} onChange={(e)=>onChange?.(e.target.checked)} />
    {label}
  </label>
);

export default Checkbox;
