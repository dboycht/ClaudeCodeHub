import React, { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import {
  MessageSquare, Star, FolderOpen, Palette, Globe,
  Download, Upload, RefreshCw, Settings, Tag, Info,
} from 'lucide-react';
import { useConversationStore } from '../../stores/conversation-store';
import { useThemeStore } from '../../stores/theme-store';
import { useSettingsStore } from '../../stores/settings-store';
import { COLOR_LABELS } from '../../types/colors';

interface SidebarProps {
  onRefresh: () => void;
}

export function Sidebar({ onRefresh }: SidebarProps) {
  const { t, i18n } = useTranslation();
  const {
    conversations, searchQuery, setSearchQuery,
    filterProject, setFilterProject, filterStarred, setFilterStarred,
    filterColor, setFilterColor,
    getProjects,
  } = useConversationStore();
  const { current, allThemes, setTheme, language, setLanguage } = useThemeStore();
  const { setBackupOpen, setImportOpen, setSettingsOpen, setAboutOpen } = useSettingsStore();

  const projects = useMemo(() => {
    const projMap = new Map<string, { name: string; count: number }>();
    for (const c of conversations) {
      const existing = projMap.get(c.project);
      if (existing) {
        existing.count++;
      } else {
        projMap.set(c.project, { name: c.projectName, count: 1 });
      }
    }
    return Array.from(projMap.entries()).map(([path, info]) => ({ path, ...info }));
  }, [conversations]);

  const starredCount = conversations.filter(c => c.isStarred).length;

  const handleThemeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setTheme(e.target.value);
  };

  const handleLanguageChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const lang = e.target.value as 'zh-CN' | 'en-US';
    setLanguage(lang);
    i18n.changeLanguage(lang);
  };

  return (
    <div className="sidebar">
      {/* Search */}
      <div className="sidebar__search">
        <input
          type="text"
          placeholder={t('sidebar.search')}
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
        <SearchIcon />
      </div>

      {/* Filters */}
      <div className="sidebar__section">
        <div
          className={`sidebar__item ${!filterStarred && !filterProject ? 'sidebar__item--active' : ''}`}
          onClick={() => { setFilterStarred(false); setFilterProject(null); }}
        >
          <MessageSquare size={16} />
          <span>{t('sidebar.allConversations')}</span>
          <span className="sidebar__item-count">{conversations.length}</span>
        </div>
        <div
          className={`sidebar__item ${filterStarred ? 'sidebar__item--active' : ''}`}
          onClick={() => { setFilterStarred(!filterStarred); setFilterProject(null); }}
        >
          <Star size={16} />
          <span>{t('sidebar.favorites')}</span>
          <span className="sidebar__item-count">{starredCount}</span>
        </div>
      </div>

      {/* Color Tags Filter */}
      <div className="sidebar__section">
        <div className="sidebar__section-title">
          <Tag size={12} style={{ display: 'inline', marginRight: 4, verticalAlign: 'middle' }} />
          {t('sidebar.tags')}
        </div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 3, padding: '0 4px' }}>
          {COLOR_LABELS.filter(c => c.id !== null).map(c => {
            const count = conversations.filter(conv => conv.color === c.id).length;
            return (
              <div
                key={c.id}
                onClick={() => setFilterColor(filterColor === c.id ? null : c.id)}
                title={`${c.label.zh} (${count})`}
                style={{
                  width: 18, height: 18, borderRadius: '50%',
                  backgroundColor: c.color,
                  cursor: 'pointer',
                  opacity: filterColor && filterColor !== c.id ? 0.25 : 1,
                  border: filterColor === c.id ? '2px solid var(--text-primary)' : '2px solid transparent',
                  transition: 'all 0.15s ease',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 8, color: '#fff', fontWeight: 'bold',
                }}
              >
                {count > 0 && !filterColor ? count : ''}
              </div>
            );
          })}
        </div>
      </div>

      {/* Projects */}
      <div className="sidebar__section">
        <div className="sidebar__section-title">{t('sidebar.projects')}</div>
        {projects.length === 0 ? (
          <div style={{ fontSize: 11, color: 'var(--text-muted)', padding: '0 4px' }}>
            {t('sidebar.noProjects')}
          </div>
        ) : (
          projects.map(p => (
            <div
              key={p.path}
              className={`sidebar__item ${filterProject === p.path ? 'sidebar__item--active' : ''}`}
              onClick={() => setFilterProject(filterProject === p.path ? null : p.path)}
            >
              <FolderOpen size={16} />
              <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {p.name}
              </span>
              <span className="sidebar__item-count">{p.count}</span>
            </div>
          ))
        )}
      </div>

      {/* Theme & Language */}
      <div className="sidebar__divider" />

      <div className="sidebar__section">
        <div className="sidebar__section-title">{t('sidebar.themes')}</div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <Palette size={14} style={{ color: 'var(--text-muted)', flexShrink: 0 }} />
          <select
            className="sidebar__select"
            value={current.id}
            onChange={handleThemeChange}
          >
            {allThemes.map(theme => (
              <option key={theme.id} value={theme.id}>
                {language === 'zh-CN' ? theme.name.zh : theme.name.en}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="sidebar__section">
        <div className="sidebar__section-title">{t('sidebar.language')}</div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <Globe size={14} style={{ color: 'var(--text-muted)', flexShrink: 0 }} />
          <select
            className="sidebar__select"
            value={language}
            onChange={handleLanguageChange}
          >
            <option value="zh-CN">中文</option>
            <option value="en-US">English</option>
          </select>
        </div>
      </div>

      {/* Actions */}
      <div className="sidebar__actions">
        <div className="sidebar__section-title">{t('sidebar.actions')}</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          <button className="btn btn--ghost btn--sm" style={{ width: '100%', justifyContent: 'center' }}
            onClick={() => setBackupOpen(true)}>
            <Download size={14} />
            {t('sidebar.backupAll')}
          </button>
          <button className="btn btn--ghost btn--sm" style={{ width: '100%', justifyContent: 'center' }}
            onClick={() => setImportOpen(true)}>
            <Upload size={14} />
            {t('sidebar.importData')}
          </button>
          <button className="btn btn--ghost btn--sm" style={{ width: '100%', justifyContent: 'center' }}
            onClick={onRefresh}>
            <RefreshCw size={14} />
            {t('sidebar.refresh')}
          </button>
          <button className="btn btn--ghost btn--sm" style={{ width: '100%', justifyContent: 'center' }}
            onClick={() => setAboutOpen(true)}>
            <Info size={14} />
            {t('sidebar.about')}
          </button>
        </div>
      </div>
    </div>
  );
}

function SearchIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="11" cy="11" r="8" />
      <path d="M21 21l-4.35-4.35" />
    </svg>
  );
}
