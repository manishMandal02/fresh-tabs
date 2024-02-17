import { ReactNode } from 'react';
import * as ContextMenuRadix from '@radix-ui/react-context-menu';
import { ISpace } from '@root/src/pages/types/global.types';
import { MdDelete, MdEdit, MdOpenInNew } from 'react-icons/md';
import { useAtom } from 'jotai';
import { deleteSpaceModalAtom, updateSpaceModalAtom } from '@root/src/stores/app';
import { getTabsInSpace } from '@root/src/services/chrome-storage/tabs';
import { openSpace } from '@root/src/services/chrome-tabs/tabs';

type Props = {
  children: ReactNode;
  space: ISpace;
};

const CustomContextMenu = ({ children, space }: Props) => {
  // global state/atom
  const [, setUpdateModal] = useAtom(updateSpaceModalAtom);
  const [, setDeleteModal] = useAtom(deleteSpaceModalAtom);

  const handleUpdateClick = async () => {
    const tabs = await getTabsInSpace(space.id);
    setUpdateModal({ ...space, tabs });
  };

  const handleDeleteClick = async () => {
    setDeleteModal({ show: true, spaceId: space.id });
  };

  const handleOpenSpace = async () => {
    const tabs = await getTabsInSpace(space.id);

    await openSpace({ space, tabs, shouldOpenInNewWindow: true });
  };

  return (
    <ContextMenuRadix.Root>
      <ContextMenuRadix.Trigger>{children}</ContextMenuRadix.Trigger>
      <ContextMenuRadix.Portal>
        <ContextMenuRadix.Content
          className="z-[9999] bg-brand-darkBgAccent rounded-md overflow-hidden shadow-[0px_10px_38px_-10px_rgba(22,_23,_24,_0.35),_0px_10px_20px_-15px_rgba(22,_23,_24,_0.2)]"
          //   sideOffset={5}
          //   align="end"
        >
          <ContextMenuRadix.Label className=" py-1 text-center text-[11px] text-slate-400 font-medium w-full">
            {space.title}
          </ContextMenuRadix.Label>
          <ContextMenuRadix.Separator className="h-[1px] bg-brand-darkBg/40 my-px" />

          <ContextMenuRadix.Item
            className="group hover:bg-brand-darkBg/70 text-[12px]  py-1.5 cursor-pointer leading-none text-slate-200 rounded-[3px] flex items-center h-[25px] px-[5px] relative pl-2 select-none outline-none data-[highlighted]:bg-violet9 data-[highlighted]:text-violet1"
            onClick={handleOpenSpace}>
            <MdOpenInNew className="text-slate-400 mr-1" /> Open in New Window
          </ContextMenuRadix.Item>

          <ContextMenuRadix.Item
            className="group hover:bg-brand-darkBg/70 text-[12px] py-1.5 cursor-pointer  leading-none text-slate-200 rounded-[3px] flex items-center h-[25px] px-[5px] relative pl-2 select-none outline-none data-[highlighted]:bg-violet9 data-[highlighted]:text-violet1"
            onClick={handleUpdateClick}>
            <MdEdit className="text-slate-400 mr-1" /> View/Update
          </ContextMenuRadix.Item>
          <ContextMenuRadix.Item
            className="group hover:bg-brand-darkBg/70 text-[12px]  py-1.5 cursor-pointer leading-none text-slate-200 rounded-[3px] flex items-center h-[25px] px-[5px] relative pl-2 select-none outline-none data-[highlighted]:bg-violet9 data-[highlighted]:text-violet1"
            onClick={handleDeleteClick}>
            <MdDelete className="text-slate-400 mr-1" /> Delete
          </ContextMenuRadix.Item>
        </ContextMenuRadix.Content>
      </ContextMenuRadix.Portal>
    </ContextMenuRadix.Root>
  );
};

export default CustomContextMenu;
