import { MdAdd, MdDelete } from 'react-icons/md';
import { useState, useCallback, useEffect } from 'react';
import { Droppable, Draggable } from 'react-beautiful-dnd';
import { motion } from 'framer-motion';
import { useAtom } from 'jotai';

import Tooltip from '../../elements/tooltip';
import { newSpaceModalAtom, nonActiveSpacesAtom } from '@root/src/stores/app';
import { NonActiveSpace } from './non-active-space';

type Props = {
  isDraggingSpace: boolean;
  isDraggingTabs: boolean;
};

const OtherSpacesContainer = ({ isDraggingSpace, isDraggingTabs }: Props) => {
  // non active spaces  (global state)
  const [spaces] = useAtom(nonActiveSpacesAtom);

  // add new space modal
  const [isModifierKeyPressed, setIsModifierKeyPressed] = useState(false);

  // spaces atom (global state)
  const [, setNewSpaceModal] = useAtom(newSpaceModalAtom);

  const handleKeyDown = useCallback(ev => {
    const keyEv = ev as KeyboardEvent;
    ev.stopPropagation();
    if (keyEv.ctrlKey || keyEv.metaKey) {
      setIsModifierKeyPressed(true);
    }
  }, []);

  const handleKeyUp = useCallback(() => {
    setIsModifierKeyPressed(false);
  }, []);

  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown);
    document.addEventListener('keyup', handleKeyUp);

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('keyup', handleKeyUp);
    };
  }, [handleKeyDown, handleKeyUp]);

  const animationVariants = {
    visible: { scale: 1, opacity: 1 },
    hidden: { scale: 0, opacity: 0 },
  };

  // bounce div animation
  const bounceDivAnimation = {
    initial: { scale: 0, opacity: 0 },
    animate: {
      scale: 1,
      opacity: 1,
    },
    exit: { scale: 0, opacity: 0 },
    transition: { type: 'spring', stiffness: 900, damping: 40, duration: 0.2 },
  };

  return (
    // eslint-disable-next-line jsx-a11y/no-static-element-interactions
    <div className="relative w-full h-[full] flex items-start justify-center overflow-hidden mx-auto gap-x-1 ">
      <Droppable
        droppableId="other-spaces"
        direction="horizontal"
        isDropDisabled={isDraggingTabs}
        type="SPACE"
        isCombineEnabled={isModifierKeyPressed}>
        {(provided1, { isDraggingOver: isDraggingOverOtherSpaces }) => (
          <div
            {...provided1.droppableProps}
            ref={provided1.innerRef}
            className={`max-w-[83.5%] w-fit pb-2 py-1.5 px-1.5  flex gap-x-2 overflow-y-hidden overflow-x-auto scroll-smooth 
                        rounded-md cc-scrollbar shadow-inner shadow-brand-darkBgAccent/20`}>
            {spaces.map((space, idx) => {
              return (
                <Draggable key={space.id} draggableId={space.id} index={idx} isDragDisabled={isDraggingTabs}>
                  {(provided3, { combineTargetFor, combineWith }) => (
                    <div
                      ref={provided3.innerRef}
                      {...provided3.draggableProps}
                      {...provided3.dragHandleProps}
                      className="z-10 "
                      style={{
                        ...provided3.draggableProps.style,
                        opacity: !combineWith || (!isDraggingOverOtherSpaces && isDraggingSpace) ? '1' : '0.75',
                      }}>
                      <Droppable
                        key={space.id}
                        droppableId={'space-' + space.id}
                        direction="horizontal"
                        type="TAB"
                        isDropDisabled={isDraggingSpace}>
                        {(provided2, { isDraggingOver }) => (
                          <motion.div
                            {...provided2.droppableProps}
                            {...bounceDivAnimation}
                            ref={provided2.innerRef}
                            className=" h-[35px] w-[50px] mt-1 mb-1.5">
                            <NonActiveSpace space={space} isDraggedOver={isDraggingOver || !!combineTargetFor} />
                          </motion.div>
                        )}
                      </Droppable>
                    </div>
                  )}
                </Draggable>
              );
            })}
          </div>
        )}
      </Droppable>

      <div className="relative w-[17%]  py-1.5 bg-red-30 h-full mt-1">
        {/* delete space drop box */}
        <Droppable droppableId="delete-space" direction="horizontal" type="SPACE" isDropDisabled={isDraggingTabs}>
          {(provided, { isDraggingOver }) => (
            <motion.div
              {...provided.droppableProps}
              ref={provided.innerRef}
              animate={isDraggingSpace ? 'visible' : 'hidden'}
              variants={animationVariants}
              transition={{ type: 'spring', stiffness: 1000, damping: 40, duration: 0.2 }}
              className="rounded-lg absolute top-2 -right-px w-[45px] h-[40px] flex bg-gradient-to-bl from-brand-darkBgAccent/90 to-brand-darkBg/90 items-center justify-center "
              style={{
                // display: 'flex',
                visibility: isDraggingSpace ? 'visible' : 'hidden',
                zIndex: isDraggingSpace ? 200 : 1,
                backgroundColor: isDraggingOver ? '#ec2427fb' : '',
                border: isDraggingOver ? ' 1.5px solid #fe7ea08b' : '',
              }}>
              <MdDelete className="text-rose-400" size={20} />
            </motion.div>
          )}
        </Droppable>

        {/* Add new space button */}
        <Droppable droppableId={'add-new-space'} direction="horizontal" mode="standard" type="TAB">
          {(provided, { isDraggingOver }) => (
            <motion.div
              {...provided.droppableProps}
              ref={provided.innerRef}
              animate={!isDraggingSpace ? 'visible' : 'hidden'}
              variants={animationVariants}
              transition={{ type: 'spring', stiffness: 1000, damping: 40, duration: 0.2 }}
              style={{
                visibility: !isDraggingSpace ? 'visible' : 'hidden',
                zIndex: !isDraggingSpace ? 200 : 1,
              }}>
              <Tooltip label="Add new space" delay={1500}>
                <button
                  className={`bg-gradient-to-bl from-brand-darkBgAccent/90 to-brand-darkBg/90 w-[45px] h-[40px]  
                            absolute top-px -right-px cursor-pointer flex items-center justify-center  rounded-lg`}
                  style={{
                    border: isDraggingOver ? '1px dashed #6b6a6a' : '',
                    backgroundColor: isDraggingOver ? ' #21262e' : '',
                  }}
                  onClick={() => setNewSpaceModal({ show: true, tabs: [] })}>
                  <MdAdd className="text-2xl font-extralight  text-slate-600" />
                </button>
              </Tooltip>
            </motion.div>
          )}
        </Droppable>
      </div>
    </div>
  );
};

export default OtherSpacesContainer;
