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
        className={`size-full text-slate-300 select-none rounded-lg flex items-center justify-center border border-transparent bg-gradient-to-bl
                      ${
                        isDraggedOver
                          ? 'from-brand-darkBgAccent/85 to-brand-darkBg/85'
                          : 'from-brand-darkBgAccent/95 to-brand-darkBg/95'
                      }
                    `}
        style={{
          ...(isDraggedOver
            ? {
                border: '1px solid' + space.theme,
              }
            : {}),

          backgroundColor: space.theme,
        }}>
        <span className="text-[16px] opacity-90">{space.emoji}</span>
      </div>
    </CustomContextMenu>
  );
};

export default NonActiveSpace;
