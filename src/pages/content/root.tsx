import refreshOnUpdate from 'virtual:reload-on-update-in-view';

import { createRoot } from 'react-dom/client';
import Frame, { FrameContextConsumer } from 'react-frame-component';

import DomainNotes from './domain-notes';
import injectedStyle from './injected.css?inline';
import { SnackbarContentScript } from './snackbar';
import { getTime } from '@root/src/utils/date-time/get-time';
import { getWeekday } from '@root/src/utils/date-time/get-weekday';
import { getSpace } from '@root/src/services/chrome-storage/spaces';
import { ContentScriptContainerIds } from '@root/src/constants/app';
import { removeWWWPrefix } from '@root/src/utils/url/get-url-domain';
import { getNoteByDomain } from '@root/src/services/chrome-storage/notes';
import { getReadableDate } from '@root/src/utils/date-time/getReadableDate';
import { getAppSettings } from '@root/src/services/chrome-storage/settings';
import { getUserSelectionText, isValidURL, publishEvents } from '@root/src/utils';
import CommandPalette, { COMMAND_PALETTE_SIZE } from './command-palette/CommandPalette';
import { IMessageEventContentScript, ISearchFilters, ISpace, ITab, NoteBubblePos } from '../../types/global.types';

// development: refresh content page on update
refreshOnUpdate('pages/content');

// host page position to reset after closing command palette
let hostBackgroundPosition = 'auto';

// close command palette
const handleCloseCommandPalette = () => {
  const commandPaletteContainerEl = document.getElementById(ContentScriptContainerIds.COMMAND_PALETTE);

  if (!commandPaletteContainerEl) return;

  commandPaletteContainerEl.replaceChildren();
  commandPaletteContainerEl.remove();

  document.body.style.overflow = hostBackgroundPosition;
};

type AppendContainerProps = {
  activeSpace: ISpace;
  recentSites?: ITab[];
  selectedText?: string;
  selectedNoteId?: string;
  searchFilterPreferences?: ISearchFilters;
};

const appendCommandPaletteContainer = ({
  recentSites,
  activeSpace,
  selectedText,
  selectedNoteId,
  searchFilterPreferences,
}: AppendContainerProps) => {
  if (document.getElementById(ContentScriptContainerIds.COMMAND_PALETTE)) return;

  const userSelectedText = selectedText || getUserSelectionText();

  const commandPaletteContainer = document.createElement('div');

  commandPaletteContainer.id = ContentScriptContainerIds.COMMAND_PALETTE;

  commandPaletteContainer.style.height = '100vh';
  commandPaletteContainer.style.width = '100vw';
  commandPaletteContainer.style.zIndex = '2147483647';

  commandPaletteContainer.style.position = 'fixed';
  commandPaletteContainer.style.top = '0';
  commandPaletteContainer.style.left = '0';

  commandPaletteContainer.style.display = 'flex';
  commandPaletteContainer.style.alignItems = 'center';
  commandPaletteContainer.style.justifyContent = 'center';

  // prevent scrolling on host site
  hostBackgroundPosition = document.body.style.overflow;
  document.body.style.overflow = 'hidden';

  // append root react component for command palette
  document.body.append(commandPaletteContainer);

  commandPaletteContainer.addEventListener('click', () => {
    handleCloseCommandPalette();
  });

  createRoot(commandPaletteContainer).render(
    <Frame
      style={{
        // all: 'inherit',
        width: COMMAND_PALETTE_SIZE.MAX_WIDTH + 'px',
        height: COMMAND_PALETTE_SIZE.MAX_HEIGHT + 'px',
        border: 'none',
        borderRadius: '12px',
        colorScheme: 'none',
        background: 'none',
        marginTop: '-18px',
      }}
      id="fresh-tabs-command"
      title="fresh-tabs-iframe"
      allowTransparency={true}>
      <FrameContextConsumer>
        {context => {
          const style = context.document.createElement('style');
          style.innerHTML = injectedStyle;
          context.document.head.appendChild(style);
          context.document.body.style.background = 'none';
          return (
            <CommandPalette
              isOpenedInPopupWindow={false}
              recentSites={recentSites || []}
              activeSpace={activeSpace}
              onClose={handleCloseCommandPalette}
              userSelectedText={userSelectedText?.trim() || ''}
              selectedNoteId={selectedNoteId}
              searchFiltersPreference={searchFilterPreferences}
            />
          );
        }}
      </FrameContextConsumer>
    </Frame>,
  );
};

