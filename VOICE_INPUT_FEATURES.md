# Obsidian Native Editor & Voice Input Features

## Overview

This document describes the new features added to Obsidian-Thino for enhanced editor integration and voice input capabilities.

## New Features

### 1. Obsidian Native Editor Integration

**File:** `src/components/ObsidianNativeEditor.tsx`

The plugin now includes a native Obsidian editor component that leverages Obsidian's CodeMirror 6 implementation, providing:

- **Full Plugin Compatibility**: Works seamlessly with Vim mode, Outliner, and other Obsidian editor plugins
- **Live Preview Mode**: Integrates with Obsidian's Live Preview functionality
- **Theme Consistency**: Uses Obsidian's theme variables for consistent styling
- **CodeMirror 6 API**: Direct access to CodeMirror 6 features and extensions
- **Fallback Support**: Automatically falls back to enhanced textarea if CodeMirror is unavailable

#### Key Features:

- `insertText()` - Insert text at cursor position
- `setContent()` - Replace entire editor content
- `getContent()` - Retrieve current content
- `applyFormat()` - Apply markdown formatting (bold, italic, headings, etc.)
- `focus()` - Focus the editor

#### Implementation Details:

The editor attempts to create a CodeMirror 6 instance using Obsidian's editor configuration:

```typescript
const activeView = app.workspace.getActiveViewOfType(MarkdownView);
const activeCM = (activeView.editor as any).cm as EditorView;
```

It extracts relevant extensions from the active editor to ensure compatibility with user settings and installed plugins.

### 2. Enhanced Voice Input

**File:** `src/components/VoiceRecorder.tsx`

The voice input system has been enhanced to provide better integration between speech recognition and audio recording:

#### Features:

- **Real-time Transcription**: Uses Web Speech Recognition API for live transcription
- **Audio Recording**: Captures audio using MediaRecorder API
- **Transcription Accumulation**: Stores full transcription throughout recording session
- **Integrated Saving**: Saves both audio file and transcription together

#### How It Works:

1. User clicks microphone button to start recording
2. Speech Recognition API transcribes speech in real-time
3. MediaRecorder captures audio as WebM format
4. Transcription is inserted into editor as user speaks
5. When stopped, audio is saved to vault with full transcription

### 3. Audio Storage with Transcription

**File:** `src/services/audioService.ts`

The audio service now supports storing transcriptions alongside audio files:

```typescript
public async saveAudioRecording(audioBlob: Blob, transcription?: string): Promise<string>
```

#### Storage Details:

- **Location**: Audio files are stored using Obsidian's attachment path settings
- **Naming**: Files are named `voice-memo-YYYYMMDDHHmmss.webm`
- **Metadata**: If transcription is provided, it's added to the daily note along with the audio link
- **Format**:
  ```markdown
  **Voice Memo:** [transcription text]

  ![[voice-memo-20250120153045.webm]]
  ```

### 4. Rich Text Toolbar Enhancements

**Files:**
- `src/components/RichTextToolbar.tsx`
- `src/less/rich-text-toolbar.less`

The formatting toolbar now works seamlessly with both editor types:

#### Supported Formats:

- **Bold** (Ctrl+B): `**text**`
- **Italic** (Ctrl+I): `*text*`
- **Strikethrough**: `~~text~~`
- **Inline Code**: `` `code` ``
- **Link**: `[text](url)`
- **Headings**: `# H1`, `## H2`, `### H3`
- **Bullet List**: `- item`
- **Numbered List**: `1. item`
- **Block Quote**: `> quote`
- **Code Block**: ` ```code``` `

#### Toolbar Toggle:

A new "Aa" button allows users to show/hide the formatting toolbar, reducing UI clutter when not needed.

## Integration in MemoEditor

**File:** `src/components/MemoEditor.tsx`

The MemoEditor component has been updated to integrate all new features:

### Voice Recording Integration:

```typescript
<VoiceRecorder
  onTranscription={handleVoiceTranscription}
  onAudioRecorded={handleAudioRecorded}
/>
```

- Real-time transcription inserts text into editor
- Completed recording saves audio + transcription to vault
- Automatic link generation for audio files

### Formatting Toolbar Integration:

