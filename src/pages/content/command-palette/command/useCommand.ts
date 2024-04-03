import {
  ClockIcon,
  FileTextIcon,
  EnterIcon,
  PinRightIcon,
  MoonIcon,
  MoveIcon,
  DesktopIcon,
  Cross1Icon,
  MagnifyingGlassIcon,
} from '@radix-ui/react-icons';

import { CommandType } from '@root/src/constants/app';
import { ICommand } from '@root/src/pages/types/global.types';

// default static commands
export const staticCommands: ICommand[] = [
  { index: 1, type: CommandType.SwitchTab, label: 'Switch Tab', icon: PinRightIcon, alias: 'Go to tab' },
  { index: 2, type: CommandType.NewNote, label: 'New Note', icon: FileTextIcon, alias: 'Create note' },
  { index: 3, type: CommandType.SwitchSpace, label: 'Switch Space', icon: EnterIcon, alias: 'GO to space' },
  { index: 4, type: CommandType.NewSpace, label: 'New Space', icon: DesktopIcon, alias: 'Create space' },
  { index: 5, type: CommandType.AddToSpace, label: 'Move Tab', icon: MoveIcon, alias: 'Send Tab to other space' },
  { index: 6, type: CommandType.SnoozeTab, label: 'Snooze Tab', icon: ClockIcon, alias: 'Remind later' },
  {
    index: 7,
    type: CommandType.DiscardTabs,
    label: 'Discard Tabs',
    icon: MoonIcon,
    alias: 'Save memory',
  },
  { index: 8, type: CommandType.CloseTab, label: 'Close Tab', icon: Cross1Icon, alias: 'Close current tab' },
];

export const webSearchCommand = (query: string, index: number): ICommand => {
  return {
    index,
    label: `Web Search: <b className="text-slate-300">${query}</b>`,
    type: CommandType.WebSearch,
    icon: MagnifyingGlassIcon,
    alias: 'Google search',
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
