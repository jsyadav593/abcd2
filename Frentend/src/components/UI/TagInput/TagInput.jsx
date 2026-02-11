import React, {useState} from 'react';

const TagInput = ({ value = [], onChange }) => {
  const [text, setText] = useState('');
  const add = () => { if (text.trim()){ onChange?.([...value, text.trim()]); setText(''); } };
  const remove = (i) => onChange?.(value.filter((_,idx)=>idx!==i));
  return (
    <div style={{display:'flex',gap:8,flexWrap:'wrap',alignItems:'center'}}>
      {value.map((t,i)=> (
        <div key={i} style={{background:'#eef2ff',padding:'4px 8px',borderRadius:999,display:'flex',gap:8,alignItems:'center'}}>
          <span>{t}</span>
          <button onClick={()=>remove(i)} style={{border:0,background:'transparent',cursor:'pointer'}}>×</button>
        </div>
      ))}
      <input value={text} onChange={(e)=>setText(e.target.value)} onKeyDown={(e)=>{ if(e.key==='Enter'){ e.preventDefault(); add(); } }} placeholder="Add tag" />
      <button onClick={add}>Add</button>
    </div>
  );
};

export default TagInput;
