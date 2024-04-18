import type { ReactNode } from 'react';
import { useAtomValue, useSetAtom } from 'jotai';
import * as RadixContextMenu from '@radix-ui/react-context-menu';
import {
  ChevronRightIcon,
  FileIcon,
  FilePlusIcon,
  MoonIcon,
  PinRightIcon,
  PlusIcon,
  TrashIcon,
} from '@radix-ui/react-icons';

import { discardTabs } from '@root/src/services/chrome-discard/discard';
import { ISpace, ITab, ITabWithIndex } from '@root/src/types/global.types';
import { nonActiveSpacesAtom, showNewSpaceModalAtom } from '@root/src/stores/app';
import { getTabsInSpace, setTabsForSpace } from '@root/src/services/chrome-storage/tabs';

type Props = {
  children: ReactNode;
  onRemoveClick: () => void;
  selectedTabs: ITabWithIndex[];
  tab: ITab;
  allTabs: ITab[];
  space: ISpace;
  setActiveSpaceTabs: (tabs: ITab[]) => void;
};

const TabContextMenu = ({ children, onRemoveClick, selectedTabs, tab, allTabs, space, setActiveSpaceTabs }: Props) => {
  console.log('🚀 ~ TabContextMenu ~ selectedTabs:22', selectedTabs);

  // global state
  const nonActiveSpaces = useAtomValue(nonActiveSpacesAtom);
  const showNewSpaceModal = useSetAtom(showNewSpaceModalAtom);

  // on discard click
  const handleDiscardTabs = async () => {
    if (selectedTabs.length > 1) {
      await discardTabs(selectedTabs.map(tab => tab.id));
    } else {
      await discardTabs([tab.id]);
    }
  };

  // move tabs to another space
  const handleMoveTabToSpace = async (newSpaceId: string) => {
    if (selectedTabs?.length < 1) {
      // 1. single Tab
      // add tab to selected space
      const tabs = await getTabsInSpace(newSpaceId);
      await setTabsForSpace(newSpaceId, [...tabs, tab]);

      // remove tab from current space

      const updatedTabsForActiveSpace = allTabs.filter(t => t.id !== tab.id);
      // ui state update
      setActiveSpaceTabs(updatedTabsForActiveSpace);
      // update storage
      await setTabsForSpace(space.id, updatedTabsForActiveSpace);

      await chrome.tabs.remove(tab.id);
    } else {
      // 2. selected multiple tabs
      const tabs = await getTabsInSpace(newSpaceId);

      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      await setTabsForSpace(newSpaceId, [...tabs, ...selectedTabs.map(({ index, ...tab }) => tab)]);

      const updatedTabsForActiveSpace = allTabs.filter(t => selectedTabs.some(sT => sT.id !== t.id));

      setActiveSpaceTabs(updatedTabsForActiveSpace);
      await setTabsForSpace(space.id, updatedTabsForActiveSpace);

      const removeTabsPromises = selectedTabs.map(t => chrome.tabs.remove(t.id));

      await Promise.allSettled(removeTabsPromises);
    }
  };

  // new space
  const handleNewSpace = () => {
    // index is not required here ⬇️
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const tabsForNewSpace = selectedTabs?.length < 1 ? [tab] : selectedTabs.map(({ index, ...tab }) => tab);

    showNewSpaceModal({ show: true, tabs: tabsForNewSpace });
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

          <RadixContextMenu.Separator className="h-[1px] bg-brand-darkBgAccent/80 my-[2px]" />
          <RadixContextMenu.Item className=" flex items-center text-[12px] font-normal text-slate-400 py-[7px] px-2.5 hover:bg-brand-darkBgAccent/40 transition-colors duration-300 cursor-pointer">
            <FilePlusIcon className="text-slate-500 mr-1 scale-[0.8]" /> New folder
          </RadixContextMenu.Item>
          <RadixContextMenu.Item className=" flex items-center text-[12px] font-normal text-slate-400 py-[7px] px-2.5 hover:bg-brand-darkBgAccent/40 transition-colors duration-300 cursor-pointer">
            <FileIcon className="text-slate-500 mr-1 scale-[0.8]" /> Move to folder
          </RadixContextMenu.Item>
          <RadixContextMenu.Separator className="h-[1px] bg-brand-darkBgAccent/80 my-[2px]" />
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

          <RadixContextMenu.Separator className="h-[1px] bg-brand-darkBgAccent/80 my-[2px]" />
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

export default TabContextMenu;
