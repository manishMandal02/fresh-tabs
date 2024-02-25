import * as PopoverRadix from '@radix-ui/react-popover';
import { ReactNode } from 'react';

type Props = {
  children: ReactNode;
  content: ReactNode;
  open?: boolean;
  onChange: (open: boolean) => void;
  modalContainer?: boolean;
};

const Popover = ({ children, content, open, onChange, modalContainer = false }: Props) => {
  const portalAnchor = modalContainer ? document.querySelector('dialog') : document.body;

  return (
    <>
      <PopoverRadix.Root open={open} onOpenChange={onChange}>
        <PopoverRadix.Trigger className="outline-none" asChild>
          {children}
        </PopoverRadix.Trigger>
        <PopoverRadix.Portal container={portalAnchor}>
          <PopoverRadix.Content className="z-[99999]" sideOffset={5}>
            {content}
          </PopoverRadix.Content>
        </PopoverRadix.Portal>
      </PopoverRadix.Root>
    </>
  );
};

export default Popover;
