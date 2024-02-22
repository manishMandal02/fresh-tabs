/* eslint-disable jsx-a11y/no-static-element-interactions */
/* eslint-disable jsx-a11y/click-events-have-key-events */
/* eslint-disable jsx-a11y/no-noninteractive-element-interactions */
import { ITab } from '@root/src/pages/types/global.types';
import { getFaviconURL } from '@root/src/pages/utils/url';
import { copyToClipboard } from '@root/src/pages/utils/copy-to-clipboard';
import { createTab, goToTab } from '@root/src/services/chrome-tabs/tabs';
import { MdClose, MdContentCopy, MdOpenInNew, MdOutlineAdd } from 'react-icons/md';
import { motion } from 'framer-motion';
import { useCustomAnimation } from '../../../hooks/useAnimation';

type Props = {
  tabData: ITab;
  isTabActive: boolean;
  isModifierKeyPressed: boolean;
  isSelected?: boolean;
  showHoverOption?: boolean;
  isSpaceActive?: boolean;
  showDeleteOption?: boolean;
  onClick?: () => void;
  onTabDelete?: () => Promise<void>;
  onCreateNewTab?: () => void;
  onTabDoubleClick?: (id: number) => void;
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

  const { bounce } = useCustomAnimation();

  return (
    <motion.div
      {...bounce}
      tabIndex={0}
      className={` w-full select-none z-[20] px-2 py-[5px] flex relative 
                 items-center justify-between shadow-sm rounded-lg overflow-hidden group h-[1.7rem]`}
      style={{
        cursor: isModifierKeyPressed ? 'pointer' : '',
      }}
      onClick={onClick}
      onDoubleClick={() => onTabDoubleClick(tabData.id)}>
      <div className="flex items-center w-full ">
        <img className=" mr-2 opacity-95  w-4 h-4 z-10 rounded-sm  " src={getFaviconURL(tabData.url)} alt="icon" />
        <span className="text-xs text-slate-400 max-w-fit min-w-[80%] text-start whitespace-nowrap overflow-hidden text-ellipsis">
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
