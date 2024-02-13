import { useState, useCallback } from 'react';
import { CommandType, ICommand, ISpace } from '../../types/global.types';
import { publishEvents } from '../../utils/publish-events';
import { getAllSpaces } from '@root/src/services/chrome-storage/spaces';
import { CommandPaletteContainerId } from '@root/src/constants/app';
import { useKeyPressed } from '../../sidepanel/hooks/useKeyPressed';
import { MdNewLabel } from 'react-icons/md';
import { getTabsInSpace } from '@root/src/services/chrome-storage/tabs';
import { getFaviconURL } from '../../utils';

type UseCommandPaletteProps = {
  activeSpace: ISpace;
  modalRef: React.RefObject<HTMLDialogElement>;
  searchQuery: string;
};

export const useCommandPalette = ({ activeSpace, modalRef, searchQuery }: UseCommandPaletteProps) => {
  // local state
  // search/commands suggestions
  const [suggestedCommands, setSuggestedCommands] = useState<ICommand[]>([]);

  // save suggestedCommands for sub commands if search query is not empty for during sub command action
  // we can revert to this suggested commands if search query is empty again
  const [suggestedCommandsForSubCommand, setSuggestedCommandsForSubCommand] = useState<ICommand[]>([]);

  // current focused command index
  const [subCommand, setSubCommand] = useState<CommandType | null>(null);

  const [searchQueryPlaceholder, setSearchQueryPlaceholder] = useState('Search...');

  // current focused command index
  const [focusedCommandIndex, setFocusedCommandIndex] = useState(1);

  // close command palette
  const handleCloseCommandPalette = useCallback(() => {
    modalRef.current?.close();
    // remove parent container
    const commandPaletteContainerEl = document.getElementById(CommandPaletteContainerId);

    commandPaletteContainerEl.replaceChildren();
    commandPaletteContainerEl?.remove();
    document.body.style.overflow = 'auto';
  }, [modalRef]);

  // handle select command
  const handleSelectCommand = useCallback(async () => {
    const focusedCommand = suggestedCommands.find(cmd => cmd.index === focusedCommandIndex);

    if (!focusedCommand?.type) return;

    switch (focusedCommand.type) {
      case CommandType.SwitchTab: {
        if (!subCommand) {
          const tabs = await getTabsInSpace(activeSpace.id);

          const tabCommands = tabs.map((tab, idx) => {
            return {
              label: tab.title,
              type: CommandType.SwitchTab,
              index: 1 + idx,
              icon: getFaviconURL(tab.url, false),
              metadata: tab.id,
            };
          });

          setSubCommand(CommandType.SwitchTab);
          setSuggestedCommandsForSubCommand(tabCommands);
          setSuggestedCommands(tabCommands);
          setSearchQueryPlaceholder('Select tab');
          setFocusedCommandIndex(1);
        } else {
          // Todo - switch tab event
        }
        break;
      }

      case CommandType.SwitchSpace: {
        if (!subCommand) {
          const allSpaces = await getAllSpaces();

          const switchSpaceCommands = allSpaces
            .filter(s => s.windowId !== activeSpace.windowId)
            .map<ICommand>((space, idx) => ({
              label: space.title,
              type: CommandType.SwitchSpace,
              index: idx + 1,
              icon: space.emoji,
              metadata: space.id,
            }));

          setSubCommand(CommandType.SwitchSpace);
          setSuggestedCommandsForSubCommand(switchSpaceCommands);
          setSuggestedCommands(switchSpaceCommands);
          setSearchQueryPlaceholder('Select space');
          setFocusedCommandIndex(1);
        } else {
          const space = suggestedCommands.find(cmd => cmd.index === focusedCommandIndex);

          console.log('🚀 ~ handleSelectCommand ~ space:', space);

          if (!space) return;

          await publishEvents({ event: 'SWITCH_SPACE', payload: { spaceId: space.metadata as string } });
          handleCloseCommandPalette();
        }

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
              icon: MdNewLabel,
            },
          ]);

          setFocusedCommandIndex(1);
        } else {
          if (!searchQuery) return;
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
          setSuggestedCommands(addToSpaceCommands);
          setSearchQueryPlaceholder('Select space');
          setFocusedCommandIndex(1);
        } else {
          await publishEvents({ event: 'Add_TO_SPACE', payload: { spaceId: focusedCommand.metadata as string } });
          handleCloseCommandPalette();
        }
        break;
      }

      case CommandType.RecentSite: {
        await publishEvents({ event: 'GO_TO_URL', payload: { url: focusedCommand.metadata as string } });
        handleCloseCommandPalette();
        break;
      }
    }
  }, [activeSpace, focusedCommandIndex, suggestedCommands, handleCloseCommandPalette, searchQuery, subCommand]);

  // handle key press
  useKeyPressed({
    parentConTainerEl: modalRef.current,
    monitorModifierKeys: false,
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
      if (focusedCommandIndex >= suggestedCommands.filter(cmd => cmd.type !== CommandType.Divider).length) {
        return;
      }

      if (focusedCommandIndex === suggestedCommands.filter(c => c.type !== 'divider').length) return;

      setFocusedCommandIndex(prev => prev + 1);
    },
    onArrowUpPressed: () => {
      if (focusedCommandIndex < 2) {
        return;
      }

      setFocusedCommandIndex(prev => prev - 1);
    },
  });

  return {
    handleSelectCommand,
    suggestedCommands,
    searchQueryPlaceholder,
    subCommand,
    setSubCommand,
    suggestedCommandsForSubCommand,
    setSuggestedCommands,
    handleCloseCommandPalette,
    setFocusedCommandIndex,
    focusedCommandIndex,
    setSuggestedCommandsForSubCommand,
  };
};
