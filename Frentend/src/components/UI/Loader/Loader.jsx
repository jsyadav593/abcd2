import React from 'react';
import './Loader.css';

const Loader = ({ size=32 }) => (
  <div className="ui-loader" style={{width:size,height:size}} />
);

export default Loader;
