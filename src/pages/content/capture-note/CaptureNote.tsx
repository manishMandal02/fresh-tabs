import { motion } from 'framer-motion';
import { useHotkeys } from 'react-hotkeys-hook';
import { useFrame } from 'react-frame-component';
import { useState, useEffect, useCallback } from 'react';
import { ClockIcon, GlobeIcon } from '@radix-ui/react-icons';

import KBD from '@root/src/components/kbd/KBD';
import { publishEvents } from '@root/src/utils';
import { ISpace } from '@root/src/types/global.types';
import { getNote } from '@root/src/services/chrome-storage/notes';
import { cleanDomainName } from '@root/src/utils/url/get-url-domain';
import { COMMAND_PALETTE_SIZE } from '../command-palette/CommandPalette';
import { useCustomAnimation } from '@root/src/pages/sidepanel/hooks/useCustomAnimation';
import { parseStringForDateTimeHint } from '@root/src/utils/date-time/naturalLanguageToDate';
import RichTextEditor, { EDITOR_EMPTY_STATE } from '@root/src/components/rich-text-editor/RichTextEditor';

type Props = {
  activeSpace: ISpace;
  userSelectedText: string;
  onClose?: () => void;
  handleGoBack: () => void;
  selectedNote?: string;
  isOpenedInPopupWindow: boolean;
  resetSuggestedCommand?: () => void;
};

