import { motion } from 'framer-motion';
import { Droppable } from 'react-beautiful-dnd';

import Menu from './Menu';
import { TrashIcon } from '@radix-ui/react-icons';
import OtherSpacesContainer from '../space/other-space/OtherSpacesContainer';

import AddButton from './AddButton';

type Props = {
  isDraggingSpace: boolean;
};

const Footer = ({ isDraggingSpace }: Props) => {
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
          <OtherSpacesContainer isDraggingSpace={isDraggingSpace} />
        </div>

        {/* add/delete space container */}
        {/* delete space drop box */}
        <div className="relative size-[25px] bg-orange-20 right-[4px] bottom-px">
          <Droppable droppableId="delete-space" direction="horizontal" type="SPACE">
            {(provided, { isDraggingOver: isDraggingOverDelete }) => (
              <motion.div
                {...provided.droppableProps}
                ref={provided.innerRef}
                animate={isDraggingSpace ? 'visible' : 'hidden'}
                variants={animationVariants}
                transition={{ type: 'spring', stiffness: 1000, damping: 40, duration: 0.1 }}
                className={`!size-full bg-gradient-to-bl px-1 from-brand-darkBgAccent/90 to-brand-darkBg/90 absolute -top-px right-px
                             cursor-pointer flex items-center outline-brand-darkBgAccent border border-brand-darkBgAccent/40 justify-center  rounded-[7px]`}
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
          <motion.div
            animate={!isDraggingSpace ? 'visible' : 'hidden'}
            variants={animationVariants}
            transition={{ type: 'spring', stiffness: 1000, damping: 40, duration: 0.1 }}
            className="size-full relative"
            style={{
              visibility: !isDraggingSpace ? 'visible' : 'hidden',
              zIndex: !isDraggingSpace ? 200 : 1,
            }}>
            {/* click option: add note & add space  */}
            <AddButton />
          </motion.div>
        </div>
      </footer>
    </>
  );
};

export default Footer;