const handleShowSnackbar = (title: string) => {
  const root = document.createElement('div');

  root.id = ContentScriptContainerIds.SNACKBAR;

  document.body.appendChild(root);

  const shadowRoot = root.attachShadow({ mode: 'open' });

  const rootIntoShadow = document.createElement('div');

  rootIntoShadow.id = 'shadow-root';

  shadowRoot.appendChild(rootIntoShadow);

  createRoot(rootIntoShadow).render(<SnackbarContentScript title={title} />);
};

const showNotes = async (spaceId: string, position: NoteBubblePos, reRender = false) => {
  // do nothing if component already rendered
  if (document.getElementById(ContentScriptContainerIds.DOMAIN_NOTES) && !reRender) return;

  if (reRender) {
    const notesRootContainer = document.getElementById(ContentScriptContainerIds.DOMAIN_NOTES);
    if (notesRootContainer) {
      notesRootContainer.replaceChildren();
      notesRootContainer.remove();
    }
  }

  const siteDomain = removeWWWPrefix(location.hostname);

  const siteNotes = await getNoteByDomain(siteDomain);

  // render notes components
  const notesContainer = document.createElement('div');

  notesContainer.id = ContentScriptContainerIds.DOMAIN_NOTES;

  notesContainer.style.width = '80px';
  notesContainer.style.height = '80px';
  notesContainer.style.zIndex = '2147483647';
  notesContainer.style.position = 'fixed';
  notesContainer.style.bottom = '16px';
  notesContainer.style.userSelect = 'none';

  if (!position || position === 'bottom-right') {
    notesContainer.style.right = '20px';
  } else {
    notesContainer.style.left = '20px';
  }

  document.body.appendChild(notesContainer);

  // open selected note
  const handleOpenSelectedNote = async (noteId: string, noteSpaceId: string) => {
    const activeSpace = await getSpace(noteSpaceId);

    appendCommandPaletteContainer({ activeSpace, selectedNoteId: noteId });
  };

  // capture new note
  const handleCaptureNewNote = async () => {
    const activeSpace = await getSpace(spaceId);

    // set current date & time as quoted text for new note from note bubble
    const today = new Date();

    const selectedText = `${getWeekday(today)}  ${getReadableDate(today)} @ ${getTime(today)}`;

    appendCommandPaletteContainer({ activeSpace, selectedText });
  };

  // send delete note event to background

  const handleDeleteEvent = async (noteId: string) => {
    await publishEvents({ event: 'DELETE_NOTE', payload: { noteId, spaceId } });
  };

  const handleRemoveDomainNotesBubble = () => {
    const notesRootContainer = document.getElementById(ContentScriptContainerIds.DOMAIN_NOTES);
    if (!notesRootContainer) return;
    notesRootContainer.replaceChildren();
    notesRootContainer.remove();
  };

  createRoot(notesContainer).render(
    <Frame
      style={{
        border: 'none',
        colorScheme: 'none',
        background: 'none',
        width: '80px',
        height: '80px',
      }}
      id="fresh-tabs-site-notes"
      title="fresh-tabs-iframe-notes"
      allowTransparency={true}>
      <FrameContextConsumer>
        {context => {
          const style = context.document.createElement('style');
          style.innerHTML = injectedStyle;
          !context.document.head.appendChild(style);
          context.document.body.style.background = 'none';
          return (
            <DomainNotes
              domainNotes={siteNotes}
              onNoteClick={handleOpenSelectedNote}
              onNewNoteClick={handleCaptureNewNote}
              onDeleteNoteClick={handleDeleteEvent}
              onClose={handleRemoveDomainNotesBubble}
              position={position}
            />
          );
        }}
      </FrameContextConsumer>
    </Frame>,
  );
};

const appendOpenInTabBtnOverlay = () => {
  const overlayBtn = document.createElement('button');

  overlayBtn.id = 'fresh-tabs-button-overlay';

  overlayBtn.style.position = 'fixed';
  overlayBtn.style.zIndex = '9999999999';
  overlayBtn.style.top = '14px';
  overlayBtn.style.right = '16px';
  overlayBtn.style.padding = '10px 18px';
  overlayBtn.style.borderRadius = '4px';

  overlayBtn.style.fontFamily = 'system-ui';
  overlayBtn.style.fontSize = '12px';
  overlayBtn.style.fontWeight = '500';
  overlayBtn.style.color = '#151b21';
  overlayBtn.style.backgroundColor = '#eaeaea';
  overlayBtn.style.cursor = 'pointer';
  overlayBtn.style.border = '2px solid  #151b21';

  overlayBtn.innerText = 'Open in Tab ↗';

  overlayBtn.addEventListener('click', async () => {
    await publishEvents({
      event: 'OPEN_PREVIEW_LINK_AS_TAB',
      payload: {
        url: window.location.href,
      },
    });
  });

  document.body.appendChild(overlayBtn);
};

