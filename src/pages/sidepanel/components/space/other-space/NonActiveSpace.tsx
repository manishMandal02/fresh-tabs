import { ISpace } from '@root/src/pages/types/global.types';
import Tooltip from '../../elements/tooltip';

type Props = {
  space: ISpace;
  isDraggedOver: boolean;
};

const NonActiveSpace = ({ space, isDraggedOver }: Props) => {
  return (
    <Tooltip label={!isDraggedOver ? space.title : ''} delay={500}>
      <div
        className="text-slate-300 select-none   rounded flex items-center  justify-center w-full h-full  py-1.5 px-3  bg-gradient-to-bl from-brand-darkBgAccent/90 to-brand-darkBg/90"
        style={{
          ...(isDraggedOver
            ? {
                border: '1px dashed' + space.theme,
                backgroundColor: space.theme,
              }
            : {
                borderBottom: '1.25px solid' + space.theme,
              }),
        }}>
        <span className="text-xl opacity-90">{space.emoji}</span>
      </div>
    </Tooltip>
  );
};

export default NonActiveSpace;
