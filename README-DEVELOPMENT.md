# 🛠️ Development Workflow Guide

This guide explains how to develop the Obsidian Memos plugin with automatic reloading.

## 🚀 Quick Start

### Option 1: Build Once and Deploy
```bash
npm run build:deploy
```
This builds the plugin and copies it to your Obsidian vault.

### Option 2: Watch Mode (Recommended for Active Development)
```bash
npm run dev:deploy
```
This:
1. Watches for source file changes
2. Automatically rebuilds when you save
3. Automatically deploys to your vault
4. Works with Hot Reload plugin for instant updates in Obsidian

## 📋 Prerequisites

### 1. Install Hot Reload Plugin (Highly Recommended)

In Obsidian:
1. Go to Settings → Community Plugins
2. Search for "Hot Reload"
3. Install and enable it

**What it does:** Automatically reloads your plugin when files change (no need to manually disable/enable)

**Repository:** https://github.com/pjeby/hot-reload

### 2. File Watcher (Optional - for better performance)

The watch script will work without this, but installing a file watcher makes it faster:

**On Mac:**
```bash
brew install fswatch
```

**On Linux:**
```bash
sudo apt-get install inotify-tools  # Debian/Ubuntu
sudo yum install inotify-tools       # CentOS/RHEL
```

## 🎯 Development Workflow

### Standard Workflow (with Hot Reload plugin)

1. **Start watch mode:**
   ```bash
   npm run dev:deploy
   ```

2. **Make changes** to any file in `src/`

3. **Save the file** - Changes automatically:
   - Rebuild via Vite
   - Deploy to your vault
   - Reload in Obsidian (via Hot Reload plugin)

4. **Check Obsidian** - Your changes are live!

### Without Hot Reload Plugin

If you don't have the Hot Reload plugin, you need to manually reload:

1. **Start watch mode:**
   ```bash
   npm run dev:deploy
   ```

2. **Make changes and save**

3. **In Obsidian**, open Console (Cmd+Option+I or Ctrl+Shift+I):
   ```javascript
   app.plugins.disablePlugin('obsidian-memos')
   app.plugins.enablePlugin('obsidian-memos')
   ```

   Or just restart Obsidian.

## 📂 File Locations

- **Source code:** `/home/user/Obsidian-Thino/src/`
- **Build output:** `/home/user/Obsidian-Thino/main.js` and `styles.css`
- **Vault plugin:** `/Users/hax429/notes/.obsidian/plugins/obsidian-memos/`

## 🔧 Available Scripts

| Command | Description |
|---------|-------------|
| `npm run build` | Build for production (one-time) |
| `npm run build:deploy` | Build and deploy to vault (one-time) |
| `npm run dev` | Build in watch mode (no deploy) |
| `npm run dev:deploy` | Build in watch mode + auto-deploy |
| `./deploy-to-vault.sh` | Manually copy files to vault |

## 🐛 Debugging

### Check if new version loaded

After deploying, check Obsidian console for:
```
BUILD VERSION: v2025-11-22-15:30-MARKDOWN-SUPPORT
```

You should also see popup notifications:
- "Memos Plugin Loading - v2025-11-22-15:30-MARKDOWN-SUPPORT"
- "Memos Plugin FULLY LOADED - Markdown support active!"

### Check if editor initialized

When creating/editing a memo, look for:
```
[ObsidianNativeEditor] Initializing...
[ObsidianNativeEditor] CodeMirror 6 editor created successfully!
```

And a popup: "✓ Markdown editor initialized (v2025-11-22-15:30)"

### Check if markdown parsing works

When viewing memos, look for:
```
[Memo Debug] Original content: ...
[Memo Debug] After br replacement: ...
```

### Common Issues

**Problem:** "Using fallback textarea editor"
**Solution:** Old code is loaded. Make sure you deployed the new build and reloaded the plugin.

**Problem:** Changes not showing up
**Solution:**
1. Check that watch mode is running
2. Verify files copied to vault: `ls -la /Users/hax429/notes/.obsidian/plugins/obsidian-memos/`
3. Hard reload: Disable plugin → wait 2 sec → Enable plugin

**Problem:** Watch script not detecting changes
**Solution:** Install `fswatch` (Mac) or `inotify-tools` (Linux) for better file watching.

## 🎨 Testing Markdown Features

After deploying, test these features in a memo:

### Lists
```markdown
* Item 1
* Item 2
  * Nested item (use Tab to indent)
```

### Todo Lists
```markdown
- [ ] Unchecked task
- [x] Completed task
```

### Numbered Lists
```markdown
1. First item
2. Second item
   1. Nested (press Enter to auto-continue)
```

### Other Markdown
```markdown
**bold text**
*italic text*
~~strikethrough~~
`inline code`
> blockquote
# Heading
```

## 📝 Tips

1. **Keep watch mode running** - Leave `npm run dev:deploy` running in a terminal
2. **Use Hot Reload** - Save lots of time not manually reloading
3. **Check console** - Use Obsidian DevTools (Cmd+Option+I) to see debug logs
4. **Version check** - Always verify the BUILD_VERSION after deploying

## 🔗 Useful Resources

- **Hot Reload Plugin:** https://github.com/pjeby/hot-reload
- **Obsidian API Docs:** https://docs.obsidian.md/Plugins/Getting+started/Build+a+plugin
- **CodeMirror 6 Docs:** https://codemirror.net/docs/

---

Happy coding! 🎉
