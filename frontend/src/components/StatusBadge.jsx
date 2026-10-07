import React from 'react';
import { CheckCircle2, Clock, AlertTriangle, Truck } from 'lucide-react';

const StatusBadge = ({ status, isDelayed }) => {
  const normStatus = (status || 'Pending').toLowerCase();

  let badgeClass = 'pending';
  let icon = <Clock size={12} />;
  let label = status || 'Pending';

  if (isDelayed || normStatus === 'delayed') {
    badgeClass = 'delayed';
    icon = <AlertTriangle size={12} />;
    label = 'Delayed';
  } else if (normStatus === 'delivered') {
    badgeClass = 'delivered';
    icon = <CheckCircle2 size={12} />;
    label = 'Delivered';
  } else if (normStatus === 'in transit') {
    badgeClass = 'in-transit';
    icon = <Truck size={12} />;
    label = 'In Transit';
  }

  return (
    <span className={`status-badge ${badgeClass}`}>
      {icon}
      {label}
    </span>
  );
};

export default StatusBadge;
