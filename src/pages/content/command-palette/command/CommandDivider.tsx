import { ICommand } from '@root/src/pages/types/global.types';

type Props = {
  index: number;
  isStaticCommand: boolean;
  suggestedCommands: ICommand[];
};

const CommandDivider = ({ index, isStaticCommand, suggestedCommands }: Props) => {
  if (index < 2 || isStaticCommand || suggestedCommands.length < 2) return;

  // do nothing if render same command type
  if (suggestedCommands[index - 1].type === suggestedCommands[index - 2].type) return;

  return (
    <>
      {/* <div className="flex items-center justify-start gap-x-1 ml-3 mt-1">
        <p key={index} className="text-[10px] font-extralight text-slate-400" tabIndex={-1}>
          {sectionLabel}
        </p>
      </div> */}
      <hr key={index} className="h-px bg-brand-darkBgAccent/50 border-none w-full m-0 p-0 my-1" tabIndex={-1} />
    </>
  );
};

export default CommandDivider;
