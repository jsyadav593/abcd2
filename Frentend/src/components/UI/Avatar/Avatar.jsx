import React from 'react';
import './Avatar.css';

const Avatar = ({ src, alt, size = 40 }) => (
  <img className="ui-avatar" src={src} alt={alt} style={{width:size,height:size}} />
);

export default Avatar;
