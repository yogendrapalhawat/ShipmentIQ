import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import api from '../api/client';
import PageHeader from '../components/PageHeader';
import FileUploadDropzone from '../components/FileUploadDropzone';
import DataTable from '../components/DataTable';
import LoadingSkeleton from '../components/LoadingSkeleton';
import ErrorState from '../components/ErrorState';
import { UploadCloud, CheckCircle2, AlertTriangle, FileText, ArrowRight, History } from 'lucide-react';

const ImportsPage = () => {
  const { addToast } = useApp();

  const [selectedFile, setSelectedFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(false);
  const [historyLoading, setHistoryLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchHistory = async () => {
    setHistoryLoading(true);
    try {
      const res = await api.get('/imports');
      setHistory(res);
    } catch (err) {
      console.error('Failed to load import history:', err);
    } finally {
      setHistoryLoading(false);
    }
  };

  useEffect(() => {
    fetchHistory();
  }, []);

  const handleFileSelect = async (file) => {
    setSelectedFile(file);
    setPreview(null);
    setError(null);
    setLoading(true);

    const formData = new FormData();
    formData.append('file', file);

    try {
      const res = await api.post('/ingest/preview', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      setPreview(res);
      addToast(`File ${file.name} parsed for preview`, 'success');
    } catch (err) {
      setError(err.message || 'Failed to parse file preview');
      addToast(err.message || 'Error parsing file', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleCommit = async () => {
    if (!selectedFile) return;

    setLoading(true);
    setError(null);

    const formData = new FormData();
    formData.append('file', selectedFile);

    try {
      const res = await api.post('/ingest/commit', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      addToast(res.message || 'Data imported successfully!', 'success');
      setSelectedFile(null);
      setPreview(null);
      fetchHistory();
    } catch (err) {
      setError(err.message || 'Failed to commit import');
      addToast(err.message || 'Commit failed', 'error');
    } finally {
      setLoading(false);
    }
  };

  const historyColumns = [
    { header: 'File Name', accessor: 'filename', cell: (row) => <strong>{row.filename}</strong> },
    {
      header: 'File Type',
      accessor: 'file_type',
      cell: (row) => (
        <span style={{ textTransform: 'uppercase', fontWeight: 600, fontSize: '0.75rem', color: '#4f46e5' }}>
          {row.file_type}
        </span>
      ),
    },
    {
      header: 'Status',
      accessor: 'status',
      cell: (row) => (
        <span
          style={{
            color: row.status.includes('Warnings') ? '#d97706' : '#15803d',
            fontWeight: 600,
            fontSize: '0.85rem',
          }}
        >
          {row.status}
        </span>
      ),
    },
    { header: 'Imported', accessor: 'imported_count', align: 'center' },
    { header: 'Rejected', accessor: 'rejected_count', align: 'center' },
    {
      header: 'Date',
      accessor: 'created_at',
      cell: (row) => new Date(row.created_at).toLocaleString(),
    },
  ];

  return (
    <div>
      <PageHeader title="Data Import Center" subtitle="Upload JSON, XML, CSV, or Excel files for validation and database ingestion" />

      {/* Upload Zone */}
      <div style={{ marginBottom: '1.75rem' }}>
        <FileUploadDropzone onFileSelect={handleFileSelect} loading={loading} />
      </div>

      {error && <ErrorState message={error} />}

      {/* Import Preview Section */}
      {preview && (
        <div style={{ backgroundColor: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '16px', padding: '1.5rem', marginBottom: '1.75rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 600, color: '#0f172a' }}>
              Import Preview: {preview.filename}
            </h3>
            <button className="btn btn-primary" onClick={handleCommit} disabled={loading}>
              <CheckCircle2 size={16} /> Confirm & Commit to Database
            </button>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', marginBottom: '1rem' }}>
            <div style={{ padding: '0.75rem 1rem', backgroundColor: '#eef2ff', borderRadius: '8px' }}>
              <span style={{ fontSize: '0.8rem', color: '#4338ca' }}>Valid Records</span>
              <p style={{ fontSize: '1.25rem', fontWeight: 700, color: '#312e81' }}>{preview.valid_records_count}</p>
            </div>
            <div style={{ padding: '0.75rem 1rem', backgroundColor: '#fef3c7', borderRadius: '8px' }}>
              <span style={{ fontSize: '0.8rem', color: '#b45309' }}>Warnings / Deduplication</span>
              <p style={{ fontSize: '0.9rem', color: '#78350f' }}>{preview.deduplication_summary}</p>
            </div>
          </div>

          {preview.warnings.length > 0 && (
            <div style={{ padding: '0.75rem 1rem', backgroundColor: '#fef2f2', border: '1px solid #fecaca', borderRadius: '8px', marginBottom: '1rem' }}>
              <strong style={{ color: '#991b1b', fontSize: '0.85rem' }}>Warnings Identified:</strong>
              <ul style={{ paddingLeft: '1.25rem', fontSize: '0.85rem', color: '#b91c1c', marginTop: '0.25rem' }}>
                {preview.warnings.map((w, idx) => (
                  <li key={idx}>{w}</li>
                ))}
              </ul>
            </div>
          )}

          <h4 style={{ fontSize: '0.9rem', fontWeight: 600, color: '#475569', marginBottom: '0.5rem' }}>
            Parsed Record Samples (First {preview.sample_records.length} records):
          </h4>
          <pre
            style={{
              backgroundColor: '#0f172a',
              color: '#f8fafc',
              padding: '1rem',
              borderRadius: '8px',
              fontSize: '0.8rem',
              overflowX: 'auto',
              maxHeight: '220px',
            }}
          >
            {JSON.stringify(preview.sample_records, null, 2)}
          </pre>
        </div>
      )}

      {/* Import History */}
      <div style={{ marginTop: '2rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
          <History size={20} style={{ color: '#4f46e5' }} />
          <h3 style={{ fontSize: '1.1rem', fontWeight: 600, color: '#0f172a' }}>Recent Ingestion History</h3>
        </div>

        {historyLoading ? (
          <LoadingSkeleton height="50px" count={4} />
        ) : (
          <DataTable columns={historyColumns} data={history} />
        )}
      </div>
    </div>
  );
};

export default ImportsPage;
