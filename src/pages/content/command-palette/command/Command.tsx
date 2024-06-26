import { FC, ReactEventHandler } from 'react';
import Highlighter from 'react-highlight-words';
import {
  CounterClockwiseClockIcon,
  Cross1Icon,
  EnterIcon,
  ExternalLinkIcon,
  OpenInNewWindowIcon,
  PinRightIcon,
  StarFilledIcon,
  FileTextIcon,
  Link2Icon,
  GlobeIcon,
} from '@radix-ui/react-icons';

import { cn } from '@root/src/utils/cn';
import { isValidURL } from '@root/src/utils/url';
import { useFrame } from 'react-frame-component';
import { COMMAND_HEIGHT } from '../CommandPalette';
import { RadixIconType } from '@root/src/types/global.types';
import { CommandType } from '@root/src/constants/app';
import { useMetaKeyPressed } from '@root/src/pages/sidepanel/hooks/use-key-shortcuts';

type CommandIcon = RadixIconType | string;

type Props = {
  index: number;
  label: string;
  alias?: string;
  type: CommandType;
  Icon: CommandIcon;
  searchTerm: string;
  metadata?: string;
  isFocused: boolean;
  isSubCommand: boolean;
  isStaticCommand: boolean;
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
  metadata,
  isSubCommand,
  isStaticCommand,
}: Props) => {
  console.log('Command ~ 🔁 rendered');

  const { document: iFrameDoc } = useFrame();

  // listen to cmd/ctrl key press
  const { isMetaKeyPressed } = useMetaKeyPressed({
    isSidePanel: false,
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
      type === CommandType.NewGroup ||
      type === CommandType.AddToGroup ||
      type === CommandType.WebSearch)
  ) {
    commandAlias = alias;
  }

  const CommandTypeIcon: FC<{ classes: string }> = ({ classes }) => {
    if (isStaticCommand && isSubCommand) return null;

    if (type === CommandType.SwitchTab) {
      if (isMetaKeyPressed)
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

    if (type === CommandType.SwitchSpace) {
      if (isMetaKeyPressed) {
        return (
          <>
            {'Open Space in New Window'}
            <OpenInNewWindowIcon className={classes} />
          </>
        );
      }

      return (
        <>
          {type.replaceAll('-', ' ')}
          <EnterIcon className={classes} />
        </>
      );
    }

    if (type === CommandType.Note)
      return (
        <>
          {'Note'}
          <FileTextIcon className={classes} />
        </>
      );

    if (isMetaKeyPressed)
      return (
        <>
          {'New tab'}
          <ExternalLinkIcon className={classes} />
        </>
      );

    return (
      <>
        {'Open here'}
        <Link2Icon className={classes} />
      </>
    );
  };

  // show link indicator for link type before title
  const LinkTypeIndicatorIcon: FC = () => {
    const classes = 'text-slate-400/70 scale-[0.7] mr-[1px] -ml-[1px]';
    if (alias === 'Bookmark') return <StarFilledIcon className={cn(classes, 'scale-[0.8]')} />;
    if (alias === 'History') return <CounterClockwiseClockIcon className={classes} />;
    return <></>;
  };

  return (
    <button
      id={`fresh-tabs-command-${index}`}
      className={cn(
        'w-full flex items-center relative justify-start pl-[13px] pr-[8px] py-[4px] outline-none first:pt-[6px] md:first:pt-[7.5px] transition-all duration-100 ease-in',
        { 'bg-brand-darkBgAccent/60': isFocused },
      )}
      onClick={onClick}
      style={{ height: COMMAND_HEIGHT + 'px' }}>
      {/* icon */}
      <div className="w-fit min-w-[14px] mr-1.5">
        <CommandIcon isFocused={isFocused} Icon={type !== CommandType.Note ? Icon : FileTextIcon} type={type} />
      </div>
      {/* label */}
      <div
        className={cn(
          'text-[12px] flex items-center text-start text-slate-400/80 max-w-[95%] transition-colors duration-150',
          {
            'max-w-[60%]': type === CommandType.Link,
          },
        )}>
        <LinkTypeIndicatorIcon />
        <span className="w-full whitespace-nowrap overflow-hidden text-ellipsis">
          <Highlighter
            searchWords={[...escapedSearchTerm.split(' ')]}
            textToHighlight={label}
            highlightClassName="bg-transparent text-slate-300/90 font-semibold"
            unhighlightClassName="bg-transparent"
          />
        </span>
        {commandAlias ? (
          <Highlighter
            searchWords={[...escapedSearchTerm.split(' ')]}
            textToHighlight={type !== CommandType.WebSearch ? `(${commandAlias})` : commandAlias}
            highlightClassName="bg-transparent font-semibold text-slate-400"
            className="ml-1.5 text-[10px] text-slate-500/90 min-w-fit whitespace-nowrap"
          />
        ) : null}
      </div>
      {/* link command url */}
      {type === CommandType.Link ? (
        <div className="w-full text-start overflow-hidden flex items-center">
          <span className=" mr-[3px] text-slate-600 font-medium text-[12px]">-</span>
          <p className="text-[11.5px] text-slate-500/90 max-w-full text-ellipsis overflow-hidden whitespace-nowrap ">
            <Highlighter
              searchWords={[...escapedSearchTerm.split(' ')]}
              textToHighlight={metadata}
              highlightClassName="bg-transparent text-slate-400 font-semibold"
              unhighlightClassName="bg-transparent"
            />
          </p>
        </div>
      ) : null}

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

// TODO - fix - some icon appear too small
const CommandIcon: FC<CommandIconProps> = ({ Icon, isFocused, type }) => {
  if (type === CommandType.Note) Icon = FileTextIcon;

  // handle fallback image for favicon icons
  const handleImageLoadError: ReactEventHandler<HTMLImageElement> = ev => {
    ev.stopPropagation();
    ev.currentTarget.style.display = 'none';
    (ev.currentTarget.nextElementSibling as SVGAElement).style.display = 'block';
  };

  if (typeof Icon === 'string' && !isValidURL(Icon as string)) {
    // emoji
    return <span className="w-[16px] mr-2.5 h-fit text-start">{Icon}</span>;
  } else if (typeof Icon === 'string') {
    console.log('🌅 ~ Icon:', Icon);

    // favicon
    return (
      <>
        <img
          alt="icon"
          src={Icon as string}
          onError={handleImageLoadError}
          className={cn('size-[14px] opacity-95 object-contain object-center', {
            invert: Icon.includes('github.com'),
          })}
        />
        {/* show fallback icon */}
        <GlobeIcon className="hidden text-slate-400 scale-[0.9]" />
      </>
    );
  }

  // icon
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
