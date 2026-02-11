import React from "react";

/**
 * FormActions Component - Reusable form action buttons
 * @param {Array} buttons - Array of button objects { label, onClick, type, variant, disabled }
 * @param {string} alignment - 'flex-end' (default), 'flex-start', 'center', 'space-between'
 */
const FormActions = ({ buttons = [], alignment = "flex-end" }) => {
  return (
    <div className="form-actions" style={{ justifyContent: alignment }}>
      {buttons.map((button, index) => (
        <button
          key={index}
          type={button.type || "button"}
          onClick={button.onClick}
          className={`form-btn form-btn-${button.variant || "secondary"}`}
          disabled={button.disabled || false}
        >
          {button.label}
        </button>
      ))}
    </div>
  );
};

export default FormActions;
