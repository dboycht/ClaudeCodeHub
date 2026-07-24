import React from 'react';
import { useTranslation } from 'react-i18next';
import { FolderOpen, HardDrive, MessageSquare } from 'lucide-react';
import { useConversationStore } from '../../stores/conversation-store';

export function StatusBar() {
  const { t } = useTranslation();
  const { conversations } = useConversationStore();

  const projectCount = new Set(conversations.map(c => c.project)).size;
  const totalSize = conversations.reduce((sum, c) => sum + c.size, 0);

  const formatSize = (bytes: number): string => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
    return `${(bytes / (1024 * 1024 * 1024)).toFixed(2)} GB`;
  };

  return (
    <div className="status-bar">
      <div className="status-bar__left">
        <div className="status-bar__item">
          <MessageSquare size={12} />
          <span>{t('status.totalConversations', { count: conversations.length })}</span>
        </div>
        <div className="status-bar__item">
          <FolderOpen size={12} />
          <span>{t('status.totalProjects', { count: projectCount })}</span>
        </div>
      </div>
      <div className="status-bar__right">
        <div className="status-bar__item">
          <HardDrive size={12} />
          <span>{t('status.totalSize', { size: formatSize(totalSize) })}</span>
        </div>
        <div className="status-bar__item">
          <span>Claude Code Manager v1.0.0</span>
        </div>
      </div>
    </div>
  );
}
