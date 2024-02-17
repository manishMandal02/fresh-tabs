import { useState, useCallback } from 'react';
import { ICommand, ISpace } from '../../types/global.types';
import { publishEvents } from '../../utils/publish-events';
import { getAllSpaces } from '@root/src/services/chrome-storage/spaces';
import { CommandPaletteContainerId, CommandType } from '@root/src/constants/app';
import { useKeyPressed } from '../../sidepanel/hooks/useKeyPressed';
import { MdNewLabel } from 'react-icons/md';
import { getTabsInSpace } from '@root/src/services/chrome-storage/tabs';
import { getFaviconURL } from '../../utils';

type UseCommandPaletteProps = {
  activeSpace: ISpace;
  modalRef: React.RefObject<HTMLDialogElement>;
};

export const useCommandPalette = ({ activeSpace, modalRef }: UseCommandPaletteProps) => {
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

  // close command palette
  const handleCloseCommandPalette = useCallback(() => {
    modalRef.current?.close();
    // remove parent container
    const commandPaletteContainerEl = document.getElementById(CommandPaletteContainerId);

    commandPaletteContainerEl.replaceChildren();
    commandPaletteContainerEl?.remove();
    document.body.style.overflow = 'auto';
  }, [modalRef]);

  // handle key press
  const { isModifierKeyPressed } = useKeyPressed({
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
  const handleSelectCommand = useCallback(async () => {
    const focusedCommand = suggestedCommands.find(cmd => cmd.index === focusedCommandIndex);

    if (!focusedCommand?.type) return;
    switch (focusedCommand.type) {
      case CommandType.SwitchTab: {
        if (!subCommand && !focusedCommand.metadata) {
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
          console.log('🚀 ~ handleSelectCommand ~ focusedCommand.metadata:', focusedCommand.metadata);
          await publishEvents({ event: 'SWITCH_TAB', payload: { tabId: focusedCommand.metadata as number } });

          handleCloseCommandPalette();
        }
        break;
      }

      case CommandType.SwitchSpace: {
        if (!subCommand && !focusedCommand.metadata) {
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
          await publishEvents({ event: 'SWITCH_SPACE', payload: { spaceId: focusedCommand.metadata as string } });
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
          await publishEvents({ event: 'MOVE_TAB_TO_SPACE', payload: { spaceId: focusedCommand.metadata as string } });
          handleCloseCommandPalette();
        }
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
    }

    setSearchQuery('');
  }, [
    activeSpace,
    focusedCommandIndex,
    isModifierKeyPressed,
    suggestedCommands,
    handleCloseCommandPalette,
    searchQuery,
    subCommand,
  ]);

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