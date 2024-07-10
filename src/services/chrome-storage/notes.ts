import { logger } from '@root/src/utils';
import { getStorage, setStorage } from './helpers';
import { INote } from '@root/src/types/global.types';
import { createAlarm, deleteAlarm, getAlarm } from '../chrome-alarms/helpers';
import { AlarmName, StorageKey } from '@root/src/constants/app';

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

    if (!note?.remainderAt) return true;

    //   create alarm for for remainder

    // remainder trigger time
    let triggerAfter = note.remainderAt - Date.now();

    // time in minutes
    triggerAfter = triggerAfter / 1000 / 60;

    await createAlarm({
      triggerAfter,
      name: AlarmName.noteRemainder(note.id),
    });

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
  if (!allNotes || allNotes?.length < 1) return [];
  const spaceNotes = allNotes.filter(note => note.spaceId === spaceId);

  return spaceNotes;
};

export const deleteAllSpaceNotes = async (spaceId: string) => {
  try {
    const allNotes = await getAllNotes();

    const newNotes = allNotes?.filter(note => note.spaceId !== spaceId);

    await setNotesToStorage(newNotes);

    //  delete remainders associated with notes deleted
    const notesWithRemainder = allNotes?.filter(note => note.spaceId === spaceId && note.remainderAt);

    const deleteAlarmPromises = notesWithRemainder?.map(note => deleteAlarm(AlarmName.noteRemainder(note.id)));

    await Promise.allSettled(deleteAlarmPromises);

    return true;
  } catch (error) {
    logger.error({
      error,
      msg: `Error deleting space notes.`,
      fileTrace: 'services/chrome-storage/notes.ts:51 deleteAllSpaceNotes ~ catch block',
    });
    return false;
  }
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
export const updateNote = async (id: string, note: Partial<Omit<INote, 'id'>>, removeRemainder = false) => {
  try {
    const allNotes = await getAllNotes();

    const noteToUpdate = allNotes.find(note => note.id === id);

    if (!noteToUpdate?.id) return false;

    const updatedNote = { ...noteToUpdate, ...note };

    allNotes.splice(
      allNotes.findIndex(n => n.id === id),
      1,
      updatedNote,
    );

    await setNotesToStorage(allNotes);

    //  delete previous remainder trigger if any
    const alarmTrigger = await getAlarm(AlarmName.noteRemainder(id));

    if (alarmTrigger) {
      await deleteAlarm(AlarmName.noteRemainder(id));
    }

    if (removeRemainder || updatedNote?.remainderAt < 1) return true;

    // new alarm trigger
    // remainder trigger time
    let triggerAfter = updatedNote.remainderAt - Date.now();

    // time in minutes
    triggerAfter = triggerAfter / 1000 / 60;

    await createAlarm({
      triggerAfter,
      name: AlarmName.noteRemainder(id),
    });

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

    //  delete remainder alarm trigger if any
    await deleteAlarm(AlarmName.noteRemainder(id));

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
