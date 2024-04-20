import { useAtom, useAtomValue, useSetAtom } from 'jotai';

import { wait } from '../../../utils';
import { logger } from '../../../utils/logger';
import { ITab } from '../../../types/global.types';
import { getTabsInSpace } from '@root/src/services/chrome-storage/tabs';
import { setTabsForSpace } from './../../../services/chrome-storage/tabs';
import { createDiscardedTabs } from '@root/src/services/chrome-tabs/tabs';
import { scrollActiveSpaceBottom } from '../../../utils/scrollActiveSpaceBottom';
import { mergeSpace, setSpacesToStorage, updateSpace } from '@root/src/services/chrome-storage/spaces';
import {
  activeSpaceAtom,
  deleteSpaceModalAtom,
  selectedTabsAtom,
  snackbarAtom,
  getAllSpacesAtom,
  removeSpaceAtom,
  updateSpaceAtom,
  setSpacesAtom,
  activeSpaceTabsAtom,
} from '@root/src/stores/app';

//* dropped reasons to handle
// --draggable -single/multi tab--
//       same space
//! not used now -       other space
//! not used now -       create new space

// --draggable -space--
//       re-arrange
//       merge
//       add to active space
//       delete

type DropLocations =
  | 'ACTIVE_SPACE'
  | 'NON_ACTIVE_SPACE'
  | 'NEW_SPACE_ZONE'
  | 'SPACES_CONTAINER'
  | 'OPEN_NON_ACTIVE_SPACE_TABS'
  | 'DELETE_SPACE_ZONE';

type DropHandlerProps = {
  droppedLocation: DropLocations;
  destinationIndex: number;
  sourceIndex: number;
  draggableId: string;
  combineDraggableId: string | null;
};

