import React from 'react';
import { Platform } from 'obsidian';
import Tag from '../icons/tag.svg?react';
import ImageSvg from '../icons/image.svg?react';
import JournalSvg from '../icons/journal.svg?react';
import TaskSvg from '../icons/checkbox-active.svg?react';
import VoiceRecorder from './VoiceRecorder';
import { formatShortcut, KeyboardShortcut } from '../hooks/useKeyboardShortcuts';
import { t } from '../translations/helper';
import '../less/quick-actions-toolbar.less';

interface QuickAction {
  id: string;
  icon: React.ReactNode;
  label: string;
  onClick: () => void;
  shortcut?: KeyboardShortcut;
  active?: boolean;
  className?: string;
}

interface QuickActionsToolbarProps {
  onTagClick: () => void;
  onImageClick: () => void;
  onListTaskToggle: () => void;
  onVoiceTranscription: (text: string) => void;
  onAudioRecorded: (file: File) => void;
  onFormatToggle: () => void;
  isListMode: boolean;
  showFormatToolbar: boolean;
}

const QuickActionsToolbar: React.FC<QuickActionsToolbarProps> = ({
  onTagClick,
  onImageClick,
  onListTaskToggle,
  onVoiceTranscription,
  onAudioRecorded,
  onFormatToggle,
  isListMode,
  showFormatToolbar,
}) => {
  const isMobile = Platform.isMobile;

  const shortcuts: Record<string, KeyboardShortcut> = {
    tag: { key: '#', ctrl: true, shift: true, description: 'Insert tag' } as KeyboardShortcut,
    image: { key: 'i', ctrl: true, shift: true, description: 'Upload image' } as KeyboardShortcut,
    listTask: { key: 'l', ctrl: true, shift: true, description: 'Toggle list/task' } as KeyboardShortcut,
    voice: { key: 'v', ctrl: true, shift: true, description: 'Voice recorder' } as KeyboardShortcut,
    format: { key: 't', ctrl: true, shift: true, description: 'Toggle formatting' } as KeyboardShortcut,
  };

  const actions: QuickAction[] = [
    {
      id: 'tag',
      icon: <Tag />,
      label: t('Add tag'),
      onClick: onTagClick,
      shortcut: shortcuts.tag,
      className: 'quick-action-tag',
    },
    {
      id: 'image',
      icon: <ImageSvg />,
      label: t('Upload image'),
      onClick: onImageClick,
      shortcut: shortcuts.image,
      className: 'quick-action-image',
    },
    {
      id: 'list-task',
      icon: isListMode ? <TaskSvg /> : <JournalSvg />,
      label: isListMode ? t('Switch to task') : t('Switch to list'),
      onClick: onListTaskToggle,
      shortcut: shortcuts.listTask,
      active: isListMode,
      className: 'quick-action-list-task',
    },
  ];

  return (
    <div className={`quick-actions-toolbar ${isMobile ? 'mobile' : 'desktop'}`}>
      <div className="quick-actions-group quick-actions-primary">
        {actions.map((action) => (
          <button
            key={action.id}
            className={`quick-action-btn ${action.className || ''} ${action.active ? 'active' : ''}`}
            onClick={action.onClick}
            title={`${action.label}${action.shortcut ? ` (${formatShortcut(action.shortcut)})` : ''}`}
            aria-label={action.label}
          >
            <span className="quick-action-icon">{action.icon}</span>
            {!isMobile && <span className="quick-action-label">{action.label}</span>}
            {!isMobile && action.shortcut && (
              <span className="quick-action-shortcut">{formatShortcut(action.shortcut)}</span>
            )}
          </button>
        ))}
      </div>

      <div className="quick-actions-group quick-actions-secondary">
        <div
          className="quick-action-btn quick-action-voice"
          title={`${t('Voice recorder')}${shortcuts.voice ? ` (${formatShortcut(shortcuts.voice)})` : ''}`}
        >
          <VoiceRecorder onTranscription={onVoiceTranscription} onAudioRecorded={onAudioRecorded} />
        </div>

        <button
          className={`quick-action-btn quick-action-format ${showFormatToolbar ? 'active' : ''}`}
          onClick={onFormatToggle}
          title={`${t('Toggle formatting toolbar')}${shortcuts.format ? ` (${formatShortcut(shortcuts.format)})` : ''}`}
          aria-label={t('Toggle formatting toolbar')}
        >
          <span className="quick-action-icon">Aa</span>
          {!isMobile && <span className="quick-action-label">{t('Format')}</span>}
          {!isMobile && shortcuts.format && (
            <span className="quick-action-shortcut">{formatShortcut(shortcuts.format)}</span>
          )}
        </button>
      </div>
    </div>
  );
};

export default QuickActionsToolbar;
