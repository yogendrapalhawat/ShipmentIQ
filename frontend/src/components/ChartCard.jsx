import React from 'react';

const ChartCard = ({ title, action, children }) => {
  return (
    <div className="chart-card">
      <div className="chart-card-header">
        <h3 className="chart-card-title">{title}</h3>
        {action && <div>{action}</div>}
      </div>
      <div style={{ width: '100%', height: '300px' }}>
        {children}
      </div>
    </div>
  );
};

export default ChartCard;
