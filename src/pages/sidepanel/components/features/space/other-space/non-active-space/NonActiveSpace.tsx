import { ISpace } from '@root/src/pages/types/global.types';
import Tooltip from '../../../../elements/tooltip';
import CustomContextMenu from './ContextMenu';

type Props = {
  space: ISpace;
  isDraggedOver: boolean;
};

const NonActiveSpace = ({ space, isDraggedOver }: Props) => {
  return (
    <CustomContextMenu space={space}>
      <Tooltip label={!isDraggedOver ? space.title : ''}>
        <div
          className={`text-slate-300 select-none rounded-tl-md  rounded-tr-md rounded-bl rounded-br 
                flex items-center  justify-center w-full h-full  py-1.5 px-3  bg-gradient-to-bl from-brand-darkBgAccent/90 to-brand-darkBg/90`}
          style={{
            ...(isDraggedOver
              ? {
                  border: '1px dashed' + space.theme,
                  backgroundColor: space.theme,
                }
              : {
                  border: '1px solid transparent',
                  borderBottom: '1.25px solid' + space.theme,
                }),
          }}>
          <span className="text-xl opacity-90">{space.emoji}</span>
        </div>
      </Tooltip>
    </CustomContextMenu>
  );
};

export default NonActiveSpace;
