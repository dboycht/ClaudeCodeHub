import React from 'react';
import { useTranslation } from 'react-i18next';
import { Info, Github, Heart } from 'lucide-react';
import { useSettingsStore } from '../../stores/settings-store';

export function AboutDialog() {
  const { t } = useTranslation();
  const { setAboutOpen } = useSettingsStore();

  return (
    <div className="dialog-overlay" onClick={() => setAboutOpen(false)}>
      <div className="dialog" onClick={e => e.stopPropagation()} style={{ minWidth: 420, textAlign: 'center' }}>
        <div className="dialog__header">
          <span className="dialog__title" style={{ display: 'flex', alignItems: 'center', gap: 8, justifyContent: 'center', width: '100%' }}>
            <Info size={18} style={{ color: 'var(--accent-primary)' }} />
            {t('dialog.about.title')}
          </span>
          <button className="btn btn--icon" onClick={() => setAboutOpen(false)}>✕</button>
        </div>
        <div className="dialog__body" style={{ padding: '24px 20px' }}>
          <div style={{ fontSize: 24, fontWeight: 700, color: 'var(--accent-primary)', marginBottom: 4 }}>
            ClaudeCode Hub
          </div>
          <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 16 }}>
            {t('dialog.about.version')}
          </div>
          <p style={{ fontSize: 12, color: 'var(--text-secondary)', lineHeight: 1.6, marginBottom: 16 }}>
            {t('dialog.about.description')}
          </p>
          <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginBottom: 8 }}>
            {t('dialog.about.author')}
          </div>
          <a
            href="https://github.com/dboycht/ClaudeCodeHub"
            target="_blank"
            rel="noopener noreferrer"
            style={{
              display: 'inline-flex', alignItems: 'center', gap: 6,
              color: 'var(--accent-primary)', textDecoration: 'none',
              fontSize: 12, marginBottom: 8,
            }}
          >
            <Github size={14} />
            github.com/dboycht/ClaudeCodeHub
          </a>
          <div style={{ fontSize: 10, color: 'var(--text-muted)', marginTop: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4 }}>
            Made with <Heart size={10} style={{ color: 'var(--danger)' }} /> by dboycht
          </div>
        </div>
        <div className="dialog__footer" style={{ justifyContent: 'center' }}>
          <button className="btn btn--primary" onClick={() => setAboutOpen(false)}>
            {t('dialog.about.close')}
          </button>
        </div>
      </div>
    </div>
  );
}
