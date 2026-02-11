import React from 'react';
import './Badge.css';

const Badge = ({ children, variant='default' }) => (
  <span className={["ui-badge", `ui-badge--${variant}`].join(' ')}>{children}</span>
);

export default Badge;
