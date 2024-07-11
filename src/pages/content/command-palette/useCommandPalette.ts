import { Pencil1Icon, PlusIcon } from '@radix-ui/react-icons';
import { useState, useCallback } from 'react';
import { useFrame } from 'react-frame-component';

import { useCommand } from './command/useCommand';
import { CommandType } from '@root/src/constants/app';
import { getTime } from '@root/src/utils/date-time/get-time';
import { publishEvents } from '../../../utils/publish-events';
import { ICommand, ISpace } from '../../../types/global.types';
import { getAllSpaces } from '@root/src/services/chrome-storage/spaces';
import { getReadableDate } from '@root/src/utils/date-time/getReadableDate';
import { naturalLanguageToDate } from '../../../utils/date-time/naturalLanguageToDate';
import { useHotkeys } from 'react-hotkeys-hook';
import { getAllGroups, getGroup } from '@root/src/services/chrome-storage/groups';

// default suggested time for snooze tab command
const defaultSuggestedSnoozeTimeLabels = [
  'After 2 hours',
  'Tomorrow at same time',
  'Tomorrow at 4pm',
  'Tuesday 2pm',
  'After 1 week',
];

export const DEFAULT_SEARCH_PLACEHOLDER = 'Search notes, bookmarks, history, commands...';

type UseCommandPaletteProps = {
  activeSpace: ISpace;
  groupId: number;
  onClose: () => void;
  isOpenedInPopupWindow: boolean;
};

