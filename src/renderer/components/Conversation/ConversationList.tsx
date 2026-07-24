import React from 'react';
import { useTranslation } from 'react-i18next';
import { Inbox, Trash2, Download } from 'lucide-react';
import { useConversationStore } from '../../stores/conversation-store';
import { useSettingsStore } from '../../stores/settings-store';
import { COLOR_LABELS } from '../../types/colors';
import { ConversationItem } from './ConversationItem';

interface ConversationListProps {
  onRefresh: () => void;
}

export function ConversationList({ onRefresh }: ConversationListProps) {
  const { t } = useTranslation();
  const {
    conversations, getFilteredConversations,
    selectedIds, clearSelection, selectAll, updateConversation,
    filterProject, filterStarred, searchQuery,
  } = useConversationStore();
  const { addToast } = useSettingsStore();

  const filtered = getFilteredConversations();
  const selectedCount = selectedIds.size;
  const hasActiveFilter = !!filterProject || filterStarred || !!searchQuery;

  const handleBatchDelete = async () => {
    if (selectedCount === 0) return;
    if (!confirm(t('batch.confirmDelete', { count: selectedCount }))) return;

    let ok = 0;
    for (const id of selectedIds) {
      try { await window.api.conv.delete(id); ok++; } catch { /* skip */ }
    }
    clearSelection();
    addToast({ message: t('batch.deleted', { count: ok }), type: 'success' });
    onRefresh();
  };

  const handleBatchColor = async (color: string | null) => {
    for (const id of selectedIds) {
      try {
        await window.api.conv.setColor(id, color);
        updateConversation(id, { color: color as any });
      } catch { /* skip */ }
    }
    addToast({ message: t('batch.tagged', { count: selectedCount }), type: 'success' });
    clearSelection();
  };

  const handleBatchExport = async () => {
    const dir = await window.api.dialog.openDir();
    if (!dir) return;

    let ok = 0;
    for (const id of selectedIds) {
      try {
        await window.api.export.conversation(id, 'markdown', `${dir}/${id.slice(0, 8)}.md`);
        ok++;
      } catch { /* skip */ }
    }
    clearSelection();
    addToast({ message: `${t('batch.exported', { count: ok })} ${dir}`, type: 'success' });
  };

  const selectBtnLabel = selectedCount > 0
    ? `✕ ${t('conversation.selected', { count: selectedCount })}`
    : t('conversation.selectAll');

  return (
    <div className="conv-list">
      <div className="conv-list__header">
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span className="conv-list__title">
            {hasActiveFilter
              ? t('status.totalConversations', { count: filtered.length })
              : t('sidebar.allConversations')
            }
          </span>
          {hasActiveFilter && (
            <span className="conv-list__count">
              {t('status.totalConversations', { count: conversations.length })}
            </span>
          )}
        </div>
        <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
          {filtered.length > 0 && (
            <button
              className="btn btn--ghost btn--sm"
              onClick={selectedCount > 0 ? clearSelection : selectAll}
              style={{ fontSize: 11 }}
            >
              {selectBtnLabel}
            </button>
          )}
        </div>
      </div>

      {selectedCount > 0 && (
        <div className="conv-list__batch-bar">
          <span style={{ fontSize: 11, color: 'var(--text-secondary)' }}>
            {t('batch.selectedCount', { count: selectedCount })}
          </span>
          {COLOR_LABELS.filter(c => c.id !== null).map(c => (
            <button
              key={c.id}
              onClick={() => handleBatchColor(c.id)}
              title={`${t('conversation.batchTag')} ${c.label.zh}`}
              style={{
                width: 16, height: 16, borderRadius: '50%',
                backgroundColor: c.color, border: 'none', cursor: 'pointer',
                opacity: 0.8,
              }}
            />
          ))}
          <button
            onClick={() => handleBatchColor(null)}
            title={t('conversation.removeColor')}
            style={{
              width: 16, height: 16, borderRadius: '50%',
              border: '1px dashed var(--text-muted)', cursor: 'pointer',
              background: 'transparent', color: 'var(--text-muted)',
              fontSize: 10, display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}
          >✕</button>
          <div style={{ flex: 1 }} />
          <button className="btn btn--ghost btn--sm" onClick={handleBatchExport}>
            <Download size={12} /> {t('batch.export')}
          </button>
          <button className="btn btn--danger btn--sm" onClick={handleBatchDelete}>
            <Trash2 size={12} /> {t('batch.delete')}
          </button>
        </div>
      )}

      <div className="conv-list__items">
        {filtered.length === 0 ? (
          <div className="conv-list__empty">
            <Inbox size={40} />
            <div className="conv-list__empty-title">{t('conversation.noConversations')}</div>
            <div className="conv-list__empty-desc">
              {hasActiveFilter ? t('conversation.tryClearFilter') : ''}
            </div>
          </div>
        ) : (
          filtered.map(conv => (
            <ConversationItem key={conv.id} conversation={conv} onRefresh={onRefresh} />
          ))
        )}
      </div>
    </div>
  );
}
