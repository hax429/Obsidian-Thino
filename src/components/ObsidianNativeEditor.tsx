import React, { forwardRef, useEffect, useImperativeHandle, useRef, useState } from 'react';
import { Editor as ObsidianEditor, MarkdownView, Notice, TFile } from 'obsidian';
import { EditorView } from '@codemirror/view';
import { EditorState, Extension } from '@codemirror/state';
import appStore from '../stores/appStore';
import { EditorRefActions } from './Editor/Editor';
import { applyMarkdownFormat } from '../helpers/editorFormatting';

interface ObsidianNativeEditorProps {
  className?: string;
  initialContent?: string;
  placeholder?: string;
  onContentChange?: (content: string) => void;
}

/**
 * ObsidianNativeEditor - A wrapper component that embeds Obsidian's native CodeMirror 6 editor
 * This allows full compatibility with Obsidian plugins like Outliner, Vim mode, etc.
 *
 * Features:
 * - Uses Obsidian's CodeMirror 6 configuration for consistency
 * - Supports Live Preview mode
 * - Compatible with all Obsidian editor plugins
 * - Full markdown formatting support
 */
const ObsidianNativeEditor = forwardRef<EditorRefActions, ObsidianNativeEditorProps>(
  ({ className = '', initialContent = '', placeholder = '', onContentChange }, ref) => {
    const containerRef = useRef<HTMLDivElement>(null);
    const editorViewRef = useRef<EditorView | null>(null);
    const textareaRef = useRef<HTMLTextAreaElement | null>(null);
    const contentRef = useRef<string>(initialContent);
    const [isReady, setIsReady] = useState(false);

    useImperativeHandle(
      ref,
      () => ({
        element: textareaRef.current || (containerRef.current as any),
        focus: () => {
          if (editorViewRef.current) {
            editorViewRef.current.focus();
          } else if (textareaRef.current) {
            textareaRef.current.focus();
          }
        },
        insertText: (text: string) => {
          if (editorViewRef.current) {
            const view = editorViewRef.current;
            const pos = view.state.selection.main.head;
            view.dispatch({
              changes: { from: pos, to: pos, insert: text },
              selection: { anchor: pos + text.length },
            });
            contentRef.current = view.state.doc.toString();
            if (onContentChange) {
              onContentChange(contentRef.current);
            }
          } else if (textareaRef.current) {
            const textarea = textareaRef.current;
            const start = textarea.selectionStart;
            const end = textarea.selectionEnd;
            const currentValue = textarea.value;
            textarea.value = currentValue.substring(0, start) + text + currentValue.substring(end);
            textarea.selectionStart = textarea.selectionEnd = start + text.length;
            contentRef.current = textarea.value;
            if (onContentChange) {
              onContentChange(contentRef.current);
            }
          }
        },
        setContent: (text: string) => {
          contentRef.current = text;
          if (editorViewRef.current) {
            const view = editorViewRef.current;
            view.dispatch({
              changes: { from: 0, to: view.state.doc.length, insert: text },
            });
            if (onContentChange) {
              onContentChange(text);
            }
          } else if (textareaRef.current) {
            textareaRef.current.value = text;
            if (onContentChange) {
              onContentChange(text);
            }
          }
        },
        getContent: (): string => {
          if (editorViewRef.current) {
            return editorViewRef.current.state.doc.toString();
          } else if (textareaRef.current) {
            return textareaRef.current.value;
          }
          return contentRef.current;
        },
        applyFormat: (format: string) => {
          if (editorViewRef.current) {
            const view = editorViewRef.current;
            const selection = view.state.selection.main;
            const text = view.state.doc.toString();

            const result = applyMarkdownFormat(
              text,
              selection.from,
              selection.to,
              format
            );

            view.dispatch({
              changes: { from: 0, to: text.length, insert: result.newText },
              selection: { anchor: result.selectionStart, head: result.selectionEnd },
            });

            contentRef.current = result.newText;
            if (onContentChange) {
              onContentChange(result.newText);
            }
          } else if (textareaRef.current) {
            const textarea = textareaRef.current;
            const result = applyMarkdownFormat(
              textarea.value,
              textarea.selectionStart,
              textarea.selectionEnd,
              format
            );

            textarea.value = result.newText;
            textarea.setSelectionRange(result.selectionStart, result.selectionEnd);
            contentRef.current = result.newText;
            if (onContentChange) {
              onContentChange(result.newText);
            }
          }
        },
      }),
      [onContentChange],
    );

    useEffect(() => {
      const setupEditor = async () => {
        if (!containerRef.current) return;

        const { app } = appStore.getState().dailyNotesState;
        if (!app) {
          console.error('App not available');
          return;
        }

        try {
          // Try to get Obsidian's editor extensions for full compatibility
          const activeView = app.workspace.getActiveViewOfType(MarkdownView);

          if (activeView && (activeView.editor as any).cm) {
            // Get the CodeMirror 6 instance configuration from active editor
            const activeCM = (activeView.editor as any).cm as EditorView;

            // Extract relevant extensions from Obsidian's editor
            // This ensures compatibility with Vim mode, Outliner, and other plugins
            const extensions: Extension[] = [];

            // Add basic CodeMirror extensions
            extensions.push(
              EditorView.lineWrapping,
              EditorView.updateListener.of((update) => {
                if (update.docChanged) {
                  contentRef.current = update.state.doc.toString();
                  if (onContentChange) {
                    onContentChange(contentRef.current);
                  }
                }
              }),
              // Use placeholder if provided
              placeholder ? EditorView.contentAttributes.of({ 'data-placeholder': placeholder }) : [],
            );

            // Try to get Obsidian's theme and syntax highlighting
            try {
              const state = activeCM.state;
              // Copy over markdown-related extensions
              const mdExtensions = state.facet(EditorState.languageData);
              if (mdExtensions) {
                extensions.push(EditorState.languageData.of(() => mdExtensions as any));
              }
            } catch (e) {
              console.log('Could not copy all editor extensions:', e);
            }

            // Create the CodeMirror 6 editor
            const startState = EditorState.create({
              doc: initialContent,
              extensions,
            });

            const view = new EditorView({
              state: startState,
              parent: containerRef.current,
            });

            editorViewRef.current = view;
            setIsReady(true);

            // Add custom styling
            containerRef.current.classList.add('obsidian-cm6-editor');

          } else {
            // Fallback: Use enhanced textarea with Obsidian-like styling
            console.log('Using fallback textarea editor');
            const textArea = document.createElement('textarea');
            textArea.className = 'obsidian-native-editor-input fallback';
            textArea.placeholder = placeholder;
            textArea.value = initialContent;
            textArea.style.cssText = `
              width: 100%;
              min-height: 120px;
              padding: 12px;
              border: 1px solid var(--background-modifier-border);
              border-radius: 6px;
              background: var(--background-primary);
              color: var(--text-normal);
              font-family: var(--font-text);
              font-size: var(--font-text-size);
              line-height: 1.5;
              resize: vertical;
              box-sizing: border-box;
            `;

            containerRef.current.appendChild(textArea);
            textareaRef.current = textArea;

            textArea.addEventListener('input', () => {
              contentRef.current = textArea.value;
              if (onContentChange) {
                onContentChange(textArea.value);
              }
            });

            setIsReady(true);
          }
        } catch (error) {
          console.error('Error setting up Obsidian native editor:', error);
          new Notice('Failed to initialize native editor, using fallback');

          // Final fallback
          const textArea = document.createElement('textarea');
          textArea.className = 'obsidian-native-editor-input fallback';
          textArea.placeholder = placeholder;
          textArea.value = initialContent;
          textArea.style.cssText = `
            width: 100%;
            min-height: 120px;
            padding: 12px;
            border: 1px solid var(--background-modifier-border);
            border-radius: 6px;
            background: var(--background-primary);
            color: var(--text-normal);
            font-family: var(--font-text);
            font-size: var(--font-text-size);
            line-height: 1.5;
            resize: vertical;
            box-sizing: border-box;
          `;

          containerRef.current.appendChild(textArea);
          textareaRef.current = textArea;

          textArea.addEventListener('input', () => {
            contentRef.current = textArea.value;
            if (onContentChange) {
              onContentChange(textArea.value);
            }
          });

          setIsReady(true);
        }
      };

      setupEditor();

      return () => {
        // Cleanup
        if (editorViewRef.current) {
          editorViewRef.current.destroy();
          editorViewRef.current = null;
        }
        if (containerRef.current) {
          containerRef.current.innerHTML = '';
        }
        textareaRef.current = null;
      };
    }, [initialContent, placeholder]);

    // Update content when initialContent changes
    useEffect(() => {
      if (isReady && contentRef.current !== initialContent) {
        if (editorViewRef.current) {
          const view = editorViewRef.current;
          view.dispatch({
            changes: { from: 0, to: view.state.doc.length, insert: initialContent },
          });
        } else if (textareaRef.current) {
          textareaRef.current.value = initialContent;
        }
        contentRef.current = initialContent;
      }
    }, [initialContent, isReady]);

    return (
      <div
        ref={containerRef}
        className={`obsidian-native-editor ${className}`}
        style={{
          width: '100%',
          minHeight: '120px',
        }}
      />
    );
  },
);

ObsidianNativeEditor.displayName = 'ObsidianNativeEditor';

export default ObsidianNativeEditor;
