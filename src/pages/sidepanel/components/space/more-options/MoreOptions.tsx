import * as DropdownMenuRadix from '@radix-ui/react-dropdown-menu';
import { MdMoreVert, MdEdit, MdSync, MdDelete, MdOutlineOpenInBrowser, MdOpenInNew } from 'react-icons/md';

type Props = {
  isSpaceActive: boolean;
  shouldOpenInNewWindow: boolean;
  onOpenSpace?: () => void;
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
}: Props) => {
  return (
    <DropdownMenuRadix.Root>
      <DropdownMenuRadix.Trigger asChild>
        <span>
          <MdMoreVert
            tabIndex={0}
            className="text-slate-500/80 cursor-pointer hover:opacity-95 transition-all duration-200 -ml-1 mt-[5px]"
            size={18}
          />
        </span>
      </DropdownMenuRadix.Trigger>

      <DropdownMenuRadix.Portal>
        <DropdownMenuRadix.Content
          className={`min-w-28 z-[9999] py-1 bg-slate-900 text-slate-400 rounded data-[side=top]:animate-slideDownAndFade 
                    shadow-[0px_10px_38px_-10px_rgba(22,_23,_24,_0.35),_0px_10px_20px_-15px_rgba(22,_23,_24,_0.2)]  
                    data-[side=right]:animate-slideLeftAndFade data-[side=bottom]:animate-slideUpAndFade data-[side=left]:animate-slideRightAndFade`}
          sideOffset={5}
          onClick={ev => {
            ev.stopPropagation();
          }}>
          {!isSpaceActive ? (
            <DropdownMenuRadix.Item
              className={`group text-xs px-1.5 py-2 pr-4 hover:bg-slate-800 cursor-pointer 
                    transition-all duration-200 leading-none flex items-center  relative select-none outline-none`}
              onClick={onOpenSpace}>
              <>
                {!shouldOpenInNewWindow ? (
                  <>
                    <MdOpenInNew className="mr-1 opacity-70 text-xs" /> Open in new window
                  </>
                ) : (
                  <>
                    <MdOutlineOpenInBrowser className="mr-1 opacity-70 text-xs" /> Open Space
                  </>
                )}
              </>
            </DropdownMenuRadix.Item>
          ) : null}
          <DropdownMenuRadix.Item
            className="group text-xs px-1.5 py-2 hover:bg-slate-800 cursor-pointer transition-all duration-200 leading-none flex items-center  relative select-none outline-none "
            onClick={onEditClick}>
            <MdEdit className="mr-1 opacity-70 text-xs" /> Edit
          </DropdownMenuRadix.Item>
          {isSpaceActive ? (
            <DropdownMenuRadix.Item
              className="group text-xs px-1.5 py-2 hover:bg-slate-800 cursor-pointer transition-all duration-200 leading-none flex items-center  relative select-none outline-none "
              onClick={onSyncClick}>
              <MdSync className="mr-1 opacity-70 text-xs" /> Sync Tabs
            </DropdownMenuRadix.Item>
          ) : null}
          <DropdownMenuRadix.Item
            className="group text-xs px-1.5 py-2 hover:bg-slate-800 cursor-pointer transition-all duration-200 leading-none flex items-center  relative select-none outline-none "
            onClick={onDeleteClick}>
            <MdDelete className="mr-1 opacity-70 text-xs" /> Delete
          </DropdownMenuRadix.Item>
        </DropdownMenuRadix.Content>
      </DropdownMenuRadix.Portal>
    </DropdownMenuRadix.Root>
  );
};

export default MoreOptions;
