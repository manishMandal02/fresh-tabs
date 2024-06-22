import { useState, useEffect } from 'react';

import CommandPalette from '../content/command-palette';
import { getSpaceByWindow } from '@root/src/services/chrome-storage/spaces';
import { getAppSettings } from '@root/src/services/chrome-storage/settings';
import { getRecentlyVisitedSites } from '@root/src/services/chrome-history/history';

const CommandPalettePopup = () => {
  const [commandPaletteProps, setCommandPaletteProps] = useState(null);

  const getCommandPaletteData = async () => {
    const currentWindowId = Number(location.search.split('=')[1]) || 0;

    if (!currentWindowId) return;

    const recentSites = await getRecentlyVisitedSites();

    console.log('💰 ~ getCommandPaletteData ~ recentSites:', recentSites);

    const activeSpace = await getSpaceByWindow(currentWindowId);

    const preferences = await getAppSettings();

    setCommandPaletteProps({
      activeSpace,
      recentSites: recentSites || [],
      searchFilterPreferences: {
        searchBookmarks: preferences.includeBookmarksInSearch,
        searchNotes: preferences.includeNotesInSearch,
      },
    });
  };

  useEffect(() => {
    (async () => {
      await getCommandPaletteData();
    })();
  }, []);

  const onCloseCommandPalette = () => {
    setCommandPaletteProps(null);
  };

  return (
    <div className="relative h-full w-full bg-slate-900 overflow-hidden">
      <div className="mt-8">
        {commandPaletteProps?.activeSpace?.id ? (
          <CommandPalette
            onClose={onCloseCommandPalette}
            recentSites={commandPaletteProps.recentSites}
            activeSpace={commandPaletteProps.activeSpace}
            searchFiltersPreference={commandPaletteProps.searchFilterPreferences}
          />
        ) : (
          <div className="text-[18px] text-center text-rose-500 font-semibold">Event not received</div>
        )}
      </div>
    </div>
  );
};

export default CommandPalettePopup;
