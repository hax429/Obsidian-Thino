import React, { forwardRef, ReactNode, useCallback, useContext, useEffect, useImperativeHandle, useRef, useState as useReactState } from 'react';
import TinyUndo from 'tiny-undo';
import appContext from '../../stores/appContext';
import { storage } from '../../helpers/storage';
import useRefresh from '../../hooks/useRefresh';
import Only from '../common/OnlyWhen';
import '../../less/editor.less';
import ReactTextareaAutocomplete from '@webscopeio/react-textarea-autocomplete';
import { usedTags } from '../../obComponents/obTagSuggester';
import '../../less/suggest.less';
import { FocusOnEditor, SaveMemoButtonIcon, SaveMemoButtonLabel } from '../../memos';
import { getSuggestions } from '../../obComponents/obFileSuggester';
import { TFile } from 'obsidian';
import appStore from '../../stores/appStore';
import { t } from '../../translations/helper';
import useState from 'react-usestateref';
import { MEMOS_VIEW_TYPE } from '../../constants';
import { applyMarkdownFormat } from '../../helpers/editorFormatting';
import ObsidianNativeEditor from '../ObsidianNativeEditor';

type ItemProps = {
  entity: {
    char: string;
    name: string;
    file?: TFile;
  };
};

type LoadingProps = {
  data: Array<{ name: string; char: string }>;
};

export interface EditorRefActions {
  element: HTMLTextAreaElement;
  focus: FunctionType;
  insertText: (text: string) => void;
  setContent: (text: string) => void;
  getContent: () => string;
  applyFormat?: (format: string) => void;
}

interface EditorProps {
  className: string;
  inputerType: string;
  initialContent: string;
  placeholder: string;
  showConfirmBtn: boolean;
  showCancelBtn: boolean;
  tools?: ReactNode;
  onConfirmBtnClick: (content: string) => void;
  onCancelBtnClick: () => void;
  onContentChange: (content: string) => void;
}

//eslint-disable-next-line
const TItem = ({ entity: { name, char, file } }: ItemProps) => {
  return <div>{`${char}`}</div>;
};
//eslint-disable-next-line
const Loading = ({ data }: LoadingProps) => {
  return <div>Loading</div>;
};

export let editorInput: HTMLTextAreaElement;
let actualToken: string;