```typescript
<button
  className={`action-btn toggle-toolbar ${showRichToolbar ? 'active' : ''}`}
  onClick={toggleRichToolbar}
>
  Aa
</button>
{showRichToolbar && (
  <div className="rich-toolbar-container">
    <RichTextToolbar onFormat={handleFormat} />
  </div>
)}
```

## Styling

**File:** `src/less/editor.less`

New CSS styles ensure the Obsidian Native Editor matches Obsidian's appearance:

- Uses Obsidian CSS variables for theming
- Responsive design for mobile devices
- Proper focus states and borders
- CodeMirror 6 specific styling
- Fallback textarea styling

## Usage

### For Users:

1. **Voice Input**: Click the microphone icon to start recording. Speak naturally, and your words will appear in the editor. Click stop when finished, and the audio file with transcription will be saved.

2. **Formatting**: Click the "Aa" button to show/hide the formatting toolbar. Click any format button to apply formatting to selected text or insert formatted placeholders.

3. **Plugin Compatibility**: The native editor automatically works with your installed Obsidian plugins like Vim mode and Outliner.

### For Developers:

To use the ObsidianNativeEditor in other components:

```typescript
import ObsidianNativeEditor from './components/ObsidianNativeEditor';

<ObsidianNativeEditor
  className="my-editor"
  initialContent="Initial text"
  placeholder="Type something..."
  onContentChange={(content) => console.log(content)}
  ref={editorRef}
/>
```

## Browser Compatibility

### Voice Input:

- **Chrome/Edge**: Full support (Web Speech API)
- **Safari**: Partial support (iOS Safari has Speech Recognition)
- **Firefox**: Limited support (requires flags)
- **Mobile**: Works best on Chrome for Android and Safari for iOS

### CodeMirror 6:

- Works in all modern browsers that Obsidian supports
- Automatic fallback to textarea if CodeMirror initialization fails

## Known Limitations

1. **Voice Recognition Language**: Currently defaults to 'en-US'. Multi-language support could be added.
2. **Audio Format**: WebM format may not be supported on all platforms (though it works in Obsidian).
3. **CodeMirror Extensions**: Not all Obsidian editor extensions are copied to prevent conflicts.
4. **Offline Usage**: Voice recognition requires internet connection in most browsers.

## Future Enhancements

- Multi-language voice recognition support
- Audio transcription using offline models
- Direct integration with Obsidian's audio recording features
- Support for additional audio formats
- Voice commands for editor actions

## Testing

To test the new features:

1. **Build the plugin**: `npm install && npm run build`
2. **Copy to Obsidian**: Copy `main.js`, `styles.css`, and `manifest.json` to your vault's plugins folder
3. **Enable in Obsidian**: Enable the plugin in Settings → Community Plugins
4. **Test Voice Input**: Create a new memo and click the microphone button
5. **Test Formatting**: Click "Aa" to open the toolbar and test formatting options
6. **Test Native Editor**: The editor should automatically use Obsidian's native editor when available

## Architecture Diagram

```
┌─────────────────────────────────────────────┐
│           MemoEditor (Main)                 │
│  ┌─────────────┐  ┌──────────────────────┐ │
│  │   Editor    │  │ ObsidianNativeEditor │ │
│  │ (Textarea)  │  │   (CodeMirror 6)     │ │
│  └─────────────┘  └──────────────────────┘ │
│                                             │
│  ┌──────────────────────────────────────┐  │
│  │      RichTextToolbar                 │  │
│  │  [B] [I] [S] [H1] [H2] [List] [...]  │  │
│  └──────────────────────────────────────┘  │
│                                             │
│  ┌──────────────────────────────────────┐  │
│  │      VoiceRecorder                   │  │
│  │  🎤 Speech Recognition + MediaRecorder │
│  └──────────────────────────────────────┘  │
└─────────────────────────────────────────────┘
                    │
                    ├─→ audioService
                    │   └─→ Vault Storage
                    │
                    └─→ editorFormatting
                        └─→ Markdown Transforms
```

## Contributing

When contributing to these features:

1. Ensure TypeScript types are properly defined
2. Test on both desktop and mobile
3. Verify compatibility with common Obsidian plugins
4. Update this documentation with any changes
5. Add appropriate error handling and fallbacks

## License

MIT - See LICENSE file for details
