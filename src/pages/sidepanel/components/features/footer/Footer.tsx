import { useAtom } from 'jotai';
import { motion } from 'framer-motion';
import { Droppable } from 'react-beautiful-dnd';

import Menu from './Menu';
import { showAddNewNoteModalAtom, showNewSpaceModalAtom } from '@root/src/stores/app';
import { PlusIcon, TrashIcon } from '@radix-ui/react-icons';
import OtherSpacesContainer from '../space/other-space/OtherSpacesContainer';
import Tooltip from '../../elements/tooltip';
import { useState } from 'react';
import Popover from '../../elements/popover';
import { wait } from '@root/src/pages/utils';

type Props = {
  isDraggingSpace: boolean;
  isDraggingTabs: boolean;
};

const Footer = ({ isDraggingSpace, isDraggingTabs }: Props) => {
  // global state
  const [, setNewSpaceModal] = useAtom(showNewSpaceModalAtom);
  const [, setNewNoteModal] = useAtom(showAddNewNoteModalAtom);

  // local state
  // show add option on add click
  const [showAddOption, setShowAddOptions] = useState(false);

  const animationVariants = {
    visible: { scale: 1, opacity: 1 },
    hidden: { scale: 0, opacity: 0 },
  };

  return (
    <>
      <footer className="relative w-full h-[5%] flex items-end justify-center pb-1 px-px">
        {/* menu */}
        <div className="size-[25px] bg-purple-20 flex items-center justify-center rounded-lg ml-1">
          <Menu />
        </div>
        {/* other spaces */}
        <div className="flex  items-center justify-center flex-grow max-w-[88%] overflow-hidden">
          <OtherSpacesContainer isDraggingSpace={isDraggingSpace} isDraggingTabs={isDraggingTabs} />
        </div>

        {/* add/delete space container */}
        {/* delete space drop box */}
        <div className="relative size-[25px] bg-orange-20 right-[4px] bottom-px">
          <Droppable droppableId="delete-space" direction="horizontal" type="SPACE" isDropDisabled={isDraggingTabs}>
            {(provided, { isDraggingOver: isDraggingOverDelete }) => (
              <motion.div
                {...provided.droppableProps}
                ref={provided.innerRef}
                animate={isDraggingSpace ? 'visible' : 'hidden'}
                variants={animationVariants}
                transition={{ type: 'spring', stiffness: 1000, damping: 40, duration: 0.1 }}
                className={`!size-full bg-gradient-to-bl px-1 from-brand-darkBgAccent/90 to-brand-darkBg/90 absolute top-px -right-px
                             cursor-pointer flex items-center outline-brand-darkBgAccent border-none justify-center  rounded-lg`}
                style={{
                  visibility: isDraggingSpace ? 'visible' : 'hidden',
                  zIndex: isDraggingSpace ? 200 : 1,
                  backgroundColor: isDraggingOverDelete ? '#ec2427fb' : '',
                  border: isDraggingOverDelete ? ' 1.2px solid #f980a08a' : '',
                }}>
                <TrashIcon className="text-rose-400 scale-[1]" />
              </motion.div>
            )}
          </Droppable>

          {/* Add new space button */}
          <Droppable droppableId={'add-new-space'} direction="horizontal" mode="standard" type="TAB">
            {(provided, { isDraggingOver: isDraggingOverNewSpace }) => (
              <motion.div
                {...provided.droppableProps}
                ref={provided.innerRef}
                animate={!isDraggingSpace ? 'visible' : 'hidden'}
                variants={animationVariants}
                transition={{ type: 'spring', stiffness: 1000, damping: 40, duration: 0.1 }}
                className="size-full relative"
                style={{
                  visibility: !isDraggingSpace ? 'visible' : 'hidden',
                  zIndex: !isDraggingSpace ? 200 : 1,
                }}>
                {/* click option: add note & add space  */}
                <Tooltip label={isDraggingSpace || isDraggingTabs ? '' : 'Add new space'} delay={1500}>
                  <Popover
                    open={showAddOption}
                    onChange={open => setShowAddOptions(open)}
                    content={
                      // eslint-disable-next-line jsx-a11y/click-events-have-key-events, jsx-a11y/no-static-element-interactions
                      <div
                        className="bg-brand-darkBg/40 px-2 py-1 rounded-md w-fit flex flex-col"
                        onClick={() => setShowAddOptions(false)}
                        onMouseEnter={() => setShowAddOptions(true)}
                        onMouseLeave={() => setShowAddOptions(false)}>
                        <button
                          className="text-slate-400/80 font-medium text-[10px] bg-brand-darkBgAccent/70 px-5 py-[6px] rounded mb-1 outline-none hover:opacity-90 transition-all duration-200"
                          onClick={() => setNewSpaceModal({ show: true, tabs: [] })}>
                          New Space
                        </button>

                        <button
                          className="text-slate-400/80 font-medium text-[10px] bg-brand-darkBgAccent/70 px-5 py-[6px] rounded outline-none hover:opacity-90 transition-all duration-200"
                          onClick={() => setNewNoteModal({ show: true, note: { text: '' } })}>
                          New Note
                        </button>
                      </div>
                    }>
                    <button
                      className={`!size-full absolute rounded-full outline-none flex items-center justify-center
                    transition-all duration-200 hover:bg-brand-darkBgAccent/20`}
                      style={{
                        border: isDraggingOverNewSpace ? '1px solid #29dc8071' : '',
                        backgroundColor: isDraggingOverNewSpace ? ' #3ae88e6b' : '',
                      }}
                      onMouseEnter={() => setShowAddOptions(true)}
                      onMouseLeave={() => {
                        // wait .1s before closing
                        async () => {
                          await wait(100);
                          setShowAddOptions(false);
                        };
                      }}
                      onClick={() => setShowAddOptions(true)}>
                      <PlusIcon className="text-slate-500 scale-[1.3]" />
                    </button>
                  </Popover>
                </Tooltip>
              </motion.div>
            )}
          </Droppable>
        </div>
      </footer>
    </>
  );
};

export default Footer;
