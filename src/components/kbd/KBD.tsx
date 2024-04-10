import { useDeviceInfo } from '@root/src/pages/sidepanel/hooks/useDeviceInfo';
import { CSSClasses } from '@root/src/types/global.types';
import { cn } from '@root/src/utils/cn';
import { memo, ReactNode } from 'react';

type Props = {
  children?: ReactNode;
  modifierKey?: boolean;
  enterKey?: boolean;
  upArrowKey?: boolean;
  downArrowKey?: boolean;
  classes?: CSSClasses;
};

const KBD = ({ children, modifierKey, enterKey, upArrowKey, downArrowKey, classes }: Props) => {
  const { isMac } = useDeviceInfo();

  const key = () => {
    if (modifierKey) {
      if (isMac) return '⌘';

      return 'Ctrl';
    }

    if (enterKey) return '↵';

    if (upArrowKey) return '⬆';

    if (downArrowKey) return '⬇';

    return children;
  };

  return (
    <kbd
      className={cn(
        `inline-flex justify-center items-center px-[7px] bg-brand-darkBgAccent/60 text-[12px] rounded-md h-[20px]
         select-none border border-brand-darkBg/70 text-slate-400/80 shadow-[0px_2px_0px_0px_#ffffff17]`,
        { 'text-[16px]': modifierKey || enterKey },
        { 'text-[10px]': upArrowKey || downArrowKey },
        classes,
      )}>
      {key()}
    </kbd>
  );
};

export default memo(KBD);
