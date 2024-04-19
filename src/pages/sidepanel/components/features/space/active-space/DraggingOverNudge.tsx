import { useAtom } from 'jotai';
import { motion } from 'framer-motion';
import { TriangleDownIcon } from '@radix-ui/react-icons';

import { nonActiveSpacesAtom } from '@root/src/stores/app';
import { useCustomAnimation } from '@root/src/pages/sidepanel/hooks/useCustomAnimation';

type Props = {
  droppableId: string;
  mergeSpaceWith?: string;
};

const DraggingOverNudge = ({ droppableId, mergeSpaceWith }: Props) => {
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
    <motion.div
      {...bounce}
      className={`absolute min-w-fit w-[10rem] -top-[160%] -left-[3.75rem] py-1.5 px-3 shadow shadow-brand-darkBgAccent/80 
                   text-center bg-gradient-to-bl from-brand-darkBgAccent/90 to-brand-darkBg/95 rounded-lg `}>
      <p className="min-w-[80%] max-w-[98%] mx-auto whitespace-nowrap text-[11.5px] overflow-hidden text-ellipsis text-slate-300/90">
        {draggingOverLocation()}
      </p>
      <TriangleDownIcon className="absolute -bottom-[10px] left-1/2  -translate-x-1/2 text-brand-darkBgAccent/90 scale-[1.2]" />
    </motion.div>
  ) : (
    <></>
  );
};

export default DraggingOverNudge;
