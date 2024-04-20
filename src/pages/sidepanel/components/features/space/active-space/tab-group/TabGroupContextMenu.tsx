import type { ReactNode } from 'react';
import { useAtom, useAtomValue, useSetAtom } from 'jotai';
import * as RadixContextMenu from '@radix-ui/react-context-menu';
import {
  ArrowDownIcon,
  ChevronRightIcon,
  FileIcon,
  FilePlusIcon,
  MoonIcon,
  PinRightIcon,
  PlusIcon,
  TrashIcon,
} from '@radix-ui/react-icons';

import { IGroup, ISpace, ITab } from '@root/src/types/global.types';
import { discardTabs } from '@root/src/services/chrome-discard/discard';
import { addGroup, setGroupsToSpace } from '@root/src/services/chrome-storage/groups';
import { getTabsInSpace, setTabsForSpace } from '@root/src/services/chrome-storage/tabs';
import {
  activeSpaceGroupsAtom,
  activeSpaceTabsAtom,
  nonActiveSpacesAtom,
  showNewSpaceModalAtom,
} from '@root/src/stores/app';

type Props = {
  children: ReactNode;
  group: IGroup;
  tabs: ITab[];
  space: ISpace;
};

const TabGroupContextMenu = ({ children, group, tabs, space }: Props) => {
  // global state
  const nonActiveSpaces = useAtomValue(nonActiveSpacesAtom);
  const showNewSpaceModal = useSetAtom(showNewSpaceModalAtom);
  const setActiveSpaceTabs = useSetAtom(activeSpaceTabsAtom);
  const [activeSpaceGroups, setActiveSpaceGroups] = useAtom(activeSpaceGroupsAtom);

  // on discard click - discard all folder tabs
  const handleDiscardTabs = async () => {
    await discardTabs(tabs.map(tab => tab.id));
  };

  // move group to another space
  const handleMoveGroupToSpace = async (newSpaceId: string) => {
    // get all tabs for new space
    const tabs = await getTabsInSpace(newSpaceId);

    // add tabs to new space
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    await setTabsForSpace(newSpaceId, [...tabs, ...tabs.map(tab => tab)]);

    // add group in new space
    await addGroup(newSpaceId, group);

    // all tabs in current space
    const activeSpaceTabs = await getTabsInSpace(space.id);

    // remove tabs & group from current space
    const updatedTabsForActiveSpace = activeSpaceTabs.filter(t => tabs.some(sT => sT.id !== t.id));
    const updatedGroupsForActiveSpace = activeSpaceGroups.filter(g => g.id !== group.id);

    // update storage
    await setTabsForSpace(space.id, updatedTabsForActiveSpace);
    await setGroupsToSpace(space.id, updatedGroupsForActiveSpace);

    // update ui state
    setActiveSpaceTabs(updatedTabsForActiveSpace);
    setActiveSpaceGroups(updatedGroupsForActiveSpace);

    const removeTabsPromises = tabs.map(t => chrome.tabs.remove(t.id));

    await Promise.allSettled(removeTabsPromises);
  };

  // new space with tabs in group
  const handleNewSpace = () => {
    const tabsForNewSpace = tabs.map(tab => tab);

    showNewSpaceModal({ show: true, tabs: tabsForNewSpace });
  };

  // create new tab after current tab
  const handleCreateNewTab = async () => {
    // TODO - check if new tab is added to the group or not
    await chrome.tabs.create({ url: 'chrome://newtab', active: true, index: tabs[tabs.length - 1].index + 1 });
  };

  // remove group
  const handleRemoveGroup = async () => {
    // get all tabs in current space
    const activeSpaceTabs = await getTabsInSpace(space.id);

    // remove tabs & group from current space
    const updatedTabsForActiveSpace = activeSpaceTabs.filter(t => tabs.some(sT => sT.id !== t.id));
    const updatedGroupsForActiveSpace = activeSpaceGroups.filter(g => g.id !== group.id);

    // update storage
    await setTabsForSpace(space.id, updatedTabsForActiveSpace);
    await setGroupsToSpace(space.id, updatedGroupsForActiveSpace);

    // update ui state
    setActiveSpaceTabs(updatedTabsForActiveSpace);
    setActiveSpaceGroups(updatedGroupsForActiveSpace);

    const removeTabsPromises = tabs.map(t => chrome.tabs.remove(t.id));

    await Promise.allSettled(removeTabsPromises);
  };

  return (
    <RadixContextMenu.Root>
      <RadixContextMenu.Trigger className="" asChild>
        {children}
      </RadixContextMenu.Trigger>
      <RadixContextMenu.Portal>
        <RadixContextMenu.Content
          className="!bg-brand-darkBg !opacity-100 rounded-md overflow-hidden min-w-[180px] h-fit z-[9999] py-px border border-brand-darkBgAccent/30"
          //   sideOffset={5}
          //   align="end"
        >
          <RadixContextMenu.Item
            onClick={handleDiscardTabs}
            className="flex items-center ext-[12px] font-normal text-slate-400 py-[7px] px-2.5  hover:bg-brand-darkBgAccent/40 transition-colors duration-300 cursor-pointer">
            <MoonIcon className="text-slate-500 mr-1 scale-[0.8]" /> Discard
          </RadixContextMenu.Item>
          <RadixContextMenu.Item
            onClick={handleCreateNewTab}
            className="flex items-center ext-[12px] font-normal text-slate-400 py-[7px] px-2.5  hover:bg-brand-darkBgAccent/40 transition-colors duration-300 cursor-pointer">
            <ArrowDownIcon className="text-slate-500 mr-1 scale-[0.8]" /> New tab after this
          </RadixContextMenu.Item>

          <RadixContextMenu.Separator className="h-[1px] bg-brand-darkBgAccent/50 my-[2px]" />

          <RadixContextMenu.Item className=" flex items-center text-[12px] font-normal text-slate-400 py-[7px] px-2.5 hover:bg-brand-darkBgAccent/40 transition-colors duration-300 cursor-pointer">
            <FilePlusIcon className="text-slate-500 mr-1 scale-[0.8]" /> New folder
          </RadixContextMenu.Item>
          <RadixContextMenu.Item className=" flex items-center text-[12px] font-normal text-slate-400 py-[7px] px-2.5 hover:bg-brand-darkBgAccent/40 transition-colors duration-300 cursor-pointer">
            <FileIcon className="text-slate-500 mr-1 scale-[0.8]" /> Move to folder
          </RadixContextMenu.Item>

          <RadixContextMenu.Separator className="h-[1px] bg-brand-darkBgAccent/50 my-[2px]" />

          <RadixContextMenu.Item
            onClick={handleNewSpace}
            className=" flex items-center text-[12px] font-normal text-slate-400 py-[7px] px-2.5 hover:bg-brand-darkBgAccent/40 transition-colors duration-300 cursor-pointer">
            <PlusIcon className="text-slate-500 mr-1 scale-[0.8]" /> New space
          </RadixContextMenu.Item>
          <RadixContextMenu.Sub>
            <RadixContextMenu.SubTrigger className="flex items-center text-[12px] font-normal text-slate-400 py-[7px] px-2.5 hover:bg-brand-darkBgAccent/40 transition-colors duration-300 cursor-pointer">
              <PinRightIcon className="text-slate-500 mr-1 scale-[0.8]" /> Move to another space{' '}
              <ChevronRightIcon className="text-slate-600/90 ml-2 scale-[0.8]" />
            </RadixContextMenu.SubTrigger>
            <RadixContextMenu.Portal>
              <RadixContextMenu.SubContent className="!bg-brand-darkBg !opacity-100 rounded-md overflow-hidden w-fit h-fit z-[99999] py-px border border-brand-darkBgAccent/30">
                {[...nonActiveSpaces.filter(s => s.isSaved)].map(space => (
                  <RadixContextMenu.Item
                    key={space.id}
                    onClick={() => handleMoveGroupToSpace(space.id)}
                    className="flex items-center text-[11px] font-normal text-slate-400 py-[7px] px-2.5 hover:bg-brand-darkBgAccent/40 transition-colors duration-300 cursor-pointer">
                    <span className="mr-1.5">{space.emoji}</span> {space.title}
                  </RadixContextMenu.Item>
                ))}
              </RadixContextMenu.SubContent>
            </RadixContextMenu.Portal>
          </RadixContextMenu.Sub>

          <RadixContextMenu.Separator className="h-[1px] bg-brand-darkBgAccent/50 my-[2px]" />

          <RadixContextMenu.Item
            onClick={handleRemoveGroup}
            className=" flex items-center text-[12px] font-normal text-slate-400 py-[7px] px-2.5 hover:bg-brand-darkBgAccent/40 transition-colors duration-300 cursor-pointer">
            <TrashIcon className="text-slate-500 mr-1 scale-[0.8]" /> Remove
          </RadixContextMenu.Item>
        </RadixContextMenu.Content>
      </RadixContextMenu.Portal>
    </RadixContextMenu.Root>
  );
};

export default TabGroupContextMenu;
