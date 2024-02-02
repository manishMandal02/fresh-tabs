import { ISpace } from '@root/src/pages/types/global.types';
import Tooltip from '../../elements/tooltip';

type Props = {
  space: ISpace;
  isDraggedOver: boolean;
};

const NonActiveSpace = ({ space, isDraggedOver }: Props) => {
  return (
    <Tooltip label={space.title} delay={500}>
      <div
        className="text-slate-300 border-b  rounded flex items-center justify-center w-[50px] h-[50px]  py-1.5 px-3  bg-gradient-to-bl from-brand-darkBgAccent/90 to-brand-darkBg/90"
        style={{
          border: isDraggedOver ? '2px dashed #000' : '',
          borderColor: space.theme,
        }}>
        <span className="text-xl opacity-90">{space.emoji}</span>
      </div>
    </Tooltip>
  );
};

export default NonActiveSpace;
