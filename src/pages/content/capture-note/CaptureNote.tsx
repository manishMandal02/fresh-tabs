import { motion } from 'framer-motion';
import { useHotkeys } from 'react-hotkeys-hook';
import { useFrame } from 'react-frame-component';
import { useState, useEffect, useCallback } from 'react';
import { ClockIcon, GlobeIcon } from '@radix-ui/react-icons';

import KBD from '@root/src/components/kbd/KBD';
import { publishEvents } from '@root/src/utils';
import { ISpace } from '@root/src/pages/types/global.types';
import { cleanDomainName } from '@root/src/utils/url/get-url-domain';
import { COMMAND_PALETTE_SIZE } from '../command-palette/CommandPalette';
import { useCustomAnimation } from '@root/src/pages/sidepanel/hooks/useAnimation';
import RichTextEditor, { EDITOR_EMPTY_STATE } from '@root/src/components/rich-text-editor/RichTextEditor';

type Props = {
  activeSpace: ISpace;
  userSelectedText: string;
  onClose?: () => void;
  handleGoBack: () => void;
};

const CreateNote = ({ userSelectedText, onClose, activeSpace, handleGoBack }: Props) => {
  const { document: iFrameDoc } = useFrame();

  // local state
  const [note, setNote] = useState('');
  const [remainder, setRemainder] = useState('');

  useEffect(() => {
    setNote(EDITOR_EMPTY_STATE);
  }, [userSelectedText]);

  const { bounce } = useCustomAnimation();

  const handleSaveNote = useCallback(async () => {
    await publishEvents({
      event: 'NEW_NOTE',
      payload: { note, url: document.location.href, activeSpace, noteRemainder: remainder },
    });
    // TODO - show note captured/save snackbar
    onClose();
  }, [note, activeSpace, onClose, remainder]);

  useHotkeys(
    'mod+enter',
    async () => {
      await handleSaveNote();
    },
    [note, remainder],
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
      {/* editor container  */}
      <div
        style={{
          height: COMMAND_PALETTE_SIZE.HEIGHT - 150 + 'px',
          maxHeight: COMMAND_PALETTE_SIZE.MAX_HEIGHT + 'px',
          width: COMMAND_PALETTE_SIZE.MAX_WIDTH - 100 + 'px',
        }}
        className="relative bg-brand-darkBg rounded-lg cc-scroll-bar">
        {/* editor */}
        <RichTextEditor
          placeholder={`Note... \n\n press {cmd + backspace} to go back`}
          content={note}
          onChange={setNote}
          userSelectedText={userSelectedText}
          setRemainder={setRemainder}
          rootDocument={iFrameDoc}
        />
      </div>
      {/* options container */}
      <div className="w-full bg-brand-darkBg/95 rounded-b-lg -mt-1.5 px-3 py-2 flex items-center justify-between ">
        {/* left container */}
        <div className="flex items-center justify-center space-x-2">
          {/* site domain */}
          {document.location.href ? (
            <motion.div
              {...bounce}
              className="flex items-center px-2 py-1 rounded-lg bg-brand-darkBgAccent/50 text-slate-300/80 text-[12px] font-medium mt-1.5">
              <GlobeIcon className="text-slate-500 scale-[1] mr-1.5" />
              <span className="">{cleanDomainName(document.location.hostname)}</span>
            </motion.div>
          ) : null}

          {/* remainder */}
          {remainder ? (
            <motion.div
              {...bounce}
              className="flex items-center px-2 py-1 rounded-lg bg-brand-darkBgAccent/50 text-slate-300/80 text-[12px] font-medium mt-1.5">
              <ClockIcon className="text-slate-500 scale-[1] mr-1.5" />
              <span className="capitalize">{remainder}</span>
            </motion.div>
          ) : null}
        </div>

        {/*  save note shortcut */}
        <div className="flex items-center mt-1.5">
          <button
            className="text-slate-400 text-[13.5px]  px-4 py-1 rounded-md bg-brand-darkBgAccent/50 select-none hover:bg-brand-darkBgAccent/50 duration-300 transition-colors"
            onClick={handleSaveNote}>
            Save
          </button>
          <span className="ml-2 flex items-center">
            <KBD modifierKey />
            <span className="font-bold text-slate-400/70 text-[13px] mx-[5px] select-none">+</span>
            <KBD>Enter</KBD>
          </span>
        </div>
      </div>
    </div>
  ) : (
    <></>
  );
};
export default CreateNote;
