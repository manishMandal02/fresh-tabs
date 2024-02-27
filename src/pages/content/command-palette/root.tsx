import { createRoot } from 'react-dom/client';
import refreshOnUpdate from 'virtual:reload-on-update-in-view';
import injectedStyle from './injected.css?inline';
import { CommandPaletteContainerId } from '@root/src/constants/app';
import { IMessageEventContentScript, ISpace, ITab } from '../../types/global.types';
import CommandPalette from '.';

refreshOnUpdate('pages/content');

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
};

const appendCommandPaletteContainer = ({ recentSites, activeSpace }: AppendContainerProps) => {
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
    <CommandPalette recentSites={recentSites} activeSpace={activeSpace} onClose={handleClose} />,
  );
};

chrome.runtime.onMessage.addListener((msg, _sender, sendResponse) => {
  console.log('🚀 ~ chrome.runtime.onMessage.addListener ~ msg:', msg);

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
