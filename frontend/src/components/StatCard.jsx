import React from 'react';

const StatCard = ({ title, value, subtitle, icon: Icon, color = 'indigo', onClick }) => {
  const colorMap = {
    indigo: { bg: '#eef2ff', text: '#4f46e5' },
    green: { bg: '#dcfce7', text: '#16a34a' },
    amber: { bg: '#fef3c7', text: '#d97706' },
    blue: { bg: '#e0f2fe', text: '#0284c7' },
    purple: { bg: '#f3e8ff', text: '#9333ea' },
  };

  const style = colorMap[color] || colorMap.indigo;

  return (
    <div
      className="stat-card"
      onClick={onClick}
      style={{ cursor: onClick ? 'pointer' : 'default' }}
    >
      <div className="stat-card-header">
        <span className="stat-card-title">{title}</span>
        {Icon && (
          <div className="stat-card-icon" style={{ backgroundColor: style.bg, color: style.text }}>
            <Icon size={20} />
          </div>
        )}
      </div>
      <div className="stat-card-value">{value}</div>
      {subtitle && <div className="stat-card-subtitle">{subtitle}</div>}
    </div>
  );
};

export default StatCard;
