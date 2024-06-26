import { useState, useEffect } from 'react';

import CommandPalette from '../content/command-palette';
import { getSpaceByWindow } from '@root/src/services/chrome-storage/spaces';
import { getAppSettings } from '@root/src/services/chrome-storage/settings';
import { getRecentlyVisitedSites } from '@root/src/services/chrome-history/history';
import { publishEvents } from '@root/src/utils';

const CommandPalettePopup = () => {
  const [commandPaletteProps, setCommandPaletteProps] = useState(null);

  const getCommandPaletteData = async () => {
    const currentWindowId = Number(location.search.split('=')[1]) || 0;

    if (!currentWindowId) return;

    const recentSites = await getRecentlyVisitedSites();

    const activeSpace = await getSpaceByWindow(currentWindowId);

    const preferences = await getAppSettings();

    document.title = `${activeSpace?.emoji || ''}  ${activeSpace?.title || ''}`;

    setCommandPaletteProps({
      activeSpace,
      recentSites: recentSites || [],
      searchFilterPreferences: {
        searchBookmarks: preferences.includeBookmarksInSearch,
        searchNotes: preferences.includeNotesInSearch,
      },
    });

    // add event listener to listen to main app shortcut
    document.body.addEventListener('keydown', async ev => {
      if (ev.key === 's' && ev.metaKey) {
        ev.preventDefault();
        ev.stopPropagation();
        await publishEvents({ event: 'OPEN_APP_SIDEPANEL', payload: { windowId: currentWindowId } });
      }
    });
  };

  useEffect(() => {
    document.title = 'Command Palette';
    (async () => {
      await getCommandPaletteData();
    })();
  }, []);

  // TODO - improvement - check and have - active tab details (title, url) for note and other commands

  const onCloseCommandPalette = () => {
    setCommandPaletteProps(null);
    window.close();
  };

  return (
    <div className="relative h-full w-full bg-slate-900 overflow-hidden">
      <div className="mt-8">
        {commandPaletteProps?.activeSpace?.id ? (
          <CommandPalette
            isOpenedInPopupWindow={true}
            onClose={onCloseCommandPalette}
            recentSites={commandPaletteProps.recentSites}
            activeSpace={commandPaletteProps.activeSpace}
            searchFiltersPreference={commandPaletteProps.searchFilterPreferences}
          />
        ) : (
          <div className="text-[18px] text-center">.</div>
        )}
      </div>
    </div>
  );
};

export default CommandPalettePopup;
