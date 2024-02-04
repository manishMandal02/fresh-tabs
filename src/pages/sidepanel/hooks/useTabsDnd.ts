type UseTabDndProps = {
  destinationIndex: number;
  sourceIndex: number;
  draggableId: string;
  droppableId: string;
};

type DroppedReasons = 'Single_TAB' | 'MULTI_TABS' | 'SPACE' | 'SPACE_ACTIVE_TAB';

export const useTabsDnd = ({ destinationIndex }: UseTabDndProps) => {
  console.log('🚀 ~ useTabsDnd ~ destinationIndex:', destinationIndex);

  // TODO - handlers
  // --single tab--
  //       same space
  //       other space
  //       create new space
  // --multi tabs--
  //       same space
  //       other spaces
  //       create new space
  // --space--
  //       re-arrange
  //       merge
  //       add to active space
  //       delete

  const droppedReason: DroppedReasons = 'MULTI_TABS';

  switch (droppedReason) {
    case 'MULTI_TABS': {
      return true;
    }
  }
};
