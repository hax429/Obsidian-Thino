import React, { useEffect, useState, useRef } from 'react';
import { Platform } from 'obsidian';
import RichTextToolbar from './RichTextToolbar';
import '../less/floating-toolbar.less';

interface FloatingToolbarProps {
  editorRef: React.RefObject<any>;
  onFormat: (format: string) => void;
  showAsBottom?: boolean; // Show as bottom toolbar on mobile
}

const FloatingToolbar: React.FC<FloatingToolbarProps> = ({ editorRef, onFormat, showAsBottom = false }) => {
  const [isVisible, setIsVisible] = useState(false);
  const [position, setPosition] = useState({ top: 0, left: 0 });
  const toolbarRef = useRef<HTMLDivElement>(null);
  const [isMobile, setIsMobile] = useState(Platform.isMobile);

  useEffect(() => {
    const checkSelection = () => {
      if (!editorRef.current) return;

      let selection: Selection | null = null;
      let selectedText = '';

      // Handle both CodeMirror and textarea
      if (editorRef.current.element) {
        const element = editorRef.current.element;

        if (element.tagName === 'TEXTAREA') {
          // For textarea
          const start = element.selectionStart;
          const end = element.selectionEnd;
          selectedText = element.value.substring(start, end);

          if (selectedText && selectedText.length > 0) {
            // Calculate position relative to textarea
            const rect = element.getBoundingClientRect();
            const scrollTop = element.scrollTop;

            setPosition({
              top: rect.top - 50 - scrollTop,
              left: rect.left + (rect.width / 2),
            });
            setIsVisible(true);
            return;
          }
        }
      }

      // For CodeMirror or regular selection
      selection = window.getSelection();
      selectedText = selection?.toString() || '';

      if (selectedText && selectedText.length > 0 && !showAsBottom) {
        const range = selection?.getRangeAt(0);
        if (range) {
          const rect = range.getBoundingClientRect();
          const toolbarWidth = toolbarRef.current?.offsetWidth || 300;

          setPosition({
            top: rect.top - 50 + window.scrollY,
            left: rect.left + (rect.width / 2) - (toolbarWidth / 2) + window.scrollX,
          });
          setIsVisible(true);
        }
      } else {
        setIsVisible(false);
      }
    };

    const handleSelectionChange = () => {
      setTimeout(checkSelection, 10);
    };

    const handleMouseUp = () => {
      setTimeout(checkSelection, 10);
    };

    document.addEventListener('selectionchange', handleSelectionChange);
    document.addEventListener('mouseup', handleMouseUp);

    return () => {
      document.removeEventListener('selectionchange', handleSelectionChange);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [editorRef, showAsBottom]);

  // On mobile, always show as bottom toolbar when there's a selection
  if (showAsBottom || isMobile) {
    return isVisible ? (
      <div className="floating-toolbar mobile-bottom">
        <RichTextToolbar onFormat={onFormat} />
      </div>
    ) : null;
  }

  // Desktop: floating toolbar
  return isVisible ? (
    <div
      ref={toolbarRef}
      className="floating-toolbar"
      style={{
        position: 'fixed',
        top: `${position.top}px`,
        left: `${position.left}px`,
        zIndex: 1000,
      }}
    >
      <RichTextToolbar onFormat={onFormat} />
    </div>
  ) : null;
};

export default FloatingToolbar;
