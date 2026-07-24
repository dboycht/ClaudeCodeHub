import fs from 'fs';
import path from 'path';
import { HistoryEntry, Conversation, ConversationMetadata, MetadataStore, SessionMessage } from '../../shared/types';

export interface SessionFileInfo {
  sessionId: string;
  filePath: string;
  projectDir: string;     // encoded dir name e.g. "D--code-VibeCoding"
  projectPath: string;    // decoded path e.g. "D:\\code\\VibeCoding"
  size: number;
  messageCount: number;
  firstMessage: string;
  createdAt: number;
  updatedAt: number;
  isAgent: boolean;
}

export class FileService {
  private claudeDir: string;
  private metadataPath: string;

  constructor(claudeDir: string) {
    this.claudeDir = claudeDir;
    const metaDir = path.join(claudeDir, 'conversation-manager');
    this.metadataPath = path.join(metaDir, 'metadata.json');
    this.ensureMetaDir();
  }

  private ensureMetaDir() {
    const metaDir = path.dirname(this.metadataPath);
    if (!fs.existsSync(metaDir)) {
      fs.mkdirSync(metaDir, { recursive: true });
    }
  }

  // ===== NEW: File-driven session scanning =====

  /**
   * Scan ALL project directories for session JSONL files.
   * This is the primary discovery method - reads actual files on disk,
   * NOT just history.jsonl (which may be incomplete).
   */
  scanAllSessionFiles(): SessionFileInfo[] {
    const results: SessionFileInfo[] = [];
    const projectsDir = path.join(this.claudeDir, 'projects');

    if (!fs.existsSync(projectsDir)) {
      console.log('[FileService] No projects directory found at:', projectsDir);
      return results;
    }

    const projectDirs = fs.readdirSync(projectsDir)
      .filter(d => fs.statSync(path.join(projectsDir, d)).isDirectory());

    console.log('[FileService] Scanning', projectDirs.length, 'project directories');

    for (const projectDirName of projectDirs) {
      const projectDir = path.join(projectsDir, projectDirName);
      const decodedProjectPath = this.decodeProjectName(projectDirName);
      const projectName = this.extractProjectName(decodedProjectPath);

      try {
        const files = fs.readdirSync(projectDir);
        for (const file of files) {
          const filePath = path.join(projectDir, file);

          // Match: <uuid>.jsonl (main sessions) and agent-<id>.jsonl (subagent sessions)
          const mainMatch = file.match(/^([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})\.jsonl$/);
          const agentMatch = file.match(/^agent-([0-9a-z-]+)\.jsonl$/);

          let sessionId: string;
          let isAgent = false;

          if (mainMatch) {
            sessionId = mainMatch[1];
          } else if (agentMatch) {
            sessionId = `agent-${agentMatch[1]}`;
            isAgent = true;
          } else {
            // Also check for session directories (some sessions have a dir + .jsonl)
            if (fs.statSync(filePath).isDirectory()) {
              // Check if there's a corresponding .jsonl alongside
              const jsonlPath = filePath + '.jsonl';
              if (fs.existsSync(jsonlPath)) continue; // handled by .jsonl match
              // Directory without .jsonl - read the first .jsonl inside
              const innerFiles = fs.readdirSync(filePath).filter(f => f.endsWith('.jsonl'));
              if (innerFiles.length > 0) continue; // handled separately if needed
            }
            continue;
          }

          try {
            const stat = fs.statSync(filePath);
            const info = this.parseSessionFile(filePath, stat);
            if (info) {
              results.push({
                sessionId,
                filePath,
                ...info,
                projectDir: projectDirName,
                projectPath: decodedProjectPath,
                isAgent,
              });
            }
          } catch (err) {
            console.error('[FileService] Error reading session file:', filePath, err);
          }
        }
      } catch (err) {
        console.error('[FileService] Error reading project dir:', projectDir, err);
      }
    }

    console.log('[FileService] Found', results.length, 'session files across all projects');
    return results;
  }

