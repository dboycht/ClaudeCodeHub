import fs from 'fs';
import path from 'path';
import { FileService } from './file-service';
import { BackupResult, ImportResult, SessionMessage } from '../../shared/types';

export class BackupService {
  private claudeDir: string;
  private fileService: FileService;

  constructor(claudeDir: string) {
    this.claudeDir = claudeDir;
    this.fileService = new FileService(claudeDir);
  }

  async backupAll(outputDir: string): Promise<BackupResult> {
    const projectsDir = path.join(this.claudeDir, 'projects');
    if (!fs.existsSync(projectsDir)) {
      return { success: false, path: outputDir, count: 0, totalSize: 0 };
    }

    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const backupDir = path.join(outputDir, `claude-backup-${timestamp}`);
    fs.mkdirSync(backupDir, { recursive: true });

    let count = 0;
    let totalSize = 0;

    // Copy history.jsonl
    const historyPath = path.join(this.claudeDir, 'history.jsonl');
    if (fs.existsSync(historyPath)) {
      fs.copyFileSync(historyPath, path.join(backupDir, 'history.jsonl'));
    }

    // Copy all project directories
    const projects = fs.readdirSync(projectsDir);
    for (const project of projects) {
      const srcDir = path.join(projectsDir, project);
      const dstDir = path.join(backupDir, 'projects', project);
      if (fs.statSync(srcDir).isDirectory()) {
        this.copyDirSync(srcDir, dstDir);
        const dirFiles = this.countFiles(srcDir);
        count += dirFiles.count;
        totalSize += dirFiles.size;
      }
    }

    // Copy metadata
    const metaPath = path.join(this.claudeDir, 'conversation-manager', 'metadata.json');
    if (fs.existsSync(metaPath)) {
      const dstMeta = path.join(backupDir, 'metadata.json');
      fs.mkdirSync(path.dirname(dstMeta), { recursive: true });
      fs.copyFileSync(metaPath, dstMeta);
    }

    return { success: true, path: backupDir, count, totalSize };
  }

  async backupConversations(ids: string[], outputDir: string): Promise<BackupResult> {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const backupDir = path.join(outputDir, `claude-backup-selected-${timestamp}`);
    fs.mkdirSync(backupDir, { recursive: true });

    let count = 0;
    let totalSize = 0;

    for (const id of ids) {
      const filePath = this.fileService.getSessionFilePath(id);
      if (filePath) {
        const stat = fs.statSync(filePath);
        totalSize += stat.size;
        const destPath = path.join(backupDir, `${id}.jsonl`);
        fs.copyFileSync(filePath, destPath);
        count++;
      }
    }

    return { success: true, path: backupDir, count, totalSize };
  }

  async exportConversation(
    id: string,
    format: 'json' | 'markdown' | 'html',
    outputPath: string
  ): Promise<boolean> {
    const filePath = this.fileService.getSessionFilePath(id);
    if (!filePath) return false;

    const messages = this.fileService.readSessionMessages(id);
    const content = this.formatMessages(messages, format);
    this.fileService.writeFile(outputPath, content);
    return true;
  }

  async importConversations(filePaths: string[]): Promise<ImportResult> {
    const result: ImportResult = { success: true, imported: 0, skipped: 0, errors: [] };

    for (const filePath of filePaths) {
      try {
        if (!fs.existsSync(filePath)) {
          result.skipped++;
          result.errors.push(`File not found: ${filePath}`);
          continue;
        }

        const stat = fs.statSync(filePath);
        if (stat.isDirectory()) {
          // Import from backup directory
          const subResult = this.importFromDirectory(filePath);
          result.imported += subResult.imported;
          result.skipped += subResult.skipped;
          result.errors.push(...subResult.errors);
        } else if (filePath.endsWith('.jsonl')) {
          // Single JSONL file import
          const imported = this.importJsonlFile(filePath);
          if (imported) {
            result.imported++;
          } else {
            result.skipped++;
            result.errors.push(`Failed to import: ${filePath}`);
          }
        } else {
          result.skipped++;
          result.errors.push(`Unsupported file format: ${filePath}`);
        }
      } catch (err) {
        result.skipped++;
        result.errors.push(`Error importing ${filePath}: ${String(err)}`);
      }
    }

    return result;
  }

  private importFromDirectory(dirPath: string): ImportResult {
    const result: ImportResult = { success: true, imported: 0, skipped: 0, errors: [] };

    const files = fs.readdirSync(dirPath).filter(f => f.endsWith('.jsonl'));
    for (const file of files) {
      const fullPath = path.join(dirPath, file);
      if (this.importJsonlFile(fullPath)) {
        result.imported++;
      } else {
        result.skipped++;
        result.errors.push(`Failed to import: ${file}`);
      }
    }

    return result;
  }

  private importJsonlFile(filePath: string): boolean {
    try {
      const content = fs.readFileSync(filePath, 'utf-8');
      const lines = content.trim().split('\n');
      if (lines.length === 0) return false;

      const firstLine: SessionMessage = JSON.parse(lines[0]);
      const sessionId = firstLine.sessionId || path.basename(filePath, '.jsonl');

      // Determine project from first user message's cwd or session data
      let project = 'D:\\code\\Imported';
      for (const line of lines) {
        try {
          const msg: SessionMessage = JSON.parse(line);
          if ((msg as any).cwd) {
            project = (msg as any).cwd;
            break;
          }
        } catch { /* skip */ }
      }

      const projectName = this.fileService.encodeProjectName(project);
      const destDir = path.join(this.claudeDir, 'projects', projectName);
      const destPath = path.join(destDir, path.basename(filePath));

      if (fs.existsSync(destPath)) {
        return false; // Already exists
      }

      this.fileService.copyFile(filePath, destPath);

      // Add to history
      const firstUserMsg = lines.map(l => { try { return JSON.parse(l); } catch { return null; } })
        .find((m: any) => m?.type === 'user' && m?.message?.content?.[0]?.text);

      if (firstUserMsg) {
        this.fileService.addToHistory({
          display: firstUserMsg.message.content[0].text.slice(0, 100),
          pastedContents: {},
          timestamp: new Date(firstUserMsg.timestamp || Date.now()).getTime(),
          project,
          sessionId,
        });
      }

      return true;
    } catch (err) {
      console.error('Import error:', err);
      return false;
    }
  }

