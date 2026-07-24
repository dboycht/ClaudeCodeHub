import React from 'react';
import { Star, MessageSquare, Calendar, HardDrive, Folder } from 'lucide-react';
import type { Conversation } from '../../../shared/types';
import { COLOR_LABELS } from '../../types/colors';
import { useConversationStore } from '../../stores/conversation-store';
import { useSettingsStore } from '../../stores/settings-store';

interface ConversationItemProps {
  conversation: Conversation;
  onRefresh: () => void;
}

function timeAgo(ts: number): string {
  const now = Date.now();
  const diff = now - ts;
  const seconds = Math.floor(diff / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (seconds < 60) return 'just now';
  if (minutes < 60) return `${minutes} min ago`;
  if (hours < 24) return `${hours}h ago`;
  if (days < 7) return `${days}d ago`;
  if (days < 30) return `${Math.floor(days / 7)}w ago`;

  const d = new Date(ts);
  return `${d.getFullYear()}/${d.getMonth() + 1}/${d.getDate()}`;
}

function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function ConversationItem({ conversation, onRefresh }: ConversationItemProps) {
  const { activeId, setActiveId, selectedIds, toggleSelect, updateConversation } = useConversationStore();
  const { addToast } = useSettingsStore();

  const isActive = activeId === conversation.id;
  const isSelected = selectedIds.has(conversation.id);

  const handleClick = () => {
    setActiveId(conversation.id);
  };

  const handleStar = async (e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await window.api.conv.toggleStar(conversation.id);
      updateConversation(conversation.id, { isStarred: !conversation.isStarred });
    } catch {
      addToast({ message: 'Failed to toggle favorite', type: 'error' });
    }
  };

  const handleCheckbox = (e: React.MouseEvent) => {
    e.stopPropagation();
    toggleSelect(conversation.id);
  };

  return (
    <div
      className={`conv-item ${isActive ? 'conv-item--active' : ''} ${isSelected ? 'conv-item--selected' : ''}`}
      onClick={handleClick}
    >
      <div className="conv-item__checkbox" onClick={handleCheckbox}>
        <input
          type="checkbox"
          checked={isSelected}
          onChange={() => {}}
          style={{ pointerEvents: 'none' }}
        />
      </div>
      <div className="conv-item__content">
        <div className="conv-item__name">
          {conversation.customName && (
            <span style={{ color: 'var(--accent-primary)', marginRight: 4 }}>✎ </span>
          )}
          {conversation.displayName}
        </div>
        <div className="conv-item__meta">
          <span title={new Date(conversation.updatedAt).toLocaleString()}>
            <Calendar size={11} />
            {timeAgo(conversation.updatedAt)}
          </span>
          {conversation.messageCount > 0 && (
            <span>
              <MessageSquare size={11} />
              {conversation.messageCount}
            </span>
          )}
          {conversation.size > 0 && (
            <span>
              <HardDrive size={11} />
              {formatSize(conversation.size)}
            </span>
          )}
        </div>
        {/* Full project path */}
        <div className="conv-item__project-path" title={conversation.project}>
          <Folder size={11} />
          <span>{conversation.project}</span>
        </div>
      </div>
      <div
        className={`conv-item__star ${conversation.isStarred ? 'conv-item__star--active' : ''}`}
        onClick={handleStar}
      >
        <Star size={15} fill={conversation.isStarred ? 'currentColor' : 'none'} />
      </div>
      {conversation.color && (
        <div
          className="conv-item__color-dot"
          style={{ backgroundColor: COLOR_LABELS.find(c => c.id === conversation.color)?.color }}
          title={COLOR_LABELS.find(c => c.id === conversation.color)?.label.zh}
        />
      )}
    </div>
  );
}
