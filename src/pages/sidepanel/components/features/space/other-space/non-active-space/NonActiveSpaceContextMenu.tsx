import { useAtomValue } from 'jotai';
import type { ReactNode } from 'react';
import * as RadixContextMenu from '@radix-ui/react-context-menu';
import {
  ChevronRightIcon,
  EnterIcon,
  ExternalLinkIcon,
  Pencil1Icon,
  StackIcon,
  TrashIcon,
} from '@radix-ui/react-icons';

import { nonActiveSpacesAtom } from '@root/src/stores/app';

type Props = {
  children: ReactNode;
  onDelete: () => void;
  onUpdate: () => void;
  onSwitchSpace: () => void;
  onOpenSpaceInNewWindow: () => void;
  onMergeClick: (mergeTo: string) => void;
  spaceLabel: string;
  spaceId: string;
};

const NonActiveSpaceContextMenu = ({
  children,
  spaceLabel,
  onDelete,
  onUpdate,
  onSwitchSpace,
  onOpenSpaceInNewWindow,
  onMergeClick,
  spaceId,
}: Props) => {
  // global state
  const nonActiveSpaces = useAtomValue(nonActiveSpacesAtom);

  return (
    <RadixContextMenu.Root>
      <RadixContextMenu.Trigger className="" asChild>
        {children}
      </RadixContextMenu.Trigger>
      <RadixContextMenu.Portal>
        <RadixContextMenu.Content className=" !bg-brand-darkBg !opacity-100 rounded-md overflow-hidden min-w-[160px] h-fit mb-2.5 z-[9999] py-px border border-brand-darkBgAccent/30">
          <RadixContextMenu.Label className="text-center py-[4px] text-[11px] font-light text-slate-300/80 opacity-95">
            {spaceLabel}
          </RadixContextMenu.Label>

          <RadixContextMenu.Separator className="h-[1px] bg-brand-darkBgAccent/50 my-[2px]" />

          <RadixContextMenu.Item
            onClick={onSwitchSpace}
            className="flex items-center text-[11px] font-normal text-slate-400 py-[6px] px-2.5 hover:bg-brand-darkBgAccent/40 transition-colors duration-300 cursor-pointer">
            <EnterIcon className="text-slate-500 mr-1 scale-[0.8]" /> Switch Space
          </RadixContextMenu.Item>

          <RadixContextMenu.Item
            onClick={onOpenSpaceInNewWindow}
            className=" flex items-center text-[11px] font-normal text-slate-400 py-[6px] px-2.5 hover:bg-brand-darkBgAccent/40 transition-colors duration-300 cursor-pointer">
            <ExternalLinkIcon className="text-slate-500 mr-1 scale-[0.8]" /> Open in new window
          </RadixContextMenu.Item>

          <RadixContextMenu.Separator className="h-[1px] bg-brand-darkBgAccent/50 my-[2px]" />

          <RadixContextMenu.Item
            onClick={onUpdate}
            className=" flex items-center text-[11px] font-normal text-slate-400 py-[6px] px-2.5 hover:bg-brand-darkBgAccent/40 transition-colors duration-300 cursor-pointer">
            <Pencil1Icon className="text-slate-500 mr-1 scale-[0.8]" /> View/Update
          </RadixContextMenu.Item>

          <RadixContextMenu.Item
            onClick={onDelete}
            className=" flex items-center text-[11px] font-normal text-slate-400 py-[6px] px-2.5 hover:bg-brand-darkBgAccent/40 transition-colors duration-300 cursor-pointer">
            <TrashIcon className="text-slate-500 mr-1 scale-[0.8]" /> Delete
          </RadixContextMenu.Item>

          <RadixContextMenu.Separator className="h-[1px] bg-brand-darkBgAccent/50 my-[2px]" />

          <RadixContextMenu.Sub>
            <RadixContextMenu.SubTrigger className="relative flex items-center text-[11px] font-normal text-slate-400 py-[6px] px-2.5 hover:bg-brand-darkBgAccent/40 transition-colors duration-300 cursor-pointer">
              <StackIcon className="text-slate-500 mr-1 scale-[0.8]" /> Merge space
              <ChevronRightIcon className="absolute right-2 text-slate-500/80 scale-[0.8]" />
            </RadixContextMenu.SubTrigger>

            <RadixContextMenu.Portal>
              <RadixContextMenu.SubContent className="!bg-brand-darkBg !opacity-100 rounded-md overflow-hidden w-fit h-fit z-[99999] py-px border border-brand-darkBgAccent/30">
                {[...nonActiveSpaces.filter(s => s.isSaved && s.id !== spaceId)].map(space => (
                  <RadixContextMenu.Item
                    key={space.id}
                    onClick={() => onMergeClick(space.id)}
                    className="flex items-center text-[11px] font-normal text-slate-400 py-[6px] px-2.5 hover:bg-brand-darkBgAccent/40 transition-colors duration-300 cursor-pointer">
                    <span className="mr-1.5">{space.emoji}</span> {space.title}
                  </RadixContextMenu.Item>
                ))}
              </RadixContextMenu.SubContent>
            </RadixContextMenu.Portal>
          </RadixContextMenu.Sub>
        </RadixContextMenu.Content>
      </RadixContextMenu.Portal>
    </RadixContextMenu.Root>
  );
};

export default NonActiveSpaceContextMenu;
