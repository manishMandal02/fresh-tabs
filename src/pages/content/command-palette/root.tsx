import { createRoot } from 'react-dom/client';
import CommandPalette from './CommandPalette';
import refreshOnUpdate from 'virtual:reload-on-update-in-view';
import injectedStyle from './injected.css?inline';

refreshOnUpdate('pages/content');

const commandPaletteContainer = document.createElement('div');
commandPaletteContainer.id = 'fresh-tabs-command-palette-container';

commandPaletteContainer.style.height = '100vh';
commandPaletteContainer.style.width = '100vw';
commandPaletteContainer.style.position = 'fixed';
commandPaletteContainer.style.top = '0';
commandPaletteContainer.style.left = '0';

chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  console.log('🚀 ~ chrome.runtime.onMessage.addListener ~ msg:', msg);

  if (msg.event === 'SHOW_COMMAND_PALETTE') {
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

    createRoot(rootIntoShadow).render(<CommandPalette />);
  }

  sendResponse(true);
});
