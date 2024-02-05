import { SetStateAction, useAtom } from 'jotai';
import { ISpaceWithTabs, ITab } from '../../types/global.types';
import { activeSpaceAtom, deleteSpaceModalAtom, newSpaceModalAtom, selectedTabsAtom } from '@root/src/stores/app';
import { updateSpace } from '@root/src/services/chrome-storage/spaces';
import { getTabsInSpace, setTabsForSpace } from '@root/src/services/chrome-storage/tabs';

// dropped reasons to handle
// --draggable -single/multi tab--
//       same space
//       other space
//       create new space
//
//       same space
//       other spaces
//       create new space
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

type UseTabDndProps = {
  destinationIndex: number;
  sourceIndex: number;
  draggableId: string;
  droppableId: string;
};

export const useTabsDnd = ({ draggableId, droppableId, sourceIndex, destinationIndex }: UseTabDndProps) => {
  // non active spaces  (global state)
  //   const [nonActiveSpaces, setNonActiveSpaces] = useAtom(nonActiveSpacesAtom);

  // new space modal global state
  const [, setNewSpaceModal] = useAtom(newSpaceModalAtom);

  // active space atom (global state)
  const [activeSpace, setActiveSpace] = useAtom(activeSpaceAtom);
  // active space atom (global state)
  const [, setDeleteSpaceModal] = useAtom(deleteSpaceModalAtom);

  // selected tabs (global state)
  const [selectedTabs] = useAtom(selectedTabsAtom);

  let droppedLocation: DropLocations = 'ACTIVE_SPACE';

  // --droppable ids
  // space-
  // active-space
  // open-non-active-space-tabs
  // other-spaces
  // add-new-space
  // delete-space

  // determine the drop location
  if (droppableId.startsWith('space-')) {
    droppedLocation = 'NON_ACTIVE_SPACE';
  } else {
    switch (droppableId) {
      case 'active-space':
        droppedLocation = 'ACTIVE_SPACE';
        break;
      case 'open-non-active-space-tabs':
        droppedLocation = 'OPEN_NON_ACTIVE_SPACE_TABS';
        break;
      case 'other-spaces':
        droppedLocation = 'SPACES_CONTAINER';
        break;
      case 'add-new-space':
        droppedLocation = 'NEW_SPACE_ZONE';
        break;
      case 'delete-space':
        droppedLocation = 'DELETE_SPACE_ZONE';
        break;
    }
  }

  //** drop handlers based on drop locations
  // dropped in active space
  const activeSpaceDropHandler = async () => {
    const activeTab = activeSpace?.tabs[activeSpace.activeTabIndex];

    let reOrderedTabs = [...activeSpace.tabs];

    if (selectedTabs?.length > 0) {
      // multi tab drop
      // remove selected tabs for active space
      reOrderedTabs = reOrderedTabs.filter(aT => !selectedTabs.find(sT => sT.id === aT.id));

      // check if the tabs are moved up or down from it's previous pos
      const didTabsMoveDownward = sourceIndex < destinationIndex;

      // calculate dropped index
      const droppedIndex = didTabsMoveDownward ? 1 + destinationIndex - selectedTabs.length : destinationIndex;

      // sort the selected tabs by index
      const sortedSelectedTabs: ITab[] = selectedTabs
        .toSorted((t1, t2) => (t1.index > t2.index ? 1 : -1))
        .map(t => ({ id: t.id, title: t.title, url: t.url }));

      // add selected tabs at dropped pos in active space
      reOrderedTabs = reOrderedTabs.toSpliced(droppedIndex, 0, ...sortedSelectedTabs);

      // find new active tab index
      const newActiveTabIndex = reOrderedTabs.findIndex(el => el.url === activeTab.url);

      setActiveSpace(prev => ({ ...prev, tabs: reOrderedTabs, activeTabIndex: newActiveTabIndex }));

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
      // update storage
      await setTabsForSpace(activeSpace.id, reOrderedTabs);
      // update space's active tab index, if changed
      if (activeSpace.activeTabIndex !== newActiveTabIndex) {
        await updateSpace(activeSpace.id, { ...activeSpace, activeTabIndex: newActiveTabIndex });
      }

      // update ui
      setActiveSpace({
        ...activeSpace,
        activeTabIndex: newActiveTabIndex,
        tabs: reOrderedTabs,
      });
    }
  };

  // dropped in non active space
  const nonActiveSpaceDropHandler = async () => {
    // extract space id from droppable id
    const droppedSpaceId = droppableId.split('space-')[1];

    // active tab in current active space
    const activeTab = activeSpace?.tabs[activeSpace.activeTabIndex];

    // remove tabs
    const tabsToRemove = await removeTabsFromActiveSpace({
      activeSpace,
      activeTab,
      selectedTabs,
      setActiveSpace,
      sourceIndex,
    });

    // add tab to new space
    // get current tabs for dropped space
    const droppedSpaceTabs = await getTabsInSpace(droppedSpaceId);

    // set storage
    await setTabsForSpace(droppedSpaceId, [...droppedSpaceTabs, ...tabsToRemove]);
  };

  // dropped in new space zone
  const newSpaceDropHandler = async () => {
    // active tab in current active space
    const activeTab = activeSpace?.tabs[activeSpace.activeTabIndex];
    // remove tabs
    const tabsToRemove = await removeTabsFromActiveSpace({
      activeSpace,
      activeTab,
      selectedTabs,
      setActiveSpace,
      sourceIndex,
    });

    // show modal to create new space with the dragged tabs
    setNewSpaceModal({ show: true, tabs: tabsToRemove });
  };

  // TODO - dropped in non-active spaces container
  const spaceContainerDropHandler = async () => {
    // merge spaces
    // re-arrange spaces
  };

  //  open non-active space dropped in active space
  const nonActiveSpaceOpenTabsHandler = async () => {
    const spaceId = draggableId;
    const tabsInSpace = await getTabsInSpace(spaceId);

    // open tabs in active space window
    await Promise.allSettled(tabsInSpace.map(tab => chrome.tabs.create({ url: tab.url })));

    // add tabs to active space
    setActiveSpace(prev => ({ ...prev, tabs: [...prev.tabs, ...tabsInSpace] }));
  };

  // dropped in delete space zone
  const deleteSpaceDropHandler = () => {
    const spaceId = draggableId;

    setDeleteSpaceModal({ show: true, spaceId });
  };

  const dropHandler = async (droppedLocation: DropLocations) => {
    switch (droppedLocation) {
      case 'ACTIVE_SPACE': {
        await activeSpaceDropHandler();
        break;
      }
      case 'NON_ACTIVE_SPACE': {
        await nonActiveSpaceDropHandler();
        break;
      }
      case 'NEW_SPACE_ZONE': {
        await newSpaceDropHandler();
        break;
      }
      case 'SPACES_CONTAINER': {
        await spaceContainerDropHandler();
        break;
      }
      case 'OPEN_NON_ACTIVE_SPACE_TABS': {
        await nonActiveSpaceOpenTabsHandler();
        break;
      }
      case 'DELETE_SPACE_ZONE': {
        deleteSpaceDropHandler();
        break;
      }
    }
  };

  return {
    dropHandler,
    droppedLocation,
  };
};

