import React from 'react';
import './Button.css';

const Button = ({ children, className, variant = 'primary', size = 'md', onClick, type = 'button', disabled }) => {
  return (
    <button
      // className={["ui-btn", `ui-btn--${variant}`, `ui-btn--${size}`].join(' ')}
      className={["ui-btn", `ui-btn--${size}`, className].filter(Boolean).join(' ') }
      onClick={onClick}
      type={type}
      disabled={disabled}
    >
      {children}
    </button>
  );
};

export default Button;
