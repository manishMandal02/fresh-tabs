import { IGroup, ISpace, ITab } from '@root/src/types/global.types';
import TabGroupContextMenu from './TabGroupContextMenu';
import Accordion from '@root/src/components/accordion/Accordion';
import { ReactNode } from 'react';

type Props = {
  group: IGroup;
  tabs: ITab[];
  space: ISpace;
  children: ReactNode;
};

const TabGroup = ({ children, group, tabs, space }: Props) => {
  return (
    <TabGroupContextMenu tabs={tabs} group={group} space={space}>
      <Accordion
        id={'group' + group.id}
        defaultCollapsed={false}
        classes={{
          triggerContainer: 'bg-brand-darkBgAccent/90 rounded-md w-full ',
          triggerIcon: 'text-slate-400',
          content: '',
        }}
        trigger={
          <>
            <div className="px-2 py-1.5 flex items-center  w-full">
              <p className="text-[13px] text-slate-400 font-normal">{group.name}</p>
              <div style={{ backgroundColor: group.theme }} className="ml-1.5 size-[12px] rounded-full" />
            </div>
          </>
        }>
        {children}
      </Accordion>
    </TabGroupContextMenu>
  );
};

export default TabGroup;