  /**
   * Extract text from a message, handling both string and array content formats
   */
  private extractText(msg: SessionMessage): string {
    const content = msg.message?.content as any;
    if (typeof content === 'string') {
      return content.trim();
    }
    if (Array.isArray(content)) {
      return content
        .filter((c: any) => c && c.type === 'text' && c.text)
        .map((c: any) => c.text)
        .join('\n')
        .trim();
    }
    return '';
  }

  /**
   * Determine if a message should appear in exports.
   * Skips: meta/skill injections, system context, empty content (thinking/tool blocks)
   */
  private isExportable(msg: SessionMessage): boolean {
    // Skip skill injections & system context (marked isMeta)
    if ((msg as any).isMeta === true) return false;
    // Skip non-conversation types
    if (msg.type !== 'user' && msg.type !== 'assistant' && msg.type !== 'message') return false;
    // Skip empty messages (thinking-only, tool_use/tool_result, blank user echoes)
    return this.extractText(msg).length > 0;
  }

  /**
   * Clean the message stream for export:
   * 1. Filter out meta/empty messages
   * 2. Merge consecutive same-role messages into one block (streaming chunks)
   */
  private cleanMessages(messages: SessionMessage[]): Array<{ role: string; text: string; timestamp: string }> {
    const result: Array<{ role: string; text: string; timestamp: string }> = [];

    for (const msg of messages) {
      if (!this.isExportable(msg)) continue;

      const role = msg.type === 'assistant' ? 'assistant' : 'user';
      const text = this.extractText(msg);
      const timestamp = msg.timestamp || '';

      const last = result[result.length - 1];
      // Merge consecutive messages of the same role (streaming chunks of one reply)
      if (last && last.role === role) {
        last.text += '\n\n' + text;
        if (!last.timestamp) last.timestamp = timestamp;
      } else {
        result.push({ role, text, timestamp });
      }
    }

    return result;
  }

  private escapeHtml(text: string): string {
    return text
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  private formatMessages(messages: SessionMessage[], format: 'json' | 'markdown' | 'html'): string {
    const cleaned = this.cleanMessages(messages);

    switch (format) {
      case 'json':
        return JSON.stringify(cleaned, null, 2);

      case 'markdown': {
        let md = '# Claude Code Conversation\n\n';
        md += `Exported: ${new Date().toISOString()}\n\n---\n\n`;
        for (const msg of cleaned) {
          const role = msg.role === 'user' ? '🧑 **You**' : '🤖 **Claude**';
          const time = msg.timestamp ? `*${new Date(msg.timestamp).toLocaleString()}*` : '';
          md += `### ${role} ${time}\n\n${msg.text}\n\n---\n\n`;
        }
        return md;
      }

      case 'html': {
        let html = `<!DOCTYPE html>
<html><head><meta charset="utf-8"><title>Claude Code Conversation</title>
<style>
  body { font-family: 'Segoe UI', sans-serif; max-width: 900px; margin: 0 auto; padding: 20px; background: #1e1e1e; color: #d4d4d4; }
  h1 { color: #4B6EAF; }
  .msg { margin: 16px 0; padding: 16px; border-radius: 8px; }
  .user { background: #2d2d2d; border-left: 3px solid #4B6EAF; }
  .assistant { background: #1a2332; border-left: 3px solid #6A9955; }
  .role { font-weight: bold; margin-bottom: 8px; }
  .time { color: #888; font-size: 0.85em; margin-left: 8px; }
  hr { border: none; border-top: 1px solid #333; margin: 24px 0; }
</style></head><body>
<h1>Claude Code Conversation</h1>
<p>Exported: ${new Date().toISOString()}</p>
<hr>`;
        for (const msg of cleaned) {
          const role = msg.role === 'user' ? 'You' : 'Claude';
          const text = this.escapeHtml(msg.text);
          const time = msg.timestamp ? new Date(msg.timestamp).toLocaleString() : '';
          html += `<div class="msg ${msg.role}">
  <div class="role">${role}<span class="time">${time}</span></div>
  <div>${text.replace(/\n/g, '<br>')}</div>
</div>\n`;
        }
        html += '</body></html>';
        return html;
      }
    }
  }

  private copyDirSync(src: string, dest: string): void {
    fs.mkdirSync(dest, { recursive: true });
    for (const item of fs.readdirSync(src)) {
      const srcPath = path.join(src, item);
      const destPath = path.join(dest, item);
      if (fs.statSync(srcPath).isDirectory()) {
        this.copyDirSync(srcPath, destPath);
      } else {
        fs.copyFileSync(srcPath, destPath);
      }
    }
  }

  private countFiles(dir: string): { count: number; size: number } {
    let count = 0;
    let size = 0;
    for (const item of fs.readdirSync(dir)) {
      const p = path.join(dir, item);
      if (fs.statSync(p).isDirectory()) {
        const sub = this.countFiles(p);
        count += sub.count;
        size += sub.size;
      } else {
        count++;
        size += fs.statSync(p).size;
      }
    }
    return { count, size };
  }
}
