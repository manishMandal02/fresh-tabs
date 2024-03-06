import { TrashIcon } from '@radix-ui/react-icons';
import { useState, useCallback, useEffect } from 'react';
import { Droppable, Draggable } from 'react-beautiful-dnd';
import { motion } from 'framer-motion';
import { useAtom } from 'jotai';
``;

import Tooltip from '../../../elements/tooltip';
import { newSpaceModalAtom, nonActiveSpacesAtom } from '@root/src/stores/app';
import { NonActiveSpace } from './non-active-space';
import { useCustomAnimation } from '../../../../hooks/useAnimation';
import DraggingOverNudge from '../active-space/DraggingOverNudge';

type Props = {
  isDraggingSpace: boolean;
  isDraggingTabs: boolean;
};

// const SPACE_CONTAINER_SIZE = { width: 40, height: 35 };

// TODO - calculate dynamic size for spaces based on num of spaces

const OtherSpacesContainer = ({ isDraggingSpace, isDraggingTabs }: Props) => {
  // non active spaces  (global state)
  const [spaces] = useAtom(nonActiveSpacesAtom);

  const spaceContainerWidth = Math.min(40, Math.round(spaces.length * 3.5));

  console.log('🚀 ~ OtherSpacesContainer ~ spaceContainerWidth:', spaceContainerWidth);

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
  const { bounce } = useCustomAnimation();

  return (
    // main container
    // eslint-disable-next-line jsx-a11y/no-static-element-interactions
    <div className="relative size-full flex items-center justify-center overflow-hidden px-1">
      {/* non active spaces container */}
      <div
        className="px-1.5 py-[6px] flex overflow-hidden rounded-md  w-fit max-w-[92%]
                    shadow-inner shadow-brand-darkBgAccent/10">
        <Droppable
          droppableId="other-spaces"
          direction="horizontal"
          isDropDisabled={isDraggingTabs}
          type="SPACE"
          isCombineEnabled={isModifierKeyPressed}>
          {(provided1, { isDraggingOver: isDraggingOverOtherSpaces }) => (
            <motion.div
              {...provided1.droppableProps}
              ref={provided1.innerRef}
              {...bounce}
              className="size-full flex justify-center gap-x-[.35rem] ">
              {/* non active spaces */}
              {spaces.map((space, idx) => {
                return (
                  <Draggable key={space.id} draggableId={space.id} index={idx} isDragDisabled={isDraggingTabs}>
                    {(provided3, { combineTargetFor, combineWith, draggingOver }) => (
                      <div
                        ref={provided3.innerRef}
                        {...provided3.draggableProps}
                        {...provided3.dragHandleProps}
                        className="z-10  !cursor-default last:mr-0  size-full"
                        tabIndex={-1}
                        style={{
                          ...provided3.draggableProps.style,
                          opacity: !combineWith || (!isDraggingOverOtherSpaces && isDraggingSpace) ? '1' : '0.75',
                        }}>
                        {draggingOver || combineWith ? (
                          <DraggingOverNudge droppableId={draggingOver} mergeSpaceWith={combineWith} />
                        ) : null}
                        {/* tabs drop zone to add tab to a non active space */}
                        <Droppable
                          key={space.id}
                          droppableId={'space-' + space.id}
                          direction="horizontal"
                          type="TAB"
                          isDropDisabled={isDraggingSpace}>
                          {(provided2, { isDraggingOver }) => (
                            // <Tooltip label={!isDraggingTabs && !isDraggingSpace ? space.title : ''}>
                            <div
                              {...provided2.droppableProps}
                              ref={provided2.innerRef}
                              style={{
                                width: spaceContainerWidth,
                                height: spaceContainerWidth + spaceContainerWidth / 10,
                              }}>
                              <NonActiveSpace space={space} isDraggedOver={isDraggingOver || !!combineTargetFor} />
                              {provided2.placeholder}
                            </div>
                            // </Tooltip>
                          )}
                        </Droppable>
                      </div>
                    )}
                  </Draggable>
                );
              })}
              {provided1.placeholder}
            </motion.div>
          )}
        </Droppable>
      </div>
      {/* add/delete container  */}
      <div
        className="relative !w-[8%] scale-[.75]"
        style={{
          width: spaceContainerWidth,
          height: spaceContainerWidth + spaceContainerWidth / 8,
        }}>
        {/* delete space drop box */}
        <Droppable droppableId="delete-space" direction="horizontal" type="SPACE" isDropDisabled={isDraggingTabs}>
          {(provided, { isDraggingOver }) => (
            <motion.div
              {...provided.droppableProps}
              ref={provided.innerRef}
              animate={isDraggingSpace ? 'visible' : 'hidden'}
              variants={animationVariants}
              transition={{ type: 'spring', stiffness: 1000, damping: 40, duration: 0.1 }}
              className={`size-full bg-gradient-to-bl from-brand-darkBgAccent/90 to-brand-darkBg/90 absolute top-px -right-px 
                         cursor-pointer flex items-center outline-brand-darkBgAccent border-none justify-center  rounded-lg`}
              style={{
                visibility: isDraggingSpace ? 'visible' : 'hidden',
                zIndex: isDraggingSpace ? 200 : 1,
                backgroundColor: isDraggingOver ? '#ec2427fb' : '',
                border: isDraggingOver ? ' 1.2px solid #f980a08a' : '',
              }}>
              <TrashIcon className="text-rose-400 scale-1.5" />
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
              transition={{ type: 'spring', stiffness: 1000, damping: 40, duration: 0.1 }}
              className=""
              style={{
                visibility: !isDraggingSpace ? 'visible' : 'hidden',
                zIndex: !isDraggingSpace ? 200 : 1,
              }}>
              <Tooltip label={isDraggingSpace || isDraggingTabs ? '' : 'Add new space'} delay={1500}>
                <button
                  className={`size-full bg-gradient-to-bl from-brand-darkBgAccent/90 to-brand-darkBg/90 absolute text-[calc(100%+1.5vw)] shadow-md shadow-brand-darkBgAccent/80
                              rounded-[7px] outline-none flex items-center justify-center focus-within:outline-slate-700 text-slate-500 font-light `}
                  style={{
                    border: isDraggingOver ? '1px solid #29dc8071' : '',
                    backgroundColor: isDraggingOver ? ' #3ae88e6b' : '',
                  }}
                  onClick={() => setNewSpaceModal({ show: true, tabs: [] })}>
                  +
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
