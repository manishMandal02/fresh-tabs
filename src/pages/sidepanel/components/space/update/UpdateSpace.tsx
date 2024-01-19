import { useState, useEffect, ChangeEventHandler } from 'react';
import { SlideModal } from '../../elements/modal';
import { ISpace, ISpaceWithoutId } from '@root/src/pages/types/global.types';
import ColorPicker from '../../elements/color-picker';
import EmojiPicker from '../../elements/emoji-picker';
import Spinner from '../../elements/spinner';
import { useUpdateSpace } from './useUpdateSpace';
import { omitObjProps } from '@root/src/pages/utils/omit-obj-props';

type Props = {
  space: ISpace;
  numTabs: number;
  onClose: () => void;
};

const UpdateSpace = ({ space, numTabs, onClose }: Props) => {
  // update space data
  const [updateSpaceData, setUpdateSpaceData] = useState<ISpaceWithoutId | undefined>(undefined);

  // logic hook
  const { handleUpdateSpace, errorMsg, snackbar } = useUpdateSpace({
    updateSpaceData,
    onClose,
    space,
  });

  useEffect(() => {
    setUpdateSpaceData(omitObjProps(space, 'id'));
  }, [space]);

  // on title change
  const onTitleChange: ChangeEventHandler<HTMLInputElement> = ev => {
    setUpdateSpaceData(prev => ({ ...prev, title: ev.target.value }));
  };
  // on emoji change
  const onEmojiChange = (emoji: string) => {
    setUpdateSpaceData(prev => ({ ...prev, emoji }));
  };

  // on emoji change
  const onThemeChange = (theme: string) => {
    //eslint-disable-next-line
    //@ts-ignore
    setUpdateSpaceData(prev => ({ ...prev, theme }));
  };

  // set update button label
  const updateBtnLabel = (updateSpaceData?.isSaved && 'Update') || 'Save';

  return (
    <SlideModal title="Update Space" isOpen={!!updateSpaceData?.title} onClose={onClose}>
      {updateSpaceData?.title ? (
        <div className=" flex flex-col  w-full h-full py-3 px-4">
          <div className="mt-4 flex items-center gap-x-3">
            <input
              type="text"
              className="rounded bg-slate-700  px-2.5 py-1.5 text-[1rem] text-slate-200 w-48 outline-slate-600"
              placeholder="Space Title..."
              onKeyDown={ev => {
                ev.stopPropagation();
              }}
              value={updateSpaceData.title}
              onChange={onTitleChange}
            />
            <EmojiPicker emoji={updateSpaceData.emoji} onChange={onEmojiChange} />
            <ColorPicker color={updateSpaceData.theme} onChange={onThemeChange} />
          </div>

          {/* numTabs */}
          <div className="mt-6 flex justify-between items-center">
            <p className="text-slate-500 font-light text-base">{numTabs} tabs in space</p>
          </div>
          {/* error msg */}
          {errorMsg ? (
            <span className="test-base mx-auto mt-6 text-slate-700 font-medium bg-red-400 px-3 py-1 w-fit text-center rounded-sm">
              {errorMsg}
            </span>
          ) : null}
          {/* update space */}
          <div className="absolute bottom-5 w-full flex flex-col items-center justify-center left-1/2 -translate-x-1/2">
            <button
              className={` w-[90%] py-2 rounded-md text-slate-500 
                      font-medium text-base shadow shadow-emerald-400 hover:opacity-80 transition-all duration-300`}
              onClick={handleUpdateSpace}>
              {snackbar.isLoading ? <Spinner size="sm" /> : updateBtnLabel}
            </button>
          </div>
        </div>
      ) : null}
    </SlideModal>
  );
};

export default UpdateSpace;
