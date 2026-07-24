import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useConversationStore } from '../../stores/conversation-store';
import { useSettingsStore } from '../../stores/settings-store';

interface RenameDialogProps {
  onRefresh: () => void;
}

export function RenameDialog({ onRefresh }: RenameDialogProps) {
  const { t } = useTranslation();
  const { activeId, conversations, updateConversation } = useConversationStore();
  const { setRenameOpen, addToast } = useSettingsStore();

  const conversation = conversations.find(c => c.id === activeId);
  const [name, setName] = useState(conversation?.customName || conversation?.displayName || '');

  const handleSave = async () => {
    if (!activeId || !name.trim()) return;
    try {
      await window.api.conv.rename(activeId, name.trim());
      updateConversation(activeId, { displayName: name.trim(), customName: name.trim() });
      addToast({ message: 'Renamed — change will appear in Claude Code /resume', type: 'success' });
      setRenameOpen(false);
      onRefresh();
    } catch {
      addToast({ message: 'Failed to rename', type: 'error' });
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') handleSave();
    if (e.key === 'Escape') setRenameOpen(false);
  };

  return (
    <div className="dialog-overlay" onClick={() => setRenameOpen(false)}>
      <div className="dialog" onClick={e => e.stopPropagation()}>
        <div className="dialog__header">
          <span className="dialog__title">{t('dialog.rename.title')}</span>
          <button className="btn btn--icon" onClick={() => setRenameOpen(false)}>✕</button>
        </div>
        <div className="dialog__body">
          <label className="dialog__label">{t('dialog.rename.label')}</label>
          <input
            className="dialog__input"
            type="text"
            value={name}
            onChange={e => setName(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={t('dialog.rename.placeholder')}
            autoFocus
          />
        </div>
        <div className="dialog__footer">
          <button className="btn btn--ghost" onClick={() => setRenameOpen(false)}>
            {t('dialog.rename.cancel')}
          </button>
          <button className="btn btn--primary" onClick={handleSave}>
            {t('dialog.rename.save')}
          </button>
        </div>
      </div>
    </div>
  );
}
