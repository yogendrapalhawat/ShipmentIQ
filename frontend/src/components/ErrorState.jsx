import React from 'react';
import { AlertCircle, RefreshCw } from 'lucide-react';

const ErrorState = ({ title = 'Failed to load data', message = 'An error occurred while connecting to the server.', onRetry }) => {
  return (
    <div
      style={{
        padding: '2.5rem 1.5rem',
        textAlign: 'center',
        backgroundColor: '#fef2f2',
        borderRadius: '16px',
        border: '1px solid #fecaca',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: '0.75rem',
      }}
    >
      <AlertCircle size={40} style={{ color: '#ef4444' }} />
      <h3 style={{ fontSize: '1.1rem', fontWeight: 600, color: '#991b1b' }}>{title}</h3>
      <p style={{ fontSize: '0.875rem', color: '#b91c1c', maxWidth: '400px' }}>{message}</p>
      {onRetry && (
        <button
          className="btn btn-secondary"
          onClick={onRetry}
          style={{ marginTop: '0.5rem', borderColor: '#fca5a5', color: '#991b1b' }}
        >
          <RefreshCw size={16} />
          Try Again
        </button>
      )}
    </div>
  );
};

export default ErrorState;
