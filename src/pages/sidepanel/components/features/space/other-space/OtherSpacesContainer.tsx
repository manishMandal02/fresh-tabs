import { useMemo } from 'react';
import { useAtomValue } from 'jotai';
import { motion } from 'framer-motion';
import { Droppable, Draggable } from 'react-beautiful-dnd';

import { NonActiveSpace } from './non-active-space';
import { nonActiveSpacesAtom } from '@root/src/stores/app';
import DraggingOverNudge from '../active-space/DraggingOverNudge';
import { useCustomAnimation } from '../../../../hooks/useCustomAnimation';
import { useMetaKeyPressed } from '@root/src/pages/sidepanel/hooks/use-key-shortcuts';

type Props = {
  isDraggingSpace: boolean;
  isDraggingTabs: boolean;
};

const OtherSpacesContainer = ({ isDraggingSpace, isDraggingTabs }: Props) => {
  console.log(' OtherSpacesContainer ~ 🔁 rendered');

  // non active spaces  (global state)
  const spaces = useAtomValue(nonActiveSpacesAtom);

  const { isMetaKeyPressed } = useMetaKeyPressed({});

  const [savedSpaces, unSavedSpaces] = useMemo(
    () => [spaces.filter(s => s.isSaved), spaces.filter(s => !s.isSaved)],
    [spaces],
  );

  // bounce div animation
  const { bounce } = useCustomAnimation();

  // TODO - separate unsaved spaces

  return (
    <div
      className="px-2 py-[4px] flex items-center justify-center overflow-hidden
                rounded-md  w-fit shadow-inner shadow-brand-darkBgAccent/10">
      <Droppable
        droppableId="other-spaces"
        direction="horizontal"
        isDropDisabled={isDraggingTabs}
        type="SPACE"
        isCombineEnabled={isMetaKeyPressed}>
        {(provided1, { isDraggingOver: isDraggingOverOtherSpaces }) => (
          <motion.div
            {...provided1.droppableProps}
            ref={provided1.innerRef}
            {...bounce}
            className="w-fit flex justify-center items-center gap-x-[.4rem]">
            {/* non active spaces */}
            {savedSpaces.map((space, idx) => {
              return (
                <>
                  <Draggable key={space.id} draggableId={space.id} index={idx} isDragDisabled={isDraggingTabs}>
                    {(provided3, { combineTargetFor, combineWith, draggingOver }) => (
                      <div
                        ref={provided3.innerRef}
                        {...provided3.draggableProps}
                        {...provided3.dragHandleProps}
                        className="z-10  !cursor-default  size-full flex items-center"
                        tabIndex={-1}
                        style={{
                          ...provided3.draggableProps.style,
                          opacity: !combineWith || (!isDraggingOverOtherSpaces && isDraggingSpace) ? '1' : '0.75',
                        }}>
                        {draggingOver || combineWith ? (
                          <DraggingOverNudge droppableId={draggingOver} mergeSpaceWith={combineWith} />
                        ) : null}

                        <NonActiveSpace space={space} isDraggedOver={!!combineTargetFor} />
                      </div>
                    )}
                  </Draggable>
                </>
              );
            })}
            {provided1.placeholder}
          </motion.div>
        )}
      </Droppable>
      {unSavedSpaces?.length > 0 ? (
        <div className="flex items-center ml-[5px] gap-x-[.25rem]">
          {/* vertical divider */}
          <hr className="h-[10px] w-[0.5px] bg-slate-500/70 rounded-md mr-[1px] border-none" />
          {/* unsaved spaces */}
          {unSavedSpaces?.map(space => <NonActiveSpace key={space.id} space={space} isDraggedOver={false} />)}
        </div>
      ) : null}
    </div>
  );
};

export default OtherSpacesContainer;
