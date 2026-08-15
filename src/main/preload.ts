import { contextBridge, ipcRenderer } from 'electron';
import type { IpcAPI } from '../shared/types';

// Inlined from shared/ipc-channels to avoid ES module bundling issues
const IPC_CHANNELS = {
  CONV_LIST: 'conv:list',
  CONV_GET_DETAIL: 'conv:getDetail',
  CONV_RENAME: 'conv:rename',
  CONV_DELETE: 'conv:delete',
  CONV_TOGGLE_STAR: 'conv:toggleStar',
  CONV_SET_COLOR: 'conv:setColor',
  CONV_MIGRATE: 'conv:migrate',
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

const api: IpcAPI = {
  conv: {
    list: () => ipcRenderer.invoke(IPC_CHANNELS.CONV_LIST),
    getDetail: (id: string) => ipcRenderer.invoke(IPC_CHANNELS.CONV_GET_DETAIL, id),
    rename: (id: string, newName: string) => ipcRenderer.invoke(IPC_CHANNELS.CONV_RENAME, id, newName),
    delete: (id: string) => ipcRenderer.invoke(IPC_CHANNELS.CONV_DELETE, id),
    toggleStar: (id: string) => ipcRenderer.invoke(IPC_CHANNELS.CONV_TOGGLE_STAR, id),
    setColor: (id: string, color: string | null) => ipcRenderer.invoke(IPC_CHANNELS.CONV_SET_COLOR, id, color),
    migrate: (id: string, targetProject: string) => ipcRenderer.invoke(IPC_CHANNELS.CONV_MIGRATE, id, targetProject),
    addTag: (id: string, tag: string) => ipcRenderer.invoke(IPC_CHANNELS.CONV_ADD_TAG, id, tag),
    removeTag: (id: string, tag: string) => ipcRenderer.invoke(IPC_CHANNELS.CONV_REMOVE_TAG, id, tag),
  },
  export: {
    conversation: (id: string, format: string, outputPath: string) =>
      ipcRenderer.invoke(IPC_CHANNELS.EXPORT_CONV, id, format, outputPath),
  },
  import: {
    conversations: (filePaths: string[]) => ipcRenderer.invoke(IPC_CHANNELS.IMPORT_CONVS, filePaths),
  },
  backup: {
    all: (outputDir: string) => ipcRenderer.invoke(IPC_CHANNELS.BACKUP_ALL, outputDir),
    conversations: (ids: string[], outputDir: string) => ipcRenderer.invoke(IPC_CHANNELS.BACKUP_CONVS, ids, outputDir),
  },
  dialog: {
    openFile: (options) => ipcRenderer.invoke(IPC_CHANNELS.DIALOG_OPEN_FILE, options),
    saveFile: (options) => ipcRenderer.invoke(IPC_CHANNELS.DIALOG_SAVE_FILE, options),
    openDir: () => ipcRenderer.invoke(IPC_CHANNELS.DIALOG_OPEN_DIR),
  },
  window: {
    minimize: () => ipcRenderer.send('window:minimize'),
    maximize: () => ipcRenderer.send('window:maximize'),
    close: () => ipcRenderer.send('window:close'),
  },
  app: {
    getVersion: () => ipcRenderer.invoke(IPC_CHANNELS.APP_GET_VERSION),
    getClaudeDir: () => ipcRenderer.invoke(IPC_CHANNELS.APP_GET_CLAUDE_DIR),
  },
};

contextBridge.exposeInMainWorld('api', api);
