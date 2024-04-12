import { useState } from 'react';
import { useAtom, useAtomValue, useSetAtom } from 'jotai';
import { ExitIcon, ExternalLinkIcon, Pencil1Icon, TrashIcon } from '@radix-ui/react-icons';

import Popover from '../../../../../../../components/popover';
import Tooltip from '../../../../../../../components/tooltip';
import { ISpace } from '@root/src/types/global.types';
import { getCurrentWindowId, openSpace } from '@root/src/services/chrome-tabs/tabs';
import { getTabsInSpace } from '@root/src/services/chrome-storage/tabs';
import { useMetaKeyPressed } from '@root/src/pages/sidepanel/hooks/use-key-shortcuts';
import {
  activeSpaceAtom,
  deleteSpaceModalAtom,
  setActiveSpaceAtom,
  showUpdateSpaceModalAtom,
  updateSpaceAtom,
} from '@root/src/stores/app';
import { getSpace } from '@root/src/services/chrome-storage/spaces';

type Props = {
  space: ISpace;
  isDraggedOver: boolean;
};

const NonActiveSpace = ({ space, isDraggedOver }: Props) => {
  console.log('🚀 ~ NonActiveSpace ~ 🔁 rendered');

  // global state/atom
  const [, setUpdateModal] = useAtom(showUpdateSpaceModalAtom);
  const [, setDeleteModal] = useAtom(deleteSpaceModalAtom);
  const activeSpace = useAtomValue(activeSpaceAtom);
  const setActiveSpace = useSetAtom(setActiveSpaceAtom);
  const updateSpaceState = useSetAtom(updateSpaceAtom);

  // local state
  const [showContextMenu, setShowContextMenu] = useState(false);

  const handleUpdateClick = async () => {
    const tabs = await getTabsInSpace(space.id);
    setUpdateModal({ ...space, tabs });
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

  const { isMetaKeyPressed } = useMetaKeyPressed({});

  return (
    <>
      <Popover
        open={showContextMenu}
        onChange={open => setShowContextMenu(open)}
        content={
          <>
            {/* context menu */}
            {/*  eslint-disable-next-line jsx-a11y/click-events-have-key-events, jsx-a11y/no-static-element-interactions */}
            <div
              onClick={() => setShowContextMenu(false)}
              className={`z-[999] flex flex-col text-[10px] text-slate-300/90 font-extralight whitespace-nowrap bg-brand-darkBg/95 
                          border border-brand-darkBgAccent/50 shadow-sm rounded shadow-brand-darkBgAccent/40`}>
              <div className=" py-[4px] px-[11px] text-center text-[10px]  text-slate-300 w-full">
                <span className="select-none">{space.emoji}&nbsp;</span>
                {'  '}
                {space.title}
              </div>
              <hr className="appearance-none h-[0.5px] bg-brand-darkBgAccent/70     border-none" />

              <button
                className="text-slate-300 cursor-default select-none group flex items-center pl-2 pr-[12px] py-[7px] transition-all duration-200 border-none outline-none hover:bg-brand-darkBgAccent/50 "
                onClick={() => handleOpenSpace()}>
                <ExitIcon className={`text-slate-500/90 mr-[5px] scale-[0.8]`} /> Switch Space
              </button>

              <button
                className="text-slate-300 cursor-default select-none group flex items-center pl-2 pr-[12px] py-[7px] transition-all duration-200 border-none outline-none hover:bg-brand-darkBgAccent/50"
                onClick={async () => await handleOpenSpace(true)}>
                <ExternalLinkIcon className={`text-slate-500/90 mr-[5px] scale-[0.8]`} /> Open in new window
              </button>

              <button
                className="text-slate-300 cursor-default select-none group flex items-center pl-2 pr-[12px] py-[7px] transition-all duration-200 border-none outline-none hover:bg-brand-darkBgAccent/50"
                onClick={handleUpdateClick}>
                <Pencil1Icon className={`text-slate-500/90 mr-[5px] scale-[0.8]`} />
                View/Update
              </button>

              <button
                className="text-slate-300 cursor-default select-none group flex items-center pl-2 pr-[12px] py-[7px] transition-all duration-200 border-none outline-none hover:bg-brand-darkBgAccent/50"
                onClick={handleDeleteClick}>
                <TrashIcon className={`text-slate-500/90 mr-[5px] scale-[0.8]`} /> Delete
              </button>
            </div>
          </>
        }>
        <div className="!size-full">
          <Tooltip label={!isDraggedOver ? `${isMetaKeyPressed ? 'Open' : ''} ${space.title}` : ''} delay={1500}>
            {/* eslint-disable-next-line jsx-a11y/click-events-have-key-events, jsx-a11y/no-static-element-interactions */}
            <div
              // eslint-disable-next-line jsx-a11y/no-noninteractive-tabindex
              tabIndex={0}
              onClick={async ev => {
                if (ev.type !== 'click') return;
                ev.preventDefault();
                ev.stopPropagation();

                if (isMetaKeyPressed) {
                  await handleOpenSpace(true);
                  return;
                }
                await handleOpenSpace();
              }}
              onContextMenu={ev => {
                if (ev.type !== 'contextmenu') return;

                setShowContextMenu(true);
                ev.preventDefault();
              }}
              className={`!size-full text-slate-300 px-[5px] py-[1.5px]  rounded-[6px] flex items-center justify-center border-[0.5px] border-transparent 
                          select-none outline-none focus-within:outline-slate-700 bg-gradient-to-bl  border-opacity-70
                      ${
                        isDraggedOver
                          ? 'from-brand-darkBgAccent/85 to-brand-darkBg/85'
                          : 'from-brand-darkBgAccent/95 to-brand-darkBg/90'
                      }
                    `}
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
              <span className="opacity-90 text-[3vw]">{space.emoji}</span>
            </div>
          </Tooltip>
        </div>
      </Popover>
    </>
  );
};

export default NonActiveSpace;
