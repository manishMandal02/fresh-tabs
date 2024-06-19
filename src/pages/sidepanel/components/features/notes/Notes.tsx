import { useAtom } from 'jotai';
import { useCallback, useEffect, useState } from 'react';
import { CounterClockwiseClockIcon, GlobeIcon, MagnifyingGlassIcon, TrashIcon } from '@radix-ui/react-icons';

import DeleteNote from './DeleteNote';
import Tooltip from '../../../../../components/tooltip';
import { showNoteModalAtom } from '@root/src/stores/app';
import { INote, ISpace } from '@root/src/types/global.types';
import { getTimeAgo } from '@root/src/utils/date-time/time-ago';
import { getNotesBySpace } from '@root/src/services/chrome-storage/notes';
import { debounce, limitCharLength } from '@root/src/utils';

type Props = {
  space: ISpace;
  notesSearchQuery: string;
};
const Notes = ({ space, notesSearchQuery }: Props) => {
  // global sate
  const [, setNoteModal] = useAtom(showNoteModalAtom);

  //TODO - create a global atom for notes

  // local state
  const [notes, setNotes] = useState<INote[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
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
      // set search query if params passed
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!notesSearchQuery) return;
    setSearchQuery(notesSearchQuery);
  }, [notesSearchQuery]);

  const handleNoteClick = (note: INote) => {
    setNoteModal({ show: true, note });
  };

  const handleSearch = async (query: string) => {
    const allNotes = await getNotesBySpace(space.id);
    let filteredNotes: INote[] = [];
    if (query.startsWith('site:')) {
      // search for notes with domain
      filteredNotes = allNotes.filter(note => note.domain.includes(query.replace('site:', '')));
    } else {
      // full notes search
      filteredNotes = allNotes.filter(note => {
        const noteTitle = note.title.toLowerCase();
        const noteBody = note.text.toLowerCase();
        return noteTitle.includes(query) || noteBody.includes(query) || note.domain.includes(query);
      });
    }
    setNotes(filteredNotes);
  };

  const debouncedSearch = debounce(handleSearch, 400);

  useEffect(() => {
    if (searchQuery?.length < 3) {
      getNotes();
    } else {
      debouncedSearch(searchQuery.toLowerCase());
    }
  }, [searchQuery]);

  return (
    <div>
      <div
        className={`flex top-[36px] w-[98%] z-[99] bg-brand-darkBg/85 sticky items-center ml-1 px-2 py-1
                    rounded-md border border-brand-darkBgAccent/40 focus-within:border-slate-700/90`}>
        <MagnifyingGlassIcon className="text-slate-400/80" />
        <input
          type="text"
          placeholder="Search notes..."
          value={searchQuery}
          onChange={ev => setSearchQuery(ev.currentTarget.value)}
          className="w-full h-full px-2 py-1 bg-transparent text-[14px] text-slate-400 outline-none placeholder:text-slate-500"
        />
      </div>
      <div className="py-1.5 px-1 w-full">
        {notes.length > 0 ? (
          notes.toReversed().map(note => (
            <button
              tabIndex={-1}
              key={note.id}
              onClick={() => handleNoteClick(note)}
              className="relative w-full bg-brand-darkBgAccent/25 px-3 py-[8px] rounded-[7px] mb-1.5 cursor-pointer group overflow-hidden">
              <div>
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
                      <Tooltip label={note.domain.length > 28 ? note.domain : ''}>
                        <span className="font-light text-[9px] text-slate-400">{limitCharLength(note.domain, 28)}</span>
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
                className={`translate-x-[34px] absolute group-hover:translate-x-0 flex items-center justify-center rounded-tr-md rounded-br-md
                          bg-brand-darkBgAccent/30 hover:bg-rose-400/50  w-[25px] h-full top-0 right-0  transition-all duration-300`}>
                <TrashIcon className="text-rose-400 scale-[0.95]" />
              </button>
            </button>
          ))
        ) : (
          <div className="text-slate-400 text-center py-6">
            {searchQuery ? `No result for ${searchQuery}` : 'No notes in this space'}
          </div>
        )}
      </div>
      {deleteNoteId ? <DeleteNote noteId={deleteNoteId} onClose={() => setDeleteNoteId('')} /> : null}
    </div>
  );
};

export default Notes;
