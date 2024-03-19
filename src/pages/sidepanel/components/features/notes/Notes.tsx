import { INote, ISpace } from '@root/src/pages/types/global.types';
import { getNotesBySpace } from '@root/src/services/chrome-storage/notes';
import { useCallback, useEffect, useState } from 'react';

type Props = {
  space: ISpace;
};
const Notes = ({ space }: Props) => {
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

  return (
    <div>
      {notes.length > 0 ? notes.map(note => <div key={note.id}>{note.id}</div>) : <div>No notes in this space</div>}
    </div>
  );
};

export default Notes;
