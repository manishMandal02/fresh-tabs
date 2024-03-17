import * as TooltipRadix from '@radix-ui/react-tooltip';

type Props = {
  label: string;
  children: React.ReactNode;
  delay?: number;
  containerEl?: HTMLElement;
  open?: boolean;
};
const Tooltip = ({ children, label, containerEl, open = false, delay = 700 }: Props) => {
  return (
    <TooltipRadix.Provider delayDuration={delay}>
      <TooltipRadix.Root {...(open ? { open: true } : {})}>
        <TooltipRadix.Trigger asChild>{children}</TooltipRadix.Trigger>
        {label ? (
          <TooltipRadix.Portal {...(containerEl ? { container: containerEl } : {})}>
            <TooltipRadix.Content
              className={` w-fit max-w-[16rem] text-wrap break-words
                  z-[9999] data-[state=delayed-open]:data-[side=top]:animate-slideDownAndFade data-[state=delayed-open]:data-[side=right]:animate-slideLeftAndFade data-[state=delayed-open]:data-[side=left]:animate-slideRightAndFade data-[state=delayed-open]:data-[side=bottom]:animate-slideUpAndFade 
                 text-slate-400 select-none rounded-md bg-brand-darkBgAccent/80 px-[16px] py-[8px] text-[11px] 
                  shadow-[hsl(206_22%_7%_/_35%)_0px_10px_38px_-10px,_hsl(206_22%_7%_/_20%)_0px_10px_20px_-15px] will-change-[transform,opacity]`}
              sideOffset={5}>
              {label}
              <TooltipRadix.Arrow className="fill-brand-darkBgAccent" />
            </TooltipRadix.Content>
          </TooltipRadix.Portal>
        ) : (
          <></>
        )}
      </TooltipRadix.Root>
    </TooltipRadix.Provider>
  );
};

export default Tooltip;
