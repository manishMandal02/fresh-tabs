/* eslint-disable react/display-name */
import { HTMLProps, forwardRef } from 'react';
import * as RadixAccordion from '@radix-ui/react-accordion';
import { ChevronDownIcon } from '@radix-ui/react-icons';

type Props = {
  trigger: React.ReactNode;
  children: React.ReactNode;
  id: string;
  defaultCollapsed?: boolean;
};

const Accordion = ({ id, trigger, children, defaultCollapsed }: Props) => (
  <RadixAccordion.Root
    className=" rounded-md shadow-[0_2px_10px] shadow-black/5"
    type="single"
    collapsible
    defaultValue={id}>
    <RadixAccordionItem value={defaultCollapsed ? 'none' : id}>
      <RadixAccordionTrigger>{trigger}</RadixAccordionTrigger>
      <RadixAccordionContent>{children}</RadixAccordionContent>
    </RadixAccordionItem>
  </RadixAccordion.Root>
);

const RadixAccordionItem = forwardRef<HTMLDivElement, RadixAccordion.AccordionItemProps>(
  ({ children, ...props }, forwardedRef) => (
    <RadixAccordion.Item className="outline-none overflow-hidden last:rounded-b mb-1" {...props} ref={forwardedRef}>
      {children}
    </RadixAccordion.Item>
  ),
);

const RadixAccordionTrigger = forwardRef<HTMLButtonElement, HTMLProps<Element>>(
  ({ children, ...props }, forwardedRef) => (
    <RadixAccordion.Header className="flex">
      {/*@ts-expect-error button type not matching radix  */}
      <RadixAccordion.Trigger
        className={`group flex h-fit flex-1 cursor-default items-center justify-between bg-brand-darkBgAccent/20 rounded-md px-2 !outline-none`}
        {...props}
        ref={forwardedRef}>
        {children}
        <ChevronDownIcon
          className="text-slate-700 font-bold ease-[cubic-bezier(0.87,_0,_0.13,_1)] transition-transform duration-300 group-data-[state=open]:rotate-180"
          aria-hidden
        />
      </RadixAccordion.Trigger>
    </RadixAccordion.Header>
  ),
);

const RadixAccordionContent = forwardRef<HTMLDivElement, HTMLProps<Element>>(({ children, ...props }, forwardedRef) => (
  <RadixAccordion.Content
    className={'outline-none data-[state=open]:animate-slideDown data-[state=closed]:animate-slideUp overflow-hidden'}
    {...props}
    ref={forwardedRef}>
    {children}
  </RadixAccordion.Content>
));

export default Accordion;
