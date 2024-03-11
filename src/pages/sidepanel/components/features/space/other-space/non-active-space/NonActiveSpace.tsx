import { useState } from 'react';
import { useAtom } from 'jotai';
import { ExitIcon, ExternalLinkIcon, Pencil1Icon, TrashIcon } from '@radix-ui/react-icons';

import Popover from '../../../../elements/popover';
import Tooltip from '../../../../elements/tooltip';
import { ISpace } from '@root/src/pages/types/global.types';
import { openSpace } from '@root/src/services/chrome-tabs/tabs';
import { getTabsInSpace } from '@root/src/services/chrome-storage/tabs';
import { activeSpaceAtom, deleteSpaceModalAtom, updateSpaceModalAtom } from '@root/src/stores/app';
import { useKeyPressed } from '@root/src/pages/sidepanel/hooks/useKeyPressed';

type Props = {
  space: ISpace;
  isDraggedOver: boolean;
};

const NonActiveSpace = ({ space, isDraggedOver }: Props) => {
  // global state/atom
  const [, setUpdateModal] = useAtom(updateSpaceModalAtom);
  const [, setDeleteModal] = useAtom(deleteSpaceModalAtom);
  const [activeSpace, setActiveSpace] = useAtom(activeSpaceAtom);

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
    const tabs = await getTabsInSpace(space.id);

    await openSpace({ space, tabs, shouldOpenInNewWindow });
    if (!shouldOpenInNewWindow) {
      const tabsInSpace = await getTabsInSpace(space.id);
      setActiveSpace({ ...space, tabs: tabsInSpace });
    }
  };
  const { isModifierKeyPressed } = useKeyPressed({ monitorModifierKeys: true });

  console.log('🚀 ~ NonActiveSpace ~ isModifierKeyPressed:', isModifierKeyPressed);

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
          <Tooltip label={!isDraggedOver ? `${isModifierKeyPressed ? 'Open' : ''} ${space.title}` : ''}>
            {/* eslint-disable-next-line jsx-a11y/click-events-have-key-events, jsx-a11y/no-static-element-interactions */}
            <div
              // eslint-disable-next-line jsx-a11y/no-noninteractive-tabindex
              tabIndex={0}
              onClick={async ev => {
                if (ev.type === 'contextmenu') return;
                if (isModifierKeyPressed) {
                  await handleOpenSpace(true);
                  return;
                }
                await handleOpenSpace();
                ev.stopPropagation();
                ev.preventDefault();
              }}
              onContextMenu={ev => {
                setShowContextMenu(true);
                ev.preventDefault();
              }}
              className={`!size-full text-slate-300 px-[5px] py-px  rounded-[6px] flex items-center justify-center border-[0.5px] border-transparent 
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
                cursor: !isModifierKeyPressed ? 'default' : 'pointer',
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
