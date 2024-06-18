import { showNotesRemainderNotification } from '@root/src/services/chrome-notification/notification';
import { getNote, updateNote } from '@root/src/services/chrome-storage/notes';

export const handleNotesRemainderAlarm = async (alarmName: string) => {
  // get note id
  const noteId = alarmName.split('-')[1];

  // get note
  const note = await getNote(noteId);

  // update note
  await updateNote(noteId, {
    remainderAt: 0,
  });

  //TODO - add to user notifications

  // show notification
  showNotesRemainderNotification(noteId, '⏰ Note Remainder', note.title, 'https://www.freshinbox.xyz/favicon.ico');
};
