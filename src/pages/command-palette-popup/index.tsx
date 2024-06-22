import { createRoot } from 'react-dom/client';
import refreshOnUpdate from 'virtual:reload-on-update-in-view';

import '@pages/command-palette-popup/index.css';
import CommandPalettePopup from '@root/src/pages/command-palette-popup/CommandPalettePopup';

// dev-only - refreshes the page
refreshOnUpdate('pages/command-palette-popup');

function init() {
  const newTAbContainer = document.querySelector('#command-palette-popup-container');
  if (!newTAbContainer) {
    throw new Error('Can not find #command-palette-popup-container');
  }
  const root = createRoot(newTAbContainer);
  root.render(<CommandPalettePopup />);
}

init();
