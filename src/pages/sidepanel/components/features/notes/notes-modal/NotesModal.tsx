import { useAtom } from 'jotai';
import { motion } from 'framer-motion';
import { useState, useEffect, useRef } from 'react';

import { SlideModal } from '../../../elements/modal';
import { showAddNewNoteModalAtom } from '@root/src/stores/app';
import Spinner from '../../../elements/spinner';
import { useKeyPressed } from '../../../../hooks/useKeyPressed';
import { parseStringForDateTimeHint } from '@root/src/pages/utils/date-time/naturalLanguageToDate';
import { useCustomAnimation } from '../../../../hooks/useAnimation';
import Checkbox from '../../../elements/checkbox/Checkbox';
import { InfoCircledIcon } from '@radix-ui/react-icons';
import Tooltip from '../../../elements/tooltip';
import { useNewNote } from './useNewNote';
import TextField from '../../../elements/form/text-field';
import RichTextEditor from '../../../elements/rich-text-editor/RichTextEditor';

const NotesModal = () => {
  // global state
  const [showModal, setShowModal] = useAtom(showAddNewNoteModalAtom);

  // local state
  const [note, setNote] = useState('');
  const [remainder, setRemainder] = useState('');
  const [shouldAddDomain, setShouldAddDomain] = useState(false);

  const editorContainerRef = useRef<HTMLDivElement>(null);

  // on close modal
  const handleClose = () => {
    setShowModal({ show: false, note: { text: '' } });
    setNote('');
    inputFrom.reset();
  };

  const { isModifierKeyPressed } = useKeyPressed({ monitorModifierKeys: true });

  // logic hook
  const { inputFrom, snackbar, handleAddNote, handleOnPasteInDomainInput } = useNewNote({
    note,
    remainder,
    handleClose,
    editorContainerRef,
    isModifierKeyPressed,
    noteId: showModal.note?.id || '',
  });

  // init component
  useEffect(() => {
    if (!showModal.show) return;

    // check if creating new note or editing note
    if (!showModal.note?.id) {
      // new note
      setNote(showModal.note.text);
    } else {
      // editing note
      const noteToEdit = showModal.note;

      setNote(noteToEdit.text);

      inputFrom.setValue('title', noteToEdit.title);

      if (noteToEdit.domain) {
        setShouldAddDomain(true);
        inputFrom.setValue('domain', noteToEdit.domain);
      }
      if (noteToEdit.remainderAt) {
        const dateHintString = parseStringForDateTimeHint(noteToEdit.text);
        if (dateHintString.dateString) {
          setRemainder(dateHintString.dateString);
        }
      }
    }

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [showModal]);

  const { bounce } = useCustomAnimation();

  const buttonText = showModal.note?.id ? 'Update Note' : 'Add Note';

  return (
    <SlideModal title={showModal.note?.id ? 'Edit Note' : 'New Note'} isOpen={showModal.show} onClose={handleClose}>
      <div className="min-h-[60vh] max-h-[90vh] w-full flex h-full flex-col justify-between">
        {/* note mdn editor */}
        <div
          className="w-full px-2.5 mb-1.5 mt-2 h-[80%] overflow-hidden relative flex flex-col"
          ref={editorContainerRef}>
          <div className="mb-1.5">
            <TextField
              name="note-title"
              placeholder="Title..."
              registerHook={inputFrom.register('title')}
              error={inputFrom.formState.errors.title?.message || ''}
            />
          </div>
          <RichTextEditor />
          {/* show note remainder */}
          <div className="w-full mt-1.5 px-1 min-h-8 flex items-center justify-between">
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
              <label htmlFor="note-domain" className="text-slate-300 font-light text-[10xp] ml-[4px] select-none">
                Attach note to a site
              </label>
              <Tooltip label="This note will be attached to the site for quick access while browsing" delay={100}>
                <InfoCircledIcon className="ml-1 text-slate-500/80" />
              </Tooltip>
            </div>
            {remainder ? (
              <motion.div
                {...bounce}
                className="pl-1.5 pr-2 py-[1.75px] rounded-[4px] bg-brand-darkBgAccent/50  w-fit uppercase flex items-center">
                ⏰ <p className="ml-[5px] text-slate-400/90 font-semibold text-[8px]">{remainder}</p>
              </motion.div>
            ) : null}
          </div>
        </div>
        <form
          className="w-full h-[20%] px-2.5 mt-1 mb-px flex flex-col"
          onSubmit={inputFrom.handleSubmit(handleAddNote)}>
          {shouldAddDomain ? (
            <div className="w-[70%] -mt-1 ml-1">
              <TextField
                name="note-domain"
                placeholder="chat.openai.com"
                label="Site name"
                onPasteHandler={handleOnPasteInDomainInput}
                registerHook={inputFrom.register('domain')}
                error={inputFrom.formState.errors.domain?.message || ''}
              />
            </div>
          ) : null}
          {/* add note */}
          <button
            type="submit"
            disabled={!note || !inputFrom.watch('title') || (shouldAddDomain && !inputFrom.watch('domain'))}
            className={`mt-4 mx-auto w-[65%] py-2.5 rounded-md text-brand-darkBg/70 font-semibold text-[13px] bg-brand-primary/90 hover:opacity-95 transition-all duration-200 
                        border-none outline-none focus-within:outline-slate-600 disabled:bg-brand-darkBgAccent disabled:text-slate-300 disabled:cursor-not-allowed `}>
            {snackbar.isLoading ? <Spinner size="sm" /> : buttonText}
          </button>
        </form>
      </div>
    </SlideModal>
  );
};

export default NotesModal;
