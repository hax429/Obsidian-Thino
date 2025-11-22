import { TFile } from 'obsidian';
import appStore from '../stores/appStore';

const INTERNAL_MD_REG = /\[\[([^\]]+)\]\]/g;
const EXRERNAL_MD_REG = /\[([^\]]+)\]\((([^\]]+).md)\)/g;

const replaceMd = (internalLink: string, label: string): string => {
  const { metadataCache } = appStore.getState().dailyNotesState.app;

  const file = metadataCache.getFirstLinkpathDest(decodeURIComponent(internalLink), '');

  // let filePath;

  if (file instanceof TFile) {
    // filePath = file.path;
    if (label) {
      // console.log(`<a data-href="${internalLink}" data-type="link" data-filepath="${internalLink}" class="internal-link">${label}</a>`);
      return `<a data-href="${internalLink}" data-type="link" data-filepath="${internalLink}" class="internal-link">${label}</a>`;
    } else {
      return `<a data-href="${internalLink}" data-type="link" data-filepath="${internalLink}" class="internal-link">${internalLink}</a>`;
    }
  } else if (label) {
    return `<a data-href="${internalLink}" data-type="link" data-filepath="${internalLink}" class="internal-link is-unresolved">${label}</a>`;
  } else {
    return `<a data-href="${internalLink}" data-type="link" data-filepath="${internalLink}" class="internal-link is-unresolved">${internalLink}</a>`;
  }
};

const getContentFromInternalLink = (line: string) => /\[\[([^\]]+)\]\]/g.exec(line)?.[1];

const getLabelFromExternalLink = (line: string) => EXRERNAL_MD_REG.exec(line)?.[1];

const getContentFromExternalLink = (line: string) => /\[([^\]]+)\]\((([^\]]+).md)\)/g.exec(line)?.[3];

const parseHtmlToRawText = (htmlStr: string): string => {
  const tempEl = document.createElement('div');
  tempEl.className = 'memo-content-text';
  tempEl.innerHTML = htmlStr;
  const text = tempEl.innerText;
  return text;
};

const parseRawTextToHtml = (rawTextStr: string): string => {
  const htmlText = rawTextStr.replace(/\n/g, '<br>');
  return htmlText;
};

const encodeHtml = (htmlStr: string): string => {
  const t = document.createElement('div');
  t.textContent = htmlStr;
  return t.innerHTML;
};

export { encodeHtml, parseHtmlToRawText, parseRawTextToHtml };
