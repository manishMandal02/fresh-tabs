import { useAtom } from 'jotai';
import { motion } from 'framer-motion';
import { useHotkeys } from 'react-hotkeys-hook';
import { useState, useEffect, useRef } from 'react';
import { InfoCircledIcon } from '@radix-ui/react-icons';

import { useNewNote } from './useNewNote';
import { getReadableDate } from '@root/src/utils';
import Tooltip from '../../../../../../components/tooltip';
import Spinner from '../../../../../../components/spinner';
import { showNoteModalAtom } from '@root/src/stores/app';
import { SlideModal } from '../../../../../../components/modal';
import TextField from '../../../../../../components/form/text-field';
import Checkbox from '../../../../../../components/checkbox/Checkbox';
import { useCustomAnimation } from '../../../../hooks/useCustomAnimation';
import RichTextEditor, { EDITOR_EMPTY_STATE } from '../../../../../../components/rich-text-editor/RichTextEditor';
import { naturalLanguageToDate, parseStringForDateTimeHint } from '@root/src/utils/date-time/naturalLanguageToDate';

const NotesModal = () => {
  console.log('NotesModal ~ 🔁 rendered');

  // global state
  const [modalGlobalState, setModalGlobalState] = useAtom(showNoteModalAtom);

  // local state
  const [note, setNote] = useState('');
  const [remainder, setRemainder] = useState('');
  const [shouldAddDomain, setShouldAddDomain] = useState(false);

  const editorContainerRef = useRef<HTMLDivElement>(null);

  // on close modal
  const handleClose = () => {
    setModalGlobalState({ show: false, note: { text: '' } });
    setNote('');
    inputFrom.reset();
  };

  // logic hook
  const { inputFrom, snackbar, handleAddNote, handleOnPasteInDomainInput } = useNewNote({
    note,
    remainder,
    handleClose,
    noteId: modalGlobalState.note?.id || '',
  });

  // init component
  useEffect(() => {
    if (!modalGlobalState.show) return;

    // check if creating new note or editing note
    if (!modalGlobalState.note?.id) {
      // new note
      modalGlobalState.note.text?.length > 0 ? setNote(modalGlobalState.note.text) : setNote(EDITOR_EMPTY_STATE);

      if (modalGlobalState.note.domain) {
        setShouldAddDomain(true);
        inputFrom.setValue('domain', modalGlobalState.note.domain);
      }
      if (modalGlobalState.note.title) {
        inputFrom.setValue('title', modalGlobalState.note.title);
      }
      // focus notes editor
      // setTimeout(() => {
      //   (editorContainerRef.current?.querySelector('div[contenteditable="true"]') as HTMLDivElement)?.focus();
      // }, 100);
    } else {
      // editing note
      const noteToEdit = modalGlobalState.note;

      noteToEdit.text?.length > 0 ? setNote(noteToEdit.text) : setNote(EDITOR_EMPTY_STATE);

      inputFrom.setValue('title', noteToEdit.title);

      if (noteToEdit.domain) {
        setShouldAddDomain(true);
        inputFrom.setValue('domain', noteToEdit.domain);
      }
      if (noteToEdit.remainderAt) {
        const dateHintString = parseStringForDateTimeHint(noteToEdit.text);

        if (dateHintString?.dateString) {
          setRemainder(dateHintString.dateString);
        }
      }
    }

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [modalGlobalState]);

  const { bounce } = useCustomAnimation();

  const buttonText = modalGlobalState.note?.id ? 'Update Note' : 'Add Note';

  // disables update note button if nothing has changed
  const disableNoteUpdate = modalGlobalState.note?.id
    ? modalGlobalState.note.text === note &&
      modalGlobalState.note.title === inputFrom.getValues('title').trim() &&
      modalGlobalState.note.domain === inputFrom.getValues('domain').trim()
    : false;

  useHotkeys(
    'shift+N',
    () => {
      setModalGlobalState({ show: true, note: { text: '' } });
    },
    [],
  );

  return (
    <SlideModal
      title={modalGlobalState.note?.id ? 'Edit Note' : 'New Note'}
      isOpen={!!modalGlobalState?.show}
      onClose={handleClose}>
      {note ? (
        <div className="min-h-[60vh] max-h-[90vh] w-full flex h-full flex-col justify-between">
          {/* note mdn editor */}
          <div
            className="w-full px-2.5 mb-1.5 mt-2 h-[90%] overflow-hidden relative flex flex-col "
            ref={editorContainerRef}>
            {/* eslint-disable-next-line jsx-a11y/no-static-element-interactions */}
            <form>
              <div className="mb-1.5">
                <TextField
                  name="note-title"
                  placeholder="Title..."
                  registerHook={inputFrom.register('title')}
                  error={inputFrom.formState.errors.title?.message || ''}
                />
              </div>
            </form>
            <div className="w-full h-[300px] max-h-full">
              {/* editor */}
              <RichTextEditor content={note} onChange={setNote} setRemainder={setRemainder} />
            </div>
            {/* show note remainder */}
            <div className="w-full mt-1.5 px-1 min-h-8 h-fit flex items-center justify-between">
              <div className="flex items-center">
                <Checkbox
                  id="note-domain"
                  size="sm"
                  checked={shouldAddDomain}
                  onChange={checked => {
                    setShouldAddDomain(checked);
                    inputFrom.reset({ domain: '' });
                  }}
                />
                <label htmlFor="note-domain" className="text-slate-300/80 font-light text-[10px] ml-[4px] select-none">
                  Attach note to a site
                </label>
                <Tooltip label="Notes with site/domain will be attached to the site for quick access while browsing">
                  <InfoCircledIcon className="ml-1 text-slate-500/80" />
                </Tooltip>
              </div>
              {remainder ? (
                <Tooltip label={getReadableDate(naturalLanguageToDate(remainder), true)}>
                  <motion.div
                    {...bounce}
                    className="pl-1.5 pr-2 py-[1.75px] rounded-[4px] bg-brand-darkBgAccent/50  w-fit uppercase flex items-center">
                    ⏰ <p className="ml-[5px] text-slate-400/90 font-semibold text-[8px]">{remainder}</p>
                  </motion.div>
                </Tooltip>
              ) : null}
            </div>
          </div>

          <div className="w-full h-[20%] px-2.5 mt-1 mb-px flex flex-col">
            {shouldAddDomain ? (
              // eslint-disable-next-line jsx-a11y/no-static-element-interactions
              <div className="w-[70%] -mt-1 ml-1" onKeyDown={ev => ev.stopPropagation()}>
                <TextField
                  name="note-domain"
                  placeholder="chat.openai.com"
                  label="Domain"
                  onPasteHandler={handleOnPasteInDomainInput}
                  registerHook={inputFrom.register('domain')}
                  error={inputFrom.formState.errors.domain?.message || ''}
                />
              </div>
            ) : null}

            <div className="mt-4 w-full relative flex flex-col justify-between items-center">
              {/* remainder change alert if note updated */}
              {remainder && modalGlobalState.note?.id && !disableNoteUpdate ? (
                <span className="w-fit flex items-center mb-1.5 text-[10px] font-light text-slate-400/80 bg-brand-darkBgAccent/20 rounded py-[3.5px] px-2">
                  <InfoCircledIcon className="text-slate-500/80 scale-[0.75] mr-[2px]" /> Remainder will be updated to
                  the date/time mentioned above
                </span>
              ) : null}
              {/* add note button */}
              <button
                onClick={inputFrom.handleSubmit(handleAddNote)}
                disabled={
                  !note ||
                  !inputFrom.watch('title') ||
                  (shouldAddDomain && !inputFrom.watch('domain')) ||
                  disableNoteUpdate
                }
                className={`mx-auto w-[45%] max-w-[200px] py-2 rounded-md text-brand-darkBg/70 font-semibold text-[13.5px] bg-brand-primary/90 hover:opacity-95 transition-all duration-200 
                            border-none outline-none focus-within:outline-slate-600 disabled:bg-brand-darkBgAccent disabled:text-slate-300 disabled:cursor-not-allowed `}>
                {snackbar.isLoading ? <Spinner size="sm" /> : buttonText}
              </button>
            </div>
          </div>
        </div>
      ) : (
        <></>
      )}
    </SlideModal>
  );
};

export default NotesModal;
