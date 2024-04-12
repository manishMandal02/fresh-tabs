import { useAtom } from 'jotai';
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
  const [spaces] = useAtom(nonActiveSpacesAtom);

  const { isMetaKeyPressed } = useMetaKeyPressed({});

  // bounce div animation
  const { bounce } = useCustomAnimation();

  return (
    <div
      className="px-2 py-[2px] flex items-center justify-center overflow-hidden
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
            className="w-fit flex justify-center items-center gap-x-[.45rem]"
            style={{
              width: 100 / spaces.length + '%',
            }}>
            {/* non active spaces */}
            {spaces.map((space, idx) => {
              return (
                <Draggable key={space.id} draggableId={space.id} index={idx} isDragDisabled={isDraggingTabs}>
                  {(provided3, { combineTargetFor, combineWith, draggingOver }) => (
                    <div
                      ref={provided3.innerRef}
                      {...provided3.draggableProps}
                      {...provided3.dragHandleProps}
                      className="z-10  !cursor-default  size-full"
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
                          <div {...provided2.droppableProps} ref={provided2.innerRef}>
                            <NonActiveSpace space={space} isDraggedOver={isDraggingOver || !!combineTargetFor} />
                            {provided2.placeholder}
                          </div>
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
  );
};

export default OtherSpacesContainer;