  /**
   * Extract display text from a message, handling various formats.
   * Claude Code messages can be:
   *   {"type":"user","message":{"role":"user","content":[{"type":"text","text":"hello"}]}}
   *   {"type":"assistant","message":{"role":"assistant","content":[{"type":"text","text":"reply"}]}}
   *   {"type":"message","message":{"role":"user","content":[...]}}
   *   {"type":"system","subtype":"local_command","content":"<command-name>/usage</command-name>..."}
   */
  private extractMessageText(msg: any): string | null {
    // User/assistant message — content can be a STRING or an ARRAY
    if ((msg.type === 'user' || msg.type === 'assistant' || msg.type === 'message') && msg.message?.content) {
      const content = msg.message.content;
      // Content is a plain string (older Claude Code format)
      if (typeof content === 'string' && content.trim()) {
        return content.trim();
      }
      // Content is an array of content blocks (newer format)
      if (Array.isArray(content)) {
        const texts = content
          .filter((c: any) => c && c.type === 'text' && c.text)
          .map((c: any) => c.text);
        if (texts.length > 0) return texts.join('\n');
      }
    }
    // System slash command display
    if (msg.type === 'system' && msg.subtype === 'local_command' && msg.content) {
      const match = String(msg.content).match(/<command-name>([^<]+)<\/command-name>/);
      if (match) return `[${match[1].trim()}]`;
    }
    return null;
  }

  /**
   * Parse a session JSONL file.
   * Display name priority: custom-title > ai-title > first user message > slash command
   */
  private parseSessionFile(filePath: string, stat: fs.Stats): {
    messageCount: number;
    firstMessage: string;
    createdAt: number;
    updatedAt: number;
    size: number;
  } | null {
    try {
      const content = fs.readFileSync(filePath, 'utf-8');
      const lines = content.trim().split('\n');
      let totalMessageCount = 0;
      let firstUserMessage = '';
      let aiTitle = '';
      let customTitle = '';
      let firstTimestamp = stat.birthtimeMs;

      for (const line of lines) {
        if (!line.trim()) continue;
        try {
          const msg = JSON.parse(line);

          // Track timestamps
          if (msg.timestamp && firstTimestamp === stat.birthtimeMs) {
            firstTimestamp = new Date(msg.timestamp).getTime();
          }

          // Collect AI-generated title (scans entire file, last one wins)
          // Format: {"type":"ai-title","aiTitle":"标题文本",...}
          if (msg.type === 'ai-title' && msg.aiTitle) {
            aiTitle = String(msg.aiTitle).trim().slice(0, 200);
          }

          // Collect custom/user-set title (HIGHEST priority)
          // Format: {"type":"custom-title","customTitle":"用户自定义标题",...}
          if (msg.type === 'custom-title' && msg.customTitle) {
            customTitle = String(msg.customTitle).trim().slice(0, 200);
          }

          // Count and capture user/assistant messages
          const text = this.extractMessageText(msg);
          if (text) {
            if (msg.type === 'user' || msg.type === 'assistant' || msg.type === 'message') {
              totalMessageCount++;
              if (!firstUserMessage) {
                firstUserMessage = text.slice(0, 200);
              }
            }
          }
        } catch { /* skip malformed lines */ }
      }

      // Priority: custom-title > ai-title > first user message > fallback
      const displayName = customTitle || aiTitle || firstUserMessage || '(Empty)';

      return {
        messageCount: totalMessageCount,
        firstMessage: displayName,
        createdAt: firstTimestamp || stat.birthtimeMs,
        updatedAt: stat.mtimeMs,
        size: stat.size,
      };
    } catch {
      return null;
    }
  }

  /**
   * Read all messages from a session file
   */
  readSessionFile(filePath: string): SessionMessage[] {
    try {
      const content = fs.readFileSync(filePath, 'utf-8');
      return content.trim().split('\n').map(line => {
        try { return JSON.parse(line); } catch { return null; }
      }).filter(Boolean) as SessionMessage[];
    } catch {
      return [];
    }
  }

  /**
   * Append a custom-title entry to the session JSONL file.
   * This is what Claude Code's Ctrl+R does — writes directly into the session.
   */
  writeCustomTitle(sessionId: string, title: string): boolean {
    const filePath = this.getSessionFilePath(sessionId);
    if (!filePath || !filePath.endsWith('.jsonl')) return false;

    try {
      const entry = JSON.stringify({
        type: 'custom-title',
        sessionId,
        customTitle: title,
      });
      fs.appendFileSync(filePath, '\n' + entry + '\n', 'utf-8');
      console.log('[FileService] Wrote custom-title to session file:', title);
      return true;
    } catch (err) {
      console.error('[FileService] Failed to write custom-title:', err);
      return false;
    }
  }

