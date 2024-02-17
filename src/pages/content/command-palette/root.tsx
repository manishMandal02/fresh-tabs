import { createRoot } from 'react-dom/client';
import refreshOnUpdate from 'virtual:reload-on-update-in-view';
import injectedStyle from './injected.css?inline';
import { CommandPaletteContainerId } from '@root/src/constants/app';
import { IMessageEventContentScript, ISpace, ITab } from '../../types/global.types';
import CommandPalette from '.';

refreshOnUpdate('pages/content');

type AppendContainerProps = {
  recentSites: ITab[];
  topSites: ITab[];
  activeSpace: ISpace;
};

const appendCommandPaletteContainer = ({ recentSites, topSites, activeSpace }: AppendContainerProps) => {
  if (document.getElementById(CommandPaletteContainerId)) return;

  const commandPaletteContainer = document.createElement('div');

  console.log('🚀 ~ appendCommandPaletteContainer ~ commandPaletteContainer:', commandPaletteContainer);

  commandPaletteContainer.id = CommandPaletteContainerId;

  commandPaletteContainer.style.height = '100vh';
  commandPaletteContainer.style.width = '100vw';
  commandPaletteContainer.style.position = 'fixed';
  commandPaletteContainer.style.top = 'auto';
  commandPaletteContainer.style.left = 'auto';

  document.body.style.overflow = 'hidden';

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

  createRoot(rootIntoShadow).render(
    <CommandPalette recentSites={recentSites} topSites={topSites} activeSpace={activeSpace} />,
  );
};

chrome.runtime.onMessage.addListener((msg, _sender, sendResponse) => {
  console.log('🚀 ~ chrome.runtime.onMessage.addListener ~ msg:', msg);

  const event = msg as IMessageEventContentScript;

  const { recentSites, topSites, activeSpace } = event.payload;

  if (msg.event === 'SHOW_COMMAND_PALETTE') {
    appendCommandPaletteContainer({
      topSites,
      recentSites,
      activeSpace,
    });
  }
  sendResponse(true);
});