//** helpers

type RemoveTabsFromActiveSpaceProps = {
  selectedTabs: ITab[];
  activeSpace: ISpaceWithTabs;
  setActiveSpace: (args_0: SetStateAction<ISpaceWithTabs>) => void;
  sourceIndex: number;
  activeTab: ITab;
};

// remove tab from current space
const removeTabsFromActiveSpace = async ({
  selectedTabs,
  activeSpace,
  setActiveSpace,
  sourceIndex,
  activeTab,
}: RemoveTabsFromActiveSpaceProps): Promise<ITab[]> => {
  let tabsToRemove: ITab[] = [];

  if (selectedTabs?.length > 0) {
    //  multiple tabs
    tabsToRemove = selectedTabs.map(t => ({ id: t.id, url: t.url, title: t.title }));
  } else {
    // single tab
    const tabToRemove = activeSpace.tabs[sourceIndex];
    tabsToRemove.push(tabToRemove);
  }
  // update tabs
  const activeSpaceUpdatedTabs = activeSpace.tabs.filter(tab => !tabsToRemove.find(t => t.id !== tab.id));

  const newActiveTabIndex = activeSpaceUpdatedTabs.findIndex(t => t.id === activeTab.id);

  // close/remove tab from window
  await Promise.allSettled(tabsToRemove.map(tab => chrome.tabs.remove(tab.id)));

  // update ui state
  setActiveSpace(prev => ({ ...prev, tabs: activeSpaceUpdatedTabs, activeTabIndex: newActiveTabIndex }));
  // update  storage
  await setTabsForSpace(activeSpace.id, activeSpaceUpdatedTabs);

  if (newActiveTabIndex !== activeSpace.activeTabIndex) {
    await updateSpace(activeSpace.id, { ...activeSpace, activeTabIndex: newActiveTabIndex });
  }
  return tabsToRemove;
};
