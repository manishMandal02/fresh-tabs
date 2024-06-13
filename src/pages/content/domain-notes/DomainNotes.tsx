import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { createPortal } from 'react-dom';
import {
  CounterClockwiseClockIcon,
  Cross1Icon,
  FileTextIcon,
  LapTimerIcon,
  Pencil2Icon,
  PlusIcon,
  TrashIcon,
} from '@radix-ui/react-icons';

import { INote } from '../../../types/global.types';
import injectedStyle from './domain-notes.css?inline';
import { getTimeAgo } from '@root/src/utils/date-time/time-ago';
import { ContentScriptContainerIds } from '@root/src/constants/app';
import { useCustomAnimation } from '../../sidepanel/hooks/useCustomAnimation';

const AllNotesContainerId = 'all-notes-container';

type Props = {
  domainNotes: INote[];
  onNoteClick: (noteId: string, spaceId: string) => void;
  onNewNoteClick: () => void;
  onDeleteNoteClick: (noteId: string) => void;
  onClose: () => void;
};

const DomainNotes = ({ domainNotes, onNoteClick, onNewNoteClick, onDeleteNoteClick, onClose }: Props) => {
  // local state
  const [notes, setNotes] = useState<INote[]>([]);
  const [showNotes, setShowNotes] = useState(false);

  useEffect(() => {
    if (!domainNotes) return;

    setNotes(domainNotes);
  }, [domainNotes]);

  const hideAllNotes = () => {
    setShowNotes(false);
    const domainNotesContainer = document.getElementById(ContentScriptContainerIds.DOMAIN_NOTES);

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

  // delete note
  const handleDeleteNote = (noteId: string) => {
    setNotes(prev => prev.filter(note => note.id !== noteId));
    onDeleteNoteClick(noteId);
  };

  const { bounce } = useCustomAnimation();

  return (
    <>
      {/* note bubble */}
      <motion.div
        {...bounce}
        onClick={() => {
          if (notes?.length < 1) {
            onNewNoteClick();
            return;
          }

          setShowNotes(prev => !prev);
        }}
        className={`relative flex items-center justify-center size-[55px] rounded-full border border-brand-darkBgAccent group
                    bg-gradient-to-br from-brand-darkBgAccent/90 to-brand-darkBg/95 shadow-md shadow-brand-darkBgAccent/50 cursor-pointer select-none`}>
        <div>
          {notes.length > 0 ? (
            <FileTextIcon className="text-slate-600 scale-[1.8] group-hover:opacity-80 duration-300 transition-opacity" />
          ) : (
            <span className="relative">
              <Pencil2Icon className="text-slate-600 scale-[1.5] group-hover:opacity-80 duration-300 transition-opacity" />
            </span>
          )}

          {/* notes count */}
          {!showNotes ? (
            <>
              {/* show notes count if notes greater than 0 */}
              {notes.length > 0 ? (
                <motion.span
                  {...bounce}
                  className={`absolute flex  group-hover:hidden  -top-[8px] right-0 text-slate-700 text-[12.5px] font-semibold px-2 py-[2px] rounded-full
                            bg-gradient-to-br from-brand-primary to-emerald-400 shadow shadow-brand-darkBg/70 `}>
                  {notes?.length}
                </motion.span>
              ) : null}
              {/* eslint-disable-next-line jsx-a11y/click-events-have-key-events, jsx-a11y/no-static-element-interactions */}
              <motion.span
                {...bounce}
                onClick={ev => {
                  ev.stopPropagation();
                  onClose();
                }}
                className={`absolute hidden group-hover:block -top-[8px] -right-[1.5px] rounded-full bg-brand-darkBgAccent/60 p-[2px] w-fit group 
                          hover:bg-brand-darkBgAccent/80 [&>svg]:hover:text-slate-200 transition-colors duration-300`}>
                <Cross1Icon className="text-slate-300/90 scale-[0.7]  transition-colors duration-300" />
              </motion.span>
            </>
          ) : null}
        </div>
      </motion.div>
      {/* notes list view */}
      {showNotes
        ? createPortal(
            <motion.div {...bounce} className="notes-container cc-scrollbar">
              {/* new note button */}
              {/* eslint-disable-next-line jsx-a11y/click-events-have-key-events, jsx-a11y/no-static-element-interactions */}
              <div
                className="new-note"
                onClick={() => {
                  onNewNoteClick();
                }}>
                <PlusIcon />
              </div>
              {notes.map(note => (
                // eslint-disable-next-line jsx-a11y/click-events-have-key-events, jsx-a11y/no-static-element-interactions
                <div
                  key={note.id}
                  className="note"
                  onClick={() => {
                    onNoteClick(note.id, note.spaceId);
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
                  {/* delete */}
                  {/* eslint-disable-next-line jsx-a11y/click-events-have-key-events, jsx-a11y/no-static-element-interactions */}
                  <div
                    className="delete"
                    onClick={ev => {
                      ev.stopPropagation();
                      handleDeleteNote(note.id);
                    }}>
                    <TrashIcon />
                  </div>
                </div>
              ))}
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
  const notesContainer = document.getElementById(ContentScriptContainerIds.DOMAIN_NOTES);
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
