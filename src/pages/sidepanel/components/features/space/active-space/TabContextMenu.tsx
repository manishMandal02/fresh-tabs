import { useAtomValue, useSetAtom } from 'jotai';
import * as RadixContextMenu from '@radix-ui/react-context-menu';
import { ReactNode, useRef, useMemo, useState, memo, FormEventHandler } from 'react';
import {
  ArrowDownIcon,
  CardStackPlusIcon,
  ChevronRightIcon,
  ColorWheelIcon,
  LayersIcon,
  MoonIcon,
  Pencil1Icon,
  PinRightIcon,
  PlusIcon,
  TrashIcon,
} from '@radix-ui/react-icons';

import { IGroup, ISpace, ITab } from '@root/src/types/global.types';
import { discardTabs } from '@root/src/services/chrome-discard/discard';
import { openTabsInTransferredSpace } from '@root/src/services/chrome-tabs/tabs';
import { nonActiveSpacesAtom, showAddNewNoteModalAtom, showNewSpaceModalAtom } from '@root/src/stores/app';
import { getTabsInSpace, setTabsForSpace } from '@root/src/services/chrome-storage/tabs';
import { ThemeColor } from '@root/src/constants/app';
import { ColorType } from '@root/src/components/color-picker/ColorPicker';
import { createPortal } from 'react-dom';
import { SlideModal } from '@root/src/components/modal';
import { capitalize, getUrlDomain, limitCharLength, wait } from '@root/src/utils';
import { getGroups, setGroupsToSpace } from '@root/src/services/chrome-storage/groups';

