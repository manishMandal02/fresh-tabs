import * as TabsRadix from '@radix-ui/react-tabs';
import { generateId } from '@root/src/pages/utils';
import { ReactNode } from 'react';

type Props<T extends string[]> = {
  tabs: [...T];
  children: [...{ [I in keyof T]: ReactNode }];
  defaultTab: number;
};

const Tabs = <T extends string[]>({ tabs, children, defaultTab }: Props<T>) => {
  if (tabs.length !== children.length) {
    throw new TypeError('Tabs and children must have the same length.');
  }
  return (
    <TabsRadix.Root defaultValue={defaultTab.toString()}>
      <TabsRadix.List className="shrink-0 z-[9999] flex bg-brand-darkBg border-b border-brand-darkBgAccent/30 rounded-md py-1 px-px sticky top-0 left-0">
        {/* tabs */}
        {tabs.map((tab, index) => (
          <TabsRadix.Trigger
            key={generateId()}
            className={` py-[6.5px]  flex-1 flex items-center justify-center text-[12px] font-normal leading-none text-slate-400/80 transition-all duration-200 
             select-none  data-[state=active]:text-slate-300/80 data-[state=active]:bg-brand-darkBgAccent/50 rounded-md outline-none cursor-pointer`}
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
