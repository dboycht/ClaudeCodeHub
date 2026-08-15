import React, { useEffect, useState, useMemo, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import {
  MessageSquare, Clock, HardDrive, FolderOpen,
  Pencil, Trash2, Download, Star,
  ClipboardList, Calendar, Tag, FolderInput,
} from 'lucide-react';
import { useConversationStore } from '../../stores/conversation-store';
import { useSettingsStore } from '../../stores/settings-store';
import type { ConversationDetail as DetailType } from '../../../shared/types';
import type { ColorLabel } from '../../types/colors';
import { COLOR_LABELS } from '../../types/colors';

interface ConversationDetailProps {
  onRefresh: () => void;
}

function formatDate(ts: number): string {
  return new Date(ts).toLocaleString();
}

function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function timeAgo(ts: number): string {
  const now = Date.now();
  const diff = now - ts;
  const seconds = Math.floor(diff / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (seconds < 60) return 'just now';
  if (minutes < 60) return `${minutes} minutes ago`;
  if (hours < 24) return `${hours} hours ago`;
  if (days < 7) return `${days} days ago`;
  if (days < 30) return `${Math.floor(days / 7)} weeks ago`;
  return formatDate(ts);
}

/** Simple markdown-like formatting for message content */
function FormattedMessage({ content, role }: { content: string; role: string }) {
  const html = useMemo(() => {
    let text = content;

    // Escape HTML
    text = text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

    // Code blocks (```...```)
    text = text.replace(/```(\w*)\n?([\s\S]*?)```/g, (_match, lang, code) => {
      return `<pre class="code-block"><code>${code.trim()}</code></pre>`;
    });

    // Inline code (`...`)
    text = text.replace(/`([^`]+)`/g, '<code class="inline-code">$1</code>');

    // Bold (**...**)
    text = text.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');

    // Italic (*...*)
    text = text.replace(/\*([^*]+)\*/g, '<em>$1</em>');

    // Headers (### ...)
    text = text.replace(/^### (.+)$/gm, '<h4>$1</h4>');
    text = text.replace(/^## (.+)$/gm, '<h3>$1</h3>');

    // Unordered list items
    text = text.replace(/^- (.+)$/gm, '<li>$1</li>');
    text = text.replace(/((?:<li>.*<\/li>\n?)+)/g, '<ul>$1</ul>');

    // Line breaks
    text = text.replace(/\n\n/g, '<br/><br/>');
    text = text.replace(/\n/g, '<br/>');

    return text;
  }, [content]);

  return (
    <div
      className={`detail-panel__message detail-panel__message--${role}`}
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}

export function ConversationDetail({ onRefresh }: ConversationDetailProps) {
  const { t } = useTranslation();
  const { activeId, conversations, updateConversation } = useConversationStore();
  const { setRenameOpen, setDeleteOpen, setExportOpen, addToast } = useSettingsStore();
  const [detail, setDetail] = useState<DetailType | null>(null);
  const [loading, setLoading] = useState(false);
  const [showAll, setShowAll] = useState(false);

  const conversation = conversations.find(c => c.id === activeId);

  useEffect(() => {
    if (!activeId) {
      setDetail(null);
      setShowAll(false);
      return;
    }
    setLoading(true);
    setShowAll(false);
    window.api.conv.getDetail(activeId).then(data => {
      setDetail(data);
      setLoading(false);
    }).catch(() => {
      setDetail(null);
      setLoading(false);
    });
  }, [activeId]);

  const handleToggleStar = async () => {
    if (!conversation) return;
    try {
      await window.api.conv.toggleStar(conversation.id);
      updateConversation(conversation.id, { isStarred: !conversation.isStarred });
    } catch {
      addToast({ message: 'Failed', type: 'error' });
    }
  };

  const handleSetColor = async (color: ColorLabel) => {
    if (!conversation) return;
    const newColor = conversation.color === color ? null : color;
    try {
      await window.api.conv.setColor(conversation.id, newColor);
      updateConversation(conversation.id, { color: newColor as any });
    } catch {
      addToast({ message: 'Failed to set color', type: 'error' });
    }
  };

  const handleMigrate = async () => {
    if (!conversation) return;
    const targetDir = await window.api.dialog.openDir();
    if (!targetDir) return;

    if (!confirm(`${t('conversation.migrateConfirm')}\n\n"${conversation.project}" → "${targetDir}"`)) return;

    try {
      const ok = await window.api.conv.migrate(conversation.id, targetDir);
      if (ok) {
        addToast({ message: t('conversation.migrateSuccess'), type: 'success' });
        onRefresh();
      } else {
        addToast({ message: t('conversation.migrateFail'), type: 'error' });
      }
    } catch {
      addToast({ message: t('conversation.migrateFail'), type: 'error' });
    }
  };

  const displayMessages = detail?.messages
    ? (showAll ? detail.messages : detail.messages.slice(0, 20))
    : [];

  if (!activeId || !conversation) {
    return (
      <div className="detail-panel">
        <div className="detail-panel__empty">
          <ClipboardList size={48} />
          <div className="detail-panel__empty-title">{t('conversation.noDetail')}</div>
          <div className="detail-panel__empty-desc">{t('conversation.noDetailDesc')}</div>
        </div>
      </div>
    );
  }

  return (
    <div className="detail-panel">
      {/* Header */}
      <div className="detail-panel__header">
        <div className="detail-panel__title">{conversation.displayName}</div>
        <div className="detail-panel__actions">
          <button className="btn btn--icon" onClick={handleToggleStar} title={t('conversation.star')}>
            <Star size={15} fill={conversation.isStarred ? 'var(--warning)' : 'none'}
              color={conversation.isStarred ? 'var(--warning)' : undefined} />
          </button>
          {/* Color tag dots */}
          <div style={{ display: 'flex', gap: 2, marginRight: 4 }}>
            {COLOR_LABELS.filter(c => c.id !== null).map(c => (
              <button
                key={c.id}
                className="btn btn--icon"
                onClick={() => handleSetColor(c.id)}
                title={c.label.zh}
                style={{
                  padding: 2,
                  opacity: conversation.color === c.id ? 1 : 0.3,
                  transform: conversation.color === c.id ? 'scale(1.2)' : 'scale(0.8)',
                  transition: 'all 0.15s ease',
                }}
              >
                <div style={{
                  width: 10, height: 10, borderRadius: '50%',
                  backgroundColor: c.color,
                  border: conversation.color === c.id ? '2px solid var(--text-primary)' : 'none',
                }} />
              </button>
            ))}
          </div>
          <button className="btn btn--ghost btn--sm" onClick={() => setRenameOpen(true)}>
            <Pencil size={13} /> {t('conversation.rename')}
          </button>
          <button className="btn btn--ghost btn--sm" onClick={() => setExportOpen(true)}>
            <Download size={13} /> {t('conversation.export')}
          </button>
          <button className="btn btn--ghost btn--sm" onClick={handleMigrate} title={t('conversation.migrateTitle')}>
            <FolderInput size={13} /> {t('conversation.migrate')}
          </button>
          <button className="btn btn--danger btn--sm" onClick={() => setDeleteOpen(true)}>
            <Trash2 size={13} /> {t('conversation.delete')}
          </button>
        </div>
      </div>

      {/* Info Grid */}
      <div className="detail-panel__info">
        <div className="detail-panel__info-item">
          <span className="detail-panel__info-label">{t('conversation.project')}</span>
          <span className="detail-panel__info-value" title={conversation.project} style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 11 }}>
            <FolderOpen size={12} /> {conversation.project}
          </span>
        </div>
        <div className="detail-panel__info-item">
          <span className="detail-panel__info-label">{t('conversation.messageCount')}</span>
          <span className="detail-panel__info-value" style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            <MessageSquare size={12} /> {detail?.messageCount ?? conversation.messageCount}
          </span>
        </div>
        <div className="detail-panel__info-item">
          <span className="detail-panel__info-label">{t('conversation.size')}</span>
          <span className="detail-panel__info-value" style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            <HardDrive size={12} /> {formatSize(conversation.size)}
          </span>
        </div>
        <div className="detail-panel__info-item">
          <span className="detail-panel__info-label">{t('conversation.updated')}</span>
          <span className="detail-panel__info-value" style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 11 }}>
            <Clock size={12} /> {timeAgo(conversation.updatedAt)}
          </span>
        </div>
      </div>

      {/* Messages Preview */}
      <div className="detail-panel__preview">
        <div className="detail-panel__preview-title">{t('conversation.preview')}</div>
        {loading ? (
          <div style={{ textAlign: 'center', padding: 20, color: 'var(--text-muted)' }}>
            {t('conversation.loading')}
          </div>
        ) : displayMessages.length > 0 ? (
          <>
            {displayMessages.map((msg, i) => (
              <FormattedMessage key={i} content={msg.content} role={msg.role} />
            ))}
            {detail && detail.messages.length > 20 && !showAll && (
              <div style={{ textAlign: 'center', padding: 16 }}>
                <button
                  className="btn btn--ghost btn--sm"
                  onClick={() => setShowAll(true)}
                >
                  {t('conversation.showAllMessages', { count: detail.messages.length })}
                </button>
              </div>
            )}
            {showAll && detail && detail.messages.length > 20 && (
              <div style={{
                textAlign: 'center', padding: 12, color: 'var(--text-muted)',
                fontSize: 11, fontStyle: 'italic', cursor: 'pointer',
              }} onClick={() => setShowAll(false)}>
                {t('conversation.collapseMessages', { count: detail.messages.length })}
              </div>
            )}
          </>
        ) : (
          <div style={{ textAlign: 'center', padding: 20, color: 'var(--text-muted)' }}>
            {conversation.messageCount === 0
              ? t('conversation.noFileOnDisk')
              : t('conversation.noMessages')}
          </div>
        )}
      </div>
    </div>
  );
}