  /**
   * Load session metadata from ~/.claude/sessions/*.json
   * These files act as Claude Code's session INDEX - only sessions with
   * metadata entries appear in Claude Code's /resume list.
   */
  loadSessionMetadata(): Map<string, { name: string; kind: string; cwd: string; status?: string }> {
    const map = new Map<string, { name: string; kind: string; cwd: string; status?: string }>();
    const sessionsDir = path.join(this.claudeDir, 'sessions');
    if (!fs.existsSync(sessionsDir)) return map;

    const files = fs.readdirSync(sessionsDir).filter(f => f.endsWith('.json'));
    for (const file of files) {
      try {
        const data = JSON.parse(fs.readFileSync(path.join(sessionsDir, file), 'utf-8'));
        if (data.sessionId) {
          map.set(data.sessionId, {
            name: data.name || '',
            kind: data.kind || '',
            cwd: data.cwd || '',
            status: data.status,
          });
        }
      } catch { /* skip */ }
    }
    console.log('[FileService] Loaded', map.size, 'session metadata entries');
    return map;
  }

  // ===== History.jsonl (secondary source, for cross-reference) =====

  getHistoryEntries(): HistoryEntry[] {
    const historyPath = path.join(this.claudeDir, 'history.jsonl');
    if (!fs.existsSync(historyPath)) return [];

    const content = fs.readFileSync(historyPath, 'utf-8');
    const entries: HistoryEntry[] = [];
    for (const line of content.trim().split('\n')) {
      try {
        entries.push(JSON.parse(line));
      } catch { /* skip malformed lines */ }
    }
    return entries;
  }

  /**
   * Build a map from history.jsonl: sessionId -> { latest timestamp, all projects }
   */
  getHistoryMap(): Map<string, { projects: Set<string>; latestTimestamp: number }> {
    const map = new Map<string, { projects: Set<string>; latestTimestamp: number }>();
    const entries = this.getHistoryEntries();
    for (const entry of entries) {
      const existing = map.get(entry.sessionId);
      if (existing) {
        existing.projects.add(entry.project);
        if (entry.timestamp > existing.latestTimestamp) {
          existing.latestTimestamp = entry.timestamp;
        }
      } else {
        map.set(entry.sessionId, {
          projects: new Set([entry.project]),
          latestTimestamp: entry.timestamp,
        });
      }
    }
    return map;
  }

  // ===== Session file path helpers =====

  getSessionFilePath(sessionId: string, project?: string): string | null {
    if (project) {
      const projectName = this.encodeProjectName(project);
      const projectDir = path.join(this.claudeDir, 'projects', projectName);
      const filePath = path.join(projectDir, `${sessionId}.jsonl`);
      if (fs.existsSync(filePath)) return filePath;
    }

    // Search all project directories
    const projectsDir = path.join(this.claudeDir, 'projects');
    if (fs.existsSync(projectsDir)) {
      for (const dir of fs.readdirSync(projectsDir)) {
        const fullDir = path.join(projectsDir, dir);
        if (!fs.statSync(fullDir).isDirectory()) continue;
        const filePath = path.join(fullDir, `${sessionId}.jsonl`);
        if (fs.existsSync(filePath)) return filePath;
      }
    }

    return null;
  }

  /**
   * Read messages by finding the session file first (convenience)
   */
  readSessionMessages(sessionId: string): SessionMessage[] {
    const filePath = this.getSessionFilePath(sessionId);
    if (!filePath) return [];
    return this.readSessionFile(filePath);
  }

  // ===== Project name encoding/decoding =====

