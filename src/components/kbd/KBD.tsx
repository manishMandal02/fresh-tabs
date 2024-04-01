import { useDeviceInfo } from '@root/src/pages/sidepanel/hooks/useDeviceInfo';
import { cn } from '@root/src/utils/cn';
import { memo , ReactNode } from 'react';

type Props = {
  children?: ReactNode;
  modifierKey?: boolean;
  //   shiftKey?: boolean;
  //   optionKey?: boolean;
};

const KBD = ({ children, modifierKey }: Props) => {
  const { isMac } = useDeviceInfo();

  console.log('🚀 ~ KBD ~ isMac:', isMac);

  const key = () => {
    if (modifierKey) {
      if (isMac) return '⌘';

      return 'Ctrl';
    }

    return children;
  };

  return (
    <kbd
      className={cn(
        `inline-flex justify-center items-center px-[7px] bg-brand-darkBgAccent/60 text-[12px] rounded-md h-[20px]
         select-none border border-brand-darkBg/70 text-slate-300/80 shadow-[0px_2px_0px_0px_#ffffff28]`,
        { 'text-[16px]': modifierKey },
      )}>
      {key()}
    </kbd>
  );
};

export default memo(KBD);