//  listen to events form background script
chrome.runtime.onMessage.addListener((msg, _sender, sendResponse) => {
  const event = msg as IMessageEventContentScript;

  const msgEvent = event.event;

  if (msgEvent === 'POPUP_PREVIEW_BUTTON_OVERLAY') {
    appendOpenInTabBtnOverlay();

    if (event?.payload?.windowId) {
      sessionStorage.setItem('activeWindowId', event.payload.windowId.toString());
    }

    // list for keyboard events for opening app in side panel

    document.body.addEventListener('keydown', async (ev: KeyboardEvent) => {
      if (ev.key === 's' && ev.metaKey) {
        ev.preventDefault();
        ev.stopPropagation();

        await publishEvents({
          event: 'OPEN_APP_SIDEPANEL',
          payload: { windowId: Number(sessionStorage.getItem('activeWindowId') || 0) },
        });
      }
    });

    // close the preview window on escape press
    document.body.addEventListener('keydown', (ev: KeyboardEvent) => {
      console.log('🚀 ~ document.body.addEventListener ~ ev:', ev);

      if (ev.key !== 'Escape') return;
      window.close();
    });

    sendResponse(true);
    return;
  }

  const { recentSites, activeSpace, snackbarMsg, searchFilterPreferences, notesBubblePos } = event.payload;

  console.log('🌅 ~ chrome.runtime.onMessage.addListener ~ msgEvent:', msgEvent);

  if (msgEvent === 'SHOW_COMMAND_PALETTE') {
    appendCommandPaletteContainer({
      recentSites,
      activeSpace,
      searchFilterPreferences,
    });
  }

  if (msgEvent === 'SHOW_DOMAIN_NOTES') {
    showNotes(activeSpace.id, notesBubblePos);
  }

  if (msgEvent === 'SHOW_SNACKBAR') {
    handleShowSnackbar(snackbarMsg);
    if (snackbarMsg.toLowerCase().startsWith('note')) {
      showNotes(activeSpace.id, notesBubblePos, true);
    }
  }

  sendResponse(true);
});

// show link preview
(async () => {
  //  check if the link previews is disabled
  const { linkPreview } = await getAppSettings();

  if (linkPreview.isDisabled) return;

  document.body.addEventListener('click', async ev => {
    const clickedEl = ev.target as HTMLElement;

    console.log('🌅 ~ clickedEl:', clickedEl);

    if (clickedEl.tagName !== 'A' && !clickedEl.closest('a')) return;

    let hrefLink =
      clickedEl.tagName === 'A' ? clickedEl.getAttribute('href') : clickedEl.closest('a').getAttribute('href') || '';

    hrefLink = !hrefLink.startsWith(window.location.origin) ? window.location.origin + hrefLink : hrefLink;

    // open link in preview window if user preference is set to Shift + Click and the shift key was pressed
    if (
      linkPreview.openTrigger === 'shift-click' &&
      isValidURL(hrefLink) &&
      !sessionStorage.getItem('activeWindowId')
    ) {
      if (!ev.shiftKey) return;
      ev.preventDefault();
      ev.stopPropagation();

      await publishEvents({
        event: 'OPEN_LINK_PREVIEW_POPUP',
        payload: {
          url: hrefLink,
        },
      });

      return;
    }

    const willOpenInNewTab =
      clickedEl.tagName === 'A'
        ? clickedEl.getAttribute('target') === '_blank'
        : clickedEl.closest('a').getAttribute('target') === '_blank' || false;

    const isInternalLink = new URL(hrefLink).hostname === new URL(location.href).hostname;

    if (!hrefLink || !isValidURL(hrefLink) || (isInternalLink && !willOpenInNewTab)) return;

    ev.preventDefault();
    ev.stopPropagation();

    // do not allow to open external links, if in preview mode
    if (sessionStorage.getItem('activeWindowId')) return;

    // send event to background script to create new popup window with the href link

    await publishEvents({
      event: 'OPEN_LINK_PREVIEW_POPUP',
      payload: {
        url: hrefLink,
      },
    });
  });
})();
