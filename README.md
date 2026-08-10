# ClaudeCode Hub

一个 Windows 11 风格的桌面应用，用于管理 Claude Code 对话记录。

**作者**: [dboycht](https://github.com/dboycht)  
**仓库**: [github.com/dboycht/ClaudeCodeHub](https://github.com/dboycht/ClaudeCodeHub)  
**版本**: 1.00.2

---

## ✨ 功能特性

### 对话管理
- **对话发现** — 扫描全部项目目录的会话文件，与 Claude Code `/resume` 完全一致
- **智能命名** — 读取 AI 生成标题（`ai-title`）和自定义标题（`custom-title`），优先显示 Claude Code 中的名称
- **重命名** — 向会话文件写入 `custom-title`，Claude Code `/resume` 即刻可见
- **删除** — 移入回收站，可恢复
- **备份** — 备份选中或全部对话到指定目录
- **导出** — JSON / Markdown / HTML 三种格式
- **导入** — 从备份或 .jsonl 文件导入

### 分类与筛选
- **颜色标签** — 7 种颜色标记（红橙黄绿蓝紫灰），类似 macOS Finder 标签
- **批量操作** — 多选后批量标记颜色、导出、删除
- **项目筛选** — 按项目目录分组过滤
- **收藏夹** — 星标收藏重要对话
- **搜索** — 按名称/消息内容快速搜索

### 界面设计
- **Windows 11 Fluent Design** — 亚克力标题栏、圆角、流畅动画
- **6 种配色主题** — JetBrains Dark（默认）、One Dark Pro、Monokai、Nord、Solarized Dark、GitHub Dark
- **中英双语** — 完整中文/English 界面，一键切换
- **消息预览** — Markdown 渲染（代码块、粗体、斜体、列表）

---

## 🚀 快速开始

### 环境要求
- Windows 10/11
- Node.js 18+
- npm 9+

### 安装与运行

```bash
# 1. 安装依赖
npm install

# 2. 启动应用

# 方式 A：双击 bat 脚本（推荐）
启动ClaudeCode管理器.bat

# 方式 B：命令行
npm run build
set ELECTRON_RUN_AS_NODE=
npm start
```

> ⚠️ **重要**：`ELECTRON_RUN_AS_NODE=1` 会导致窗口控件失效，bat 脚本会自动处理

---

## 📖 使用指南

| 操作 | 方法 |
|------|------|
| 查看对话详情 | 点击列表中的对话 |
| 重命名（同步到 Claude Code） | 选中对话 → 点击"重命名" → 写入 `custom-title` |
| 批量标记颜色 | 勾选多个 → 点击颜色圆点 |
| 批量导出/删除 | 勾选多个 → 点击 Export / Delete |
| 按颜色筛选 | 侧栏颜色圆点 |
| 切换主题/语言 | 侧栏下拉菜单 |

---

## 📝 更新日志

### v1.00.2 (2026-08-10)
- ✨ 新增：中文版管理脚本 `manage.bat`（编译 / 打包 / 生成 GitHub / 清理缓存）
- 🔧 修复：导出功能（Markdown / JSON / HTML）无法生成文件
  - 原因：`content` 字段为字符串时 `.map()` 崩溃
  - 修复：支持字符串和数组两种消息格式，HTML 导出增加转义
- 🔧 修复：删除对话后列表不立即刷新
  - 原因：`shell.trashItem` 异步未等待，刷新时文件仍存在
  - 修复：等待回收站操作完成后再刷新列表
- 🔧 修复：软件图标改用 `resources/icon.ico`

### v1.00.1 (2026-07-24)
- ✨ 新增：关于对话框（作者、项目地址、版本信息）
- ✨ 新增：批量操作栏（多选后批量颜色标记、导出、删除）
- ✨ 新增：颜色标签分类系统（7色，类似 macOS Finder）
- 🔧 修复：Toast 通知移至右下角
- 🔧 修复：重命名功能现在写入会话文件 `custom-title`，Claude Code 可见
- 🔧 修复：标题读取字段修正（`aiTitle`/`customTitle` 替代 `content`）
- 🔧 修复：无标题会话显示 UUID 前缀（与 `/resume` 一致）
- 🔧 修复：`content` 字段同时支持字符串和数组格式
- 🔧 修复：仅展示磁盘会话文件，移除 `[History]` 和历史幽灵条目
- 🔧 修复：窗口关闭按钮调用 `app.quit()` 确保完全退出
- 🌐 全面中英双语覆盖
- 🎨 消息预览支持 Markdown 渲染（代码块、粗体、斜体、列表）

### v1.0.0 (初始版本)
- 对话扫描与管理（重命名、删除、备份、导出、导入）
- Windows 11 Fluent Design 界面
- 6 种 JetBrains 风格暗色主题
- 中英双语切换
- 项目筛选、收藏夹、搜索

---

## 🔧 技术栈

| 技术 | 用途 |
|------|------|
| **Electron 33** | 桌面应用框架 |
| **React 19** | UI 框架 |
| **TypeScript 5** | 类型安全 |
| **Vite 6** | 构建工具 |
| **Zustand 5** | 状态管理 |
| **i18next** | 国际化 |
| **Lucide React** | 图标库 |

---

## 📁 项目结构

```
VibeCoding/
├── 启动ClaudeCode管理器.bat
├── src/
│   ├── main/                     # Electron 主进程
│   │   ├── index.ts / preload.ts
│   │   └── services/             # 文件/会话/备份服务
│   ├── renderer/                 # React 前端
│   │   ├── components/           # Layout / Conversation / Dialogs / Common
│   │   ├── stores/               # Zustand 状态
│   │   ├── themes/               # 6 套配色
│   │   ├── i18n/                 # 中英文
│   │   └── styles/               # 全局 CSS
│   └── shared/                   # 类型 & 常量
└── resources/
```

---

## ⚠️ 常见问题

**Q: 对话列表与 `/resume` 不一致？**  
A: 应用直接扫描会话文件并匹配 AI 标题，应与 Claude Code 完全一致。如仍有差异请提 Issue。

**Q: 窗口控件不工作？**  
A: 清除 `ELECTRON_RUN_AS_NODE` 环境变量后重试。

**Q: 如何恢复误删的对话？**  
A: 对话移入系统回收站，可从回收站恢复。
