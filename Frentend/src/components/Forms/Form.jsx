import React from "react";

/**
 * Form Wrapper Component - Main form container
 * @param {string} title - Form title
 * @param {ReactNode} children - Form fields content
 * @param {function} onSubmit - Form submission handler
 * @param {ReactNode} actions - Form action buttons
 * @param {string} className - Additional CSS classes
 */
const Form = ({ title, children, onSubmit, actions, className = "" }) => {
  return (
    <div className={`form-wrapper ${className}`}>
      {title && <h2 className="form-title">{title}</h2>}

      <form onSubmit={onSubmit} className="form">
        <div className="form-body">{children}</div>

        {actions && <div className="form-actions-area">{actions}</div>}
      </form>
    </div>
  );
};

export default Form;
