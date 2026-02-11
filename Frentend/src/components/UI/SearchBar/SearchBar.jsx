import React from 'react';
import './SearchBar.css';

const SearchBar = ({ value, onChange, placeholder = 'Search...' }) => (
  <div className="ui-search">
    <input className="ui-search-input" value={value} onChange={(e)=>onChange?.(e.target.value)} placeholder={placeholder} />
  </div>
);

export default SearchBar;
