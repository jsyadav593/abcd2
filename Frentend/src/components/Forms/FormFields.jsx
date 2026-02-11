import React from "react";

/**
 * FormFields Component - Grid layout wrapper for form fields
 * @param {ReactNode} children - Form field elements
 * @param {number} columns - Number of grid columns (default: 2)
 * @param {string} gap - Gap between fields (default: '18px')
 * @param {string} className - Additional CSS classes
 */
const FormFields = ({ 
  children, 
  columns = 2, 
  gap = "18px",
  className = ""
}) => {
  return (
    <div
      className={`form-fields ${className}`}
      style={{
        gridTemplateColumns: `repeat(${columns}, 1fr)`,
        gap: gap,
      }}
    >
      {children}
    </div>
  );
};

export default FormFields;
