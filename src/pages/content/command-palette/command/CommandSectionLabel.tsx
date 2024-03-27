import { Link2Icon } from '@radix-ui/react-icons';
import { getCommandIcon, staticCommands } from '../CommandPalette';
import { CommandType } from '@root/src/constants/app';
import { ICommand, RadixIconType } from '@root/src/pages/types/global.types';

type Props = {
  index: number;
  isStaticCommand: boolean;
  suggestedCommands: ICommand[];
};

const CommandSectionLabel = ({ index, isStaticCommand, suggestedCommands }: Props) => {
  if (index < 1 || isStaticCommand) return;

  let sectionLabel = '';

  let Icon = Link2Icon;

  if (
    index ===
    suggestedCommands.find(cmd1 => cmd1.type === CommandType.SwitchTab && staticCommands[0].label !== cmd1.label)?.index
  ) {
    sectionLabel = 'Switch to opened tabs';
    Icon = getCommandIcon(CommandType.SwitchTab).Icon as RadixIconType;
  } else if (index === suggestedCommands.find(cmd1 => cmd1.type === CommandType.RecentSite)?.index) {
    sectionLabel = 'Open recently visited sites';
  } else if (
    index ===
    suggestedCommands.find(cmd1 => cmd1.type === CommandType.SwitchSpace && staticCommands[1].label !== cmd1.label)
      ?.index
  ) {
    sectionLabel = 'Switch space';
    Icon = getCommandIcon(CommandType.SwitchSpace).Icon as RadixIconType;
  }

  if (!sectionLabel) return;

  return (
    <>
      <div className="flex items-center justify-start gap-x-1 mt-1.5 ml-2.5 mb-1">
        <p key={index} className="text-[12.5px] font-light text-slate-500 " tabIndex={-1}>
          {sectionLabel}
        </p>
        <Icon className=" text-slate-700 ml-px scale-[1]" />
      </div>
      <hr key={index} className="h-px bg-brand-darkBgAccent border-none w-full m-0 p-0" tabIndex={-1} />
    </>
  );
};
export default CommandSectionLabel;