type Props = {
  selectedItem: ITab | IGroup;
  space: ISpace;
  allTabs: ITab[];
  allGroups: IGroup[];
  children: ReactNode;
  selectedTabs: number[];
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
  allGroups,
  setActiveSpaceTabs,
}: Props) => {
  // global state
  const nonActiveSpaces = useAtomValue(nonActiveSpacesAtom);
  const showNewSpaceModal = useSetAtom(showNewSpaceModalAtom);
  const showNoteModal = useSetAtom(showAddNewNoteModalAtom);

  const isSelectedItemTab = useMemo(() => 'index' in selectedItem, [selectedItem]);

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
      title: `New group ${allGroups?.length + 1}`,
    });
  };

  // TODO - not syncing after moving tabs to groups
  // move tab/group to a group
  const handleMoveToGroup = async (groupId: number) => {
    // move tabs to group
    if (selectedTabs?.length > 0 || 'index' in selectedItem) {
      const tabsToMove = selectedTabs?.length > 0 ? selectedTabs : selectedItem.id;

      await chrome.tabs.group({ groupId, tabIds: tabsToMove });
      return;
    }
    // merge groups
    const tabsInSelectedGroup = allTabs.filter(t => t.groupId === selectedItem.id).map(t => t.id);

    await chrome.tabs.group({ groupId, tabIds: tabsInSelectedGroup });
  };

  // move tabs to another space
  const handleMoveTabToSpace = async (newSpaceId: string) => {
    if ('name' in selectedItem) {
      const groupsInSelectedSpace = await getGroups(newSpaceId);

      setGroupsToSpace(newSpaceId, [...(groupsInSelectedSpace || []), selectedItem as IGroup]);

      // remove tabs from current space/group
      const tabsInGroup = allTabs.filter(t => t.groupId === selectedItem.id);

      await chrome.tabs.remove(tabsInGroup.map(t => t.id));

      // remove from storage
      setGroupsToSpace(
        space.id,
        allGroups.filter(g => g.id !== selectedItem.id),
      );

      // open group in selected space if space opened in another window
      await openTabsInTransferredSpace(newSpaceId, tabsInGroup, selectedItem);
      return;
    }

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

  // new note
  const handleNewNote = () => {
    showNoteModal({
      show: true,
      note: {
        text: '',
        title: limitCharLength((selectedItem as ITab).title, 42),
        domain: getUrlDomain((selectedItem as ITab).url),
      },
    });
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
    if (!isSelectedItemTab) {
      const tabsInSelectedGroup = allTabs.filter(t => t.groupId === selectedItem.id);
      newTabIndex = tabsInSelectedGroup[tabsInSelectedGroup.length - 1].index + 1;
    } else {
      newTabIndex = (selectedItem as ITab).index + 1;
    }
    const tab = await chrome.tabs.create({ url: 'chrome://newtab', active: true, index: newTabIndex });

    if (!isSelectedItemTab) {
      await chrome.tabs.group({ groupId: selectedItem.id, tabIds: [tab.id] });
    }
  };

  // change group color/theme
  const handleGroupColorChange = async (color: chrome.tabGroups.ColorEnum) => {
    await chrome.tabGroups.update(selectedItem.id, { color });
  };

  // rename group
  const [showGroupRenameModal, setShowGroupRenameModal] = useState(0);
  const [groupTitle, setGroupTitle] = useState('');

  const renameInputRef = useRef<HTMLInputElement>(null);

  const handleRenameGroup: FormEventHandler<HTMLFormElement> = async ev => {
    ev.preventDefault();
    if (groupTitle?.length < 3) {
      return;
    }
    await chrome.tabGroups.update(selectedItem.id, { title: groupTitle });
    setShowGroupRenameModal(0);
  };

  return (
    <>
      <RadixContextMenu.Root>
        <RadixContextMenu.Trigger asChild>{children}</RadixContextMenu.Trigger>
        <RadixContextMenu.Portal>
          <RadixContextMenu.Content className="!bg-brand-darkBg !opacity-100 rounded-md overflow-hidden min-w-[180px] h-fit z-[9999] py-px border border-brand-darkBgAccent/30">
            <RadixContextMenu.Item
              onClick={handleDiscardTabs}
              className="flex items-center ext-[12px] font-normal text-slate-400 py-[7px] px-2.5  hover:bg-brand-darkBgAccent/40 transition-colors duration-300 cursor-pointer">
              <MoonIcon className="text-slate-500 mr-1 scale-[0.8]" /> Discard
            </RadixContextMenu.Item>
            <RadixContextMenu.Item
              onClick={handleCreateNewTab}
              className="flex items-center ext-[12px] font-normal text-slate-400 py-[7px] px-2.5  hover:bg-brand-darkBgAccent/40 transition-colors duration-300 cursor-pointer">
              <ArrowDownIcon className="text-slate-500 mr-1 scale-[0.8]" />
              {isSelectedItemTab ? 'New tab after this' : 'New tab in group'}
            </RadixContextMenu.Item>

            <RadixContextMenu.Separator className="h-[1px] bg-brand-darkBgAccent/50 my-[2px]" />

            {isSelectedItemTab ? (
              <RadixContextMenu.Item
                onClick={handleCreateNewGroup}
                className=" flex items-center text-[12px] font-normal text-slate-400 py-[7px] px-2.5 hover:bg-brand-darkBgAccent/40 transition-colors duration-300 cursor-pointer">
                <CardStackPlusIcon className="text-slate-500 mr-1 scale-[0.8]" /> New group
              </RadixContextMenu.Item>
            ) : null}

            {!isSelectedItemTab ? (
              <>
                <RadixContextMenu.Item
                  onClick={async () => {
                    setGroupTitle((selectedItem as IGroup).name);
                    setShowGroupRenameModal(selectedItem.id);
                    await wait(100);
                    renameInputRef.current?.focus();
                  }}
                  className=" flex items-center text-[12px] font-normal text-slate-400 py-[7px] px-2.5 hover:bg-brand-darkBgAccent/40 transition-colors duration-300 cursor-pointer">
                  <Pencil1Icon className="text-slate-500 mr-1 scale-[0.8]" /> Rename group
                </RadixContextMenu.Item>
                <RadixContextMenu.Sub>
                  <RadixContextMenu.SubTrigger className="flex items-center text-[12px] font-normal text-slate-400 py-[7px] px-2.5 hover:bg-brand-darkBgAccent/40 transition-colors duration-300 cursor-pointer">
                    <ColorWheelIcon className="text-slate-500 mr-1 scale-[0.8]" /> Change group color
                    <ChevronRightIcon className="text-slate-600/90 ml-2 scale-[0.8]" />
                  </RadixContextMenu.SubTrigger>
                  <RadixContextMenu.Portal>
                    <RadixContextMenu.SubContent className="!bg-brand-darkBg !opacity-100 rounded-md overflow-hidden w-fit h-fit z-[99999] py-px border border-brand-darkBgAccent/30">
                      {[...(Object.keys(ThemeColor) as Array<ColorType>)].map(color => (
                        <RadixContextMenu.Item
                          key={color}
                          onClick={() => {
                            // handle color change
                            handleGroupColorChange(color.toLowerCase() as chrome.tabGroups.ColorEnum);
                          }}
                          className="flex items-center py-[7px] px-2.5 hover:bg-brand-darkBgAccent/40 transition-colors duration-300 cursor-pointer">
                          <span
                            className="size-[10px] rounded-full block -mb-px z-[20] opacity-90"
                            style={{ backgroundColor: ThemeColor[color] }}></span>
                          <span className="ml-2 text-[11px] font-normal text-slate-400">{color}</span>
                        </RadixContextMenu.Item>
                      ))}
                    </RadixContextMenu.SubContent>
                  </RadixContextMenu.Portal>
                </RadixContextMenu.Sub>
              </>
            ) : null}
            {allGroups?.length > 1 ? (
              <RadixContextMenu.Sub>
                <RadixContextMenu.SubTrigger className="flex items-center text-[12px] font-normal text-slate-400 py-[7px] px-2.5 hover:bg-brand-darkBgAccent/40 transition-colors duration-300 cursor-pointer">
                  <LayersIcon className="text-slate-500 mr-1 scale-[0.8]" />{' '}
                  {isSelectedItemTab ? ' Move to group' : 'Merge group'}
                  <ChevronRightIcon className="text-slate-600/90 ml-2 scale-[0.8]" />
                </RadixContextMenu.SubTrigger>
                <RadixContextMenu.Portal>
                  <RadixContextMenu.SubContent className="!bg-brand-darkBg !opacity-100 rounded-md overflow-hidden w-fit h-fit z-[99999] py-px border border-brand-darkBgAccent/30">
                    {[
                      ...allGroups.filter(
                        g => g.id !== ('index' in selectedItem ? selectedItem.groupId : selectedItem.id),
                      ),
                    ].map(group => (
                      <RadixContextMenu.Item
                        key={group.id}
                        onClick={() => handleMoveToGroup(group.id)}
                        className="flex items-center text-[11px] font-normal text-slate-400 py-[7px] px-2.5 hover:bg-brand-darkBgAccent/40 transition-colors duration-300 cursor-pointer">
                        <span
                          className="size-[8.5px] block rounded-full opacity-90 mr-[5px]"
                          style={{ backgroundColor: ThemeColor[capitalize(group.theme)] }}></span>
                        {group.name}
                      </RadixContextMenu.Item>
                    ))}
                  </RadixContextMenu.SubContent>
                </RadixContextMenu.Portal>
              </RadixContextMenu.Sub>
            ) : null}

            <RadixContextMenu.Separator className="h-[1px] bg-brand-darkBgAccent/50 my-[2px]" />

            {isSelectedItemTab ? (
              <RadixContextMenu.Item
                onClick={handleNewNote}
                className=" flex items-center text-[12px] font-normal text-slate-400 py-[7px] px-2.5 hover:bg-brand-darkBgAccent/40 transition-colors duration-300 cursor-pointer">
                <Pencil1Icon className="text-slate-500 mr-1 scale-[0.8]" /> New note
              </RadixContextMenu.Item>
            ) : null}

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
      {/* modal */}
      {showGroupRenameModal
        ? createPortal(
            <>
              <SlideModal
                isOpen={true}
                title={`Rename ${(selectedItem as IGroup).name}`}
                onClose={() => setShowGroupRenameModal(0)}>
                <form className="px-3 pt-4 flex items-center flex-col" onSubmit={handleRenameGroup}>
                  <input
                    ref={renameInputRef}
                    type="text"
                    // eslint-disable-next-line jsx-a11y/no-autofocus
                    autoFocus
                    placeholder="Group name..."
                    value={groupTitle}
                    onChange={e => setGroupTitle(e.target.value)}
                    className="w-[85%] text-[14px] px-2 py-1.5 text-slate-300 bg-brand-darkBgAccent/60 border border-transparent rounded-md transition-colors duration-200 focus:outline-none focus:border-slate-600"
                  />
                  {/* update button */}
                  <button
                    className={` mt-4 mx-auto w-[50%] py-2 rounded-md text-brand-darkBg/70 font-semibold text-[13px] 
                    bg-brand-primary/90 hover:opacity-95 transition-all duration-200 border-none outline-none focus-within:outline-slate-600`}
                    type="submit">
                    Rename
                  </button>
                </form>
              </SlideModal>
            </>,
            document.body,
          )
        : null}
    </>
  );
};

export default memo(TabContextMenu);
