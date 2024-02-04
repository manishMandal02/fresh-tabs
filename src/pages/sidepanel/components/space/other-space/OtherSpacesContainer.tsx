import { MdAdd } from 'react-icons/md';
import { useState, useCallback, useEffect } from 'react';
import { Droppable, Draggable } from 'react-beautiful-dnd';

import { ISpace } from '@root/src/pages/types/global.types';
import NonActiveSpace from './NonActiveSpace';
import CreateSpace from '../create/CreateSpace';
import Tooltip from '../../elements/tooltip';

type Props = {
  isDraggingGlobal: boolean;
  spaces: ISpace[];
};

const OtherSpacesContainer = ({ isDraggingGlobal, spaces }: Props) => {
  // add new space modal
  const [showAddSpaceModal, setShowAddSpaceModal] = useState(false);
  const [isModifierKeyPressed, setIsModifierKeyPressed] = useState(false);

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

  return (
    // eslint-disable-next-line jsx-a11y/no-static-element-interactions
    <div
      className="w-full h-[12%] -mt-3.5 flex items-start overflow-hidden  mx-auto "
      onKeyDown={ev => ev.stopPropagation()}>
      <Droppable
        droppableId="other-spaces"
        direction="horizontal"
        isDropDisabled={isDraggingGlobal}
        isCombineEnabled={isModifierKeyPressed}>
        {(provided1, { isDraggingOver: isDraggingOverOtherSpaces }) => (
          <div
            {...provided1.droppableProps}
            ref={provided1.innerRef}
            className="w-[80%]  pb-2 px-1 flex  gap-x-2 overflow-y-hidden overflow-x-auto scroll-smooth  cc-scrollbar shadow-inner shadow-brand-darkBgAccent/30">
            {spaces.map((space, idx) => {
              return (
                <Draggable key={space.id} draggableId={space.id} index={idx} isDragDisabled={isDraggingGlobal}>
                  {(provided3, { combineTargetFor, combineWith }) => (
                    <div
                      ref={provided3.innerRef}
                      {...provided3.draggableProps}
                      {...provided3.dragHandleProps}
                      className="z-10 transition-all duration-200"
                      style={{
                        ...provided3.draggableProps.style,
                        opacity: !combineWith ? '1' : '0.75',
                      }}>
                      <Droppable
                        key={space.id}
                        droppableId={space.id}
                        direction="horizontal"
                        isDropDisabled={isDraggingOverOtherSpaces}>
                        {(provided2, { isDraggingOver }) => (
                          <div {...provided2.droppableProps} ref={provided2.innerRef} className=" h-fit w-[50px]">
                            <NonActiveSpace space={space} isDraggedOver={isDraggingOver || !!combineTargetFor} />
                          </div>
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

      {/* Add new space button */}
      <div className="w-[14%] py-1 ml-1 h-fit">
        <Droppable droppableId={'add-new-space'} direction="horizontal" mode="standard">
          {(provided, { isDraggingOver }) => (
            <div {...provided.droppableProps} ref={provided.innerRef} className=" z-10">
              <Tooltip label="Add new space" delay={1500}>
                <button
                  className="bg-gradient-to-bl from-brand-darkBgAccent/90 w-[38px] h-[38px] to-brand-darkBg/90 cursor-pointer flex items-center justify-center  rounded"
                  style={{
                    border: isDraggingOver ? '1px dashed #6b6a6a' : '',
                    backgroundColor: isDraggingOver ? ' #21262e' : '',
                  }}
                  onClick={() => setShowAddSpaceModal(true)}>
                  <MdAdd className="text-2xl font-extralight  text-slate-600" />
                </button>
              </Tooltip>
            </div>
          )}
        </Droppable>
      </div>
      {/* add new space */}
      <CreateSpace show={showAddSpaceModal} onClose={() => setShowAddSpaceModal(false)} />
    </div>
  );
};

export default OtherSpacesContainer;
