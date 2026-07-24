import React from 'react';
import { CheckCircle, XCircle, Info, AlertTriangle, X } from 'lucide-react';
import { useSettingsStore } from '../../stores/settings-store';

const iconMap = {
  success: CheckCircle,
  error: XCircle,
  info: Info,
  warning: AlertTriangle,
};

export function ToastContainer() {
  const { toasts, removeToast } = useSettingsStore();

  return (
    <div className="toast-container">
      {toasts.map(toast => {
        const Icon = iconMap[toast.type];
        return (
          <div key={toast.id} className={`toast toast--${toast.type}`}>
            <Icon size={16} />
            <span>{toast.message}</span>
            <button className="toast__close" onClick={() => removeToast(toast.id)}>
              <X size={12} />
            </button>
          </div>
        );
      })}
    </div>
  );
}
