import { INote, ISpace } from '@root/src/pages/types/global.types';
import { getTimeAgo } from '@root/src/pages/utils/date-time/time-ago';
import { getNotesBySpace } from '@root/src/services/chrome-storage/notes';
import { useCallback, useEffect, useState } from 'react';
import Tooltip from '../../elements/tooltip';
import { GlobeIcon, LapTimerIcon, TrashIcon } from '@radix-ui/react-icons';
import { useAtom } from 'jotai';
import { showAddNewNoteModalAtom } from '@root/src/stores/app';

type Props = {
  space: ISpace;
};
const Notes = ({ space }: Props) => {
  // global sate
  const [, setNoteModal] = useAtom(showAddNewNoteModalAtom);
  // local state
  const [notes, setNotes] = useState<INote[]>([]);

  const getNotes = useCallback(async () => {
    const allNotes = await getNotesBySpace(space.id);
    if (allNotes.length < 1) return;

    setNotes(allNotes);
  }, [space.id]);

  // init component
  useEffect(() => {
    (async () => {
      await getNotes();
    })();
  }, []);

  const handleNoteClick = (note: INote) => {
    setNoteModal({ show: true, note });
  };

  const handleDeletNote = (id: string) => {
    console.log('🚀 ~ handleDeletNote ~ id:', id);

    // TODO - handle delete
  };

  console.log('🚀 ~ handleDeletNote ~ handleDeletNote:', handleDeletNote);

  return (
    <div className="py-2 px-1 w-full">
      {notes.length > 0 ? (
        notes.map(note => (
          <button
            tabIndex={-1}
            key={note.id}
            onClick={() => handleNoteClick(note)}
            className="relative w-full bg-brand-darkBgAccent/40 px-3 py-1.5 rounded-lg cursor-pointer group overflow-hidden">
            <div className="group-hover:-translate-x-8  transition-all duration-300 w-full">
              <p className="text-slate-400 text-[14px] font-medium text-start">{note.title}</p>
              <div className="flex items-center justify-end mt-2">
                {/*  note site */}
                <div className="flex items-center bg-brand-darkBgAccent/60 border border-brand-darkBg/80  w-fit px-1.5 py-[2.5px] rounded-md font-medium mr-1.5">
                  <GlobeIcon className="text-slate-500  mr-[2.5px]  scale-[0.8]" />
                  <Tooltip label={note.domain}>
                    <span className="font-light text-[10px] text-slate-400">{note.domain}</span>
                  </Tooltip>
                </div>
                {/* remainder until */}
                <div className="flex items-center bg-brand-darkBgAccent/60 border border-brand-darkBg/80  w-fit px-1.5 py-[2.5px] rounded-md font-medium">
                  {/* <span className="opacity-90">⏰</span> &nbsp;
                   */}
                  <LapTimerIcon className="text-slate-500 mr-[2.5px] scale-[0.8]" />
                  <Tooltip label={new Date(note.remainderAt).toLocaleString()}>
                    <span className="font-light text-[10px] text-slate-400">{getTimeAgo(note.remainderAt)}</span>
                  </Tooltip>
                </div>
              </div>
            </div>

            {/* delete note */}
            <button className=" translate-x-[32px] group-hover:translate-x-0 flex items-center justify-center rounded-tr-md rounded-br-md bg-brand-darkBgAccent/30 hover:bg-rose-400/20 absolute w-[32px] h-full top-0 right-0  transition-all duration-300">
              <TrashIcon className="text-rose-400 scale-[1] z-[99]" />
            </button>
          </button>
        ))
      ) : (
        <div>No notes in this space</div>
      )}
    </div>
  );
};

export default Notes;
