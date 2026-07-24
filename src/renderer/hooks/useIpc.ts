import { useCallback, useEffect, useState } from 'react';
import type { Conversation, ConversationDetail, BackupResult, ImportResult } from '../../shared/types';

export function useConversations() {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await window.api.conv.list();
      setConversations(data);
    } catch (err) {
      console.error('Failed to load conversations:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  return { conversations, loading, reload: load };
}

export function useConversationDetail(id: string | null) {
  const [detail, setDetail] = useState<ConversationDetail | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!id) {
      setDetail(null);
      return;
    }
    setLoading(true);
    window.api.conv.getDetail(id).then(data => {
      setDetail(data);
      setLoading(false);
    }).catch(() => {
      setDetail(null);
      setLoading(false);
    });
  }, [id]);

  return { detail, loading };
}

export function useConversationActions() {
  const rename = useCallback(async (id: string, newName: string) => {
    return window.api.conv.rename(id, newName);
  }, []);

  const remove = useCallback(async (id: string) => {
    return window.api.conv.delete(id);
  }, []);

  const toggleStar = useCallback(async (id: string) => {
    return window.api.conv.toggleStar(id);
  }, []);

  const exportConv = useCallback(async (id: string, format: string, outputPath: string) => {
    return window.api.export.conversation(id, format, outputPath);
  }, []);

  const importConvs = useCallback(async (filePaths: string[]): Promise<ImportResult> => {
    return window.api.import.conversations(filePaths);
  }, []);

  const backupAll = useCallback(async (outputDir: string): Promise<BackupResult> => {
    return window.api.backup.all(outputDir);
  }, []);

  const backupConvs = useCallback(async (ids: string[], outputDir: string): Promise<BackupResult> => {
    return window.api.backup.conversations(ids, outputDir);
  }, []);

  return { rename, remove, toggleStar, exportConv, importConvs, backupAll, backupConvs };
}
