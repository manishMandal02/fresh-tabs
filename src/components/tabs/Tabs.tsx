import { ReactNode } from 'react';
import * as TabsRadix from '@radix-ui/react-tabs';

import { generateId } from '@root/src/utils';

type Props<T extends string[]> = {
  tabs: T;
  children: { [K in keyof T]: ReactNode };
  defaultTab: number;
  selectedTab: number;
  onTabChange: (tab: number) => void;
};

const Tabs = <T extends string[]>({ tabs, children, defaultTab, selectedTab, onTabChange }: Props<T>) => {
  if (children?.length > 0 && tabs.length !== children?.length) {
    throw new TypeError('Tabs and children must have the same length.');
  }

  return (
    <TabsRadix.Root
      defaultValue={defaultTab.toString()}
      value={selectedTab.toString()}
      onValueChange={value => onTabChange(Number(value))}>
      <TabsRadix.List className="shrink-0 z-[99] flex bg-brand-darkBg border-b border-brand-darkBgAccent/30 rounded-md py-1 px-px sticky top-0 left-0">
        {/* tabs */}
        {tabs.map((tab, index) => (
          <TabsRadix.Trigger
            key={generateId()}
            className={`py-[6.5px] flex-1 flex items-center justify-center text-[12px] font-normal leading-none text-slate-400/90 transition-all duration-200 rounded-md
                      data-[state=active]:text-slate-300/80 bg-brand-darkBgAccent/15 data-[state=active]:bg-brand-darkBgAccent/60 select-none outline-none cursor-pointer`}
            value={(index + 1).toString()}>
            <h1>{tab as string}</h1>
          </TabsRadix.Trigger>
        ))}
      </TabsRadix.List>

      {/* body */}
      {children.map((tabContent, index) => (
        <TabsRadix.Content key={generateId()} className="!outline-none" value={(index + 1).toString()}>
          {tabContent}
        </TabsRadix.Content>
      ))}
    </TabsRadix.Root>
  );
};
export default Tabs;
