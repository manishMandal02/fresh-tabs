import { ReactNode } from 'react';
import { motion } from 'framer-motion';
import * as PopoverRadix from '@radix-ui/react-popover';
import { useCustomAnimation } from '../../pages/sidepanel/hooks/useAnimation';

type Props = {
  children: ReactNode;
  content: ReactNode;
  open?: boolean;
  onChange: (open: boolean) => void;
  modalContainer?: boolean;
  modalOffset?: number;
};

const Popover = ({ children, content, open, onChange, modalOffset = 5, modalContainer = false }: Props) => {
  const portalAnchor = modalContainer ? document.querySelector('dialog') : document.body;

  const { fade } = useCustomAnimation();

  return (
    <>
      <PopoverRadix.Root open={open} onOpenChange={onChange}>
        <PopoverRadix.Trigger className="outline-none" asChild>
          {children}
        </PopoverRadix.Trigger>
        <PopoverRadix.Portal container={portalAnchor}>
          <PopoverRadix.Content className="z-[99999]" sideOffset={modalOffset}>
            <motion.div {...fade}>{content}</motion.div>
          </PopoverRadix.Content>
        </PopoverRadix.Portal>
      </PopoverRadix.Root>
    </>
  );
};

export default Popover;
