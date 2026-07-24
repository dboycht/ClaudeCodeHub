import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useConversationStore } from '../../stores/conversation-store';
import { useSettingsStore } from '../../stores/settings-store';

export function ExportDialog() {
  const { t, i18n } = useTranslation();
  const { activeId, conversations } = useConversationStore();
  const { setExportOpen, addToast } = useSettingsStore();
  const [format, setFormat] = useState<'json' | 'markdown' | 'html'>('markdown');

  const conversation = conversations.find(c => c.id === activeId);

  const handleExport = async () => {
    if (!activeId || !conversation) return;

    const ext = format === 'json' ? 'json' : format === 'markdown' ? 'md' : 'html';
    const defaultName = `${conversation.displayName.replace(/[^a-zA-Z0-9一-鿿]/g, '_')}.${ext}`;

    try {
      const filePath = await window.api.dialog.saveFile({
        defaultPath: defaultName,
        filters: [{
          name: format.toUpperCase(),
          extensions: [ext],
        }],
      });
      if (!filePath) return;

      const ok = await window.api.export.conversation(activeId, format, filePath);
      if (ok) {
        addToast({ message: t('dialog.export.success'), type: 'success' });
      } else {
        addToast({ message: t('dialog.export.failed'), type: 'error' });
      }
    } catch {
      addToast({ message: t('dialog.export.failed'), type: 'error' });
    }
    setExportOpen(false);
  };

  const formatInfo: Record<string, { zh: string; en: string; descZh: string; descEn: string }> = {
    json: { zh: 'JSON (原始格式)', en: 'JSON (Original)', descZh: '保留完整的原始数据，适合备份和程序处理', descEn: 'Full raw data, best for backup and programmatic use' },
    markdown: { zh: 'Markdown (可读格式)', en: 'Markdown (Readable)', descZh: '格式化为可读的对话记录，适合阅读和分享', descEn: 'Formatted readable conversation log, great for reading and sharing' },
    html: { zh: 'HTML (带样式)', en: 'HTML (Styled)', descZh: '带 JetBrains 暗色样式的网页，适合打印和归档', descEn: 'Web page with JetBrains dark styling, perfect for printing and archiving' },
  };

  return (
    <div className="dialog-overlay" onClick={() => setExportOpen(false)}>
      <div className="dialog" onClick={e => e.stopPropagation()} style={{ minWidth: 440 }}>
        <div className="dialog__header">
          <span className="dialog__title">{t('dialog.export.title')}</span>
          <button className="btn btn--icon" onClick={() => setExportOpen(false)}>✕</button>
        </div>
        <div className="dialog__body">
          <p className="dialog__text" style={{ marginBottom: 4, fontWeight: 500 }}>
            "{conversation?.displayName}"
          </p>
          <label className="dialog__label">{t('dialog.export.format')}</label>
          <div className="dialog__radio-group">
            {(['json', 'markdown', 'html'] as const).map(fmt => (
              <label
                key={fmt}
                className={`dialog__radio ${format === fmt ? 'dialog__radio--active' : ''}`}
              >
                <input
                  type="radio"
                  name="export-format"
                  value={fmt}
                  checked={format === fmt}
                  onChange={() => setFormat(fmt)}
                />
                <div>
                  <div style={{ fontWeight: 500 }}>
                    {i18n.language === 'zh-CN' ? formatInfo[fmt].zh : formatInfo[fmt].en}
                  </div>
                  <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>
                    {i18n.language === 'zh-CN' ? formatInfo[fmt].descZh : formatInfo[fmt].descEn}
                  </div>
                </div>
              </label>
            ))}
          </div>
        </div>
        <div className="dialog__footer">
          <button className="btn btn--ghost" onClick={() => setExportOpen(false)}>
            {t('dialog.export.cancel')}
          </button>
          <button className="btn btn--primary" onClick={handleExport}>
            {t('dialog.export.export')}
          </button>
        </div>
      </div>
    </div>
  );
}
