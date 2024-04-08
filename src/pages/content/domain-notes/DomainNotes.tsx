import { useState } from 'react';
import { motion } from 'framer-motion';
import { createPortal } from 'react-dom';
import { CounterClockwiseClockIcon, FileTextIcon, LapTimerIcon, PlusIcon } from '@radix-ui/react-icons';

import { INote } from '../../types/global.types';
import injectedStyle from './domain-notes.css?inline';
import { getTimeAgo } from '@root/src/utils/date-time/time-ago';
import { DomainNotesContainerId } from '@root/src/constants/app';
import { useCustomAnimation } from '../../sidepanel/hooks/useCustomAnimation';

const AllNotesContainerId = 'all-notes-container';

type Props = {
  notes: INote[];
  onNoteClick: (noteId: string) => void;
  onNewNoteClick: () => void;
};

const DomainNotes = ({ notes, onNoteClick, onNewNoteClick }: Props) => {
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

  // on click outside all notes container
  const handleClickOutsideNotesContainer = () => {
    hideAllNotes();
  };

  const { bounce } = useCustomAnimation();

  return (
    <>
      <motion.div
        {...bounce}
        onClick={() => setShowNotes(prev => !prev)}
        className={`relative bg-gradient-to-br from-brand-darkBgAccent/90 to-brand-darkBg/95  flex items-center justify-center size-[55px] rounded-full select-none
                  border border-brand-darkBgAccent  shadow-md shadow-brand-darkBgAccent/80 cursor-pointer group`}>
        <div>
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
                // eslint-disable-next-line jsx-a11y/click-events-have-key-events, jsx-a11y/no-static-element-interactions
                <div
                  key={note.id}
                  className="note"
                  onClick={() => {
                    onNoteClick(note.id);
                  }}>
                  <p>{note.title}</p>

                  <div className="bottom-container">
                    {note.remainderAt ? (
                      <span>
                        <LapTimerIcon /> {getTimeAgo(note.remainderAt)}
                      </span>
                    ) : null}
                    <span>
                      <CounterClockwiseClockIcon /> {getTimeAgo(note.createdAt)}
                    </span>
                  </div>
                </div>
              ))}
              {/* new note button */}
              {/* eslint-disable-next-line jsx-a11y/click-events-have-key-events, jsx-a11y/no-static-element-interactions */}
              <div
                className="new-note"
                onClick={() => {
                  onNewNoteClick();
                }}>
                <PlusIcon />
              </div>
            </motion.div>,
            createShadowRoot(handleClickOutsideNotesContainer),
          )
        : null}
    </>
  );
};

export default DomainNotes;

const createShadowRoot = (onCLose: () => void) => {
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

  host.addEventListener('click', onCLose);

  const shadowRoot = host.attachShadow({ mode: 'open' });

  const styles = document.createElement('style');

  styles.innerHTML = injectedStyle;

  shadowRoot.appendChild(styles);

  return shadowRoot;
};
