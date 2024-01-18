import { ISpace } from '@root/src/pages/types/global.types';
import Tooltip from '../../elements/tooltip';

type Props = {
  space: ISpace;
  isDraggedOver: boolean;
};

const NonActiveSpace = ({ space, isDraggedOver }: Props) => {
  console.log('🚀 ~ NonActiveSpace ~ space:', space);
  console.log('🚀 ~ NonActiveSpace ~ isDraggedOver:', isDraggedOver);

  return (
    <Tooltip label={space.title} delay={500}>
      <div
        className="text-slate-300 rounded flex items-center justify-center w-[60px] h-[60px] bg-brand-darkBgAccent py-1.5 px-3"
        style={{
          border: isDraggedOver ? '2px dashed #000' : '',
        }}>
        <span className="text-xl">{space.emoji}</span>
      </div>
    </Tooltip>
  );
};

export default NonActiveSpace;
