/* eslint-disable jsx-a11y/no-static-element-interactions */
/* eslint-disable jsx-a11y/click-events-have-key-events */
/* eslint-disable jsx-a11y/no-noninteractive-element-interactions */
import { memo } from 'react';
import { Cross1Icon, CopyIcon, ExternalLinkIcon } from '@radix-ui/react-icons';

import { ITab } from '@root/src/pages/types/global.types';
import { getFaviconURL } from '@root/src/pages/utils/url';
import { TAB_HEIGHT } from '../active-space/ActiveSpaceTabs';
import { createTab, goToTab } from '@root/src/services/chrome-tabs/tabs';
import { copyToClipboard } from '@root/src/pages/utils/copy-to-clipboard';

type Props = {
  tabData: ITab & { faviconUrl?: string };
  showHoverOption?: boolean;
  isSpaceActive?: boolean;
  showDeleteOption?: boolean;
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
  showDeleteOption = true,
  showHoverOption = true,
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
      className={`w-[99%] max-w-[99%] select-none z-[20] px-[10px] py-[12px] flex items-center justify-between outline-none
                   relative shadow-sm rounded-lg overflow-hidden group hover:bg-brand-darkBgAccent/50 transition-all duration-200`}
      onClick={onClick}
      style={{
        height: TAB_HEIGHT + 'px',
      }}
      onDoubleClick={() => onTabDoubleClick(tabData.id)}>
      <div className="flex items-center w-full">
        <img
          className="mr-[8px] opacity-90  size-[17px] max-w-[17px] z-10 rounded-sm object-contain object-center"
          src={tabData.faviconUrl || getFaviconURL(tabData.url)}
          alt="icon"
        />
        <span className="text-[13px] text-slate-300/80 min-w-[80%] max-w-[95%] text-start whitespace-nowrap overflow-hidden text-ellipsis">
          {tabData.title?.trim() || 'No title'}
        </span>
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
