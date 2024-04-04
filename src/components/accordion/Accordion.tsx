/* eslint-disable react/display-name */
import { HTMLProps, forwardRef } from 'react';
import * as RadixAccordion from '@radix-ui/react-accordion';
import { ChevronDownIcon } from '@radix-ui/react-icons';
import { cn } from '@root/src/utils/cn';
import { CSSClasses } from '@root/src/pages/types/global.types';

type Props = {
  trigger: React.ReactNode;
  children: React.ReactNode;
  id: string;
  defaultCollapsed?: boolean;
  classes?: {
    triggerContainer?: CSSClasses;
    triggerIcon?: CSSClasses;
    content?: CSSClasses;
  };
};

const Accordion = ({ id, trigger, children, defaultCollapsed, classes }: Props) => (
  <RadixAccordion.Root
    className=" rounded-md shadow-[0_2px_10px] shadow-black/5"
    type="single"
    collapsible
    defaultValue={id}>
    <RadixAccordionItem value={defaultCollapsed ? 'none' : id}>
      <RadixAccordionTrigger classes={classes}>{trigger}</RadixAccordionTrigger>
      <RadixAccordionContent classes={classes}>{children}</RadixAccordionContent>
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

const RadixAccordionTrigger = forwardRef<
  HTMLButtonElement,
  HTMLProps<Element> & { classes?: { triggerIcon?: CSSClasses; triggerContainer?: CSSClasses } }
>(({ children, ...props }, forwardedRef) => (
  <RadixAccordion.Header className="flex">
    {/*@ts-expect-error button type not matching radix  */}
    <RadixAccordion.Trigger
      className={cn(
        `group flex h-fit w-full flex-1 cursor-default items-center select-none justify-between px-2 !outline-none`,
        props.classes?.triggerContainer,
      )}
      {...props}
      ref={forwardedRef}>
      {children}
      <ChevronDownIcon
        className={cn(
          'text-brand-darkBgAccent/80 font-bold ease-[cubic-bezier(0.87,_0,_0.13,_1)] transition-transform duration-300 group-data-[state=open]:rotate-180',
          props.classes?.triggerIcon,
        )}
        aria-hidden
      />
    </RadixAccordion.Trigger>
  </RadixAccordion.Header>
));

const RadixAccordionContent = forwardRef<HTMLDivElement, HTMLProps<Element> & { classes?: { content?: CSSClasses } }>(
  ({ children, ...props }, forwardedRef) => (
    <RadixAccordion.Content
      className={cn(
        'outline-none data-[state=open]:animate-slideDown data-[state=closed]:animate-slideUp overflow-hidden',
        props.classes?.content,
      )}
      {...props}
      ref={forwardedRef}>
      {children}
    </RadixAccordion.Content>
  ),
);

export default Accordion;
