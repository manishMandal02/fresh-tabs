import { CommandType } from '@root/src/constants/app';
import { ICommand } from '@root/src/pages/types/global.types';

type Props = {
  index: number;
  isStaticCommand: boolean;
  suggestedCommands: ICommand[];
};

const CommandSectionLabel = ({ index, isStaticCommand, suggestedCommands }: Props) => {
  if (index < 1 || isStaticCommand) return;
  console.log('🚀 ~ CommandSectionLabel ~ index:', index);

  console.log('🚀 ~ CommandSectionLabel ~ suggestedCommands:', suggestedCommands);
  let sectionLabel = '';

  if (index === suggestedCommands.find(cmd1 => cmd1.type === CommandType.SwitchTab)?.index) {
    sectionLabel = 'Switch to opened tabs';
  } else if (index === suggestedCommands.find(cmd1 => cmd1.type === CommandType.RecentSite)?.index) {
    sectionLabel = 'Open recently visited sites';
  } else if (index === suggestedCommands.find(cmd1 => cmd1.type === CommandType.SwitchSpace)?.index) {
    sectionLabel = 'Switch space';
  }
  console.log('🚀 ~ CommandSectionLabel ~ sectionLabel:', sectionLabel);

  if (!sectionLabel) return;

  return (
    <>
      <hr key={index} className="h-px bg-brand-darkBgAccent/55 border-none w-full m-0 p-0 mb-[6px]" tabIndex={-1} />

      <div className="flex items-center justify-start gap-x-1 ml-3 mb-">
        <p key={index} className="text-[12px] font-thin text-slate-400/80 " tabIndex={-1}>
          {sectionLabel}
        </p>
      </div>
    </>
  );
};

export default CommandSectionLabel;
