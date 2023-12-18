import { useState, useEffect } from 'react';
import { ISpace } from '../types/global.types';
import { testSpaces } from './testData';
import { CreateSpace, Space, UpdateSpace } from './components/space';

const SidePanel = () => {
  const [spaces, setSpaces] = useState<ISpace[] | undefined>(undefined);

  const [spaceToUpdate, setSpaceToUpdate] = useState<ISpace | null>(null);

  useEffect(() => {
    const sortedSpaces = testSpaces.toSorted(a => {
      if (!a.isSaved) {
        return -1;
      } else {
        return 1;
      }
    });

    setSpaces(sortedSpaces);
  }, []);

  return (
    <div className="w-screen h-screen  overflow-hidden bg-brand-background">
      <main className="h-full relative ">
        {/* heading */}
        <p className="h-[3%] text-slate-300 text-[.9rem] font-extralight pt-1  text-center">Fresh Tabs</p>
        {/* spaces */}
        <div className="w-full  h-[97%] pt-10 px-3">
          <p className="text-sm text-slate-500  mb-1.5 tracking-wide select-none">Spaces</p>
          {/* un saved  */}
          {spaces?.map(space => (
            <Space
              key={space.id}
              numSpaces={spaces.length}
              space={space}
              onUpdateClick={() => setSpaceToUpdate(space)}
            />
          ))}
          {/* add new space */}
          <CreateSpace />
          {/* update space */}
          <UpdateSpace isOpen={spaceToUpdate !== null} space={spaceToUpdate} onClose={() => setSpaceToUpdate(null)} />
        </div>
      </main>
    </div>
  );
};

export default SidePanel;
