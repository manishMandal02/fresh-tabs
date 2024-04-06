import { useState } from 'react';
import { motion } from 'framer-motion';
import { createPortal } from 'react-dom';
import { FileTextIcon } from '@radix-ui/react-icons';

import injectedStyle from './domain-notes.css?inline';
import { INote } from '../../types/global.types';
import { DomainNotesContainerId } from '@root/src/constants/app';
import { useCustomAnimation } from '../../sidepanel/hooks/useCustomAnimation';

type Props = {
  notes: INote[];
};

const DomainNotes = ({ notes }: Props) => {
  // local state
  const [showNotes, setShowNotes] = useState(false);
  const { bounce } = useCustomAnimation();

  const createShadowRoot = () => {
    // notes container
    const notesContainer = document.getElementById(DomainNotesContainerId);
    const host = document.createElement('div');
    notesContainer.appendChild(host);

    const shadowRoot = host.attachShadow({ mode: 'open' });

    const styles = document.createElement('style');

    styles.innerHTML = injectedStyle;

    shadowRoot.appendChild(styles);

    return shadowRoot;
  };
  return (
    <>
      <motion.div
        {...bounce}
        onClick={() => setShowNotes(prev => !prev)}
        className={`relative bg-gradient-to-br from-brand-darkBgAccent/90 to-brand-darkBg/95  flex items-center justify-center size-[55px] rounded-full select-none
                  border border-brand-darkBgAccent  shadow-md shadow-brand-darkBgAccent/80 cursor-pointer group`}>
        <div className="">
          <FileTextIcon className="text-slate-500 scale-[2] opacity-70 group-hover:opacity-80 duration-300 transition-opacity" />
          <span
            className={`absolute -top-[8px] right-0 text-slate-700 text-[12.5px] font-semibold px-2 py-[2px] rounded-full
        bg-gradient-to-br from-brand-primary to-emerald-400 shadow shadow-brand-darkBg/70 `}>
            {notes?.length}
          </span>
        </div>
      </motion.div>
      {/* notes list view */}
      {showNotes
        ? createPortal(
            <motion.div {...bounce} className="notes-container">
              {notes.map(n => (
                <p key={n.id}>n.title</p>
              ))}
            </motion.div>,
            createShadowRoot(),
          )
        : null}
    </>
  );
};

export default DomainNotes;
