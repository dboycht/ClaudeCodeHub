import { FileService, SessionFileInfo } from './file-service';
import { BackupService } from './backup-service';
import { Conversation, ConversationDetail, HistoryEntry, SessionMessage } from '../../shared/types';

export class ConversationService {
  private fileService: FileService;
  private backupService: BackupService;

  constructor(fileService: FileService, backupService: BackupService) {
    this.fileService = fileService;
    this.backupService = backupService;
  }

  /**
   * PRIMARY: Scan actual session files on disk.
   * Falls back to history.jsonl for sessions that might not have files.
   */
  async listConversations(): Promise<Conversation[]> {
    // 1. Scan all session files in project directories
    const sessionFiles = this.fileService.scanAllSessionFiles();
    const metadata = this.fileService.loadMetadata();
    const sessionMeta = this.fileService.loadSessionMetadata();

    // 2. Cross-reference with history.jsonl for additional project info
    const historyMap = this.fileService.getHistoryMap();

    // Index session files by sessionId
    const fileMap = new Map<string, SessionFileInfo>();
    for (const sf of sessionFiles) {
      const existing = fileMap.get(sf.sessionId);
      if (!existing || sf.size > existing.size) {
        fileMap.set(sf.sessionId, sf);
      }
    }
    console.log('[ConversationService]', fileMap.size, 'session files,', sessionMeta.size, 'metadata entries');

    // 3. Build conversation list from ALL session files on disk
    // Claude Code /resume shows ALL sessions, using UUID prefix for unnamed ones
    const conversations: Conversation[] = [];

    for (const [sessionId, sf] of fileMap) {
      const meta = metadata.conversations[sessionId];
      const sm = sessionMeta.get(sessionId);

      // Name priority: custom > AI title > first message > UUID prefix (matching /resume)
      const aiName = sm?.name || '';
      const contentName = sf.firstMessage && sf.firstMessage !== '(Empty)'
        ? sf.firstMessage.slice(0, 100)
        : '';
      const displayName = meta?.customName || aiName || contentName || sessionId.slice(0, 8);

      conversations.push({
        id: sessionId,
        displayName,
        customName: meta?.customName,
        project: sf.projectPath,
        projectName: this.fileService.extractProjectName(sf.projectPath),
        messageCount: sf.messageCount,
        createdAt: meta?.createdAt || sf.createdAt,
        updatedAt: sf.updatedAt,
        size: sf.size,
        firstMessage: sf.firstMessage,
        tags: meta?.tags,
        isStarred: meta?.isStarred,
        color: meta?.color || null,
      });
    }

    console.log('[ConversationService] Total conversations:', conversations.length, '(file-based only)');

    return conversations.sort((a, b) => b.updatedAt - a.updatedAt);
  }

  async getConversationDetail(id: string): Promise<ConversationDetail | null> {
    const filePath = this.fileService.getSessionFilePath(id);

    console.log('[ConversationService] getDetail id:', id, 'filePath:', filePath || 'NOT FOUND');

    if (filePath && filePath.endsWith('.jsonl')) {
      const rawMessages = this.fileService.readSessionFile(filePath);
      const formattedMessages: Array<{ role: string; content: string; timestamp: string }> = [];

      for (const msg of rawMessages) {
        if (msg.type === 'user' || msg.type === 'assistant' || msg.type === 'message') {
          let content = '';
          const rawContent = msg.message?.content;
          if (typeof rawContent === 'string') {
            content = rawContent.trim();
          } else if (Array.isArray(rawContent)) {
            content = rawContent
              .filter((c: any) => c && c.type === 'text' && c.text)
              .map((c: any) => c.text)
              .join('\n')
              .trim();
          }
          if (content) {
            const role = msg.type === 'assistant' ? 'assistant' : 'user';
            formattedMessages.push({
              role,
              content,
              timestamp: msg.timestamp || '',
            });
          }
        }
      }

      const stat = require('fs').statSync(filePath);

      return {
        id,
        messages: formattedMessages,
        messageCount: formattedMessages.length,
        size: stat.size,
        project: this.fileService.decodeProjectName(
          filePath.split(/[/\\]/).slice(-2, -1)[0] || ''
        ),
        firstMessage: formattedMessages[0]?.content?.slice(0, 200) || '',
        createdAt: stat.birthtimeMs,
        updatedAt: stat.mtimeMs,
      };
    }

    // Fallback: try history entries
    const entries = this.fileService.getHistoryEntries();
    const entry = entries.find(e => e.sessionId === id);
    if (!entry) return null;

    return {
      id,
      messages: [],
      messageCount: 0,
      size: 0,
      project: entry.project,
      firstMessage: entry.display,
      createdAt: entry.timestamp,
      updatedAt: entry.timestamp,
    };
  }

  async renameConversation(id: string, newName: string): Promise<boolean> {
    try {
      // 1. Write custom-title into the session JSONL file
      //    This is what Claude Code's Ctrl+R does — the title change persists in /resume
      this.fileService.writeCustomTitle(id, newName);

      // 2. Also update our metadata store for quick lookup
      this.fileService.updateMetadata(id, { customName: newName });

      return true;
    } catch {
      return false;
    }
  }

  async deleteConversation(id: string): Promise<boolean> {
    return this.fileService.deleteSessionFile(id);
  }

  async toggleStar(id: string): Promise<boolean> {
    try {
      const meta = this.fileService.getMetadata(id);
      this.fileService.updateMetadata(id, { isStarred: !(meta?.isStarred) });
      return true;
    } catch {
      return false;
    }
  }

  async setColor(id: string, color: string | null): Promise<boolean> {
    try {
      this.fileService.updateMetadata(id, { color: color as any });
      return true;
    } catch {
      return false;
    }
  }

  async addTag(id: string, tag: string): Promise<boolean> {
    try {
      const meta = this.fileService.getMetadata(id);
      const tags = meta?.tags || [];
      if (!tags.includes(tag)) {
        this.fileService.updateMetadata(id, { tags: [...tags, tag] });
      }
      return true;
    } catch {
      return false;
    }
  }

  async removeTag(id: string, tag: string): Promise<boolean> {
    try {
      const meta = this.fileService.getMetadata(id);
      const tags = meta?.tags || [];
      this.fileService.updateMetadata(id, { tags: tags.filter(t => t !== tag) });
      return true;
    } catch {
      return false;
    }
  }
}
