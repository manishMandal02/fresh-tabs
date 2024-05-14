import { logger } from '@root/src/utils';
import { getStorage, setStorage } from './helpers';
import { StorageKey } from '@root/src/constants/app';
import { INote } from '@root/src/types/global.types';

// get all spaces
export const getAllNotes = async () => await getStorage<INote[]>({ key: StorageKey.NOTES, type: 'local' });

export const setNotesToStorage = async (notes: INote[]) => {
  await setStorage({ type: 'local', key: StorageKey.NOTES, value: notes });
  return true;
};

export const addNewNote = async (note: INote) => {
  try {
    const allNotes = await getAllNotes();

    await setNotesToStorage([...(allNotes || []), note]);
    return true;
  } catch (error) {
    logger.error({
      error,
      msg: 'Error creating note.',
      fileTrace: 'services/chrome-storage/notes.ts:31 addNewNote ~ catch block',
    });
    return false;
  }
};

export const getNotesBySpace = async (spaceId: string) => {
  const allNotes = await getAllNotes();
  const spaceNotes = allNotes.filter(note => note.spaceId === spaceId);

  return spaceNotes;
};

export const getNote = async (id: string) => {
  const allNotes = await getAllNotes();
  const note = allNotes.find(note => note.id === id);

  return note;
};

export const getNoteByDomain = async (domain: string) => {
  const allNotes = await getAllNotes();
  if (!allNotes || allNotes?.length < 1) return null;
  const note = allNotes.filter(note => note.domain === domain);

  return note;
};

// update note
export const updateNote = async (id: string, note: Omit<INote, 'id'>) => {
  try {
    const allNotes = await getAllNotes();

    let noteToUpdate = allNotes.find(note => note.id === id);

    noteToUpdate = { ...noteToUpdate, ...note };

    allNotes.splice(
      allNotes.findIndex(n => n.id === id),
      1,
      noteToUpdate,
    );

    await setNotesToStorage(allNotes);
    return true;
  } catch (error) {
    logger.error({
      error,
      msg: 'Error updating note.',
      fileTrace: 'services/chrome-storage/notes.ts:58 updateNote ~ catch block',
    });
    return false;
  }
};
// update note
export const deleteNote = async (id: string) => {
  try {
    const allNotes = await getAllNotes();

    // remove note
    allNotes.splice(
      allNotes.findIndex(n => n.id === id),
      1,
    );

    await setNotesToStorage(allNotes);
    return true;
  } catch (error) {
    logger.error({
      error,
      msg: 'Error deleting  note.',
      fileTrace: 'services/chrome-storage/notes.ts:80 deleteNote ~ catch block',
    });
    return false;
  }
};