export const useTabsDnd = () => {
  // global states/atoms
  const activeSpace = useAtomValue(activeSpaceAtom);
  const selectedTabs = useAtomValue(selectedTabsAtom);
  const alLSpacesState = useAtomValue(getAllSpacesAtom);

  const setSpaces = useSetAtom(setSpacesAtom);
  const setSnackbar = useSetAtom(snackbarAtom);
  const removeSpaceState = useSetAtom(removeSpaceAtom);
  const updateSpaceState = useSetAtom(updateSpaceAtom);
  const setDeleteSpaceModal = useSetAtom(deleteSpaceModalAtom);

  const [activeSpaceTabs, setActiveSpaceTabs] = useAtom(activeSpaceTabsAtom);

  // --droppable ids
  // space-
  // active-space
  // open-non-active-space-tabs
  // other-spaces
  // add-new-space
  // delete-space

  const getDroppedLocation = (droppableId: string) => {
    let droppedLocation: DropLocations;
    // determine the drop location

    switch (droppableId) {
      case 'active-space':
        droppedLocation = 'ACTIVE_SPACE';
        break;
      case 'open-non-active-space-tabs':
        droppedLocation = 'OPEN_NON_ACTIVE_SPACE_TABS';
        break;
      case 'add-new-space':
        droppedLocation = 'NEW_SPACE_ZONE';
        break;
      case 'delete-space':
        droppedLocation = 'DELETE_SPACE_ZONE';
        break;
      default: {
        droppedLocation = 'SPACES_CONTAINER';
      }
    }
    return droppedLocation;
  };

  //** handlers based on drop locations
  // dropped in active space
  const activeSpaceDropHandler = async ({
    destinationIndex,
    sourceIndex,
  }: Pick<DropHandlerProps, 'sourceIndex' | 'destinationIndex'>) => {
    const activeTab = activeSpaceTabs[activeSpace.activeTabIndex];

    let reOrderedTabs = [...activeSpaceTabs];

    if (selectedTabs?.length > 0) {
      // multi tab drop
      // remove selected tabs for active space
      reOrderedTabs = reOrderedTabs.filter(aT => !selectedTabs.find(sT => sT.id === aT.id));

      // check if the tabs are moved up or down from it's previous pos
      const didTabsMoveDownward = sourceIndex < destinationIndex;

      console.log('🚀 ~ useTabsDnd ~ didTabsMoveDownward:', didTabsMoveDownward);

      // calculate dropped index
      const droppedIndex = didTabsMoveDownward ? 1 + destinationIndex - selectedTabs.length : destinationIndex;

      // sort the selected tabs by index
      const sortedSelectedTabs: ITab[] = selectedTabs.toSorted((t1, t2) => (t1.index > t2.index ? 1 : -1));

      // add selected tabs at dropped pos in active space
      reOrderedTabs = reOrderedTabs.toSpliced(droppedIndex, 0, ...sortedSelectedTabs);

      // find new active tab index
      const newActiveTabIndex = reOrderedTabs.findIndex(el => el.url === activeTab.url);

      updateSpaceState({ ...activeSpace, activeTabIndex: newActiveTabIndex });
      setActiveSpaceTabs(reOrderedTabs);
      if (!didTabsMoveDownward) {
        sortedSelectedTabs.reverse();
      }

      // grouping all chrome api calls to move tabs
      const moveTabsPromises = sortedSelectedTabs.map(async tab => {
        const index = destinationIndex;

        return chrome.tabs.move(tab.id, { index });
      });

      // update storage
      await setTabsForSpace(activeSpace.id, reOrderedTabs);

      // move tab in window
      await Promise.allSettled(moveTabsPromises);

      // update space's active tab index, if changed
      if (activeSpace.activeTabIndex !== newActiveTabIndex) {
        await updateSpace(activeSpace.id, { ...activeSpace, activeTabIndex: newActiveTabIndex });
      }
    } else {
      // single tab drop
      const [tabToMove] = reOrderedTabs.splice(sourceIndex, 1);
      // update the dropped tab position
      reOrderedTabs.splice(destinationIndex, 0, tabToMove);

      // find new active tab index
      const newActiveTabIndex = reOrderedTabs.findIndex(el => el.url === activeTab.url);

      await chrome.tabs.move(tabToMove.id, { index: destinationIndex });

      // update ui
      updateSpaceState({ ...activeSpace, activeTabIndex: newActiveTabIndex });
      setActiveSpaceTabs(reOrderedTabs);

      // update tabs storage
      await setTabsForSpace(activeSpace.id, reOrderedTabs);

      // update space's active tab index, if changed
      if (activeSpace.activeTabIndex !== newActiveTabIndex) {
        await updateSpace(activeSpace.id, { ...activeSpace, activeTabIndex: newActiveTabIndex });
      }
    }
  };

  // dropped in non active space container
  const spaceContainerDropHandler = async ({
    draggableId,
    combineDraggableId,
    destinationIndex,
    sourceIndex,
  }: Pick<DropHandlerProps, 'draggableId' | 'combineDraggableId' | 'sourceIndex' | 'destinationIndex'>) => {
    if (combineDraggableId && typeof combineDraggableId === 'string') {
      // merge spaces
      const res = await mergeSpace(draggableId, combineDraggableId);

      if (res) {
        // update ui state
        removeSpaceState(draggableId);

        // show success snackbar
        setSnackbar({ show: true, msg: 'Space merged', isSuccess: true, isLoading: false });
      } else {
        setSnackbar({ show: true, msg: 'Failed to merge space', isSuccess: false, isLoading: false });
      }
    } else {
      // re-arrange spaces
      const reOrderedSpaces = [...alLSpacesState];

      const [spaceToMove] = reOrderedSpaces.splice(sourceIndex, 1);

      reOrderedSpaces.splice(destinationIndex, 0, spaceToMove);

      await setSpacesToStorage([...reOrderedSpaces]);

      setSpaces([...reOrderedSpaces]);
    }
  };

  //  open non-active space dropped in active space
  const nonActiveSpaceOpenTabsHandler = async ({ draggableId }: Pick<DropHandlerProps, 'draggableId'>) => {
    const spaceId = draggableId;
    const tabsInDraggedSpace = await getTabsInSpace(spaceId);

    // open tabs in active space window
    await createDiscardedTabs(tabsInDraggedSpace);

    // add tabs to active space

    setActiveSpaceTabs(prev => [...prev, ...tabsInDraggedSpace]);

    await wait(100);

    scrollActiveSpaceBottom();

    const tabsInActiveSpace = await getTabsInSpace(activeSpace.id);

    setTabsForSpace(spaceId, [...tabsInActiveSpace, ...tabsInDraggedSpace]);
  };

  // dropped in delete space zone
  const deleteSpaceDropHandler = ({ draggableId }: Pick<DropHandlerProps, 'draggableId'>) => {
    const spaceId = draggableId;

    setDeleteSpaceModal({ show: true, spaceId });
  };

  // main/root drop handler
  const dropHandler = async ({
    droppedLocation,
    combineDraggableId,
    destinationIndex,
    draggableId,
    sourceIndex,
  }: DropHandlerProps) => {
    switch (droppedLocation) {
      case 'ACTIVE_SPACE': {
        await activeSpaceDropHandler({ destinationIndex, sourceIndex });
        break;
      }
      case 'SPACES_CONTAINER': {
        await spaceContainerDropHandler({ combineDraggableId, destinationIndex, draggableId, sourceIndex });
        break;
      }
      case 'OPEN_NON_ACTIVE_SPACE_TABS': {
        await nonActiveSpaceOpenTabsHandler({ draggableId });
        break;
      }
      case 'DELETE_SPACE_ZONE': {
        deleteSpaceDropHandler({ draggableId });
        break;
      }
      default: {
        logger.info('[DnD] Unknown drop location.');
      }
    }
  };

  return {
    getDroppedLocation,
    dropHandler,
  };
};

