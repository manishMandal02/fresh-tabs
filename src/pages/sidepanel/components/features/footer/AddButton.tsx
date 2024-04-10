import { useAtom } from 'jotai';
import { useState } from 'react';
import { motion } from 'framer-motion';

import { PlusIcon } from '@radix-ui/react-icons';
import Tooltip from '../../../../../components/tooltip';
import Popover from '../../../../../components/popover';
import { useCustomAnimation } from '../../../hooks/useCustomAnimation';
import { showAddNewNoteModalAtom, showNewSpaceModalAtom } from '@root/src/stores/app';
import KBD from '@root/src/components/kbd/KBD';

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

  const { bounce } = useCustomAnimation();

  return (
    <Tooltip label={isDraggingGlobal ? '' : 'Add new space'} delay={1500}>
      <Popover
        open={showAddOption}
        onChange={open => setShowAddOptions(open)}
        modalOffset={3}
        content={
          // eslint-disable-next-line jsx-a11y/click-events-have-key-events, jsx-a11y/no-static-element-interactions
          <motion.div
            {...bounce}
            className="px-3 py-2.5 rounded-lg w-fit flex flex-col"
            onClick={() => setShowAddOptions(false)}>
            <button
              className="text-slate-300/80 text-[11px] bg-gradient-to-br from-brand-darkBgAccent/70 to-slate-900/90 border border-brand-darkBgAccent/30 px-3 py-[7px] rounded mb-1.5 outline-none hover:text-slate-300 hover:border-brand-darkBgAccent/80  transition-all duration-300"
              onClick={() => setNewSpaceModal({ show: true, tabs: [] })}>
              New Space{' '}
              <span className="ml-1">
                <KBD classes="text-[8px] shadow-brand-darkBgAccent/80">Shift</KBD>{' '}
                <span className="text-slate-500 ">+</span>{' '}
                <KBD classes="text-[8px] shadow-brand-darkBgAccent/80">S</KBD>
              </span>
            </button>

            <button
              className="text-slate-300/80 text-[11px] bg-gradient-to-br from-brand-darkBgAccent/70 to-slate-900/90 border border-brand-darkBgAccent/30 px-3 py-[7px] rounded outline-none hover:text-slate-300 hover:border-brand-darkBgAccent/80  transition-all duration-300"
              onClick={() => setNewNoteModal({ show: true, note: { text: '' } })}>
              New Note
              <span className="ml-1.5">
                <KBD classes="text-[8px] shadow-brand-darkBgAccent/80">Shift</KBD>{' '}
                <span className="text-slate-500">+</span> <KBD classes="text-[8px] shadow-brand-darkBgAccent/80">N</KBD>
              </span>
            </button>
          </motion.div>
        }>
        <button
          className={`!size-full absolute rounded-full outline-none flex items-center justify-center
      transition-all duration-200 hover:bg-brand-darkBgAccent/20`}
          style={{
            border: isDraggingOver ? '1px solid #29dc8071' : '',
            backgroundColor: isDraggingOver ? ' #3ae88e6b' : '',
          }}
          onClick={() => setShowAddOptions(true)}>
          <PlusIcon className="text-slate-500 scale-[1.3]" />
        </button>
      </Popover>
    </Tooltip>
  );
};

export default AddButton;
