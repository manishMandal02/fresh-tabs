import { useAtom } from 'jotai';
import { motion } from 'framer-motion';
import { TriangleDownIcon } from '@radix-ui/react-icons';

import { nonActiveSpacesAtom } from '@root/src/stores/app';
import { useCustomAnimation } from '@root/src/pages/sidepanel/hooks/useAnimation';

type Props = {
  droppableId: string;
};

const DraggingOverNudge = ({ droppableId }: Props) => {
  const [nonActiveSpaces] = useAtom(nonActiveSpacesAtom);

  // know over which droppable the draggable is dragging over
  const draggingOverLocation = () => {
    if (!droppableId) return;
    if (droppableId === 'add-new-space') {
      return `Create new space with this tab`;
    }

    if (droppableId.startsWith('space-')) {
      const spaceId = droppableId.split('-')[1];
      const space = nonActiveSpaces.find(space => space.id === spaceId);
      return `Add tab to ${space.title}`;
    }
  };

  const { bounce } = useCustomAnimation();
  return draggingOverLocation ? (
    <motion.div
      {...bounce}
      className={`absolute w-44  -top-[38px] -left-[70px] mx-auto px-3 py-2 text-[10px] text-slate-300/90 font-light text-center
      bg-gradient-to-bl from-brand-darkBgAccent/85 to-brand-darkBg/90 rounded-lg`}>
      {draggingOverLocation()}

      <TriangleDownIcon className="absolute w-3 h-3 -bottom-[7px] left-1/2 -translate-x-1/2 text-slate-800 scale-[1.2]" />
    </motion.div>
  ) : (
    <></>
  );
};

export default DraggingOverNudge;
