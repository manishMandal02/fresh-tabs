import { FC, ReactEventHandler } from 'react';

import { cn } from '@root/src/utils/cn';
import { isValidURL } from '@root/src/utils/url';
import { COMMAND_HEIGHT } from '../CommandPalette';
import { RadixIconType } from '@root/src/pages/types/global.types';
import { FALLBACK_ICON } from '@root/src/constants/app';

type CommandIcon = RadixIconType | string;

// extracted command icon into an separate component
type IconProps = {
  Icon: CommandIcon;
  isFocused: boolean;
  label: string;
};

const CommandIcon: FC<IconProps> = ({ Icon, isFocused, label }) => {
  // handle fallback image for favicon icons
  const handleImageLoadError: ReactEventHandler<HTMLImageElement> = ev => {
    ev.stopPropagation();
    ev.currentTarget.src = FALLBACK_ICON;
  };

  if (typeof Icon === 'string' && !isValidURL(Icon as string)) {
    return <span className="w-[16px] mr-2.5 h-fit text-start">{Icon}</span>;
  } else if (typeof Icon === 'string') {
    return (
      <img
        alt="icon"
        src={Icon as string}
        onError={handleImageLoadError}
        className="w-[14px] h-fit rounded-md opacity-95 object-scale-down object-center"
      />
    );
  }

  return (
    <Icon
      className={cn(
        'text-slate-400/90 w-[14px] scale-[1]',
        { 'text-slate-300/90': isFocused },
        { 'scale-[0.92]': label === 'New Space' },
      )}
    />
  );
};

type Props = {
  index: number;
  label: string;
  Icon: CommandIcon;
  isFocused: boolean;
  onClick: () => void;
};

const Command = ({ index, label, Icon, isFocused, onClick }: Props) => {
  return (
    <button
      id={`fresh-tabs-command-${index}`}
      className={cn(
        'w-full flex items-center justify-start pl-[12px] pr-[10px] md:py-[6px] outline-none first:pt-[6px] md:first:pt-[7.5px] transition-all duration-100 ease-in',
        { 'bg-brand-darkBgAccent/60': isFocused },
      )}
      onClick={onClick}
      style={{ height: COMMAND_HEIGHT + 'px' }}>
      {/* icon */}
      <div className="w-[22px]">
        <CommandIcon isFocused={isFocused} Icon={Icon} label={label} />
      </div>
      {/* label */}
      <p
        className={cn(
          'text-[12px] text-start text-slate-400/90 min-w-[50%] max-w-[95%] whitespace-nowrap  overflow-hidden text-ellipsis transition-colors duration-150',
          { 'text-slate-300/90': isFocused },
        )}
        dangerouslySetInnerHTML={{ __html: label }}></p>
    </button>
  );
};
export default Command;
