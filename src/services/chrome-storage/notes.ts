import { INote } from '@root/src/pages/types/global.types';
import { getStorage, setStorage } from './helpers';
import { StorageKey } from '@root/src/constants/app';
import { logger } from '@root/src/pages/utils';

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
      fileTrace: 'services/chrome-storage/notes.ts:20 ! catch block',
    });
    return false;
  }
};

export const getNotesBySpace = async (spaceId: string) => {
  const allNotes = await getAllNotes();
  const spaceNotes = allNotes.filter(note => note.spaceId === spaceId);

  return spaceNotes;
};
