import * as DropdownMenuRadix from '@radix-ui/react-dropdown-menu';
import { MdMoreVert, MdEdit, MdSync, MdDelete } from 'react-icons/md';

type Props = {
  onEditClick: () => void;
  onSyncClick: () => void;
  onDeleteClick: () => void;
};

const MoreOptions = ({ onEditClick, onSyncClick, onDeleteClick }: Props) => {
  return (
    <DropdownMenuRadix.Root>
      <DropdownMenuRadix.Trigger>
        <MdMoreVert className="text-slate-400 z-50 text-lg m-0" onClick={() => {}} />
      </DropdownMenuRadix.Trigger>

      <DropdownMenuRadix.Portal>
        <DropdownMenuRadix.Content
          className="min-w-28 z-[200] bg-slate-900 text-slate-400 rounded py-1 px-1 shadow-[0px_10px_38px_-10px_rgba(22,_23,_24,_0.35),_0px_10px_20px_-15px_rgba(22,_23,_24,_0.2)] will-change-[opacity,transform] data-[side=top]:animate-slideDownAndFade data-[side=right]:animate-slideLeftAndFade data-[side=bottom]:animate-slideUpAndFade data-[side=left]:animate-slideRightAndFade"
          sideOffset={5}
          onClick={ev => {
            ev.stopPropagation();
          }}>
          <DropdownMenuRadix.Item
            className="group text-xs px-1 py-1.5 hover:bg-slate-800 cursor-pointer transition-all duration-200 leading-none flex items-center  relative select-none outline-none "
            onClick={onEditClick}>
            <MdEdit className="mr-1 opacity-70 text-xs" /> Edit
          </DropdownMenuRadix.Item>
          <DropdownMenuRadix.Item
            className="group text-xs px-1 py-1.5 hover:bg-slate-800 cursor-pointer transition-all duration-200 leading-none flex items-center  relative select-none outline-none "
            onClick={onSyncClick}>
            <MdSync className="mr-1 opacity-70 text-xs" /> Sync Tabs
          </DropdownMenuRadix.Item>
          <DropdownMenuRadix.Item
            className="group text-xs px-1 py-1.5 hover:bg-slate-800 cursor-pointer transition-all duration-200 leading-none flex items-center  relative select-none outline-none "
            onClick={onDeleteClick}>
            <MdDelete className="mr-1 opacity-70 text-xs" /> Delete
          </DropdownMenuRadix.Item>
        </DropdownMenuRadix.Content>
      </DropdownMenuRadix.Portal>
    </DropdownMenuRadix.Root>
  );
};

export default MoreOptions;