export const useCommandPalette = ({ activeSpace, groupId, onClose, isOpenedInPopupWindow }: UseCommandPaletteProps) => {
  // local state
  // search/commands suggestions
  const [suggestedCommands, setSuggestedCommands] = useState<ICommand[]>([]);

  // search query
  const [searchQuery, setSearchQuery] = useState('');
  const { document: iFrameDoc } = useFrame();

  // save suggestedCommands for sub commands if search query is not empty for during sub command action
  // we can revert to this suggested commands if search query is empty again
  const [suggestedCommandsForSubCommand, setSuggestedCommandsForSubCommand] = useState<ICommand[]>([]);

  // current focused command index
  const [subCommand, setSubCommand] = useState<CommandType | null>(null);

  const [searchQueryPlaceholder, setSearchQueryPlaceholder] = useState(DEFAULT_SEARCH_PLACEHOLDER);

  // current focused command index
  const [focusedCommandIndex, setFocusedCommandIndex] = useState(1);

  const { getCommandIcon } = useCommand();

  // close command palette
  const handleCloseCommandPalette = useCallback(() => {
    // remove parent container
    onClose();
  }, [onClose]);

  // handle select command
  const handleSelectCommand = useCallback(
    async (index?: number, isMetaKeyPressed = false) => {
      const activeIndex = index || focusedCommandIndex;

      const focusedCommand = suggestedCommands.find(cmd => cmd.index === activeIndex);

      if (!focusedCommand?.type) return;

      switch (focusedCommand.type) {
        case CommandType.SwitchTab: {
          await publishEvents({
            event: 'SWITCH_TAB',
            payload: {
              isOpenedInPopupWindow,
              activeSpace,
              shouldCloseCurrentTab: isMetaKeyPressed,
              tabId: focusedCommand.metadata as number,
            },
          });

          handleCloseCommandPalette();
          break;
        }

        case CommandType.SwitchSpace: {
          await publishEvents({
            event: 'SWITCH_SPACE',
            payload: {
              spaceId: focusedCommand.metadata as string,
              shouldOpenInNewWindow: isMetaKeyPressed,
            },
          });
          handleCloseCommandPalette();

          break;
        }

        case CommandType.NewSpace: {
          if (!subCommand) {
            setSuggestedCommandsForSubCommand([]);
            setSearchQueryPlaceholder('Enter space title...');
            setSubCommand(CommandType.NewSpace);
            setSuggestedCommands([
              {
                label: 'Create & switch space',
                type: CommandType.NewSpace,
                index: 1,
                icon: PlusIcon,
              },
            ]);

            setFocusedCommandIndex(1);
          } else {
            if (searchQuery?.length < 3) return;
            await publishEvents({
              event: 'NEW_SPACE',
              payload: { activeSpace, isOpenedInPopupWindow, spaceTitle: searchQuery },
            });
            handleCloseCommandPalette();
          }
          break;
        }

        case CommandType.AddToSpace: {
          if (!subCommand) {
            const allSpaces = await getAllSpaces();

            const addToSpaceCommands = allSpaces
              .filter(s => s.id !== activeSpace.id)
              .map<ICommand>((space, idx) => ({
                label: space.title,
                type: CommandType.AddToSpace,
                index: idx + 1,
                icon: space.theme,
                metadata: space.id,
              }));

            setSuggestedCommandsForSubCommand(addToSpaceCommands);
            setSubCommand(CommandType.AddToSpace);
            setSearchQueryPlaceholder('Select group');
            setFocusedCommandIndex(1);
          } else {
            await publishEvents({
              event: 'MOVE_TAB_TO_SPACE',
              payload: {
                activeSpace,
                isOpenedInPopupWindow,
                spaceId: focusedCommand.metadata as string,
              },
            });
            handleCloseCommandPalette();
          }
          break;
        }

        case CommandType.NewNote: {
          // set sub command
          // note: handing create/save notes is done in create note (create-note > CreateNote.tsx)
          setSubCommand(CommandType.NewNote);
          break;
        }

        case CommandType.Note: {
          // open note
          setSubCommand(CommandType.NewNote);
          setSuggestedCommands([focusedCommand]);
          break;
        }

        case CommandType.WebSearch: {
          await publishEvents({
            event: 'WEB_SEARCH',
            payload: {
              activeSpace,
              isOpenedInPopupWindow,
              searchQuery,
              shouldOpenInNewTab: isMetaKeyPressed,
            },
          });
          handleCloseCommandPalette();
          break;
        }

        case CommandType.Link: {
          await publishEvents({
            event: 'GO_TO_URL',
            payload: {
              activeSpace,
              isOpenedInPopupWindow,
              url: focusedCommand.metadata as string,
              shouldOpenInNewTab: isMetaKeyPressed,
            },
          });
          handleCloseCommandPalette();
          break;
        }

        case CommandType.DiscardTabs: {
          await publishEvents({ event: 'DISCARD_TABS', payload: { shouldIgnoreDiscardWhitelist: isMetaKeyPressed } });
          handleCloseCommandPalette();
          break;
        }

        case CommandType.WhitelistDomainForAutoDiscard: {
          await publishEvents({
            event: 'WHITE_LIST_DOMAIN_FOR_AUTO_DISCARD',
            payload: { activeSpace, isOpenedInPopupWindow },
          });
          handleCloseCommandPalette();
          break;
        }

        case CommandType.SnoozeTab: {
          if (!subCommand && !focusedCommand.metadata) {
            const snoozeTabSubCommands = defaultSuggestedSnoozeTimeLabels.map<ICommand>((label, idx) => ({
              index: idx + 1,
              label: label,
              alias: `${getReadableDate(naturalLanguageToDate(label))} @ ${getTime(naturalLanguageToDate(label))}`,
              type: CommandType.SnoozeTab,
              metadata: naturalLanguageToDate(label),
              icon: getCommandIcon(CommandType.SnoozeTab).Icon,
            }));

            setSubCommand(CommandType.SnoozeTab);
            setSuggestedCommandsForSubCommand(snoozeTabSubCommands);
            setSuggestedCommands(snoozeTabSubCommands);
            setSearchQueryPlaceholder('Tomorrow @ 2pm...');
            setFocusedCommandIndex(1);
          } else {
            await publishEvents({
              event: 'SNOOZE_TAB',
              payload: {
                activeSpace,
                isOpenedInPopupWindow,
                spaceId: activeSpace.id,
                snoozedUntil: focusedCommand.metadata as number,
              },
            });

            handleCloseCommandPalette();
          }
          break;
        }

        case CommandType.CloseTab: {
          await publishEvents({ event: 'CLOSE_TAB', payload: { activeSpace, isOpenedInPopupWindow } });
          handleCloseCommandPalette();
          break;
        }

        // group commands
        case CommandType.NewGroup: {
          if (!subCommand) {
            setSuggestedCommandsForSubCommand([]);
            setSearchQueryPlaceholder('Enter group name...');
            setSubCommand(CommandType.NewGroup);
            setSuggestedCommands([
              {
                label: 'Create new tab group',
                type: CommandType.NewGroup,
                index: 1,
                icon: PlusIcon,
              },
            ]);

            setFocusedCommandIndex(1);
          } else {
            if (searchQuery?.length < 1) return;
            await publishEvents({
              event: 'NEW_GROUP',
              payload: {
                activeSpace,
                isOpenedInPopupWindow,
                groupName: searchQuery,
              },
            });
            handleCloseCommandPalette();
          }
          break;
        }

        case CommandType.AddToGroup: {
          if (!subCommand) {
            const allGroups = await getAllGroups(activeSpace.id);

            const addToGroupCommands = allGroups.map<ICommand>((group, idx) => ({
              label: group.name,
              type: CommandType.AddToGroup,
              index: idx + 1,
              icon: group.theme,
              metadata: group.id,
            }));

            setSuggestedCommandsForSubCommand(addToGroupCommands);
            setSubCommand(CommandType.AddToGroup);
            setSearchQueryPlaceholder('Select group');
            setFocusedCommandIndex(1);
          } else {
            await publishEvents({
              event: 'ADD_TO_GROUP',
              payload: {
                activeSpace,
                isOpenedInPopupWindow,
                groupId: focusedCommand.metadata as number,
              },
            });
            handleCloseCommandPalette();
          }
          break;
        }

        case CommandType.RenameGroup: {
          if (!subCommand) {
            const group = await getGroup(activeSpace.id, groupId);

            setSuggestedCommandsForSubCommand([]);
            setSearchQueryPlaceholder(group?.name || 'Enter new name...');
            setSubCommand(CommandType.RenameGroup);
            setSuggestedCommands([
              {
                label: 'Rename group',
                type: CommandType.RenameGroup,
                index: 1,
                icon: Pencil1Icon,
              },
            ]);

            setFocusedCommandIndex(1);
          } else {
            if (searchQuery?.length < 1) return;
            await publishEvents({
              event: 'RENAME_GROUP',
              payload: {
                groupId,
                activeSpace,
                isOpenedInPopupWindow,
                groupName: searchQuery,
              },
            });
            handleCloseCommandPalette();
          }
          break;
        }

        // side panel commands
        case CommandType.OpenSidePanel: {
          await publishEvents({
            event: 'OPEN_APP_SIDEPANEL',
            payload: { isOpenedInPopupWindow, windowId: activeSpace.windowId },
          });
          handleCloseCommandPalette();
          break;
        }
        case CommandType.OpenNotificationsModal: {
          await publishEvents({
            event: 'OPEN_APP_SIDEPANEL',
            payload: { isOpenedInPopupWindow, windowId: activeSpace.windowId, openSidePanelModal: 'notifications' },
          });
          handleCloseCommandPalette();
          break;
        }
        case CommandType.OpenPreferencesModal: {
          await publishEvents({
            event: 'OPEN_APP_SIDEPANEL',
            payload: { isOpenedInPopupWindow, windowId: activeSpace.windowId, openSidePanelModal: 'preferences' },
          });
          handleCloseCommandPalette();
          break;
        }
        case CommandType.OpenSnoozedTabsModal: {
          await publishEvents({
            event: 'OPEN_APP_SIDEPANEL',
            payload: { isOpenedInPopupWindow, windowId: activeSpace.windowId, openSidePanelModal: 'snoozed-tabs' },
          });
          handleCloseCommandPalette();
          break;
        }
        case CommandType.OpenSpaceHistoryModal: {
          await publishEvents({
            event: 'OPEN_APP_SIDEPANEL',
            payload: { isOpenedInPopupWindow, windowId: activeSpace.windowId, openSidePanelModal: 'space-history' },
          });
          handleCloseCommandPalette();
          break;
        }
      }

      setSearchQuery('');
    },
    [
      groupId,
      subCommand,
      searchQuery,
      activeSpace,
      getCommandIcon,
      suggestedCommands,
      focusedCommandIndex,
      isOpenedInPopupWindow,
      handleCloseCommandPalette,
    ],
  );

  // on escape pressed
  useHotkeys(
    'escape',
    () => {
      handleCloseCommandPalette();
    },
    [handleCloseCommandPalette],
    { enableOnFormTags: true, document: iFrameDoc, preventDefault: true },
  );

  // on tab pressed
  useHotkeys(
    'tab',
    async () => {
      await handleSelectCommand(null);
    },
    [handleSelectCommand],
    { enableOnFormTags: true, document: iFrameDoc, preventDefault: true },
  );
  // on tab + enter pressed
  useHotkeys(
    'tab+enter',
    async () => {
      await handleSelectCommand(null);
    },
    [handleSelectCommand],
    { enableOnFormTags: true, document: iFrameDoc, preventDefault: true },
  );

  // enter pressed
  useHotkeys(
    'enter',
    async () => {
      await handleSelectCommand(null);
    },
    [handleSelectCommand],
    { enableOnFormTags: true, document: iFrameDoc },
  );

  // cmd + enter pressed
  useHotkeys(
    'mod+enter',
    async () => {
      await handleSelectCommand(null, true);
    },
    [handleSelectCommand],
    { enableOnFormTags: true, document: iFrameDoc },
  );

  // cmd + arrow up pressed - go to top
  useHotkeys(
    'mod+ArrowUp',
    () => {
      if (focusedCommandIndex < 2) {
        setFocusedCommandIndex(suggestedCommands.length);
        return;
      }

      setFocusedCommandIndex(1);
    },
    [suggestedCommands, focusedCommandIndex],
    { enableOnFormTags: true, document: iFrameDoc },
  );
  // arrow up pressed
  useHotkeys(
    'ArrowUp',
    () => {
      if (focusedCommandIndex < 2) {
        setFocusedCommandIndex(suggestedCommands.length);
        return;
      }

      setFocusedCommandIndex(prev => prev - 1);
    },
    [suggestedCommands, focusedCommandIndex],
    { enableOnFormTags: true, document: iFrameDoc },
  );

  // cmd + arrow down pressed - go to bottom
  useHotkeys(
    'mod+ArrowDown',
    () => {
      if (focusedCommandIndex >= suggestedCommands.length) {
        setFocusedCommandIndex(1);
        return;
      }
      setFocusedCommandIndex(suggestedCommands.length);
    },
    [suggestedCommands, focusedCommandIndex],
    { enableOnFormTags: true, document: iFrameDoc },
  );
  // arrow down pressed
  useHotkeys(
    'ArrowDown',
    () => {
      if (focusedCommandIndex >= suggestedCommands.length) {
        setFocusedCommandIndex(1);
        return;
      }
      setFocusedCommandIndex(prev => prev + 1);
    },
    [suggestedCommands, focusedCommandIndex],
    { enableOnFormTags: true, document: iFrameDoc },
  );

  return {
    handleSelectCommand,
    suggestedCommands,
    searchQueryPlaceholder,
    subCommand,
    searchQuery,
    setSearchQuery,
    setSubCommand,
    suggestedCommandsForSubCommand,
    setSuggestedCommands,
    handleCloseCommandPalette,
    setFocusedCommandIndex,
    focusedCommandIndex,
    setSuggestedCommandsForSubCommand,
    setSearchQueryPlaceholder,
  };
};
