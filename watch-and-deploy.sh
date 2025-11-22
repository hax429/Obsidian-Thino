#!/bin/bash

# Watch for changes to main.js and automatically deploy to vault
# This works in conjunction with vite build --watch

VAULT_PLUGIN_PATH="/Users/hax429/notes/.obsidian/plugins/obsidian-memos"
BUILD_DIR="/home/user/Obsidian-Thino"

echo "👀 Watching for changes in build files..."
echo "📁 Will auto-deploy to: $VAULT_PLUGIN_PATH"
echo "🔥 Make sure you have the 'Hot Reload' plugin installed in Obsidian"
echo ""

# Create vault plugin directory if it doesn't exist
mkdir -p "$VAULT_PLUGIN_PATH"

# Initial deployment
echo "📦 Initial deployment..."
cp "$BUILD_DIR/main.js" "$VAULT_PLUGIN_PATH/main.js" 2>/dev/null
cp "$BUILD_DIR/styles.css" "$VAULT_PLUGIN_PATH/styles.css" 2>/dev/null
cp "$BUILD_DIR/manifest.json" "$VAULT_PLUGIN_PATH/manifest.json" 2>/dev/null
touch "$VAULT_PLUGIN_PATH/.hotreload"
echo "✅ Initial deployment complete!"
echo ""

# Watch for file changes using inotifywait (Linux) or fswatch (Mac)
if command -v inotifywait &> /dev/null; then
  # Linux
  while inotifywait -e modify,create "$BUILD_DIR/main.js" "$BUILD_DIR/styles.css" 2>/dev/null; do
    echo "🔄 Changes detected, deploying..."
    cp "$BUILD_DIR/main.js" "$VAULT_PLUGIN_PATH/main.js"
    cp "$BUILD_DIR/styles.css" "$VAULT_PLUGIN_PATH/styles.css"
    echo "✅ Deployed at $(date '+%H:%M:%S')"
  done
elif command -v fswatch &> /dev/null; then
  # Mac
  fswatch -o "$BUILD_DIR/main.js" "$BUILD_DIR/styles.css" | while read change; do
    echo "🔄 Changes detected, deploying..."
    cp "$BUILD_DIR/main.js" "$VAULT_PLUGIN_PATH/main.js"
    cp "$BUILD_DIR/styles.css" "$VAULT_PLUGIN_PATH/styles.css"
    echo "✅ Deployed at $(date '+%H:%M:%S')"
  done
else
  # Fallback: polling every 2 seconds
  echo "⚠️  File watcher not found. Using polling mode (slower)."
  echo "💡 Install inotifywait (Linux) or fswatch (Mac) for better performance."
  echo ""

  LAST_MAIN_TIME=$(stat -c %Y "$BUILD_DIR/main.js" 2>/dev/null || stat -f %m "$BUILD_DIR/main.js" 2>/dev/null)
  LAST_CSS_TIME=$(stat -c %Y "$BUILD_DIR/styles.css" 2>/dev/null || stat -f %m "$BUILD_DIR/styles.css" 2>/dev/null)

  while true; do
    sleep 2

    CURRENT_MAIN_TIME=$(stat -c %Y "$BUILD_DIR/main.js" 2>/dev/null || stat -f %m "$BUILD_DIR/main.js" 2>/dev/null)
    CURRENT_CSS_TIME=$(stat -c %Y "$BUILD_DIR/styles.css" 2>/dev/null || stat -f %m "$BUILD_DIR/styles.css" 2>/dev/null)

    if [ "$CURRENT_MAIN_TIME" != "$LAST_MAIN_TIME" ] || [ "$CURRENT_CSS_TIME" != "$LAST_CSS_TIME" ]; then
      echo "🔄 Changes detected, deploying..."
      cp "$BUILD_DIR/main.js" "$VAULT_PLUGIN_PATH/main.js"
      cp "$BUILD_DIR/styles.css" "$VAULT_PLUGIN_PATH/styles.css"
      echo "✅ Deployed at $(date '+%H:%M:%S')"

      LAST_MAIN_TIME=$CURRENT_MAIN_TIME
      LAST_CSS_TIME=$CURRENT_CSS_TIME
    fi
  done
fi
