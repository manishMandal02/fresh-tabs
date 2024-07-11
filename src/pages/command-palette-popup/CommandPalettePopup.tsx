import { useState, useEffect } from 'react';

import { publishEvents } from '@root/src/utils';
import CommandPalette from '../content/command-palette';
import { ISearchFilters, ISpace } from '@root/src/types/global.types';
import { getSpaceByWindow } from '@root/src/services/chrome-storage/spaces';
import { getAppSettings } from '@root/src/services/chrome-storage/settings';

const CommandPalettePopup = () => {
  const [commandPaletteProps, setCommandPaletteProps] = useState<{
    activeSpace: ISpace;
    groupId: number;
    searchFilterPreferences: ISearchFilters;
  }>(null);

  const getCommandPaletteData = async () => {
    const currentWindowId = Number(location.search.split('=')[1]) || 0;

    if (!currentWindowId) return;

    const activeSpace = await getSpaceByWindow(currentWindowId);

    const preferences = await getAppSettings();

    document.title = `${activeSpace?.emoji || ''}  ${activeSpace?.title || ''}`;

    const [activeTab] = await chrome.tabs.query({
      active: true,
      currentWindow: true,
    });

    setCommandPaletteProps({
      activeSpace,
      groupId: activeTab.groupId || 0,
      searchFilterPreferences: {
        searchBookmarks: preferences.cmdPalette.includeBookmarksInSearch,
        searchNotes: preferences.cmdPalette.includeNotesInSearch,
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
      <div className="mt-6">
        {commandPaletteProps?.activeSpace?.id ? (
          <CommandPalette
            groupId={commandPaletteProps.groupId}
            isOpenedInPopupWindow={true}
            onClose={onCloseCommandPalette}
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
