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
  CheckIcon,
  Pencil1Icon,
  BellIcon,
  GearIcon,
  CounterClockwiseClockIcon,
} from '@radix-ui/react-icons';

import { CommandType } from '@root/src/constants/app';
import { ICommand } from '@root/src/types/global.types';

// default static commands
export const staticCommands: ICommand[] = [
  {
    index: 1,
    type: CommandType.NewNote,
    label: 'New Note',
    icon: FileTextIcon,
    alias: 'Create note',
    isFeatured: true,
  },
  {
    index: 2,
    type: CommandType.NewSpace,
    label: 'New Space',
    icon: DesktopIcon,
    alias: 'Create space',
    isFeatured: true,
  },
  {
    index: 3,
    type: CommandType.AddToSpace,
    label: 'Move Tab',
    icon: MoveIcon,
    alias: 'Send Tab to other space',
    isFeatured: true,
  },
  {
    index: 4,
    type: CommandType.SnoozeTab,
    label: 'Snooze Tab',
    icon: ClockIcon,
    alias: 'Remind later',
    isFeatured: true,
  },
  {
    index: 5,
    type: CommandType.DiscardTabs,
    label: 'Discard Tabs',
    icon: MoonIcon,
    alias: 'Save memory',
    isFeatured: true,
  },
  {
    index: 6,
    type: CommandType.WhitelistDomainForAutoDiscard,
    label: 'Whitelist site',
    icon: CheckIcon,
    alias: 'Prevent this site from being discarded',
    isFeatured: true,
  },
  { index: 7, type: CommandType.CloseTab, label: 'Close Tab', icon: Cross1Icon, alias: 'Close current tab' },
  // group cmd
  {
    index: 8,
    type: CommandType.NewGroup,
    label: 'New Group',
    icon: PlusIcon,
    alias: 'Create group with this tab',
    isFeatured: true,
  },
  {
    index: 9,
    type: CommandType.AddToGroup,
    label: 'Add to Group',
    icon: LayersIcon,
    alias: 'Move tab to a group',
  },
  {
    index: 10,
    type: CommandType.RenameGroup,
    label: 'Rename Group',
    icon: Pencil1Icon,
    alias: '',
  },
  // quick access side panel menu items
  {
    index: 11,
    type: CommandType.OpenSidePanel,
    label: 'Open FreshTab',
    icon: LayersIcon,
    alias: 'open in side pane',
  },
  {
    index: 12,
    type: CommandType.OpenNotificationsModal,
    label: 'Show Notifications',
    icon: BellIcon,
    alias: 'open in side panel',
  },
  {
    index: 13,
    type: CommandType.OpenPreferencesModal,
    label: 'Show Preferences',
    icon: GearIcon,
    alias: 'open in side panel',
  },
  {
    index: 14,
    type: CommandType.OpenSnoozedTabsModal,
    label: 'Show Snoozed Tabs',
    icon: ClockIcon,
    alias: 'open in side panel',
  },
  {
    index: 15,
    type: CommandType.OpenSpaceHistoryModal,
    label: 'Show Space History',
    icon: CounterClockwiseClockIcon,
    alias: 'open in side panel',
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
