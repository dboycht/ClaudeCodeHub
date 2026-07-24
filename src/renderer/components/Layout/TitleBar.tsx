import React from 'react';
import { useTranslation } from 'react-i18next';
import { MessageSquare, Minus, Square, X, RefreshCw } from 'lucide-react';

interface TitleBarProps {
  onRefresh: () => void;
}

export function TitleBar({ onRefresh }: TitleBarProps) {
  const { t } = useTranslation();

  const handleMinimize = () => window.api.window.minimize();
  const handleMaximize = () => window.api.window.maximize();
  const handleClose = () => window.api.window.close();

  return (
    <div className="title-bar">
      <MessageSquare size={16} className="title-bar__icon" style={{ color: 'var(--accent-primary)' }} />
      <span className="title-bar__title">{t('app.title')}</span>
      <div className="title-bar__actions">
        <button className="title-bar__btn" onClick={onRefresh} title="Refresh">
          <RefreshCw size={14} />
        </button>
        <button className="title-bar__btn" onClick={handleMinimize} title="Minimize">
          <Minus size={14} />
        </button>
        <button className="title-bar__btn" onClick={handleMaximize} title="Maximize">
          <Square size={12} />
        </button>
        <button className="title-bar__btn title-bar__btn--close" onClick={handleClose} title="Close">
          <X size={14} />
        </button>
      </div>
    </div>
  );
}
