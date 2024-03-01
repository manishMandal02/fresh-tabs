import CustomContextMenu from './ContextMenu';
import { ISpace } from '@root/src/pages/types/global.types';

type Props = {
  space: ISpace;
  isDraggedOver: boolean;
};

const NonActiveSpace = ({ space, isDraggedOver }: Props) => {
  return (
    <CustomContextMenu space={space}>
      <div
        className={`text-slate-300 select-none rounded-lg  flex items-center  justify-center
                      py-1.5 px-3  bg-gradient-to-bl from-brand-darkBgAccent/95 to-brand-darkBg/95 `}
        style={{
          ...(isDraggedOver
            ? {
                borderColor: '1px dashed' + space.theme,
                backgroundColor: space.theme,
              }
            : {
                backgroundColor: space.theme,
              }),
        }}>
        <span className="text-[16px] opacity-90">{space.emoji}</span>
      </div>
    </CustomContextMenu>
  );
};

export default NonActiveSpace;
