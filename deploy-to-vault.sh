#!/bin/bash

# Development deployment script for Obsidian Memos plugin
# This copies the built files to your Obsidian vault

VAULT_PLUGIN_PATH="/Users/hax429/notes/.obsidian/plugins/obsidian-memos"
BUILD_DIR="/home/user/Obsidian-Thino"

echo "🚀 Deploying Obsidian Memos to vault..."
echo "📁 Vault plugin path: $VAULT_PLUGIN_PATH"
echo "🔨 Build directory: $BUILD_DIR"
echo ""

# Check if build files exist
if [ ! -f "$BUILD_DIR/main.js" ]; then
  echo "❌ Error: main.js not found. Run 'npm run build' first!"
  exit 1
fi

# Create vault plugin directory if it doesn't exist
mkdir -p "$VAULT_PLUGIN_PATH"

# Copy files
echo "📦 Copying files..."
cp "$BUILD_DIR/main.js" "$VAULT_PLUGIN_PATH/main.js"
cp "$BUILD_DIR/styles.css" "$VAULT_PLUGIN_PATH/styles.css"
cp "$BUILD_DIR/manifest.json" "$VAULT_PLUGIN_PATH/manifest.json"

# Create .hotreload file for auto-reload (if you have the Hot Reload plugin)
touch "$VAULT_PLUGIN_PATH/.hotreload"

echo ""
echo "✅ Deployment complete!"
echo ""
echo "📝 Next steps:"
echo "   1. If Obsidian is open, reload the plugin:"
echo "      - Press Ctrl+Shift+I (or Cmd+Option+I on Mac) to open DevTools"
echo "      - Run: app.plugins.disablePlugin('obsidian-memos')"
echo "      - Run: app.plugins.enablePlugin('obsidian-memos')"
echo "   2. Or restart Obsidian"
echo ""
echo "🔥 For automatic reloading, install the 'Hot Reload' plugin:"
echo "   https://github.com/pjeby/hot-reload"
echo ""
