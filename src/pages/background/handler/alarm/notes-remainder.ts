import { NOTIFICATION_TYPE } from '@root/src/constants/app';
import { showNotesRemainderNotification } from '@root/src/services/chrome-notification/notification';
import { getNote, updateNote } from '@root/src/services/chrome-storage/notes';
import { addNotification } from '@root/src/services/chrome-storage/user-notifications';
import { generateId, publishEvents } from '@root/src/utils';

export const handleNotesRemainderAlarm = async (alarmName: string) => {
  // get note id
  const noteId = alarmName.split('-')[1];

  // get note
  const note = await getNote(noteId);

  console.log('💰 ~ handleNotesRemainderAlarm ~ note:', note);

  // update note
  const res = await updateNote(
    noteId,
    {
      remainderAt: 0,
    },
    true,
  );

  if (!res) return null;

  // add to user notifications
  await addNotification({
    id: generateId(),
    timestamp: Date.now(),
    type: NOTIFICATION_TYPE.NOTE_REMAINDER,
    note: {
      id: noteId,
      title: note.title,
      domain: note.domain,
    },
  });

  // send to side panel
  await publishEvents({
    id: generateId(),
    event: 'UPDATE_NOTIFICATIONS',
    payload: {
      spaceId: note.spaceId,
    },
  });

  // send to side panel
  await publishEvents({
    id: generateId(),
    event: 'UPDATE_NOTES',
    payload: {
      spaceId: note.spaceId,
    },
  });

  // show notification
  showNotesRemainderNotification(
    noteId,
    '⏰ Note Remainder',
    note?.title || '',
    'https://www.freshinbox.xyz/favicon.ico',
  );
};