const CreateNote = ({
  selectedNote,
  userSelectedText,
  onClose,
  activeSpace,
  handleGoBack,
  isOpenedInPopupWindow,
  resetSuggestedCommand,
}: Props) => {
  const { document: iFrameDoc } = useFrame();

  // local state
  const [noteId, setNoteId] = useState('');
  const [title, setTitle] = useState('');
  const [note, setNote] = useState('');
  const [domain, setDomain] = useState('');
  const [remainder, setRemainder] = useState('');

  // init component
  useEffect(() => {
    if (selectedNote) {
      // edit note
      (async () => {
        setNoteId(selectedNote);
        // reset suggested commands
        resetSuggestedCommand();

        const noteToEdit = await getNote(selectedNote);

        setTitle(noteToEdit?.title || '');
        setNote(noteToEdit.text);

        noteToEdit?.domain && setDomain(noteToEdit.domain);

        if (noteToEdit.remainderAt) {
          const dateHintString = parseStringForDateTimeHint(noteToEdit.text);

          if (dateHintString?.dateString) {
            setRemainder(dateHintString.dateString);
          }
        }
      })();
    } else {
      //  new note
      setTitle(document.title);
      setNote(EDITOR_EMPTY_STATE);
      if (isOpenedInPopupWindow) return;
      setDomain(cleanDomainName(document.location.hostname));
    }
    // run on mount
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const { bounce } = useCustomAnimation();

  const handleSaveNote = useCallback(async () => {
    if (!title || !note) return;
    if (noteId) {
      await publishEvents({
        event: 'EDIT_NOTE',
        payload: {
          note,
          noteId,
          activeSpace,
          isOpenedInPopupWindow,
          noteTitle: title,
          url: domain,
          noteRemainder: remainder,
        },
      });
    } else {
      await publishEvents({
        event: 'NEW_NOTE',
        payload: { note, activeSpace, isOpenedInPopupWindow, noteTitle: title, url: domain, noteRemainder: remainder },
      });
    }

    onClose();
  }, [note, title, activeSpace, onClose, remainder, domain, noteId, isOpenedInPopupWindow]);

  useHotkeys(
    'mod+enter',
    async () => {
      await handleSaveNote();
    },
    [note, title, remainder, noteId],
    {
      document: iFrameDoc,
      enableOnContentEditable: true,
      preventDefault: true,
      enableOnFormTags: true,
    },
  );

  useHotkeys(
    'mod+backspace',
    () => {
      if (note !== EDITOR_EMPTY_STATE) return;
      handleGoBack();
    },
    [note, EDITOR_EMPTY_STATE],
    {
      enableOnContentEditable: true,
      document: iFrameDoc,
      preventDefault: true,
    },
  );

  return note ? (
    <div className="h-fit w-fit p-3.5 border border-brand-darkBg/50 rounded-lg glassmorphism-bg">
      <div className="mb-1.5 bg-brand-darkBg rounded-lg">
        <input
          value={title}
          onKeyDown={ev => {
            if (ev.code === 'Tab') {
              const editorContainer = ev.currentTarget.parentElement?.nextElementSibling as HTMLDivElement;

              const editor = editorContainer.querySelector('div[contenteditable="true"]') as HTMLDivElement;

              editor?.focus({ preventScroll: true });
            }
          }}
          onChange={ev => setTitle(ev.target.value)}
          placeholder="Title"
          className={`bg-brand-darkBgAccent/20 rounded-lg w-full py-1.5 px-3  text-slate-300 placeholder:text-slate-400 text-[14.5px] 
                        transition-colors duration-300 border-2 border-transparent outline-none focus-within:border-slate-600`}
        />
      </div>

      {/* editor container  */}
      <div
        style={{
          height: COMMAND_PALETTE_SIZE.HEIGHT - 150 + 'px',
          maxHeight: COMMAND_PALETTE_SIZE.MAX_HEIGHT + 'px',
          width: COMMAND_PALETTE_SIZE.MAX_WIDTH - 100 + 'px',
        }}
        className="relative bg-brand-darkBg rounded-lg">
        {/* editor */}
        <RichTextEditor
          placeholder={`Note... \n\n press "cmd + backspace" to go back`}
          content={note}
          onChange={setNote}
          userSelectedText={userSelectedText}
          setRemainder={setRemainder}
          rootDocument={iFrameDoc}
        />
      </div>
      {/* options container */}
      <div className="w-full mt-1 px-1.5 py-1 flex items-start justify-between ">
        {/* left container */}
        <div className="flex items-start justify-center space-x-2">
          {/* space */}
          {activeSpace ? (
            <motion.div
              {...bounce}
              className="flex items-center px-2 py-1 rounded-md bg-brand-darkBg/85 text-slate-300/80 text-[12px] font-medium mt-1.5 cursor-not-allowed">
              <span className="mr-1">{activeSpace.emoji}</span>
              <span className="">{activeSpace.title}</span>
            </motion.div>
          ) : null}
          {/* site domain */}
          {domain ? (
            <motion.div
              {...bounce}
              className="flex items-center px-2 py-1 rounded-md bg-brand-darkBg/85 text-slate-300/80 text-[12px] font-medium mt-1.5">
              <GlobeIcon className="text-slate-500 scale-[1] mr-1.5" />
              <span className="">{domain}</span>
            </motion.div>
          ) : null}

          {/* remainder time display */}
          {remainder ? (
            <motion.div
              {...bounce}
              className="flex items-center px-2 py-1 rounded-md bg-brand-darkBg/85 text-slate-300/80 text-[12px] font-medium mt-1.5">
              <ClockIcon className="text-slate-500 scale-[1] mr-1.5" />
              <span className="capitalize">{remainder}</span>
            </motion.div>
          ) : null}
        </div>

        {/*  save note shortcut */}
        <button
          onClick={handleSaveNote}
          className="flex items-center px-3.5 py-2 rounded-md bg-brand-darkBg/85 select-none hover:bg-brand-darkBg duration-300 transition-colors">
          <span className="text-slate-400 text-[13.5px] ">Save</span>
          <span className="ml-3.5 flex items-center">
            <KBD modifierKey classes="text-slate-300/90" />
            <span className="font-bold text-slate-400/70 text-[13px] mx-[5px] select-none">+</span>
            <KBD classes="text-slate-300/90">Enter</KBD>
          </span>
        </button>
      </div>
    </div>
  ) : (
    <></>
  );
};
export default CreateNote;
