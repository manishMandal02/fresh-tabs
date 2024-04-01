import { useAtom } from 'jotai';
import { useState } from 'react';

import { wait } from '@root/src/utils';
import Tooltip from '../../../../../components/tooltip';
import Popover from '../../../../../components/popover';
import { PlusIcon } from '@radix-ui/react-icons';
import { showAddNewNoteModalAtom, showNewSpaceModalAtom } from '@root/src/stores/app';

type Props = {
  isDraggingGlobal: boolean;
  isDraggingOver: boolean;
};

const AddButton = ({ isDraggingGlobal, isDraggingOver }: Props) => {
  // global state
  const [, setNewSpaceModal] = useAtom(showNewSpaceModalAtom);
  const [, setNewNoteModal] = useAtom(showAddNewNoteModalAtom);

  // local state
  const [showAddOption, setShowAddOptions] = useState(false);
  const [isHoveringOverCard, setIsHoveringOverCard] = useState(false);

  return (
    <Tooltip label={isDraggingGlobal ? '' : 'Add new space'} delay={1500}>
      <Popover
        open={showAddOption}
        onChange={open => setShowAddOptions(open)}
        modalOffset={1}
        content={
          // eslint-disable-next-line jsx-a11y/click-events-have-key-events, jsx-a11y/no-static-element-interactions
          <div
            className="bg-brand-darkBg/40 px-2 py-1 rounded-md w-fit flex flex-col"
            onClick={() => setShowAddOptions(false)}
            onMouseEnter={() => {
              setIsHoveringOverCard(true);
              setShowAddOptions(true);
            }}
            onMouseLeave={() => {
              setIsHoveringOverCard(false);
              setShowAddOptions(false);
            }}>
            <button
              className="text-slate-400/80 font-medium text-[10px] bg-gradient-to-br from-brand-darkBgAccent/70 to-slate-900/90 border border-brand-darkBgAccent/30 px-7 py-[7px] rounded mb-1 outline-none hover:text-slate-300/80 hover:border-brand-darkBgAccent/60 transition-all duration-200"
              onClick={() => setNewSpaceModal({ show: true, tabs: [] })}>
              New Space
            </button>

            <button
              className="text-slate-400/80 font-medium text-[10px] bg-gradient-to-br from-brand-darkBgAccent/70 to-slate-900/90 border border-brand-darkBgAccent/30 px-7 py-[7px] rounded outline-none hover:text-slate-300/80 hover:border-brand-darkBgAccent/60 transition-all duration-200"
              onClick={() => setNewNoteModal({ show: true, note: { text: '' } })}>
              New Note
            </button>
          </div>
        }>
        <button
          className={`!size-full absolute rounded-full outline-none flex items-center justify-center
      transition-all duration-200 hover:bg-brand-darkBgAccent/20`}
          style={{
            border: isDraggingOver ? '1px solid #29dc8071' : '',
            backgroundColor: isDraggingOver ? ' #3ae88e6b' : '',
          }}
          onMouseEnter={() => setShowAddOptions(true)}
          onMouseLeave={() => {
            (async () => {
              await wait(500);
            })();
            !isHoveringOverCard && setShowAddOptions(false);
          }}
          onClick={ev => ev.preventDefault()}>
          <PlusIcon className="text-slate-500 scale-[1.3]" />
        </button>
      </Popover>
    </Tooltip>
  );
};

export default AddButton;
