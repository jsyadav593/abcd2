import React from 'react';

const FileUploader = ({ onChange, accept }) => (
  <input type="file" accept={accept} onChange={(e)=>onChange?.(e.target.files)} />
);

export default FileUploader;
