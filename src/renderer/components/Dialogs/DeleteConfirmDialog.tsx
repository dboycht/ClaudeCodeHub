import React from 'react';
import { useTranslation } from 'react-i18next';
import { AlertTriangle } from 'lucide-react';
import { useConversationStore } from '../../stores/conversation-store';
import { useSettingsStore } from '../../stores/settings-store';

interface DeleteConfirmDialogProps {
  onRefresh: () => void;
}

export function DeleteConfirmDialog({ onRefresh }: DeleteConfirmDialogProps) {
  const { t } = useTranslation();
  const { activeId, conversations, removeConversation } = useConversationStore();
  const { setDeleteOpen, addToast } = useSettingsStore();

  const conversation = conversations.find(c => c.id === activeId);

  const handleDelete = async () => {
    if (!activeId) return;
    try {
      const ok = await window.api.conv.delete(activeId);
      if (ok) {
        removeConversation(activeId);
        addToast({ message: 'Conversation moved to trash', type: 'success' });
      } else {
        addToast({ message: 'Failed to delete conversation', type: 'error' });
      }
    } catch {
      addToast({ message: 'Failed to delete conversation', type: 'error' });
    }
    setDeleteOpen(false);
    onRefresh();
  };

  return (
    <div className="dialog-overlay" onClick={() => setDeleteOpen(false)}>
      <div className="dialog" onClick={e => e.stopPropagation()} style={{ minWidth: 420 }}>
        <div className="dialog__header">
          <span className="dialog__title" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <AlertTriangle size={18} style={{ color: 'var(--warning)' }} />
            {t('dialog.delete.title')}
          </span>
          <button className="btn btn--icon" onClick={() => setDeleteOpen(false)}>✕</button>
        </div>
        <div className="dialog__body">
          <p className="dialog__text" style={{ marginBottom: 8 }}>
            {t('conversation.confirmDelete')}
          </p>
          <p style={{ fontWeight: 600, color: 'var(--danger)', fontSize: 13 }}>
            "{conversation?.displayName}"
          </p>
          <p style={{ marginTop: 8, fontSize: 12, color: 'var(--text-muted)' }}>
            {t('conversation.confirmDeleteDesc')}
          </p>
        </div>
        <div className="dialog__footer">
          <button className="btn btn--ghost" onClick={() => setDeleteOpen(false)}>
            {t('dialog.delete.cancel')}
          </button>
          <button className="btn btn--danger-solid" onClick={handleDelete}>
            {t('dialog.delete.confirm')}
          </button>
        </div>
      </div>
    </div>
  );
}
