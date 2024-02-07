import * as PopoverRadix from '@radix-ui/react-popover';
import { ReactNode } from 'react';

type Props = {
  children: ReactNode;
  content: ReactNode;
  open?: boolean;
  onChange: (open: boolean) => void;
};

const Popover = ({ children, content, open, onChange }: Props) => {
  // TODO - temp fix to show popover
  const portalAnchor = [...document.getElementsByTagName('dialog')][1];

  return (
    <>
      <PopoverRadix.Root open={open} onOpenChange={onChange}>
        <PopoverRadix.Trigger className="outline-none" asChild>
          {children}
        </PopoverRadix.Trigger>
        <PopoverRadix.Portal container={portalAnchor}>
          <PopoverRadix.Content className="z-[99]" sideOffset={5}>
            {content}
          </PopoverRadix.Content>
        </PopoverRadix.Portal>
      </PopoverRadix.Root>
    </>
  );
};

export default Popover;
