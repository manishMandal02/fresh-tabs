import { useAtom } from 'jotai';
import { motion } from 'framer-motion';
import { TriangleDownIcon } from '@radix-ui/react-icons';

import { nonActiveSpacesAtom } from '@root/src/stores/app';
import { useCustomAnimation } from '@root/src/pages/sidepanel/hooks/useAnimation';

type Props = {
  droppableId: string;
  mergeSpaceWith?: string;
};

const DraggingOverNudge = ({ droppableId, mergeSpaceWith }: Props) => {
  console.log('🚀 ~ DraggingOverNudge ~ droppableId:', droppableId);

  const [nonActiveSpaces] = useAtom(nonActiveSpacesAtom);

  // know over which droppable the draggable is dragging over
  const draggingOverLocation = () => {
    if (!droppableId) return;

    if (mergeSpaceWith) {
      const space = nonActiveSpaces.find(space => space.id === mergeSpaceWith);

      return 'Merge with ' + space.title;
    }

    if (droppableId.startsWith('space-')) {
      const spaceId = droppableId.split('-')[1];
      const space = nonActiveSpaces.find(space => space.id === spaceId);

      return 'Add tab to ' + space.title;
    }

    if (droppableId === 'add-new-space') {
      return `Create new space with this tab`;
    }

    if (droppableId === 'delete-space') {
      return 'Remove this space';
    }
  };

  const { bounce } = useCustomAnimation();
  return draggingOverLocation() ? (
    <motion.span {...bounce}>
      <div
        className={`absolute  w-[9.5rem] -top-[100%] left-1/2 -translate-x-1/2 mx-auto px-3 py-2 text-[10px] font-light leading-4 text-center 
                  text-slate-300 bg-gradient-to-bl from-brand-darkBgAccent/95 to-brand-darkBg/95 rounded-lg`}>
        {draggingOverLocation()}
        <TriangleDownIcon className="absolute w-3 h-3 -bottom-[7px] left-1/2 text-slate-800 scale-[1.2]" />
      </div>
    </motion.span>
  ) : (
    <></>
  );
};

export default DraggingOverNudge;
