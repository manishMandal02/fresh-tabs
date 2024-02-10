import { createRoot } from 'react-dom/client';
import refreshOnUpdate from 'virtual:reload-on-update-in-view';
import injectedStyle from './injected.css?inline';
import { CommandPaletteContainerId } from '@root/src/constants/app';
import CommandPalette from './CommandPalette';
import { IMessageEventContentScript, ITab } from '../../types/global.types';

refreshOnUpdate('pages/content');

type AppendContainerProps = {
  recentSites: ITab[];
  topSites: ITab[];
};

const appendCommandPaletteContainer = ({ recentSites, topSites }: AppendContainerProps) => {
  if (document.getElementById(CommandPaletteContainerId)) return;

  const commandPaletteContainer = document.createElement('div');
  commandPaletteContainer.id = CommandPaletteContainerId;

  commandPaletteContainer.style.height = '100vh';
  commandPaletteContainer.style.width = '100vw';
  commandPaletteContainer.style.position = 'fixed';
  commandPaletteContainer.style.top = '0';
  commandPaletteContainer.style.left = '0';

  // append root react component for command palette
  document.body.append(commandPaletteContainer);
  const rootIntoShadow = document.createElement('div');

  rootIntoShadow.id = 'shadow-root';

  const shadowRoot = commandPaletteContainer.attachShadow({ mode: 'open' });

  shadowRoot.appendChild(rootIntoShadow);

  /** Inject styles into shadow dom */
  const styleElement = document.createElement('style');
  styleElement.innerHTML = injectedStyle;
  shadowRoot.appendChild(styleElement);

  createRoot(rootIntoShadow).render(<CommandPalette recentSites={recentSites} topSites={topSites} />);
};

chrome.runtime.onMessage.addListener((msg, _sender, sendResponse) => {
  console.log('🚀 ~ chrome.runtime.onMessage.addListener ~ msg:', msg);

  const event = msg as IMessageEventContentScript;

  const { recentSites, topSites } = event.payload;

  if (msg.event === 'SHOW_COMMAND_PALETTE') {
    appendCommandPaletteContainer({
      recentSites,
      topSites,
    });
  }

  sendResponse(true);
});
