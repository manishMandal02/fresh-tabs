import { useAtomValue, useSetAtom } from 'jotai';

import Tooltip from '@root/src/components/tooltip';
import { ISpace } from '@root/src/types/global.types';
import NonActiveSpaceContextMenu from './NonActiveSpaceContextMenu';
import { getGroups } from '@root/src/services/chrome-storage/groups';
import { getTabsInSpace } from '@root/src/services/chrome-storage/tabs';
import { getSpace, mergeSpace } from '@root/src/services/chrome-storage/spaces';
import { getCurrentWindowId, openSpace } from '@root/src/services/chrome-tabs/tabs';
import { useMetaKeyPressed } from '@root/src/pages/sidepanel/hooks/use-key-shortcuts';
import {
  activeSpaceAtom,
  deleteSpaceModalAtom,
  removeSpaceAtom,
  setActiveSpaceAtom,
  showUpdateSpaceModalAtom,
  snackbarAtom,
  updateSpaceAtom,
} from '@root/src/stores/app';
import { cn } from '@root/src/utils/cn';

type Props = {
  space: ISpace;
  totalSpaces: number;
  isDraggedOver: boolean;
};

const NonActiveSpace = ({ space, isDraggedOver, totalSpaces }: Props) => {
  console.log('🚀 ~ NonActiveSpace ~ 🔁 rendered');

  // global state/atom
  const activeSpace = useAtomValue(activeSpaceAtom);
  const removeSpace = useSetAtom(removeSpaceAtom);
  const setSnackbarState = useSetAtom(snackbarAtom);
  const updateSpaceState = useSetAtom(updateSpaceAtom);
  const setActiveSpace = useSetAtom(setActiveSpaceAtom);
  const setDeleteModal = useSetAtom(deleteSpaceModalAtom);
  const setUpdateModal = useSetAtom(showUpdateSpaceModalAtom);

  const handleUpdateClick = async () => {
    const tabs = await getTabsInSpace(space.id);
    const groups = await getGroups(space.id);

    setUpdateModal({ ...space, tabs, groups });
  };

  const handleDeleteClick = async () => {
    setDeleteModal({ show: true, spaceId: space.id });
  };

  const handleOpenSpace = async (shouldOpenInNewWindow = false) => {
    if (!shouldOpenInNewWindow && activeSpace.id === space.id) return;
    const tabs = await getTabsInSpace(space.id);

    await openSpace({ space, tabs, shouldOpenInNewWindow });

    if (!shouldOpenInNewWindow) {
      // update ui state
      // remove current window id from the previous space
      const previousActiveSpace = await getSpace(activeSpace.id);
      updateSpaceState({ ...previousActiveSpace, windowId: 0 });

      const windowId = await getCurrentWindowId();

      // update new active space
      setActiveSpace(space.id);
      updateSpaceState({ ...space, windowId });
    }
  };

  const handleMergeSpace = async (spaceId: string, mergeToSpace: string) => {
    //  merge spaces
    const res = await mergeSpace(spaceId, mergeToSpace);
    if (res) {
      removeSpace(spaceId);
      setSnackbarState({ show: true, msg: 'Space merged', isSuccess: true, isLoading: false });
    } else {
      setSnackbarState({ show: true, msg: 'Failed to merge space', isSuccess: false, isLoading: false });
    }
  };

  const { isMetaKeyPressed } = useMetaKeyPressed({});

  return (
    <NonActiveSpaceContextMenu
      spaceId={space.id}
      spaceLabel={`${space.emoji} ${'  '} ${space.title}`}
      onDelete={handleDeleteClick}
      onSwitchSpace={() => {
        handleOpenSpace(false);
      }}
      onOpenSpaceInNewWindow={() => {
        handleOpenSpace(true);
      }}
      onUpdate={handleUpdateClick}
      onMergeClick={spaceToMerge => {
        handleMergeSpace(space.id, spaceToMerge);
      }}>
      <div>
        <Tooltip label={!isDraggedOver ? `${isMetaKeyPressed ? 'Open' : ''} ${space.title}` : ''} delay={1200}>
          {/* eslint-disable-next-line jsx-a11y/click-events-have-key-events, jsx-a11y/no-static-element-interactions */}
          <div
            onClick={async ev => {
              if (ev.type !== 'click' || !isMetaKeyPressed) return;

              await handleOpenSpace(false);
            }}
            className={cn(
              '!size-full text-slate-300 px-[4px] py-[1.5px]  rounded-[6px] flex items-center justify-center border-[0.5px] border-transparent  select-none outline-none focus-within:outline-slate-700 bg-gradient-to-bl  border-opacity-70 from-brand-darkBgAccent/95 to-brand-darkBg/90',
              { 'from-brand-darkBgAccent/85 to-brand-darkBg/85': isDraggedOver },
            )}
            style={{
              ...(isDraggedOver
                ? {
                    border: '1px solid' + space.theme,
                  }
                : {}),
              backgroundColor: space.theme,
              cursor: !isMetaKeyPressed ? 'default' : 'pointer',
              borderColor: activeSpace.id === space.id ? space.theme : '',
            }}>
            <span
              className="opacity-90 "
              style={{
                fontSize: totalSpaces > 10 ? '2vw' : totalSpaces > 15 ? '1.5vw' : '3vw',
              }}>
              {space.emoji}
            </span>
          </div>
        </Tooltip>
      </div>
    </NonActiveSpaceContextMenu>
  );
};

export default NonActiveSpace;
