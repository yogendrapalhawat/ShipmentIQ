import React from 'react';

export const LoadingSkeleton = ({ height = '200px', count = 1 }) => {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', width: '100%' }}>
      {Array.from({ length: count }).map((_, idx) => (
        <div
          key={idx}
          style={{
            height,
            backgroundColor: '#e2e8f0',
            borderRadius: '12px',
            animation: 'pulse 1.5s infinite ease-in-out',
          }}
        />
      ))}
      <style>{`
        @keyframes pulse {
          0% { opacity: 0.6; }
          50% { opacity: 1; }
          100% { opacity: 0.6; }
        }
      `}</style>
    </div>
  );
};

export default LoadingSkeleton;
