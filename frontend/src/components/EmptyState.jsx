import React from 'react';
import { PackageX } from 'lucide-react';

const EmptyState = ({ title = 'No data available', description = 'There are no records matching your criteria.', action }) => {
  return (
    <div
      style={{
        padding: '3rem 1.5rem',
        textAlign: 'center',
        backgroundColor: '#ffffff',
        borderRadius: '16px',
        border: '1px solid #e2e8f0',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: '0.75rem',
      }}
    >
      <PackageX size={44} style={{ color: '#94a3b8' }} />
      <h3 style={{ fontSize: '1.1rem', fontWeight: 600, color: '#0f172a' }}>{title}</h3>
      <p style={{ fontSize: '0.875rem', color: '#64748b', maxWidth: '400px' }}>{description}</p>
      {action && <div style={{ marginTop: '0.5rem' }}>{action}</div>}
    </div>
  );
};

export default EmptyState;
