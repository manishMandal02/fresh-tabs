import { createPortal } from 'react-dom';
import { useAtom, useAtomValue, useSetAtom } from 'jotai';
import { useEffect, useCallback, useState } from 'react';

import { AlarmName } from '@root/src/constants/app';
import { ISpace } from '@root/src/types/global.types';
import Spinner from '../../../../../../components/spinner';
import { AlertModal } from '../../../../../../components/modal';
import { deleteAlarm, getAlarm } from '@root/src/services/chrome-alarms/helpers';
import { deleteSpace, getAllSpaces, getSpace, updateSpace } from '@root/src/services/chrome-storage/spaces';
import {
  snackbarAtom,
  deleteSpaceModalAtom,
  removeSpaceAtom,
  getActiveSpaceIdAtom,
  setActiveSpaceAtom,
  updateSpaceAtom,
} from '@root/src/stores/app';
import { openSpace } from '@root/src/services/chrome-tabs/tabs';
import { getTabsInSpace } from '@root/src/services/chrome-storage/tabs';

const DeleteSpaceModal = () => {
  // global state
  // delete space modal
  const [deleteSpaceModal, setDeleteSpaceModal] = useAtom(deleteSpaceModalAtom);

  const activeSpaceId = useAtomValue(getActiveSpaceIdAtom);

  const setActiveSpace = useSetAtom(setActiveSpaceAtom);

  const updateSpaceState = useSetAtom(updateSpaceAtom);

  const [spaceToDelete, setSpaceToDelete] = useState<ISpace | undefined>(undefined);

  const removeSpaceState = useSetAtom(removeSpaceAtom);
  // snackbar atom
  const [snackbar, setSnackbar] = useAtom(snackbarAtom);

  // get details of space to delete
  const deleteInit = useCallback(async (spaceId: string) => {
    // get space from storage
    const spaceToDelete = await getSpace(spaceId);

    setSpaceToDelete({ ...spaceToDelete });
  }, []);

  useEffect(() => {
    if (deleteSpaceModal.show) {
      (async () => {
        await deleteInit(deleteSpaceModal.spaceId);
      })();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [deleteSpaceModal]);

  const onClose = () => {
    setDeleteSpaceModal({ show: false, spaceId: '' });
  };

  //  delete space handler
  const handleDeleteSpace = async () => {
    // show loading snackbar
    setSnackbar({ show: true, msg: 'Deleting space', isLoading: true });

    // hide loading snackbar
    setSnackbar({ show: false, msg: '', isLoading: false });
    // close modal
    onClose();

    // re-render spaces

    if (activeSpaceId === spaceToDelete.id) {
      // active space deleted

      // change active space
      const spaces = await getAllSpaces();
      const newActiveSpace = spaces.find(s => s.isSaved);
      const tabs = await getTabsInSpace(newActiveSpace.id);
      openSpace({
        space: newActiveSpace,
        tabs,
        shouldOpenInNewWindow: false,
        onNewWindowCreated: async windowId => {
          await updateSpace(newActiveSpace.id, { windowId });
          updateSpaceState({ ...newActiveSpace, windowId });
          setActiveSpace(newActiveSpace.id);
        },
      });
    }

    // delete space
    const res = await deleteSpace(spaceToDelete.id);

    removeSpaceState(spaceToDelete.id);

    // space deleted
    if (res) {
      setSnackbar({ show: true, msg: 'Space deleted', isSuccess: true });

      // if the space was unsaved, check if it had any delete trigger scheduled
      const schedule = await getAlarm(AlarmName.deleteSpace(spaceToDelete.id));

      if (schedule?.name) {
        // scheduled trigger found - delete it
        await chrome.alarms.clear(schedule.name);
        await deleteAlarm(AlarmName.deleteSpace(spaceToDelete.id));
      }
    } else {
      // failed
      setSnackbar({ show: true, msg: 'Failed to deleted space', isSuccess: false });
    }
  };

  return deleteSpaceModal.show
    ? createPortal(
        <AlertModal isOpen={deleteSpaceModal.show} title="Confirm Delete" showCloseBtn={false} onClose={onClose}>
          <div className=" px-4 py-2.5 text-slate-400  h-fit">
            <p className="font-light text-sm">
              Are you sure you want to delete <br />{' '}
              <strong className="text-slate-400 font-medium m-0">{spaceToDelete?.title?.trim() || 'this space'}</strong>
              ?
            </p>

            <div className=" mt-2 ml-auto w-fit">
              <button
                className="bg-brand-darkBgAccent/80 text-slate-200 mr-2 w-20 py-1.5 rounded-md hover:opacity-90 transition-all duration-200  "
                onClick={() => onClose()}>
                Cancel
              </button>
              <button
                className="bg-red-600 text-slate-200 w-20 py-1.5 rounded-md hover:opacity-90 transition-all duration-200 "
                onClick={handleDeleteSpace}>
                {snackbar.isLoading ? <Spinner size="sm" /> : 'Delete'}
              </button>
            </div>
          </div>
        </AlertModal>,
        document.body,
      )
    : null;
};

export default DeleteSpaceModal;
