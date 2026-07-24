import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Upload, FileJson } from 'lucide-react';
import { useSettingsStore } from '../../stores/settings-store';

interface ImportDialogProps {
  onRefresh: () => void;
}

export function ImportDialog({ onRefresh }: ImportDialogProps) {
  const { t } = useTranslation();
  const { setImportOpen, addToast } = useSettingsStore();
  const [importing, setImporting] = useState(false);

  const handleSelectFiles = async () => {
    const files = await window.api.dialog.openFile({
      filters: [
        { name: 'JSONL / Backup', extensions: ['jsonl', 'json'] },
        { name: 'All Files', extensions: ['*'] },
      ],
      multi: true,
    });
    if (files && files.length > 0) {
      await doImport(files);
    }
  };

  const handleSelectDir = async () => {
    const dir = await window.api.dialog.openDir();
    if (dir) {
      await doImport([dir]);
    }
  };

  const doImport = async (paths: string[]) => {
    setImporting(true);
    try {
      const result = await window.api.import.conversations(paths);
      if (result.imported > 0) {
        addToast({
          message: t('dialog.import.success', { count: result.imported }),
          type: 'success',
        });
      }
      if (result.skipped > 0) {
        addToast({
          message: t('dialog.import.skipped', { count: result.skipped }),
          type: 'warning',
          duration: 5000,
        });
      }
      if (result.errors.length > 0) {
        addToast({
          message: result.errors[0],
          type: 'error',
          duration: 5000,
        });
      }
      setImportOpen(false);
      onRefresh();
    } catch {
      addToast({ message: t('dialog.import.failed'), type: 'error' });
    } finally {
      setImporting(false);
    }
  };

  return (
    <div className="dialog-overlay" onClick={() => setImportOpen(false)}>
      <div className="dialog" onClick={e => e.stopPropagation()} style={{ minWidth: 440 }}>
        <div className="dialog__header">
          <span className="dialog__title">{t('dialog.import.title')}</span>
          <button className="btn btn--icon" onClick={() => setImportOpen(false)}>✕</button>
        </div>
        <div className="dialog__body" style={{ textAlign: 'center', padding: 32 }}>
          <Upload size={40} style={{ color: 'var(--text-muted)', marginBottom: 16 }} />
          <p className="dialog__text" style={{ marginBottom: 20 }}>
            {t('dialog.import.dragDrop')}
          </p>
          <div style={{ display: 'flex', gap: 8, justifyContent: 'center' }}>
            <button className="btn btn--ghost" onClick={handleSelectFiles} disabled={importing}>
              <FileJson size={14} />
              {t('dialog.import.selectFiles')}
            </button>
            <button className="btn btn--ghost" onClick={handleSelectDir} disabled={importing}>
              <Upload size={14} />
              Select Folder
            </button>
          </div>
          {importing && (
            <div style={{ marginTop: 16, fontSize: 12, color: 'var(--text-muted)' }}>
              Importing...
            </div>
          )}
        </div>
        <div className="dialog__footer">
          <button className="btn btn--ghost" onClick={() => setImportOpen(false)}>
            {t('dialog.import.cancel')}
          </button>
        </div>
      </div>
    </div>
  );
}
