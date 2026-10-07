import React from 'react';
import { useApp } from '../context/AppContext';
import { CheckCircle2, AlertCircle, Info, X } from 'lucide-react';

const Toast = () => {
  const { toasts, removeToast } = useApp();

  if (toasts.length === 0) return null;

  return (
    <div className="toast-container">
      {toasts.map((toast) => {
        let icon = <Info size={18} style={{ color: '#3b82f6' }} />;
        if (toast.type === 'success') {
          icon = <CheckCircle2 size={18} style={{ color: '#22c55e' }} />;
        } else if (toast.type === 'error') {
          icon = <AlertCircle size={18} style={{ color: '#ef4444' }} />;
        }

        return (
          <div key={toast.id} className="toast">
            {icon}
            <span style={{ flex: 1 }}>{toast.message}</span>
            <button onClick={() => removeToast(toast.id)} style={{ color: '#94a3b8' }}>
              <X size={16} />
            </button>
          </div>
        );
      })}
    </div>
  );
};

export default Toast;
