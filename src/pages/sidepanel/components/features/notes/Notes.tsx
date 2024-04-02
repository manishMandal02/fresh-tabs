import { useAtom } from 'jotai';
import { useCallback, useEffect, useState } from 'react';
import { CounterClockwiseClockIcon, GlobeIcon, TrashIcon } from '@radix-ui/react-icons';

import DeleteNote from './DeleteNote';
import Tooltip from '../../../../../components/tooltip';
import { showAddNewNoteModalAtom } from '@root/src/stores/app';
import { INote, ISpace } from '@root/src/pages/types/global.types';
import { getTimeAgo } from '@root/src/utils/date-time/time-ago';
import { getNotesBySpace } from '@root/src/services/chrome-storage/notes';
import { limitCharLength } from '@root/src/utils';

type Props = {
  space: ISpace;
};
const Notes = ({ space }: Props) => {
  // global sate
  const [, setNoteModal] = useAtom(showAddNewNoteModalAtom);

  // local state
  const [notes, setNotes] = useState<INote[]>([]);
  const [deleteNoteId, setDeleteNoteId] = useState('');

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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleNoteClick = (note: INote) => {
    setNoteModal({ show: true, note });
  };

  return (
    <>
      <div className="py-1.5 px-1 w-full">
        {notes.length > 0 ? (
          notes.map(note => (
            <button
              tabIndex={-1}
              key={note.id}
              onClick={() => handleNoteClick(note)}
              className="relative w-full bg-brand-darkBgAccent/25 px-3 py-[8px] rounded-[7px] mb-1.5 cursor-pointer group overflow-hidden">
              <div className="group-hover:-translate-x-[34px]  transition-all duration-300 w-full">
                <p className="text-slate-300/80 text-[14px] text-start">{limitCharLength(note.title, 42)}</p>
                <div className="flex items-center justify-end mt-3">
                  {/*  note site */}
                  {note.remainderAt ? (
                    <div className="flex items-center bg-brand-darkBgAccent/35 border border-brand-darkBg/30  w-fit px-1.5 py-[2.5px] rounded-md font- mr-1.5">
                      <p className="mr-[4px]  scale-[0.85] opacity-90">⏰</p>
                      <Tooltip label={new Date(note.remainderAt).toLocaleString()}>
                        <span className="font-light text-[9px] text-slate-400">{getTimeAgo(note.remainderAt)}</span>
                      </Tooltip>
                    </div>
                  ) : null}
                  {/*  note site */}
                  {note.domain ? (
                    <div className="flex items-center bg-brand-darkBgAccent/35 border border-brand-darkBg/30  w-fit px-1.5 py-[2.5px] rounded-md font- mr-1.5">
                      <GlobeIcon className="text-slate-500  mr-[2.5px]  scale-[0.7]" />
                      <Tooltip label={note.domain}>
                        <span className="font-light text-[9px] text-slate-400">{note.domain}</span>
                      </Tooltip>
                    </div>
                  ) : null}
                  {/* remainder until */}
                  {note?.createdAt ? (
                    <div className="flex items-center bg-brand-darkBgAccent/35 border border-brand-darkBg/30  w-fit px-1.5 py-[2.5px] rounded-md font-">
                      <CounterClockwiseClockIcon className="text-slate-500 mr-[2.5px] scale-[0.7]" />
                      <Tooltip label={new Date(note.createdAt).toLocaleString()}>
                        <span className="font-light text-[9px] text-slate-400">{getTimeAgo(note.createdAt)}</span>
                      </Tooltip>
                    </div>
                  ) : null}
                </div>
              </div>

              {/* delete note */}
              <button
                onClick={ev => {
                  ev.stopPropagation();
                  setDeleteNoteId(note.id);
                }}
                className=" translate-x-[34px] group-hover:translate-x-0 flex items-center justify-center rounded-tr-md rounded-br-md bg-brand-darkBgAccent/30 hover:bg-rose-400/20 absolute w-[34px] h-full top-0 right-0  transition-all duration-300">
                <TrashIcon className="text-rose-400 scale-[1] z-[99]" />
              </button>
            </button>
          ))
        ) : (
          <div className="text-slate-400 text-center py-6">No notes in this space</div>
        )}
      </div>
      {deleteNoteId ? <DeleteNote noteId={deleteNoteId} onClose={() => setDeleteNoteId('')} /> : null}
    </>
  );
};

export default Notes;
