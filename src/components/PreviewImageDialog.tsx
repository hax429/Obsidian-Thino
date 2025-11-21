import React, { useEffect, useRef, useState } from 'react';
import utils from '../helpers/utils';
import { showDialog } from './Dialog';
import '../less/preview-image-dialog.less';
import appStore from '../stores/appStore';
import Close from '../icons/close.svg?component';
import { Notice, Platform } from 'obsidian';
import { t } from '../translations/helper';
import { TransformWrapper, TransformComponent, ReactZoomPanPinchRef } from 'react-zoom-pan-pinch';

interface Props extends DialogProps {
  imgUrl: string;
  filepath?: string;
}

const PreviewImageDialog: React.FC<Props> = ({ destroy, imgUrl, filepath }: Props) => {
  const transformRef = useRef<ReactZoomPanPinchRef>(null);
  const [imageLoaded, setImageLoaded] = useState<boolean>(false);
  const [imageError, setImageError] = useState<boolean>(false);
  const { vault } = appStore.getState().dailyNotesState.app;

  useEffect(() => {
    utils.getImageSize(imgUrl).then(({ width }) => {
      if (width !== 0) {
        setImageLoaded(true);
      } else {
        setImageError(true);
      }
    });
  }, []);

  const handleCloseBtnClick = () => {
    destroy();
  };

  const handleZoomIn = () => {
    transformRef.current?.zoomIn(0.3);
  };

  const handleZoomOut = () => {
    transformRef.current?.zoomOut(0.3);
  };

  const handleResetTransform = () => {
    transformRef.current?.resetTransform();
  };

  const convertBase64ToBlob = (base64: string, type: string) => {
    var bytes = window.atob(base64);
    var ab = new ArrayBuffer(bytes.length);
    var ia = new Uint8Array(ab);
    for (var i = 0; i < bytes.length; i++) {
      ia[i] = bytes.charCodeAt(i);
    }
    return new Blob([ab], { type: type });
  };

  const copyImageToClipboard = async () => {
    try {
      if ((filepath === null || filepath === undefined) && imgUrl !== null) {
        const myBase64 = imgUrl.split('base64,')[1];
        const blobInput = convertBase64ToBlob(myBase64, 'image/png');
        const clipboardItemInput = new ClipboardItem({ 'image/png': blobInput });
        await window.navigator['clipboard'].write([clipboardItemInput]);
        new Notice(t('Send to clipboard successfully'));
      } else {
        const buffer = await vault.adapter.readBinary(filepath);
        const arr = new Uint8Array(buffer);

        const blob = new Blob([arr], { type: 'image/png' });

        const item = new ClipboardItem({ 'image/png': blob });
        await window.navigator['clipboard'].write([item]);
        new Notice(t('Send to clipboard successfully'));
      }
    } catch (error) {
      console.error('Failed to copy image:', error);
      new Notice(t('Failed to copy image to clipboard'));
    }
  };

  return (
    <>
      <button className="btn close-btn" onClick={handleCloseBtnClick}>
        <Close className="icon-img" />
      </button>

      <div className="img-container internal-embed image-embed is-loaded">
        {!imageLoaded && !imageError && (
          <span className="loading-text">{t('Image is loading...')}</span>
        )}
        {imageError && (
          <span className="loading-text">{t('😟 Cannot load image, image link maybe broken')}</span>
        )}
        {imageLoaded && (
          <TransformWrapper
            ref={transformRef}
            initialScale={1}
            minScale={0.3}
            maxScale={8}
            centerOnInit={true}
            wheel={{
              step: 0.1,
            }}
            pinch={{
              step: 5,
            }}
            panning={{
              disabled: false,
              velocityDisabled: false,
            }}
            doubleClick={{
              disabled: false,
              mode: 'reset',
            }}
          >
            <TransformComponent
              wrapperClass="transform-wrapper"
              contentClass="transform-content"
            >
              <img
                src={imgUrl}
                alt="Preview"
                style={{
                  maxWidth: '100%',
                  maxHeight: '100%',
                  display: 'block',
                }}
              />
            </TransformComponent>
          </TransformWrapper>
        )}
      </div>

      <div className="action-btns-container">
        <button className="btn" onClick={handleZoomOut} title={t('Zoom out')}>
          ➖
        </button>
        <button className="btn" onClick={handleZoomIn} title={t('Zoom in')}>
          ➕
        </button>
        <button className="btn" onClick={handleResetTransform} title={t('Reset zoom')}>
          ⭕
        </button>
        <button className="btn" onClick={copyImageToClipboard} title={t('Copy to clipboard')}>
          📄
        </button>
      </div>
    </>
  );
};

export default function showPreviewImageDialog(imgUrl: string, filepath?: string): void {
  if (filepath) {
    showDialog(
      {
        className: 'preview-image-dialog',
      },
      PreviewImageDialog,
      { imgUrl, filepath },
    );
  } else {
    showDialog(
      {
        className: 'preview-image-dialog',
      },
      PreviewImageDialog,
      { imgUrl },
    );
  }
}
