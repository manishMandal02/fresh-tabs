import { FC, ReactEventHandler } from 'react';
import Highlighter from 'react-highlight-words';
import { Cross1Icon, EnterIcon, ExternalLinkIcon, OpenInNewWindowIcon, PinRightIcon } from '@radix-ui/react-icons';

import { cn } from '@root/src/utils/cn';
import { isValidURL } from '@root/src/utils/url';
import { useFrame } from 'react-frame-component';
import { COMMAND_HEIGHT } from '../CommandPalette';
import { RadixIconType } from '@root/src/pages/types/global.types';
import { CommandType, FALLBACK_ICON } from '@root/src/constants/app';
import { useKeyShortcuts } from '@root/src/pages/sidepanel/hooks/useKeyShortcuts';

type CommandIcon = RadixIconType | string;

type Props = {
  index: number;
  label: string;
  searchTerm: string;
  type: CommandType;
  Icon: CommandIcon;
  isFocused: boolean;
  isStaticCommand: boolean;
  alias?: string;
  isSubCommand: boolean;
  onClick: () => void;
};

const Command = ({
  index,
  label,
  Icon,
  isFocused,
  type,
  searchTerm,
  onClick,
  alias,
  isSubCommand,
  isStaticCommand,
}: Props) => {
  const { document: iFrameDoc } = useFrame();

  // listen to cmd/ctrl key press
  const { isModifierKeyPressed } = useKeyShortcuts({
    monitorModifierKeys: true,
    parentConTainerEl: iFrameDoc.body.querySelector('dialog'),
  });

  const escapedSearchTerm = searchTerm.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

  let commandAlias = '';

  // show alias/desc only for selected commands
  if (
    alias &&
    (type === CommandType.AddToSpace ||
      type === CommandType.SnoozeTab ||
      type === CommandType.DiscardTabs ||
      type === CommandType.WebSearch)
  ) {
    commandAlias = alias;
  }

  const CommandTypeIcon: FC<{ classes: string }> = ({ classes }) => {
    if (isStaticCommand && isSubCommand) return null;

    if (type === CommandType.SwitchTab) {
      if (isModifierKeyPressed)
        return (
          <>
            {'Close & Switch Tab'}
            <Cross1Icon className={classes} />
          </>
        );
      return (
        <>
          {type.replaceAll('-', ' ')}
          <PinRightIcon className={classes} />
        </>
      );
    }

    if (type === CommandType.SwitchSpace)
      return (
        <>
          {type.replaceAll('-', ' ')}
          <EnterIcon className={classes} />
        </>
      );

    if (isModifierKeyPressed)
      return (
        <>
          {'New tab'}
          <ExternalLinkIcon className={classes} />
        </>
      );

    return (
      <>
        {'Open here'}
        <OpenInNewWindowIcon className={classes} />
      </>
    );
  };

  return (
    <button
      id={`fresh-tabs-command-${index}`}
      className={cn(
        'w-full flex items-center relative justify-start pl-[13px] pr-[8px] md:py-[6px] outline-none first:pt-[6px] md:first:pt-[7.5px] transition-all duration-100 ease-in',
        { 'bg-brand-darkBgAccent/60': isFocused },
      )}
      onClick={onClick}
      style={{ height: COMMAND_HEIGHT + 'px' }}>
      {/* icon */}
      <div className="w-[22px]">
        <CommandIcon isFocused={isFocused} Icon={Icon} type={type} />
      </div>
      {/* label */}
      <div
        className={cn(
          'text-[12px] text-start text-slate-400/80 min-w-[50%] max-w-[95%] whitespace-nowrap  overflow-hidden text-ellipsis transition-colors duration-150',
          { 'text-slate-300/90': isFocused },
        )}>
        <Highlighter
          searchWords={type !== CommandType.SnoozeTab ? [escapedSearchTerm] : []}
          textToHighlight={label}
          highlightClassName="bg-transparent text-slate-300/90 font-semibold"
          unhighlightClassName="bg-transparent"
        />
        {commandAlias ? (
          <Highlighter
            searchWords={type !== CommandType.SnoozeTab ? [escapedSearchTerm] : []}
            textToHighlight={type !== CommandType.WebSearch ? `(${commandAlias})` : commandAlias}
            highlightClassName="bg-transparent font-semibold text-slate-400"
            className="ml-1.5 text-[11px] text-slate-500/90"
          />
        ) : null}
      </div>
      {/* command type label/sticker */}
      {!isStaticCommand && !isSubCommand ? (
        <div className="flex items-center absolute right-3 top-1 bg-brand-darkBgAccent/90 rounded-[5px] text-[10px]  text-slate-400/80 px-2.5 py-1.5 capitalize select-none">
          <CommandTypeIcon classes="ml-1 text-slate-400/80 scale-[0.9]" />
        </div>
      ) : null}
    </button>
  );
};
export default Command;

// sub component
type CommandIconProps = {
  Icon: CommandIcon;
  isFocused: boolean;
  type: CommandType;
};

const CommandIcon: FC<CommandIconProps> = ({ Icon, isFocused, type }) => {
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
        { 'scale-[0.92]': type === CommandType.NewNote },
      )}
    />
  );
};
