import {
  ClockIcon,
  FileTextIcon,
  MoonIcon,
  MoveIcon,
  DesktopIcon,
  Cross1Icon,
  LayersIcon,
  MagnifyingGlassIcon,
  PlusIcon,
} from '@radix-ui/react-icons';

import { CommandType } from '@root/src/constants/app';
import { ICommand } from '@root/src/types/global.types';

// default static commands
export const staticCommands: ICommand[] = [
  { index: 1, type: CommandType.NewNote, label: 'New Note', icon: FileTextIcon, alias: 'Create note' },
  { index: 2, type: CommandType.NewSpace, label: 'New Space', icon: DesktopIcon, alias: 'Create space' },
  { index: 3, type: CommandType.AddToSpace, label: 'Move Tab', icon: MoveIcon, alias: 'Send Tab to other space' },
  { index: 4, type: CommandType.SnoozeTab, label: 'Snooze Tab', icon: ClockIcon, alias: 'Remind later' },
  {
    index: 5,
    type: CommandType.DiscardTabs,
    label: 'Discard Tabs',
    icon: MoonIcon,
    alias: 'Save memory',
  },
  { index: 6, type: CommandType.CloseTab, label: 'Close Tab', icon: Cross1Icon, alias: 'Close current tab' },
  {
    index: 7,
    type: CommandType.NewGroup,
    label: 'New Group',
    icon: PlusIcon,
    alias: 'Create group with this tab',
  },
  {
    index: 8,
    type: CommandType.AddToGroup,
    label: 'Add to Group',
    icon: LayersIcon,
    alias: 'Move tab to a group',
  },
];

export const webSearchCommand = (query: string, index: number): ICommand => {
  return {
    index,
    label: `Web Search:`,
    alias: query.trim(),
    type: CommandType.WebSearch,
    icon: MagnifyingGlassIcon,
  };
};

export const useCommand = () => {
  const isStaticCommand = (label: string) => staticCommands.some(cmd => cmd.label === label);

  const getCommandIcon = (type: CommandType) => {
    const cmd = staticCommands.find(c => c.type === type);

    return { Icon: cmd.icon, label: cmd.label };
  };

  return { isStaticCommand, getCommandIcon };
};
