import { PlusIcon } from '@radix-ui/react-icons';
import { useState, useCallback, useMemo } from 'react';

import { useCommand } from './command/useCommand';
import { CommandType } from '@root/src/constants/app';
import { ICommand, ISpace } from '../../types/global.types';
import { publishEvents } from '../../../utils/publish-events';
import { getAllSpaces } from '@root/src/services/chrome-storage/spaces';
import { useKeyShortcuts } from '../../sidepanel/hooks/useKeyShortcuts';
import { naturalLanguageToDate } from '../../../utils/date-time/naturalLanguageToDate';
import { getReadableDate } from '@root/src/utils/date-time/getReadableDate';
import { getTime } from '@root/src/utils/date-time/get-time';

type UseCommandPaletteProps = {
  activeSpace: ISpace;
  modalRef: React.RefObject<HTMLDialogElement>;
  onClose: () => void;
};

export const useCommandPalette = ({ activeSpace, modalRef, onClose }: UseCommandPaletteProps) => {
  // local state
  // search/commands suggestions
  const [suggestedCommands, setSuggestedCommands] = useState<ICommand[]>([]);

  // search query
  const [searchQuery, setSearchQuery] = useState('');

  // save suggestedCommands for sub commands if search query is not empty for during sub command action
  // we can revert to this suggested commands if search query is empty again
  const [suggestedCommandsForSubCommand, setSuggestedCommandsForSubCommand] = useState<ICommand[]>([]);

  // current focused command index
  const [subCommand, setSubCommand] = useState<CommandType | null>(null);

  const [searchQueryPlaceholder, setSearchQueryPlaceholder] = useState('Search...');

  // current focused command index
  const [focusedCommandIndex, setFocusedCommandIndex] = useState(1);

  const { getCommandIcon } = useCommand();

  // default suggested time for snooze tab command
  const defaultSuggestedSnoozeTimeLabels: string[] = useMemo(
    () => ['After 2 hours', 'Tomorrow at same time', 'Tomorrow at 4pm', 'Tuesday 2pm', 'After 1 week'],
    [],
  );

  // close command palette
  const handleCloseCommandPalette = useCallback(() => {
    modalRef.current?.close();
    // remove parent container
    onClose();
  }, [modalRef, onClose]);

  // handle key press
  const { isModifierKeyPressed } = useKeyShortcuts({
    parentConTainerEl: modalRef.current,
    monitorModifierKeys: true,
    onEscapePressed: () => {
      handleCloseCommandPalette();
    },
    onTabPressed: () => {
      (async () => {
        await handleSelectCommand();
      })();
    },
    onEnterPressed: () => {
      (async () => {
        await handleSelectCommand();
      })();
    },
    onArrowDownPressed: () => {
      if (focusedCommandIndex >= suggestedCommands.length) {
        setFocusedCommandIndex(1);
        return;
      }
      setFocusedCommandIndex(prev => prev + 1);
    },
    onArrowUpPressed: () => {
      if (focusedCommandIndex < 2) {
        setFocusedCommandIndex(suggestedCommands.length);
        return;
      }

      setFocusedCommandIndex(prev => prev - 1);
    },
  });

  // handle select command
  const handleSelectCommand = useCallback(
    async (index?: number) => {
      const activeIndex = index || focusedCommandIndex;

      const focusedCommand = suggestedCommands.find(cmd => cmd.index === activeIndex);

      if (!focusedCommand?.type) return;

      switch (focusedCommand.type) {
        case CommandType.SwitchTab: {
          await publishEvents({
            event: 'SWITCH_TAB',
            payload: { shouldCloseCurrentTab: isModifierKeyPressed, tabId: focusedCommand.metadata as number },
          });

          handleCloseCommandPalette();
          break;
        }

        case CommandType.SwitchSpace: {
          await publishEvents({ event: 'SWITCH_SPACE', payload: { spaceId: focusedCommand.metadata as string } });
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
            await publishEvents({ event: 'NEW_SPACE', payload: { spaceTitle: searchQuery } });
            handleCloseCommandPalette();
          }
          break;
        }

        case CommandType.AddToSpace: {
          if (!subCommand) {
            const allSpaces = await getAllSpaces();

            const addToSpaceCommands = allSpaces
              .filter(s => s.windowId !== activeSpace.windowId)
              .map<ICommand>((space, idx) => ({
                label: space.title,
                type: CommandType.AddToSpace,
                index: idx + 1,
                icon: space.emoji,
                metadata: space.id,
              }));

            setSuggestedCommandsForSubCommand(addToSpaceCommands);
            setSubCommand(CommandType.AddToSpace);
            // setSuggestedCommands(addToSpaceCommands);
            setSearchQueryPlaceholder('Select space');
            setFocusedCommandIndex(1);
          } else {
            await publishEvents({
              event: 'MOVE_TAB_TO_SPACE',
              payload: { spaceId: focusedCommand.metadata as string },
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
        case CommandType.WebSearch: {
          await publishEvents({
            event: 'WEB_SEARCH',
            payload: { searchQuery, shouldOpenInNewTab: isModifierKeyPressed },
          });
          handleCloseCommandPalette();
          break;
        }

        case CommandType.RecentSite: {
          await publishEvents({
            event: 'GO_TO_URL',
            payload: { url: focusedCommand.metadata as string, shouldOpenInNewTab: isModifierKeyPressed },
          });
          handleCloseCommandPalette();
          break;
        }
        case CommandType.DiscardTabs: {
          await publishEvents({ event: 'DISCARD_TABS' });
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
              payload: { spaceId: activeSpace.id, snoozedUntil: focusedCommand.metadata as number },
            });

            handleCloseCommandPalette();
          }
          break;
        }
        case CommandType.CloseTab: {
          await publishEvents({ event: 'CLOSE_TAB' });
          handleCloseCommandPalette();
          break;
        }
      }

      setSearchQuery('');
    },
    [
      activeSpace,
      focusedCommandIndex,
      isModifierKeyPressed,
      suggestedCommands,
      handleCloseCommandPalette,
      searchQuery,
      subCommand,
      getCommandIcon,
      defaultSuggestedSnoozeTimeLabels,
    ],
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
