import React, { useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { useThemeStore } from './stores/theme-store';
import { useConversationStore } from './stores/conversation-store';
import { applyTheme, getSavedTheme } from './themes';
import { Layout } from './components/Layout/Layout';
import { TitleBar } from './components/Layout/TitleBar';
import { Sidebar } from './components/Layout/Sidebar';
import { StatusBar } from './components/Layout/StatusBar';
import { ConversationList } from './components/Conversation/ConversationList';
import { ConversationDetail } from './components/Conversation/ConversationDetail';
import { RenameDialog } from './components/Dialogs/RenameDialog';
import { DeleteConfirmDialog } from './components/Dialogs/DeleteConfirmDialog';
import { ExportDialog } from './components/Dialogs/ExportDialog';
import { ImportDialog } from './components/Dialogs/ImportDialog';
import { BackupDialog } from './components/Dialogs/BackupDialog';
import { AboutDialog } from './components/Dialogs/AboutDialog';
import { ToastContainer } from './components/Common/Toast';
import { useSettingsStore } from './stores/settings-store';

export function App() {
  const { i18n } = useTranslation();
  const { current, language, setLanguage } = useThemeStore();
  const { setConversations, setIsLoading } = useConversationStore();
  const {
    isRenameOpen, isDeleteOpen, isExportOpen,
    isImportOpen, isBackupOpen, isAboutOpen,
    addToast,
  } = useSettingsStore();

  // Apply theme on mount
  useEffect(() => {
    applyTheme(getSavedTheme());
  }, []);

  // Sync language with i18n
  useEffect(() => {
    if (i18n.language !== language) {
      i18n.changeLanguage(language);
    }
  }, [language, i18n]);

  // Load conversations
  const loadConversations = useCallback(async () => {
    setIsLoading(true);
    try {
      if (!window.api?.conv?.list) {
        addToast({ message: 'API not available - preload may have failed', type: 'error', duration: 6000 });
        return;
      }
      const data = await window.api.conv.list();
      console.log('[App] Loaded', data.length, 'conversations');
      setConversations(data);
      if (data.length === 0) {
        addToast({ message: 'No conversations found in history', type: 'info' });
      }
    } catch (err: any) {
      console.error('[App] Failed to load conversations:', err);
      addToast({ message: `Failed to load: ${err?.message || 'Unknown error'}`, type: 'error', duration: 6000 });
    } finally {
      setIsLoading(false);
    }
  }, [setConversations, setIsLoading, addToast]);

  useEffect(() => {
    loadConversations();
  }, [loadConversations]);

  return (
    <div className="app-root">
      <TitleBar onRefresh={loadConversations} />
      <div className="app-body">
        <Sidebar onRefresh={loadConversations} />
        <ConversationList onRefresh={loadConversations} />
        <ConversationDetail onRefresh={loadConversations} />
      </div>
      <StatusBar />
      <ToastContainer />
      {isRenameOpen && <RenameDialog onRefresh={loadConversations} />}
      {isDeleteOpen && <DeleteConfirmDialog onRefresh={loadConversations} />}
      {isExportOpen && <ExportDialog />}
      {isImportOpen && <ImportDialog onRefresh={loadConversations} />}
      {isBackupOpen && <BackupDialog />}
      {isAboutOpen && <AboutDialog />}
    </div>
  );
}
