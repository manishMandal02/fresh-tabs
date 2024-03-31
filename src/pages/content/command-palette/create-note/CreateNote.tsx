import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useFrame } from 'react-frame-component';

import RichTextEditor, {
  EDITOR_EMPTY_STATE,
} from '@root/src/pages/sidepanel/components/elements/rich-text-editor/RichTextEditor';
import { useCustomAnimation } from '@root/src/pages/sidepanel/hooks/useAnimation';
import { cleanDomainName } from '@root/src/utils/url/get-url-domain';

type Props = {
  userSelectedText: string;
  onClose?: () => void;
};

const CreateNote = ({ userSelectedText }: Props) => {
  const { document: iFrameDoc } = useFrame();

  // local state
  const [note, setNote] = useState('');
  const [remainder, setRemainder] = useState('');

  useEffect(() => {
    setNote(EDITOR_EMPTY_STATE);
  }, [userSelectedText]);

  // TODO - create a note title

  const { bounce } = useCustomAnimation();

  return note ? (
    <div className="relative w-full max-h-[500px] h-fit bg-brand-darkBg rounded-lg cc-scroll-bar">
      {/* editor */}
      <RichTextEditor
        content={note}
        onChange={setNote}
        userSelectedText={userSelectedText}
        setRemainder={setRemainder}
        rootDocument={iFrameDoc}
      />
      <div className="absolute top-1.5 right-2 flex items-center justify-center space-x-2">
        {/* remainder */}
        {remainder ? (
          <motion.div
            {...bounce}
            className="flex items-center px-2.5 py-px rounded-lg bg-brand-darkBgAccent text-slate-300/80 text-[12px] font-medium shadow-md shadow-brand-darkBg/80">
            <span className="opacity-90 mr-1.5">⏰</span>
            <span className="text-brand-text">{remainder}</span>
          </motion.div>
        ) : null}
        {/* remainder */}
        {document.location.href ? (
          <motion.div
            {...bounce}
            className="flex items-center px-2.5 py-px rounded-lg bg-brand-darkBgAccent text-slate-300/80 text-[12px] font-medium shadow-md shadow-brand-darkBg/80">
            <span className="opacity-90 mr-1.5">⏰</span>
            <span className="text-brand-text">{cleanDomainName(document.location.hostname)}</span>
          </motion.div>
        ) : null}
      </div>
    </div>
  ) : (
    <></>
  );
};
export default CreateNote;
