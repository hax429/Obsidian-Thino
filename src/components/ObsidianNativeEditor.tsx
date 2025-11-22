import React, { forwardRef, useEffect, useImperativeHandle, useRef, useState } from 'react';
import { Notice } from 'obsidian';
import { EditorView } from '@codemirror/view';
import { EditorState, Extension } from '@codemirror/state';
import { EditorRefActions } from './Editor/Editor';
import { applyMarkdownFormat } from '../helpers/editorFormatting';
import livePreviewViewPlugin from '../editor/live-preview';

interface ObsidianNativeEditorProps {
  className?: string;
  initialContent?: string;
  placeholder?: string;
  onContentChange?: (content: string) => void;
}

/**
 * ObsidianNativeEditor - Completely rewritten standalone CodeMirror 6 editor with full markdown support
 *
 * Features:
 * - Standalone CodeMirror 6 editor (doesn't depend on active MarkdownView)
 * - Live preview rendering for markdown elements
 * - Smart Tab key handling for list indentation
 * - Auto-continue lists (bullet points and numbered lists)
 * - Todo list checkbox support
 */
const ObsidianNativeEditor = forwardRef<EditorRefActions, ObsidianNativeEditorProps>(
  ({ className = '', initialContent = '', placeholder = '', onContentChange }, ref) => {
    const containerRef = useRef<HTMLDivElement>(null);
    const editorViewRef = useRef<EditorView | null>(null);
    const contentRef = useRef<string>(initialContent);
    const [isReady, setIsReady] = useState(false);

    // Debug notification
    console.log('[ObsidianNativeEditor] Initializing with BUILD_VERSION: v2025-11-22-15:30-MARKDOWN-SUPPORT');

    useImperativeHandle(
      ref,
      () => ({
        element: containerRef.current as any,
        focus: () => {
          if (editorViewRef.current) {
            editorViewRef.current.focus();
          }
        },
        insertText: (text: string) => {
          if (!editorViewRef.current) return;
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
          }
        },
        getContent: (): string => {
          if (editorViewRef.current) {
            return editorViewRef.current.state.doc.toString();
          }
          return contentRef.current;
        },
        applyFormat: (format: string) => {
          if (!editorViewRef.current) return;
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
        },
      }),
      [onContentChange],
    );

    useEffect(() => {
      const setupEditor = () => {
        if (!containerRef.current) return;

        console.log('[ObsidianNativeEditor] Setting up CodeMirror 6 editor...');

        try {
          // Create comprehensive markdown editing extensions
          const extensions: Extension[] = [
            // Line wrapping
            EditorView.lineWrapping,

            // Live preview plugin for markdown rendering
            livePreviewViewPlugin,

            // Placeholder support using contentAttributes
            placeholder ? EditorView.contentAttributes.of({
              'data-placeholder': placeholder,
              'aria-placeholder': placeholder,
            }) : [],

            // Update listener for content changes
            EditorView.updateListener.of((update) => {
              if (update.docChanged) {
                contentRef.current = update.state.doc.toString();
                if (onContentChange) {
                  onContentChange(contentRef.current);
                }
              }
            }),

            // Custom Tab and Enter key handling for markdown lists
            EditorView.domEventHandlers({
              keydown: (event, view) => {
                // Handle Tab for list indentation
                if (event.key === 'Tab') {
                  event.preventDefault();
                  const { state } = view;
                  const { from } = state.selection.main;
                  const line = state.doc.lineAt(from);
                  const lineText = line.text;

                  // Check if this is a list item or todo item
                  const isListItem = /^\s*([-*]|\d+\.)\s/.test(lineText);
                  const isTodoItem = /^\s*[-*]\s+\[[ xX]\]\s/.test(lineText);

                  if (isListItem || isTodoItem) {
                    // Handle list indentation
                    const indent = event.shiftKey ? -2 : 2;
                    let newText = lineText;

                    if (indent > 0) {
                      // Add indentation (Tab)
                      newText = '  ' + lineText;
                    } else {
                      // Remove indentation (Shift+Tab)
                      newText = lineText.replace(/^  /, '');
                    }

                    view.dispatch({
                      changes: { from: line.from, to: line.to, insert: newText },
                      selection: { anchor: from + indent },
                    });
                    return true;
                  } else {
                    // Insert 2 spaces for regular tabs
                    view.dispatch({
                      changes: { from, to: from, insert: '  ' },
                      selection: { anchor: from + 2 },
                    });
                    return true;
                  }
                }

                // Handle Enter key for auto-continuing lists
                if (event.key === 'Enter' && !event.shiftKey && !event.ctrlKey && !event.metaKey) {
                  const { state } = view;
                  const { from } = state.selection.main;
                  const line = state.doc.lineAt(from);
                  const lineText = line.text;

                  // Check for bullet list
                  const bulletMatch = lineText.match(/^(\s*)([-*])\s+(.*)$/);
                  if (bulletMatch) {
                    event.preventDefault();
                    const [, indent, bullet, content] = bulletMatch;

                    // If the line has no content (just the bullet), remove it and exit list mode
                    if (!content.trim()) {
                      view.dispatch({
                        changes: { from: line.from, to: line.to, insert: '' },
                        selection: { anchor: line.from },
                      });
                      return true;
                    }

                    // Continue the list on next line
                    const newLine = `\n${indent}${bullet} `;
                    view.dispatch({
                      changes: { from, to: from, insert: newLine },
                      selection: { anchor: from + newLine.length },
                    });
                    return true;
                  }

                  // Check for numbered list
                  const numberedMatch = lineText.match(/^(\s*)(\d+)\.\s+(.*)$/);
                  if (numberedMatch) {
                    event.preventDefault();
                    const [, indent, num, content] = numberedMatch;

                    // If the line has no content (just the number), remove it and exit list mode
                    if (!content.trim()) {
                      view.dispatch({
                        changes: { from: line.from, to: line.to, insert: '' },
                        selection: { anchor: line.from },
                      });
                      return true;
                    }

                    // Continue the list with incremented number
                    const nextNum = parseInt(num) + 1;
                    const newLine = `\n${indent}${nextNum}. `;
                    view.dispatch({
                      changes: { from, to: from, insert: newLine },
                      selection: { anchor: from + newLine.length },
                    });
                    return true;
                  }

                  // Check for todo list
                  const todoMatch = lineText.match(/^(\s*)([-*])\s+\[([ xX])\]\s+(.*)$/);
                  if (todoMatch) {
                    event.preventDefault();
                    const [, indent, bullet, , content] = todoMatch;

                    // If the line has no content (just the checkbox), remove it and exit list mode
                    if (!content.trim()) {
                      view.dispatch({
                        changes: { from: line.from, to: line.to, insert: '' },
                        selection: { anchor: line.from },
                      });
                      return true;
                    }

                    // Continue the todo list on next line (unchecked by default)
                    const newLine = `\n${indent}${bullet} [ ] `;
                    view.dispatch({
                      changes: { from, to: from, insert: newLine },
                      selection: { anchor: from + newLine.length },
                    });
                    return true;
                  }
                }

                return false;
              },
            }),

            // Custom theme/styling with placeholder support
            EditorView.theme({
              '&': {
                fontSize: '14px',
                border: '1px solid var(--background-modifier-border)',
                borderRadius: '6px',
                backgroundColor: 'var(--background-primary)',
              },
              '.cm-scroller': {
                fontFamily: 'var(--font-text)',
                lineHeight: '1.6',
                padding: '12px',
              },
              '.cm-content': {
                caretColor: 'var(--text-normal)',
                color: 'var(--text-normal)',
              },
              '.cm-content[data-placeholder]:empty::before': {
                content: 'attr(data-placeholder)',
                color: 'var(--text-faint)',
                fontStyle: 'italic',
                pointerEvents: 'none',
                position: 'absolute',
              },
              '.cm-line': {
                padding: '0 2px',
              },
              '&.cm-focused': {
                outline: 'none',
                borderColor: 'var(--background-modifier-border-focus)',
              },
              '.cm-activeLine': {
                backgroundColor: 'var(--background-primary-alt)',
              },
              '.cm-selectionBackground': {
                backgroundColor: 'var(--text-selection) !important',
              },
              '&.cm-focused .cm-selectionBackground': {
                backgroundColor: 'var(--text-selection) !important',
              },
              '.cm-cursor': {
                borderLeftColor: 'var(--text-normal)',
              },
            }),
          ];

          // Create the editor state
          const startState = EditorState.create({
            doc: initialContent,
            extensions,
          });

          // Create the editor view
          const view = new EditorView({
            state: startState,
            parent: containerRef.current,
          });

          editorViewRef.current = view;
          setIsReady(true);

          console.log('[ObsidianNativeEditor] CodeMirror 6 editor created successfully!');
          new Notice('✓ Markdown editor initialized (v2025-11-22-15:30)', 2000);

        } catch (error: any) {
          console.error('[ObsidianNativeEditor] Failed to create editor:', error);
          new Notice('Failed to initialize editor: ' + error.message, 5000);
        }
      };

      setupEditor();

      return () => {
        // Cleanup
        if (editorViewRef.current) {
          editorViewRef.current.destroy();
          editorViewRef.current = null;
        }
      };
    }, []); // Only run once on mount

    // Update content when initialContent changes
    useEffect(() => {
      if (isReady && editorViewRef.current && contentRef.current !== initialContent) {
        const view = editorViewRef.current;
        view.dispatch({
          changes: { from: 0, to: view.state.doc.length, insert: initialContent },
        });
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
