import { ITab } from '@root/src/pages/types/global.types';
import { getFaviconURL } from '@root/src/pages/utils';
import { copyToClipboard } from '@root/src/pages/utils/copy-to-clipboard';
import { createTab, goToTab } from '@root/src/services/chrome-tabs/tabs';
import { MdClose, MdContentCopy, MdOpenInNew, MdMyLocation } from 'react-icons/md';
import { motion } from 'framer-motion';

type Props = {
  tabData: ITab;
  showHoverOption?: boolean;
  onTabDelete?: () => Promise<void>;
  isTabActive: boolean;
  isSpaceActive?: boolean;
  showDeleteOption?: boolean;
};
const Tab = ({
  tabData,
  onTabDelete,
  isTabActive,
  isSpaceActive,
  showDeleteOption = true,
  showHoverOption = true,
}: Props) => {
  // handle open tab
  const handleOpen = async () => {
    if (!isSpaceActive) {
      // if the tab is not active, create a new tab
      await createTab(tabData.url);
      return;
    }

    // if the space is active, just go to the tab
    await goToTab(tabData.id);
  };
  // handle copy tab url
  const handleCopyURL = async () => await copyToClipboard(tabData.url);

  return (
    <div
      className={` w-full z-[10] relative px-2.5 py-1.5 flex   items-center justify-between shadow-sm rounded-lg overflow-hidden group h-[1.7rem]  ${
        isTabActive ? ' bg-brand-darkBgAccent' : ''
      }`}>
      <span className="flex items-center w-full ">
        <img className="w-4 h-4 mr-1.5 rounded-sm cursor-pointer z-10" src={getFaviconURL(tabData.url)} alt="icon" />
        <span className="text-xs text-slate-400 max-w-fit min-w-[80%] whitespace-nowrap overflow-hidden text-ellipsis">
          {tabData.title}
        </span>
      </span>
      {showHoverOption ? (
        <motion.span
          initial={{ x: 20, opacity: 0 }}
          whileInView={{ x: 0, opacity: 1, animationDuration: '0.5s', transition: { delay: 0.25 } }}
          className="absolute hidden group-hover:flex right-2 bottom-px items-center gap-x-3 bg-brand-darkBgAccent px-2 py-1.5 rounded">
          {/* go to tab */}
          {isSpaceActive && !isTabActive ? (
            <>
              <MdMyLocation
                className={` text-slate-500 text-xs cursor-pointer py-[1.5px] px-[1.5px] scale-[1.65] transition-all duration-200 hover:bg-brand-darkBg/50`}
                onClick={handleOpen}
              />
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
    </div>
  );
};

export default Tab;
