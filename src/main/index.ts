import { app, BrowserWindow, ipcMain, dialog, shell } from 'electron';
import path from 'path';
import fs from 'fs';
import { FileService } from './services/file-service';
import { ConversationService } from './services/conversation-service';
import { BackupService } from './services/backup-service';

// Inlined from shared/ipc-channels to avoid ES module bundling issues
const IPC_CHANNELS = {
  CONV_LIST: 'conv:list',
  CONV_GET_DETAIL: 'conv:getDetail',
  CONV_RENAME: 'conv:rename',
  CONV_DELETE: 'conv:delete',
  CONV_TOGGLE_STAR: 'conv:toggleStar',
  CONV_SET_COLOR: 'conv:setColor',
  CONV_ADD_TAG: 'conv:addTag',
  CONV_REMOVE_TAG: 'conv:removeTag',
  EXPORT_CONV: 'export:conversation',
  IMPORT_CONVS: 'import:conversations',
  BACKUP_ALL: 'backup:all',
  BACKUP_CONVS: 'backup:conversations',
  DIALOG_OPEN_FILE: 'dialog:openFile',
  DIALOG_SAVE_FILE: 'dialog:saveFile',
  DIALOG_OPEN_DIR: 'dialog:openDir',
  APP_GET_VERSION: 'app:getVersion',
  APP_GET_CLAUDE_DIR: 'app:getClaudeDir',
} as const;

let mainWindow: BrowserWindow | null = null;
let CLAUDE_DIR: string;
let fileService: FileService;
let backupService: BackupService;
let conversationService: ConversationService;

function initServices() {
  CLAUDE_DIR = path.join(app.getPath('home'), '.claude');
  fileService = new FileService(CLAUDE_DIR);
  backupService = new BackupService(CLAUDE_DIR);
  conversationService = new ConversationService(fileService, backupService);
}

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    minWidth: 1000,
    minHeight: 600,
    frame: false,
    titleBarStyle: 'hidden',
    backgroundColor: '#2B2B2B',
    icon: path.join(__dirname, '../../resources/icon.ico'),
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false,
    },
  });

  if (process.env.VITE_DEV_SERVER_URL) {
    mainWindow.loadURL(process.env.VITE_DEV_SERVER_URL);
  } else {
    mainWindow.loadFile(path.join(__dirname, '../renderer/index.html'));
  }
}

function registerIpcHandlers() {
  // Conversation handlers
  ipcMain.handle(IPC_CHANNELS.CONV_LIST, async () => {
    return conversationService.listConversations();
  });

  ipcMain.handle(IPC_CHANNELS.CONV_GET_DETAIL, async (_e, id: string) => {
    return conversationService.getConversationDetail(id);
  });

  ipcMain.handle(IPC_CHANNELS.CONV_RENAME, async (_e, id: string, newName: string) => {
    return conversationService.renameConversation(id, newName);
  });

  ipcMain.handle(IPC_CHANNELS.CONV_DELETE, async (_e, id: string) => {
    return conversationService.deleteConversation(id);
  });

  ipcMain.handle(IPC_CHANNELS.CONV_TOGGLE_STAR, async (_e, id: string) => {
    return conversationService.toggleStar(id);
  });

  ipcMain.handle(IPC_CHANNELS.CONV_SET_COLOR, async (_e, id: string, color: string | null) => {
    return conversationService.setColor(id, color as any);
  });

  ipcMain.handle(IPC_CHANNELS.CONV_ADD_TAG, async (_e, id: string, tag: string) => {
    return conversationService.addTag(id, tag);
  });

  ipcMain.handle(IPC_CHANNELS.CONV_REMOVE_TAG, async (_e, id: string, tag: string) => {
    return conversationService.removeTag(id, tag);
  });

  // Export/Import/Backup handlers
  ipcMain.handle(IPC_CHANNELS.EXPORT_CONV, async (_e, id: string, format: string, outputPath: string) => {
    return backupService.exportConversation(id, format as 'json' | 'markdown' | 'html', outputPath);
  });

  ipcMain.handle(IPC_CHANNELS.IMPORT_CONVS, async (_e, filePaths: string[]) => {
    return backupService.importConversations(filePaths);
  });

  ipcMain.handle(IPC_CHANNELS.BACKUP_ALL, async (_e, outputDir: string) => {
    return backupService.backupAll(outputDir);
  });

  ipcMain.handle(IPC_CHANNELS.BACKUP_CONVS, async (_e, ids: string[], outputDir: string) => {
    return backupService.backupConversations(ids, outputDir);
  });

  // Dialog handlers
  ipcMain.handle(IPC_CHANNELS.DIALOG_OPEN_FILE, async (_e, options) => {
    const result = await dialog.showOpenDialog(mainWindow!, {
      properties: ['openFile', ...(options.multi ? ['multiSelections' as const] : [])],
      filters: options.filters,
    });
    return result.canceled ? null : result.filePaths;
  });

  ipcMain.handle(IPC_CHANNELS.DIALOG_SAVE_FILE, async (_e, options) => {
    const result = await dialog.showSaveDialog(mainWindow!, {
      defaultPath: options.defaultPath,
      filters: options.filters,
    });
    return result.canceled ? null : result.filePath;
  });

  ipcMain.handle(IPC_CHANNELS.DIALOG_OPEN_DIR, async () => {
    const result = await dialog.showOpenDialog(mainWindow!, {
      properties: ['openDirectory'],
    });
    return result.canceled ? null : result.filePaths[0];
  });

  // App handlers
  ipcMain.handle(IPC_CHANNELS.APP_GET_VERSION, () => {
    return app.getVersion();
  });

  ipcMain.handle(IPC_CHANNELS.APP_GET_CLAUDE_DIR, () => {
    return CLAUDE_DIR;
  });

  // Window controls
  ipcMain.on('window:minimize', () => mainWindow?.minimize());
  ipcMain.on('window:maximize', () => {
    if (mainWindow?.isMaximized()) {
      mainWindow.unmaximize();
    } else {
      mainWindow?.maximize();
    }
  });
  ipcMain.on('window:close', () => app.quit());
}

app.whenReady().then(() => {
  initServices();
  registerIpcHandlers();
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});