// eslint-disable-next-line react/display-name
const Editor = forwardRef((props: EditorProps, ref: React.ForwardedRef<EditorRefActions>) => {
  const {
    globalState: { useTinyUndoHistoryCache },
  } = useContext(appContext);
  const {
    className,
    inputerType,
    initialContent,
    placeholder,
    showConfirmBtn,
    showCancelBtn,
    onConfirmBtnClick: handleConfirmBtnClickCallback,
    onCancelBtnClick: handleCancelBtnClickCallback,
    onContentChange: handleContentChangeCallback,
  } = props;
  const editorRef = useRef<HTMLTextAreaElement>(null);
  const obsidianEditorRef = useRef<EditorRefActions>(null);
  const tinyUndoRef = useRef<TinyUndo | null>(null);
  const refresh = useRefresh();
  const [editorContent, setEditorContent] = useReactState(initialContent);

  const [, setHeight, currentHeightRef] = useState(0);
  // const [showDatePicker, toggleShowDatePicker] = useToggle(false);

  useEffect(() => {
    const leaves = app.workspace.getLeavesOfType(MEMOS_VIEW_TYPE);
    let memosHeight;
    let leafView;

    if (leaves.length > 0) {
      const leaf = leaves[0];
      leafView = leaf.view.containerEl;
      memosHeight = leafView.offsetHeight;
    } else {
      leafView = document;
      memosHeight = window.outerHeight;
    }

    setHeight(memosHeight);
  }, []);

  useEffect(() => {
    if (!editorRef.current) {
      return;
    }

    if (initialContent) {
      editorRef.current.value = initialContent;
      refresh();
    }
  }, []);

  useEffect(() => {
    if (useTinyUndoHistoryCache) {
      if (!editorRef.current) {
        return;
      }

      const { tinyUndoActionsCache, tinyUndoIndexCache } = storage.get(['tinyUndoActionsCache', 'tinyUndoIndexCache']);

      tinyUndoRef.current = new TinyUndo(editorRef.current, {
        interval: 5000,
        initialActions: tinyUndoActionsCache,
        initialIndex: tinyUndoIndexCache,
      });

      tinyUndoRef.current.subscribe((actions, index) => {
        storage.set({
          tinyUndoActionsCache: actions,
          tinyUndoIndexCache: index,
        });
      });

      return () => {
        tinyUndoRef.current?.destroy();
      };
    } else {
      tinyUndoRef.current?.destroy();
      tinyUndoRef.current = null;
      storage.remove(['tinyUndoActionsCache', 'tinyUndoIndexCache']);
    }
  }, [useTinyUndoHistoryCache]);

  useEffect(() => {
    if (editorRef.current) {
      editorRef.current.style.height = 'auto';
      editorRef.current.style.height = (editorRef.current.scrollHeight ?? 0) + 'px';
    }
  }, [editorRef.current?.value]);

  useImperativeHandle(
    ref,
    () => {
      // If using Obsidian native editor, delegate to its ref
      if (inputerType === 'memo' && obsidianEditorRef.current) {
        return obsidianEditorRef.current;
      }

      // Otherwise use the regular textarea ref
      return {
        element: editorRef.current as HTMLTextAreaElement,
        focus: () => {
          if (FocusOnEditor) {
            editorRef.current?.focus();
          }
        },
        insertText: (rawText: string) => {
          if (!editorRef.current) {
            return;
          }

          const prevValue = editorRef.current.value;
          editorRef.current.value =
            prevValue.slice(0, editorRef.current.selectionStart) +
            rawText +
            prevValue.slice(editorRef.current.selectionStart);
          handleContentChangeCallback(editorRef.current.value);
          refresh();
        },
        setContent: (text: string) => {
          if (editorRef.current) {
            editorRef.current.value = text;
            handleContentChangeCallback(editorRef.current.value);
            refresh();
          }
        },
        getContent: (): string => {
          return editorRef.current?.value ?? '';
        },
        applyFormat: (format: string) => {
          if (!editorRef.current) {
            return;
          }

          const text = editorRef.current.value;
          const start = editorRef.current.selectionStart;
          const end = editorRef.current.selectionEnd;

          const result = applyMarkdownFormat(text, start, end, format);

          editorRef.current.value = result.newText;
          editorRef.current.setSelectionRange(result.selectionStart, result.selectionEnd);
          editorRef.current.focus();
          handleContentChangeCallback(result.newText);
          refresh();
        },
      };
    },
    [inputerType],
  );

  const handleInsertTrigger = (event: { currentTrigger: string; item: any }) => {
    if (!editorRef.current) {
      return;
    }

    const { fileManager } = appStore.getState().dailyNotesState.app;

    if (event.currentTrigger === '#') {
      const prevValue = editorRef.current.value;
      let removeCharNum;
      if (actualToken !== null && actualToken !== undefined) {
        removeCharNum = actualToken.length;
      } else {
        removeCharNum = 0;
      }
      let behindCharNum = editorRef.current.selectionStart;
      for (let i = 0; i < prevValue.length; i++) {
        if (!/\s/g.test(prevValue[behindCharNum])) {
          behindCharNum++;
        }
      }

      editorRef.current.value =
        //eslint-disable-next-line
        prevValue.slice(0, editorRef.current.selectionStart - removeCharNum) +
        event.item.char +
        prevValue.slice(behindCharNum);
      handleContentChangeCallback(editorRef.current.value);
      refresh();
    } else if (event.currentTrigger === '[[') {
      const filePath = fileManager.generateMarkdownLink(event.item.file, event.item.file.path, '', '');

      const prevValue = editorRef.current.value;
      let removeCharNum;
      if (actualToken !== null && actualToken !== undefined) {
        if (filePath.contains('[[')) {
          removeCharNum = actualToken.length + 1;
        } else if (event.item.file.extension !== 'md') {
          removeCharNum = actualToken.length + 1;
        } else {
          removeCharNum = actualToken.length + 2;
        }
      } else {
        removeCharNum = 2;
      }
      let behindCharNum = editorRef.current.selectionStart;
      for (let i = 0; i < prevValue.length; i++) {
        if (!/\s/g.test(prevValue[behindCharNum])) {
          behindCharNum++;
        }
      }

      editorRef.current.value =
        //eslint-disable-next-line
        prevValue.slice(0, editorRef.current.selectionStart - removeCharNum) +
        filePath +
        prevValue.slice(behindCharNum);
      handleContentChangeCallback(editorRef.current.value);
      refresh();
    }
  };

  const handleEditorInput = useCallback(() => {
    handleContentChangeCallback(editorRef.current?.value ?? '');
    refresh();
  }, []);

  const handleEditorKeyDown = useCallback((event: React.KeyboardEvent<HTMLTextAreaElement>) => {
    event.stopPropagation();

    if (event.code === 'Enter') {
      if (event.metaKey || event.ctrlKey) {
        handleCommonConfirmBtnClick();
      }
    }
    refresh();
  }, []);

  const handleCommonConfirmBtnClick = useCallback(() => {
    let content = '';

    if (inputerType === 'memo' && obsidianEditorRef.current) {
      content = obsidianEditorRef.current.getContent();
      handleConfirmBtnClickCallback(content);
      obsidianEditorRef.current.setContent('');
      setEditorContent('');
    } else if (editorRef.current) {
      if (inputerType === 'memo') {
        editorRef.current.value = getEditorContentCache();
      }
      handleConfirmBtnClickCallback(editorRef.current.value);
      editorRef.current.value = '';
    }

    refresh();
    // After confirm btn clicked, tiny-undo should reset state(clear actions and index)
    tinyUndoRef.current?.resetState();
  }, [inputerType, handleConfirmBtnClickCallback]);

  const handleCommonCancelBtnClick = useCallback(() => {
    handleCancelBtnClickCallback();
  }, []);

  const getEditorContentCache = (): string => {
    return storage.get(['editorContentCache']).editorContentCache ?? '';
  };

  const getEditorContent = (): string => {
    // For Obsidian native editor, just return the cached content
    if (inputerType === 'memo') {
      return getEditorContentCache();
    }

    if (!editorRef.current) {
      return '';
    }

    editorRef.current.value = getEditorContentCache();
    // if( FocusOnEditor ){
    //   editorRef.current?.focus();
    // }

    return editorRef.current.value;
  };

  return (
    <div className={'common-editor-wrapper ' + className}>
      {inputerType === 'memo' ? (
        <ObsidianNativeEditor
          ref={obsidianEditorRef}
          className="common-editor-inputer scroll"
          placeholder={placeholder}
          initialContent={getEditorContent()}
          onContentChange={(content) => {
            setEditorContent(content);
            handleContentChangeCallback(content);
          }}
        />
      ) : (
        <textarea
          style={{
            minHeight: 48,
          }}
          className="common-editor-inputer scroll"
          rows={1}
          placeholder={placeholder}
          ref={editorRef}
          onInput={handleEditorInput}
          onKeyDown={handleEditorKeyDown}
        ></textarea>
      )}

      <div className="common-tools-wrapper">
        <div className="common-tools-container">
          <Only when={props.tools !== undefined}>{props.tools}</Only>
        </div>
        <div className="btns-container">
          <Only when={showCancelBtn}>
            <button className="action-btn cancel-btn" onClick={handleCommonCancelBtnClick}>
              {t('CANCEL EDIT')}
            </button>
          </Only>
          <Only when={showConfirmBtn}>
            <button
              className="action-btn confirm-btn"
              disabled={inputerType === 'memo' ? !editorContent : !editorRef.current?.value}
              onClick={handleCommonConfirmBtnClick}
            >
              {SaveMemoButtonLabel}
              <span className="icon-text">{SaveMemoButtonIcon}️</span>
            </button>
          </Only>
        </div>
      </div>
    </div>
  );
});

export default Editor;
