import React from 'react';

const EmptyState = ({ title = 'No results', description }) => (
  <div style={{textAlign:'center',padding:24,color:'#64748b'}}>
    <div style={{fontSize:18,fontWeight:600}}>{title}</div>
    {description && <div style={{marginTop:6}}>{description}</div>}
  </div>
);

export default EmptyState;