  /**
   * Windows: D:\code\VibeCoding -> D--code-VibeCoding
   * Unix:    /home/user/proj  -> -home-user-proj
   */
  encodeProjectName(projectPath: string): string {
    if (projectPath.match(/^[A-Za-z]:/)) {
      // Windows path
      return projectPath.replace(/:/, '-').replace(/\\/g, '-');
    }
    // Unix path
    return projectPath.replace(/\//g, '-');
  }

  /**
   * Reverse of encodeProjectName
   */
  decodeProjectName(encoded: string): string {
    // Check if Windows-encoded (starts with single letter + "--")
    if (/^[A-Za-z]--/.test(encoded)) {
      const drive = encoded[0];
      const rest = encoded.slice(2); // skip "D-"
      return `${drive}:\\${rest.replace(/-/g, '\\')}`;
    }
    // Unix-encoded
    return encoded.replace(/^-/, '/').replace(/-/g, '/');
  }

  extractProjectName(projectPath: string): string {
    const parts = projectPath.replace(/[/\\]/g, '/').split('/').filter(Boolean);
    return parts[parts.length - 1] || projectPath;
  }

  // ===== Metadata store =====

  loadMetadata(): MetadataStore {
    try {
      if (fs.existsSync(this.metadataPath)) {
        const data = fs.readFileSync(this.metadataPath, 'utf-8');
        return JSON.parse(data);
      }
    } catch { /* ignore */ }
    return { version: 1, conversations: {} };
  }

  saveMetadata(store: MetadataStore): void {
    this.ensureMetaDir();
    fs.writeFileSync(this.metadataPath, JSON.stringify(store, null, 2), 'utf-8');
  }

  getMetadata(sessionId: string): ConversationMetadata | null {
    const store = this.loadMetadata();
    return store.conversations[sessionId] || null;
  }

  updateMetadata(sessionId: string, updates: Partial<ConversationMetadata>): void {
    const store = this.loadMetadata();
    const existing = store.conversations[sessionId] || { sessionId };
    store.conversations[sessionId] = { ...existing, ...updates };
    this.saveMetadata(store);
  }

  // ===== CRUD operations =====

  deleteSessionFile(sessionId: string): boolean {
    const filePath = this.getSessionFilePath(sessionId);
    if (!filePath) return false;

    try {
      const { shell } = require('electron');
      shell.trashItem(filePath).catch(() => {
        fs.rmSync(filePath, { recursive: true, force: true });
      });

      // Also remove session directory if exists
      const dirPath = filePath.replace(/\.jsonl$/, '');
      if (fs.existsSync(dirPath) && fs.statSync(dirPath).isDirectory()) {
        shell.trashItem(dirPath).catch(() => {
          fs.rmSync(dirPath, { recursive: true, force: true });
        });
      }

      // Remove from metadata
      const store = this.loadMetadata();
      delete store.conversations[sessionId];
      this.saveMetadata(store);

      return true;
    } catch {
      return false;
    }
  }

  removeFromHistory(sessionId: string): void {
    const historyPath = path.join(this.claudeDir, 'history.jsonl');
    if (!fs.existsSync(historyPath)) return;

    const content = fs.readFileSync(historyPath, 'utf-8');
    const lines = content.trim().split('\n').filter(line => {
      try {
        const entry = JSON.parse(line);
        return entry.sessionId !== sessionId;
      } catch { return true; }
    });
    fs.writeFileSync(historyPath, lines.join('\n') + (lines.length > 0 ? '\n' : ''), 'utf-8');
  }

  addToHistory(entry: HistoryEntry): void {
    const historyPath = path.join(this.claudeDir, 'history.jsonl');
    fs.appendFileSync(historyPath, JSON.stringify(entry) + '\n', 'utf-8');
  }

  // ===== Utilities =====

  getProjects(): string[] {
    const projectsDir = path.join(this.claudeDir, 'projects');
    if (!fs.existsSync(projectsDir)) return [];

    return fs.readdirSync(projectsDir)
      .filter(d => fs.statSync(path.join(projectsDir, d)).isDirectory())
      .map(d => this.decodeProjectName(d));
  }

  fileExists(filePath: string): boolean {
    return fs.existsSync(filePath);
  }

  copyFile(src: string, dest: string): void {
    const destDir = path.dirname(dest);
    if (!fs.existsSync(destDir)) {
      fs.mkdirSync(destDir, { recursive: true });
    }
    fs.copyFileSync(src, dest);
  }

  writeFile(filePath: string, content: string): void {
    const dir = path.dirname(filePath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    fs.writeFileSync(filePath, content, 'utf-8');
  }
}
