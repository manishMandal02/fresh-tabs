import * as PopoverRadix from '@radix-ui/react-popover';
import { ReactNode } from 'react';

type Props = {
  children: ReactNode;
  content: ReactNode;
  open?: boolean;
  onChange: (open: boolean) => void;
};

const Popover = ({ children, content, open, onChange }: Props) => {
  return (
    <>
      <PopoverRadix.Root open={open} onOpenChange={onChange}>
        <PopoverRadix.Trigger asChild>{children}</PopoverRadix.Trigger>
        <PopoverRadix.Portal>
          <PopoverRadix.Content className=" z-[150]" sideOffset={5}>
            {content}
          </PopoverRadix.Content>
        </PopoverRadix.Portal>
      </PopoverRadix.Root>
    </>
  );
};

export default Popover;
