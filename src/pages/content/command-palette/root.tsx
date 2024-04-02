import { createRoot } from 'react-dom/client';
import Frame, { FrameContextConsumer } from 'react-frame-component';

import injectedStyle from './injected.css?inline';
import { SnackbarContentScript } from '../snackbar';
import refreshOnUpdate from 'virtual:reload-on-update-in-view';
import { CommandPaletteContainerId } from '@root/src/constants/app';
import CommandPalette, { COMMAND_PALETTE_SIZE } from './CommandPalette';
import { getUserSelectionText } from '@root/src/utils/getUserSelectedText';
import { IMessageEventContentScript, ISpace, ITab } from '../../types/global.types';

// development: refresh content page on update
refreshOnUpdate('pages/content');

// handles click for backdrop of command palette container iframe
const handleBackgroundCLick = () => {
  // close command palette
  handleClose();
};

// close command palette
const handleClose = () => {
  const commandPaletteContainerEl = document.getElementById(CommandPaletteContainerId);

  if (!commandPaletteContainerEl) return;

  commandPaletteContainerEl.replaceChildren();
  commandPaletteContainerEl.remove();

  document.body.style.overflow = 'auto';
};

type AppendContainerProps = {
  recentSites: ITab[];
  activeSpace: ISpace;
  selectedText?: string;
};

const appendCommandPaletteContainer = ({ recentSites, activeSpace, selectedText }: AppendContainerProps) => {
  if (document.getElementById(CommandPaletteContainerId)) return;

  const userSelectedText = selectedText || getUserSelectionText();

  const commandPaletteContainer = document.createElement('div') as HTMLDivElement;

  commandPaletteContainer.id = CommandPaletteContainerId;

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
  document.body.style.overflow = 'hidden';

  // append root react component for command palette
  document.body.append(commandPaletteContainer);

  commandPaletteContainer.addEventListener('click', handleBackgroundCLick);

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
              recentSites={recentSites}
              activeSpace={activeSpace}
              onClose={handleClose}
              userSelectedText={userSelectedText}
            />
          );
        }}
      </FrameContextConsumer>
    </Frame>,
  );
};

const handleShowSnackbar = (title: string) => {
  console.log('🚀 ~ handleShowSnackbar ~ title:', title);

  const root = (document as Document).createElement('div');

  (document as Document).body.appendChild(root);

  const shadowRoot = root.attachShadow({ mode: 'open' });

  const rootIntoShadow = document.createElement('div');

  rootIntoShadow.id = 'shadow-root';

  shadowRoot.appendChild(rootIntoShadow);

  createRoot(rootIntoShadow).render(<SnackbarContentScript title={title} />);
};

// TODO - testing - loads command palette on site load

// (async () => {
//   const activeSpace = await getSpace('148626a9faf');

//   console.log('🚀 ~ activeSpace:', activeSpace);

//   const selectedText = 'Transform your Gmail experience—say goodbye to clutter effortlessly';
//   appendCommandPaletteContainer({ activeSpace, selectedText, recentSites: [] });
// })();

chrome.runtime.onMessage.addListener((msg, _sender, sendResponse) => {
  const event = msg as IMessageEventContentScript;

  const { recentSites, activeSpace, snackbarMsg } = event.payload;

  console.log('🚀 ~ chrome.runtime.onMessage.addListener ~ snackbarMsg:', snackbarMsg);

  const msgEvent = event.event;

  if (msgEvent === 'SHOW_COMMAND_PALETTE') {
    appendCommandPaletteContainer({
      recentSites,
      activeSpace,
    });
  }
  if (msgEvent === 'SHOW_SNACKBAR') {
    handleShowSnackbar(snackbarMsg);
  }
  sendResponse(true);
});
