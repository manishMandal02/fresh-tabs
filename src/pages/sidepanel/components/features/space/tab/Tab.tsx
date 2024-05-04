/* eslint-disable jsx-a11y/no-static-element-interactions */
/* eslint-disable jsx-a11y/click-events-have-key-events */
/* eslint-disable jsx-a11y/no-noninteractive-element-interactions */
import { memo } from 'react';
import { Cross1Icon, CopyIcon, ExternalLinkIcon, MoonIcon } from '@radix-ui/react-icons';

import { ITab } from '@root/src/types/global.types';
import { TAB_HEIGHT } from '../active-space/ActiveSpaceTabs';
import { createTab, goToTab } from '@root/src/services/chrome-tabs/tabs';
import { copyToClipboard } from '@root/src/utils/copy-to-clipboard';
import SiteIcon from '@root/src/components/site-icon/SiteIcon';
import { cn } from '@root/src/utils/cn';
import Tooltip from '@root/src/components/tooltip';

type Props = {
  tabData: ITab;
  showHoverOption?: boolean;
  isTabDiscarded?: boolean;
  isSpaceActive?: boolean;
  showDeleteOption?: boolean;
  hideIcon?: boolean;
  showVisitTime?: string;
  size?: 'sm' | 'md';
  showURL?: boolean;
  onClick?: () => void;
  onTabDelete?: () => Promise<void>;
  onTabDoubleClick?: (id: number) => void;
};

const Tab = ({
  tabData,
  onTabDelete,
  onClick,
  isSpaceActive,
  onTabDoubleClick,
  showVisitTime,
  isTabDiscarded = false,
  showDeleteOption = true,
  showHoverOption = true,
  showURL = false,
  hideIcon = false,
  size = 'md',
}: Props) => {
  console.log('🚀 ~ Tab ~ 🔁 rendered');

  // handle open tab
  const handleOpen = async () => {
    if (!isSpaceActive) {
      // if the tab is not active, create a new tab
      await createTab(tabData.url);
      return;
    }

    // if the space is active, just go to the tab
    await goToTab(tabData.id);
    onTabDoubleClick(tabData.id);
  };
  // handle copy tab url
  const handleCopyURL = async () => await copyToClipboard(tabData.url);

  return (
    <div
      tabIndex={-1}
      className={cn(
        `w-[99%] max-w-[99%] select-none z-[20] px-[10px] py-[12px] flex items-center justify-between outline-none
                   relative shadow-sm rounded-lg overflow-hidden group hover:bg-brand-darkBgAccent/50 transition-all duration-200`,
        { 'py-[6px]': size === 'sm' },
      )}
      onClick={onClick}
      style={{
        height: (size !== 'sm' ? TAB_HEIGHT : TAB_HEIGHT - 4) + 'px',
      }}
      onDoubleClick={() => onTabDoubleClick(tabData.id)}>
      <div className={cn(' flex items-center w-full', { 'opacity-85': isTabDiscarded })}>
        {!hideIcon ? (
          <>
            <SiteIcon
              siteURl={tabData.url}
              classes={cn(
                'size-[17px] max-w-[17px] z-10 border-none',
                { 'size-[14px]': size === 'sm' },
                { grayscale: isTabDiscarded },
              )}
            />
            {isTabDiscarded ? (
              <Tooltip label="💤  Discarded tab" delay={1000}>
                <MoonIcon className="z-[30] rounded-full text-slate-600 -ml-[2px] mr-[1.5px] scale-[0.85]" />
              </Tooltip>
            ) : null}
          </>
        ) : null}
        {/* site visit time (show in history) */}
        {showVisitTime ? (
          <span className="text-slate-500/70 font-light text-[8.5px] mr-[5px] -ml-1">{showVisitTime}</span>
        ) : null}
        {/* tab title with url */}
        <div className="flex items-center justify-start w-full max-w-full overflow-hidden ">
          <div className={cn({ 'w-full': !showURL }, { '!max-w-[50%]': showURL })}>
            <p
              className={cn(
                'text-[13px] text-slate-300/80 max-w-full whitespace-nowrap overflow-hidden text-ellipsis text-start',
                {
                  'text-[10px]': size === 'sm',
                },
              )}>
              {tabData.title?.trim() || 'No title'}
            </p>
          </div>
          {showURL ? (
            <div className="ml-1 w-full  overflow-hidden">
              <p className="text-[10px] text-slate-500/90 max-w-full text-ellipsis overflow-hidden whitespace-nowrap ">
                {tabData.url}
              </p>
            </div>
          ) : null}
        </div>
      </div>
      {showHoverOption ? (
        <span
          className="absolute opacity-0 hidden group-hover:flex group-hover:opacity-100 transition-all duration-300 right-[8px] items-center gap-x-3 shadow-md shadow-slate-800"
          onClick={ev => ev.stopPropagation()}>
          {/* open tab  */}
          {!isSpaceActive ? (
            <ExternalLinkIcon
              className={`text-slate-400 rounded bg-brand-darkBgAccent text-xs cursor-pointer py-[2px] px-[3.5px] scale-[1.6] transition-all duration-200 hover:bg-brand-darkBgAccent/95`}
              onClick={handleOpen}
            />
          ) : null}
          <CopyIcon
            className={`text-slate-400 rounded bg-brand-darkBgAccent text-xs cursor-pointer py-[2px] px-[3.5px] scale-[1.6] transition-all duration-200 hover:bg-brand-darkBgAccent/95`}
            onClick={handleCopyURL}
          />
          {showDeleteOption ? (
            <Cross1Icon
              className={`text-slate-400 rounded bg-brand-darkBgAccent text-xs cursor-pointer py-[2px] px-[3.5px] scale-[1.6] transition-all duration-200 hover:bg-brand-darkBgAccent/95`}
              onClick={onTabDelete}
            />
          ) : null}
        </span>
      ) : null}
    </div>
  );
};

export default memo(Tab);
