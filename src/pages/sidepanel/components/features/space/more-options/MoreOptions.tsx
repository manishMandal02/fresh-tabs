import {
  DotsVerticalIcon,
  Pencil1Icon,
  TrashIcon,
  OpenInNewWindowIcon,
  EnterIcon,
  UpdateIcon,
  CounterClockwiseClockIcon,
  LapTimerIcon,
} from '@radix-ui/react-icons';
import Popover from '../../../elements/popover';
import { useState } from 'react';

type Props = {
  isSpaceActive: boolean;
  shouldOpenInNewWindow: boolean;
  onOpenSpace?: () => void;
  onHistoryClick?: () => void;
  onSnoozedTabsClick?: () => void;
  onEditClick: () => void;
  onSyncClick: () => void;
  onDeleteClick: () => void;
};

const MoreOptions = ({
  isSpaceActive,
  onEditClick,
  onSyncClick,
  shouldOpenInNewWindow,
  onOpenSpace,
  onDeleteClick,
  onHistoryClick,
  onSnoozedTabsClick,
}: Props) => {
  const [showMenu, setShowMenu] = useState(false);
  return (
    <Popover
      open={showMenu}
      onChange={open => setShowMenu(open)}
      content={
        <>
          {/*  eslint-disable-next-line jsx-a11y/click-events-have-key-events, jsx-a11y/no-static-element-interactions */}
          <div
            onClick={() => setShowMenu(false)}
            className={`flex flex-col text-[10.5px] text-slate-300/80 font-light whitespace-nowrap w-[8.5rem] bg-brand-darkBg/95  
                     border border-brand-darkBgAccent/40 shadow-sm rounded shadow-brand-darkBgAccent/50`}>
            {!isSpaceActive ? (
              <>
                {!shouldOpenInNewWindow ? (
                  <button
                    className="flex items-center pl-2 py-2.5 hover:bg-brand-darkBgAccent/15 transition-all duration-200 border-none outline-none focus-visible:bg-brand-darkBgAccent/30"
                    onClick={onOpenSpace}>
                    <OpenInNewWindowIcon className={`text-slate-500/90 mr-[5px] scale-[0.8]`} /> Open in new window
                  </button>
                ) : (
                  <button
                    className="flex items-center pl-2 py-2.5 hover:bg-brand-darkBgAccent/15 transition-all duration-200 border-none outline-none focus-visible:bg-brand-darkBgAccent/30"
                    onClick={onOpenSpace}>
                    <EnterIcon className="text-slate-500/90 mr-[5px] scale-[0.8]" /> Open Space
                  </button>
                )}
              </>
            ) : null}
            <button
              className="flex items-center pl-2 py-2.5 hover:bg-brand-darkBgAccent/15 transition-all duration-200 border-none outline-none focus-visible:bg-brand-darkBgAccent/30"
              onClick={onHistoryClick}>
              <CounterClockwiseClockIcon className="text-slate-500/90 mr-[5px] scale-[0.8]" /> Space history
            </button>
            <button
              className="flex items-center pl-2 py-2.5 hover:bg-brand-darkBgAccent/15 transition-all duration-200 border-none outline-none focus-visible:bg-brand-darkBgAccent/30"
              onClick={onSnoozedTabsClick}>
              <LapTimerIcon className="text-slate-500/90 mr-[5px] scale-[0.8]" /> Snoozed tabs
            </button>
            <button
              className="flex items-center pl-2 py-2.5 hover:bg-brand-darkBgAccent/15 transition-all duration-200 border-none outline-none focus-visible:bg-brand-darkBgAccent/30"
              onClick={onSyncClick}>
              <UpdateIcon className="text-slate-500/90 mr-[5px] scale-[0.8]" /> Sync tabs
            </button>
            <button
              className="flex items-center pl-2 py-2.5 hover:bg-brand-darkBgAccent/15 transition-all duration-200 border-none outline-none focus-visible:bg-brand-darkBgAccent/30"
              onClick={onEditClick}>
              <Pencil1Icon className="text-slate-500/90 mr-[5px] scale-[0.8]" /> Update Space
            </button>
            <button
              className="flex items-center pl-2 py-2.5 hover:bg-brand-darkBgAccent/15 transition-all duration-200 border-none outline-none focus-visible:bg-brand-darkBgAccent/30"
              onClick={onDeleteClick}>
              <TrashIcon className="text-slate-500/90 mr-[5px] scale-[0.85]" /> Delete space
            </button>
          </div>
        </>
      }>
      <button
        tabIndex={0}
        onClick={() => setShowMenu(true)}
        className={`text-slate-500/90 hover:bg-brand-darkBgAccent/20 rounded-full px-2 py-2 transition-all duration-200 outline-none focus:bg-brand-darkBgAccent/50 ${
          showMenu ? 'bg-brand-darkBgAccent/30' : ''
        }`}>
        <DotsVerticalIcon className="scale-[1.1]" />
      </button>
    </Popover>
  );
};

export default MoreOptions;
