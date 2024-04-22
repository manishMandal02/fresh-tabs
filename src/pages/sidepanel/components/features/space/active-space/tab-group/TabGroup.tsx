import * as RadixAccordion from '@radix-ui/react-accordion';
import { type ReactNode, useState, useEffect } from 'react';

import { cn } from '@root/src/utils/cn';
import TabGroupContextMenu from './TabGroupContextMenu';
import { ChevronDownIcon } from '@radix-ui/react-icons';
import { IGroup, ISpace, ITab } from '@root/src/types/global.types';
import { useCallback } from 'react';

type Props = {
  group: IGroup;
  tabs: ITab[];
  space: ISpace;
  isDragging: boolean;
  children: ReactNode;
};

const TabGroup = ({ children, isDragging, group, tabs, space }: Props) => {
  const [isExpanded, setIsExpanded] = useState(false);

  // init component
  useEffect(() => {
    if (!group.collapsed && !isDragging) {
      // expand group if not collapsed (chrome) and not dragging
      setIsExpanded(true);
    } else {
      setIsExpanded(false);
    }
  }, [isDragging, group]);

  const handleExpandGroup = useCallback(() => {
    // TODO - expand
    setIsExpanded(prev => !prev);
  }, [setIsExpanded]);

  console.log('🚀 ~ TabGroup ~ !!children:', !!children);
  return (
    <TabGroupContextMenu tabs={tabs} group={group} space={space}>
      {/* eslint-disable-next-line jsx-a11y/click-events-have-key-events, jsx-a11y/no-static-element-interactions */}
      <div className=" w-[96vw] min-w-[96vw] cursor-default" onClick={handleExpandGroup}>
        <RadixAccordion.Root type="single" value={isExpanded ? `group-${group.id}` : ''}>
          <RadixAccordion.Item value={`group-${group.id}`}>
            <RadixAccordion.Header>
              <RadixAccordion.Trigger className="w-full h-fit" asChild>
                <div className="bg-brand-darkBgAccent/80 rounded-md flex items-center justify-between px-2 py-1">
                  <div className="px-2 py-1.5 flex items-center w-full">
                    <p className="text-[13px] text-slate-400 font-normal">{group.name}</p>
                    <div style={{ backgroundColor: group.theme }} className="ml-1.5 size-[8px] rounded-full" />
                  </div>
                  <ChevronDownIcon
                    className={cn(
                      'text-slate-400 font-bold ease-[cubic-bezier(0.87,_0,_0.13,_1)] transition-transform duration-300 group-data-[state=open]:rotate-180',
                    )}
                    aria-hidden
                  />
                </div>
              </RadixAccordion.Trigger>
            </RadixAccordion.Header>
            <RadixAccordion.Content className="bg-brand-darkBgAccent/30 rounded-md">{children}</RadixAccordion.Content>
          </RadixAccordion.Item>
        </RadixAccordion.Root>
      </div>
    </TabGroupContextMenu>
  );
};

export default TabGroup;
