import React, { useRef } from 'react';
import { UploadCloud, FileText } from 'lucide-react';

const FileUploadDropzone = ({ onFileSelect, acceptedFormats = '.json,.xml,.csv,.xlsx', loading = false }) => {
  const fileInputRef = useRef(null);

  const handleDrop = (e) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      onFileSelect(e.dataTransfer.files[0]);
    }
  };

  const handleChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      onFileSelect(e.target.files[0]);
    }
  };

  return (
    <div
      className="dropzone"
      onDragOver={(e) => e.preventDefault()}
      onDrop={handleDrop}
      onClick={() => fileInputRef.current?.click()}
    >
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleChange}
        accept={acceptedFormats}
        style={{ display: 'none' }}
      />
      <UploadCloud className="dropzone-icon" />
      <h4 style={{ fontSize: '1rem', fontWeight: 600, color: '#0f172a', marginBottom: '0.25rem' }}>
        {loading ? 'Processing File...' : 'Click or Drag & Drop File to Upload'}
      </h4>
      <p style={{ fontSize: '0.85rem', color: '#64748b' }}>
        Supports JSON (Orders), XML (Shipments), CSV (Products), Excel (.xlsx)
      </p>
    </div>
  );
};

export default FileUploadDropzone;