//!not used - dropped in non active space
// const nonActiveSpaceDropHandler = async ({
//   droppableId,
//   sourceIndex,
// }: Pick<DropHandlerProps, 'droppableId' | 'sourceIndex'>) => {
//   // extract space id from droppable id
//   const droppedSpaceId = droppableId.split('space-')[1];

//   // active tab in current active space
//   const activeTab = activeSpaceTabs[activeSpace.activeTabIndex];

//   // remove tabs
//   const tabsToRemove = await removeTabsFromActiveSpace({
//     activeSpace,
//     tabs: activeSpaceTabs,
//     activeTab,
//     selectedTabs,
//     updateSpaceState: space => updateSpaceState(space),
//     updateTabs: tabs => setActiveSpaceTabs(tabs),
//     sourceIndex,
//   });

//   // add tab to new space
//   // get current tabs for dropped space
//   const droppedSpaceTabs = await getTabsInSpace(droppedSpaceId);

//   // set storage
//   await setTabsForSpace(droppedSpaceId, [...droppedSpaceTabs, ...tabsToRemove]);
// };

//! not used - dropped in new space zone
// const newSpaceDropHandler = async ({ sourceIndex }: Pick<DropHandlerProps, 'sourceIndex'>) => {
//   // active tab in current active space
//   const activeTab = activeSpaceTabs[activeSpace.activeTabIndex];
//   // remove tabs

//   const tabsToRemove = await removeTabsFromActiveSpace({
//     activeSpace,
//     tabs: activeSpaceTabs,
//     activeTab,
//     selectedTabs,
//     updateSpaceState: space => updateSpaceState(space),
//     updateTabs: tabs => setActiveSpaceTabs(tabs),
//     sourceIndex,
//   });

//   // show modal to create new space with the dragged tabs
//   setNewSpaceModal({ show: true, tabs: tabsToRemove });
// };

//!not used - helpers

// type RemoveTabsFromActiveSpaceProps = {
//   selectedTabs: ITab[];
//   activeSpace: ISpace;
//   tabs: ITab[];
//   updateSpaceState: (space: ISpace) => void;
//   updateTabs: (tabs: ITab[]) => void;
//   sourceIndex: number;
//   activeTab: ITab;
// };

// remove tab from current space
// const removeTabsFromActiveSpace = async ({
//   selectedTabs,
//   activeSpace,
//   tabs,
//   updateSpaceState,
//   updateTabs,
//   sourceIndex,
//   activeTab,
// }: RemoveTabsFromActiveSpaceProps): Promise<ITab[]> => {
//   let tabsToRemove: ITab[] = [];

//   if (selectedTabs?.length > 0) {
//     //  multiple tabs
//     tabsToRemove = selectedTabs.map(t => ({ id: t.id, url: t.url, title: t.title }));
//   } else {
//     // single tab
//     const tabToRemove = tabs[sourceIndex];
//     tabsToRemove.push(tabToRemove);
//   }
//   // update tabs
//   const activeSpaceUpdatedTabs = tabs.filter(tab => tabsToRemove.find(t => t.id !== tab.id));

//   const newActiveTabIndex = activeSpaceUpdatedTabs.findIndex(t => t.id === activeTab.id);

//   // close/remove tab from window
//   await Promise.allSettled(tabsToRemove.map(tab => chrome.tabs.remove(tab.id)));

//   // update ui state
//   updateSpaceState({ ...activeSpace, activeTabIndex: newActiveTabIndex });
//   updateTabs(activeSpaceUpdatedTabs);

//   // update  storage
//   await setTabsForSpace(activeSpace.id, activeSpaceUpdatedTabs);

//   if (newActiveTabIndex !== activeSpace.activeTabIndex) {
//     await updateSpace(activeSpace.id, { ...activeSpace, activeTabIndex: newActiveTabIndex });
//   }
//   return tabsToRemove;
// };
