// Shared types between main and renderer processes

export interface HistoryEntry {
  display: string;
  pastedContents: Record<string, unknown>;
  timestamp: number;
  project: string;
  sessionId: string;
}

export interface Conversation {
  id: string;
  displayName: string;
  customName?: string;
  project: string;
  projectName: string;
  messageCount: number;
  createdAt: number;
  updatedAt: number;
  size: number;
  firstMessage: string;
  tags?: string[];
  isStarred?: boolean;
  color?: ColorLabel;
}

export type ColorLabel = 'red' | 'orange' | 'yellow' | 'green' | 'blue' | 'purple' | 'gray' | null;

export interface ConversationMetadata {
  sessionId: string;
  customName?: string;
  tags?: string[];
  isStarred?: boolean;
  color?: ColorLabel;
  createdAt?: number;
}

export interface MetadataStore {
  version: number;
  conversations: Record<string, ConversationMetadata>;
}

export interface SessionMessage {
  type: 'user' | 'assistant' | 'system' | string;
  message?: {
    role: string;
    content: Array<{ type: string; text?: string }>;
  };
  uuid?: string;
  timestamp?: string;
  sessionId?: string;
  parentUuid?: string | null;
}

export interface ConversationDetail {
  id: string;
  messages: Array<{
    role: string;
    content: string;
    timestamp: string;
  }>;
  messageCount: number;
  size: number;
  project: string;
  firstMessage: string;
  createdAt: number;
  updatedAt: number;
}

export interface ExportOptions {
  format: 'json' | 'markdown' | 'html';
  conversationId: string;
  outputPath: string;
}

export interface ImportResult {
  success: boolean;
  imported: number;
  skipped: number;
  errors: string[];
}

export interface BackupResult {
  success: boolean;
  path: string;
  count: number;
  totalSize: number;
}

export interface IpcAPI {
  conv: {
    list: () => Promise<Conversation[]>;
    getDetail: (id: string) => Promise<ConversationDetail | null>;
    rename: (id: string, newName: string) => Promise<boolean>;
    delete: (id: string) => Promise<boolean>;
    toggleStar: (id: string) => Promise<boolean>;
    setColor: (id: string, color: string | null) => Promise<boolean>;
    addTag: (id: string, tag: string) => Promise<boolean>;
    removeTag: (id: string, tag: string) => Promise<boolean>;
  };
  export: {
    conversation: (id: string, format: string, outputPath: string) => Promise<boolean>;
  };
  import: {
    conversations: (filePaths: string[]) => Promise<ImportResult>;
  };
  backup: {
    all: (outputDir: string) => Promise<BackupResult>;
    conversations: (ids: string[], outputDir: string) => Promise<BackupResult>;
  };
  dialog: {
    openFile: (options: { filters: Array<{ name: string; extensions: string[] }>; multi?: boolean }) => Promise<string[] | null>;
    saveFile: (options: { defaultPath: string; filters: Array<{ name: string; extensions: string[] }> }) => Promise<string | null>;
    openDir: () => Promise<string | null>;
  };
  window: {
    minimize: () => void;
    maximize: () => void;
    close: () => void;
  };
  app: {
    getVersion: () => Promise<string>;
    getClaudeDir: () => Promise<string>;
  };
}

declare global {
  interface Window {
    api: IpcAPI;
  }
}
