/* eslint-disable jsx-a11y/no-static-element-interactions */
/* eslint-disable jsx-a11y/click-events-have-key-events */
/* eslint-disable jsx-a11y/no-noninteractive-element-interactions */
import { ITab } from '@root/src/pages/types/global.types';
import { getFaviconURL } from '@root/src/pages/utils';
import { copyToClipboard } from '@root/src/pages/utils/copy-to-clipboard';
import { createTab, goToTab } from '@root/src/services/chrome-tabs/tabs';
import { MdClose, MdContentCopy, MdOpenInNew, MdOutlineAdd } from 'react-icons/md';
import { motion } from 'framer-motion';
import { parseURL } from '@root/src/pages/utils/parseURL';

type Props = {
  tabData: ITab;
  isSelected?: boolean;
  isModifierKeyPressed: boolean;
  onClick?: () => void;
  showHoverOption?: boolean;
  onTabDelete?: () => Promise<void>;
  isTabActive: boolean;
  isSpaceActive?: boolean;
  showDeleteOption?: boolean;
  onTabDoubleClick?: (id: number) => void;
  onCreateNewTab?: () => void;
};
const Tab = ({
  tabData,
  onTabDelete,
  isTabActive,
  onCreateNewTab,
  // isSelected,
  onClick,
  isSpaceActive,
  onTabDoubleClick,
  isModifierKeyPressed,
  showDeleteOption = true,
  showHoverOption = true,
}: Props) => {
  // local state

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

  const bounceDivAnimation = {
    initial: { scale: 0, opacity: 0 },
    animate: {
      scale: 1,
      opacity: 1,
    },
    exit: { scale: 0, opacity: 0 },
    transition: { type: 'spring', stiffness: 900, damping: 40 },
  };

  const generateFaviconURL = () => {
    const tabURL = parseURL(tabData.url);

    return getFaviconURL(tabURL);
  };

  return (
    <motion.div
      {...bounceDivAnimation}
      tabIndex={0}
      className={` w-full select-none z-[20] px-2 py-[5px] flex relative 
                 items-center justify-between shadow-sm rounded-lg overflow-hidden group h-[1.7rem]`}
      style={{
        cursor: isModifierKeyPressed ? 'pointer' : '',
      }}
      onClick={onClick}
      onDoubleClick={() => onTabDoubleClick(tabData.id)}>
      <div className="flex items-center w-full ">
        <div className=" flex relative items-start min-w-[1.2rem] mr-1.5">
          <img className=" opacity-95 visible  w-4 h-4 z-10 rounded-sm  " src={generateFaviconURL()} alt="icon" />
          {/* <span
            className="hidden peer-hover:flex bg-emerald-500/50 z-20 rounded-md absolute w-5 h-5 top-0 left-0"
            style={{
              display: isSelected ? 'flex' : 'hidden',
            }}
            onClick={onClick}></span> */}
        </div>
        <span className="text-xs text-slate-400 max-w-fit min-w-[80%] whitespace-nowrap overflow-hidden text-ellipsis">
          {tabData.title.trim()}
        </span>
      </div>
      {showHoverOption ? (
        <motion.span
          initial={{ x: 20, opacity: 0 }}
          whileInView={{ x: 0, opacity: 1, animationDuration: '0.4s', transition: { delay: 0.1 } }}
          exit={{ x: 20, opacity: 0 }}
          className="absolute hidden group-hover:flex right-2 bottom-px items-center gap-x-3 bg-brand-darkBgAccent px-2 py-1.5 rounded">
          {/* go to tab */}

          {isSpaceActive && !isTabActive ? (
            <>
              {/* <MdMyLocation
                className={` text-slate-500 text-xs cursor-pointer py-[1.5px] px-[1.5px] scale-[1.65] transition-all duration-200 hover:bg-brand-darkBg/50`}
                onClick={handleOpen}
              /> */}
              {/* <span className="h-px w-px bg-slate-200" /> */}
            </>
          ) : null}
          {/* open tab  */}
          {!isSpaceActive ? (
            <MdOpenInNew
              className={` text-slate-500 text-xs cursor-pointer py-[1.5px] px-[1.5px] scale-[1.65] transition-all duration-200 hover:bg-brand-darkBg/50`}
              onClick={handleOpen}
            />
          ) : null}

          {isSpaceActive ? (
            <>
              <MdOutlineAdd
                className={` text-slate-500 text-xs cursor-pointer py-[1.5px] px-[1.5px] scale-[1.65] transition-all duration-200 hover:bg-brand-darkBg/50`}
                onClick={onCreateNewTab}
              />
              {/* <span className="h-px w-px bg-slate-200" /> */}
            </>
          ) : null}

          <MdContentCopy
            className={` text-slate-500 text-xs cursor-pointer py-[1.5px] px-[1.5px] scale-[1.65] transition-all duration-200 hover:bg-brand-darkBg/50`}
            onClick={handleCopyURL}
          />
          {showDeleteOption ? (
            <MdClose
              className={` text-slate-500 text-xs cursor-pointer py-[1.5px] px-[1.5px] scale-[1.65] transition-all duration-200 hover:bg-brand-darkBg/50`}
              onClick={onTabDelete}
            />
          ) : null}
        </motion.span>
      ) : null}
    </motion.div>
  );
};

export default Tab;
