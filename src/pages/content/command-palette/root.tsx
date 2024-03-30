import { createRoot } from 'react-dom/client';
import Frame, { FrameContextConsumer } from 'react-frame-component';
import refreshOnUpdate from 'virtual:reload-on-update-in-view';
import injectedStyle from './injected.css?inline';
import { CommandPaletteContainerId } from '@root/src/constants/app';
import { IMessageEventContentScript, ISpace, ITab } from '../../types/global.types';
import { getUserSelectionText } from '@root/src/utils/getUserSelectedText';
import CommandPalette from './CommandPalette';

refreshOnUpdate('pages/content');

// close command palette
const handleClose = () => {
  const commandPaletteContainerEl = document.getElementById(CommandPaletteContainerId);

  if (!commandPaletteContainerEl) return;

  commandPaletteContainerEl.replaceChildren();
  commandPaletteContainerEl.remove();

  // close note capture command if opened
  const containerEl = document.getElementById('fresh-tabs-create-note-command-container');
  if (!containerEl) return;
  containerEl.replaceChildren();
  containerEl.remove();

  document.body.style.overflow = 'auto';
};

type AppendContainerProps = {
  recentSites: ITab[];
  activeSpace: ISpace;
};

const appendCommandPaletteContainer = ({ recentSites, activeSpace }: AppendContainerProps) => {
  if (document.getElementById(CommandPaletteContainerId)) return;

  const userSelectedText = getUserSelectionText();

  const commandPaletteContainer = document.createElement('div');

  commandPaletteContainer.id = CommandPaletteContainerId;

  commandPaletteContainer.style.height = '100vh';
  commandPaletteContainer.style.width = '100vw';
  commandPaletteContainer.style.position = 'fixed';
  commandPaletteContainer.style.top = '0px';
  commandPaletteContainer.style.left = '0px';
  commandPaletteContainer.style.zIndex = '2147483647';

  // prevent scrolling on host site
  document.body.style.overflow = 'hidden';

  // append root react component for command palette
  document.body.append(commandPaletteContainer);

  // const rootIntoShadow = document.createElement('div');

  // rootIntoShadow.id = 'shadow-root';

  // const shadowRoot = commandPaletteContainer.attachShadow({ mode: 'open' });

  // shadowRoot.appendChild(rootIntoShadow);

  // /** Inject styles into shadow dom */
  // const styleElement = document.createElement('style');
  // styleElement.innerHTML = injectedStyle;
  // shadowRoot.appendChild(styleElement);

  createRoot(commandPaletteContainer).render(
    <Frame className="!w-fit !h-[550px] !border-none !fixed top-[40%] !left-1/2 " style={{ all: 'inherit' }}>
      <FrameContextConsumer>
        {({ document }) => {
          const style = document.createElement('style');
          style.innerHTML = injectedStyle;
          document.head.appendChild(style);
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

chrome.runtime.onMessage.addListener((msg, _sender, sendResponse) => {
  const event = msg as IMessageEventContentScript;

  const { recentSites, activeSpace } = event.payload;

  if (msg.event === 'SHOW_COMMAND_PALETTE') {
    appendCommandPaletteContainer({
      recentSites,
      activeSpace,
    });
  }
  sendResponse(true);
});
