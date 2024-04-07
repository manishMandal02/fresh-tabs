import { useState } from 'react';
import { motion } from 'framer-motion';
import { createPortal } from 'react-dom';
import { CounterClockwiseClockIcon, FileTextIcon, LapTimerIcon } from '@radix-ui/react-icons';

import injectedStyle from './domain-notes.css?inline';
import { INote } from '../../types/global.types';
import { DomainNotesContainerId } from '@root/src/constants/app';
import { useCustomAnimation } from '../../sidepanel/hooks/useCustomAnimation';
import { getTimeAgo } from '@root/src/utils/date-time/time-ago';

const AllNotesContainerId = 'all-notes-container';

type Props = {
  notes: INote[];
};

const DomainNotes = ({ notes }: Props) => {
  // local state
  const [showNotes, setShowNotes] = useState(true);

  const hideAllNotes = () => {
    setShowNotes(false);
    const domainNotesContainer = document.getElementById(DomainNotesContainerId);

    if (!domainNotesContainer) return;

    const allNotesContainer = domainNotesContainer.querySelector(`#${AllNotesContainerId}`);

    if (!allNotesContainer) return;

    allNotesContainer.replaceChildren();

    allNotesContainer.remove();
  };

  const handleClickOutsideNotesContainer = () => {
    hideAllNotes();
  };

  const createShadowRoot = () => {
    // notes container
    const notesContainer = document.getElementById(DomainNotesContainerId);
    const host = document.createElement('div');
    host.id = AllNotesContainerId;
    host.style.height = '100vh';
    host.style.width = '100vw';
    // 10 less than notes list container (highest z-index)
    host.style.zIndex = '2147483637';

    host.style.position = 'fixed';
    host.style.top = '0';
    host.style.left = '0';

    notesContainer.appendChild(host);

    host.addEventListener('click', handleClickOutsideNotesContainer);

    const shadowRoot = host.attachShadow({ mode: 'open' });

    const styles = document.createElement('style');

    styles.innerHTML = injectedStyle;

    shadowRoot.appendChild(styles);

    return shadowRoot;
  };

  const { bounce } = useCustomAnimation();

  return (
    <>
      <motion.div
        {...bounce}
        onClick={() => setShowNotes(prev => !prev)}
        className={`relative bg-gradient-to-br from-brand-darkBgAccent/90 to-brand-darkBg/95  flex items-center justify-center size-[55px] rounded-full select-none
                  border border-brand-darkBgAccent  shadow-md shadow-brand-darkBgAccent/80 cursor-pointer group`}>
        <div className="">
          <FileTextIcon className="text-slate-500 scale-[1.8] opacity-70 group-hover:opacity-80 duration-300 transition-opacity" />
          {!showNotes ? (
            <motion.span
              {...bounce}
              className={`absolute -top-[8px] right-0 text-slate-700 text-[12.5px] font-semibold px-2 py-[2px] rounded-full
                          bg-gradient-to-br from-brand-primary to-emerald-400 shadow shadow-brand-darkBg/70 `}>
              {notes?.length}
            </motion.span>
          ) : null}
        </div>
      </motion.div>
      {/* notes list view */}
      {showNotes
        ? createPortal(
            <motion.div {...bounce} className="notes-container">
              {notes.map(note => (
                <div key={note.id} className="note">
                  <p>{note.title}</p>

                  <div className="bottom-container">
                    <span>
                      <LapTimerIcon /> {getTimeAgo(note.remainderAt)}
                    </span>
                    <span>
                      <CounterClockwiseClockIcon /> {getTimeAgo(note.createdAt)}
                    </span>
                  </div>
                </div>
              ))}
            </motion.div>,
            createShadowRoot(),
          )
        : null}
    </>
  );
};

export default DomainNotes;
