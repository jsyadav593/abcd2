import React from 'react';

const Pagination = ({ page = 1, totalPages = 1, onChange }) => {
  const prev = () => onChange?.(Math.max(1, page - 1));
  const next = () => onChange?.(Math.min(totalPages, page + 1));
  return (
    <div style={{display:'flex',gap:8,alignItems:'center'}}>
      <button onClick={prev} disabled={page<=1}>Prev</button>
      <span>{page} / {totalPages}</span>
      <button onClick={next} disabled={page>=totalPages}>Next</button>
    </div>
  );
};

export default Pagination;
