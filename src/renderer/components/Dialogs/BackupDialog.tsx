import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Download, FolderOpen } from 'lucide-react';
import { useConversationStore } from '../../stores/conversation-store';
import { useSettingsStore } from '../../stores/settings-store';

export function BackupDialog() {
  const { t } = useTranslation();
  const { selectedIds, conversations } = useConversationStore();
  const { setBackupOpen, addToast } = useSettingsStore();
  const [scope, setScope] = useState<'all' | 'selected'>('all');
  const [outputDir, setOutputDir] = useState('');
  const [backing, setBacking] = useState(false);

  const handleChooseDir = async () => {
    const dir = await window.api.dialog.openDir();
    if (dir) setOutputDir(dir);
  };

  const handleBackup = async () => {
    if (!outputDir) return;
    setBacking(true);
    try {
      let result;
      if (scope === 'all') {
        result = await window.api.backup.all(outputDir);
      } else {
        result = await window.api.backup.conversations(Array.from(selectedIds), outputDir);
      }
      addToast({
        message: t('dialog.backup.success', { count: result.count, path: result.path }),
        type: 'success',
      });
      setBackupOpen(false);
    } catch {
      addToast({ message: t('dialog.backup.failed'), type: 'error' });
    } finally {
      setBacking(false);
    }
  };

  return (
    <div className="dialog-overlay" onClick={() => setBackupOpen(false)}>
      <div className="dialog" onClick={e => e.stopPropagation()} style={{ minWidth: 440 }}>
        <div className="dialog__header">
          <span className="dialog__title" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <Download size={16} />
            {t('dialog.backup.title')}
          </span>
          <button className="btn btn--icon" onClick={() => setBackupOpen(false)}>✕</button>
        </div>
        <div className="dialog__body">
          <div className="dialog__radio-group">
            <label className={`dialog__radio ${scope === 'all' ? 'dialog__radio--active' : ''}`}>
              <input
                type="radio"
                name="backup-scope"
                value="all"
                checked={scope === 'all'}
                onChange={() => setScope('all')}
              />
              <div>
                <div style={{ fontWeight: 500 }}>{t('dialog.backup.all')}</div>
                <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>
                  {t('status.totalConversations', { count: conversations.length })}
                </div>
              </div>
            </label>
            <label className={`dialog__radio ${scope === 'selected' ? 'dialog__radio--active' : ''}`}>
              <input
                type="radio"
                name="backup-scope"
                value="selected"
                checked={scope === 'selected'}
                onChange={() => setScope('selected')}
                disabled={selectedIds.size === 0}
              />
              <div>
                <div style={{ fontWeight: 500 }}>{t('dialog.backup.selected')}</div>
                <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>
                  {selectedIds.size === 0
                    ? t('dialog.backup.noSelection')
                    : t('conversation.selected', { count: selectedIds.size })
                  }
                </div>
              </div>
            </label>
          </div>

          <div style={{ marginTop: 16 }}>
            <label className="dialog__label">{t('dialog.backup.selectDir')}</label>
            <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
              <input
                className="dialog__input"
                style={{ flex: 1, marginTop: 0 }}
                type="text"
                value={outputDir}
                readOnly
                placeholder="Choose a directory..."
              />
              <button className="btn btn--ghost" onClick={handleChooseDir}>
                <FolderOpen size={14} />
              </button>
            </div>
          </div>
        </div>
        <div className="dialog__footer">
          <button className="btn btn--ghost" onClick={() => setBackupOpen(false)}>
            {t('dialog.backup.cancel')}
          </button>
          <button
            className="btn btn--primary"
            onClick={handleBackup}
            disabled={!outputDir || backing}
          >
            {backing ? 'Backing up...' : t('dialog.backup.backup')}
          </button>
        </div>
      </div>
    </div>
  );
}
