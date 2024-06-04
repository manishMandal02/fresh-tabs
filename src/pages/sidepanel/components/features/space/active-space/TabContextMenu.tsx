import type { ReactNode } from 'react';
import { useAtomValue, useSetAtom } from 'jotai';
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
import { openTabsInTransferredSpace } from '@root/src/services/chrome-tabs/tabs';
import { nonActiveSpacesAtom, showNewSpaceModalAtom } from '@root/src/stores/app';
import { getTabsInSpace, setTabsForSpace } from '@root/src/services/chrome-storage/tabs';
import { memo } from 'react';

type Props = {
  selectedItem: ITab | IGroup;
  space: ISpace;
  allTabs: ITab[];
  children: ReactNode;
  selectedTabs: number[];
  totalGroups: number;
  onRemoveClick: () => void;
  setActiveSpaceTabs: (tabs: ITab[]) => void;
};

const TabContextMenu = ({
  children,
  onRemoveClick,
  selectedTabs,
  selectedItem,
  allTabs,
  space,
  totalGroups,
  setActiveSpaceTabs,
}: Props) => {
  // global state
  const nonActiveSpaces = useAtomValue(nonActiveSpacesAtom);
  const showNewSpaceModal = useSetAtom(showNewSpaceModalAtom);

  // on discard click
  const handleDiscardTabs = async () => {
    if (selectedTabs.length > 1) {
      await discardTabs(selectedTabs);
    } else {
      await discardTabs([selectedItem.id]);
    }
  };

  // new group
  const handleCreateNewGroup = async () => {
    // create group
    const newGroupId = await chrome.tabs.group({
      tabIds: selectedTabs?.length > 0 ? selectedTabs : selectedItem.id,
    });

    // update group title
    await chrome.tabGroups.update(newGroupId, {
      title: `New group ${totalGroups + 1}`,
    });
  };

  // move tabs to another space
  const handleMoveTabToSpace = async (newSpaceId: string) => {
    if (selectedTabs?.length < 1) {
      // move single Tab

      // add tab to selected space
      const tabs = await getTabsInSpace(newSpaceId);
      await setTabsForSpace(newSpaceId, [...tabs, selectedItem as ITab]);

      // remove tab from current space
      const updatedTabsForActiveSpace = allTabs.filter(t => t.id !== selectedItem.id);

      // ui state update
      setActiveSpaceTabs(updatedTabsForActiveSpace);
      // update storage
      await setTabsForSpace(space.id, updatedTabsForActiveSpace);

      await chrome.tabs.remove(selectedItem.id);
    } else {
      //  move multiple tabs
      const newSpaceTabs = await getTabsInSpace(newSpaceId);

      await setTabsForSpace(newSpaceId, [
        ...newSpaceTabs,
        ...allTabs.filter(t => selectedTabs.includes(t.id)).map(t => t),
      ]);

      const updatedTabsForActiveSpace = allTabs.filter(t => !selectedTabs.includes(t.id));

      setActiveSpaceTabs(updatedTabsForActiveSpace);
      await setTabsForSpace(space.id, updatedTabsForActiveSpace);

      const removeTabsPromises = selectedTabs.map(tId => chrome.tabs.remove(tId));

      await Promise.allSettled(removeTabsPromises);
    }

    // create moved tabs in the selected space if space opened in another window
    const tabsToCreate =
      selectedTabs?.length > 1 ? allTabs.filter(t => selectedTabs.includes(t.id)).map(t => t) : [selectedItem as ITab];
    await openTabsInTransferredSpace(newSpaceId, tabsToCreate);
  };

  // new space
  const handleNewSpace = () => {
    // index is not required here ⬇️
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const tabsForNewSpace =
      selectedTabs?.length < 1 ? [selectedItem as ITab] : allTabs.filter(t => selectedTabs.includes(t.id)).map(t => t);

    showNewSpaceModal({ show: true, tabs: tabsForNewSpace });
  };

  // create new tab after current tab
  const handleCreateNewTab = async () => {
    let newTabIndex = -1;

    // if group selected then create new tab after last tab in group
    if ('name' in selectedItem) {
      const tabsInSelectedGroup = allTabs.filter(t => t.groupId === selectedItem.id);
      newTabIndex = tabsInSelectedGroup[tabsInSelectedGroup.length - 1].index + 1;
    } else {
      newTabIndex = selectedItem.index + 1;
    }
    await chrome.tabs.create({ url: 'chrome://newtab', active: true, index: newTabIndex });
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

          <RadixContextMenu.Item
            onClick={handleCreateNewGroup}
            className=" flex items-center text-[12px] font-normal text-slate-400 py-[7px] px-2.5 hover:bg-brand-darkBgAccent/40 transition-colors duration-300 cursor-pointer">
            <FilePlusIcon className="text-slate-500 mr-1 scale-[0.8]" /> New group
          </RadixContextMenu.Item>
          <RadixContextMenu.Item className=" flex items-center text-[12px] font-normal text-slate-400 py-[7px] px-2.5 hover:bg-brand-darkBgAccent/40 transition-colors duration-300 cursor-pointer">
            <FileIcon className="text-slate-500 mr-1 scale-[0.8]" /> Move to group
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
                    onClick={() => handleMoveTabToSpace(space.id)}
                    className="flex items-center text-[11px] font-normal text-slate-400 py-[7px] px-2.5 hover:bg-brand-darkBgAccent/40 transition-colors duration-300 cursor-pointer">
                    <span className="mr-1.5">{space.emoji}</span> {space.title}
                  </RadixContextMenu.Item>
                ))}
              </RadixContextMenu.SubContent>
            </RadixContextMenu.Portal>
          </RadixContextMenu.Sub>

          <RadixContextMenu.Separator className="h-[1px] bg-brand-darkBgAccent/50 my-[2px]" />

          <RadixContextMenu.Item
            onClick={onRemoveClick}
            className=" flex items-center text-[12px] font-normal text-slate-400 py-[7px] px-2.5 hover:bg-brand-darkBgAccent/40 transition-colors duration-300 cursor-pointer">
            <TrashIcon className="text-slate-500 mr-1 scale-[0.8]" /> Remove
          </RadixContextMenu.Item>
        </RadixContextMenu.Content>
      </RadixContextMenu.Portal>
    </RadixContextMenu.Root>
  );
};

export default memo(TabContextMenu);
