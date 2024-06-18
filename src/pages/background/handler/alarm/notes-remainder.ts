import { NOTIFICATION_TYPE } from '@root/src/constants/app';
import { showNotesRemainderNotification } from '@root/src/services/chrome-notification/notification';
import { getNote, updateNote } from '@root/src/services/chrome-storage/notes';
import { addNotification } from '@root/src/services/chrome-storage/user-notifications';
import { generateId } from '@root/src/utils';

export const handleNotesRemainderAlarm = async (alarmName: string) => {
  // get note id
  const noteId = alarmName.split('-')[1];

  // get note
  const note = await getNote(noteId);

  console.log('🌅 ~ handleNotesRemainderAlarm ~ note:', note);

  // update note
  const res = await updateNote(
    noteId,
    {
      remainderAt: 0,
    },
    true,
  );

  console.log('🌅 ~ handleNotesRemainderAlarm ~ res:', res);

  if (!res) return null;

  // add to user notifications
  await addNotification({
    note,
    id: generateId(),
    timestamp: Date.now(),
    type: NOTIFICATION_TYPE.NOTE_REMAINDER,
  });

  // show notification
  showNotesRemainderNotification(
    noteId,
    '⏰ Note Remainder',
    note?.title || '',
    'https://www.freshinbox.xyz/favicon.ico',
  );
};
