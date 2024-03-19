import '@mdxeditor/editor/style.css';

import { useAtom } from 'jotai';
import { motion } from 'framer-motion';
import { useState, useEffect, useRef, useCallback } from 'react';
import {
  MDXEditor,
  headingsPlugin,
  quotePlugin,
  listsPlugin,
  linkPlugin,
  thematicBreakPlugin,
  markdownShortcutPlugin,
} from '@mdxeditor/editor';

import type { MDXEditorMethods } from '@mdxeditor/editor';

import { SlideModal } from '../../../elements/modal';
import { showAddNewNoteModalAtom } from '@root/src/stores/app';
import Spinner from '../../../elements/spinner';
import { wait } from '@root/src/pages/utils';
import { useKeyPressed } from '../../../../hooks/useKeyPressed';
import { parseStringForDateTimeHint } from '@root/src/pages/utils/date-time/naturalLanguageToDate';
import { useCustomAnimation } from '../../../../hooks/useAnimation';
import Checkbox from '../../../elements/checkbox/Checkbox';
import { InfoCircledIcon } from '@radix-ui/react-icons';
import Tooltip from '../../../elements/tooltip';
import { useNewNote } from './useNewNote';
import TextField from '../../../elements/form/text-field';

const NewNote = () => {
  // global state
  const [showModal, setShowModal] = useAtom(showAddNewNoteModalAtom);

  // local state
  const [note, setNote] = useState('');
  const [remainder, setRemainder] = useState('');
  const [shouldAddDomain, setShouldAddDomain] = useState(false);

  const editorRef = useRef<MDXEditorMethods>(null);
  const editorContainerRef = useRef<HTMLDivElement>(null);

  // logic hook

  const { inputFrom, snackbar, handleAddNote, handleOnPasteInDomainInput } = useNewNote({ remainder, note });

  console.log('🚀 ~ NewNote ~ inputFrom.formState.errors:', inputFrom.formState.errors);

  console.log('🚀 ~ NewNote ~  inputFrom.watch(domain):', inputFrom.watch('domain'));

  // init component
  useEffect(() => {
    if (!showModal.show) return;

    if (showModal.note) {
      setNote(showModal.note);
      editorRef.current.setMarkdown(showModal.note);
    }
    (async () => {
      await wait(50);

      editorRef.current?.focus(null, { defaultSelection: 'rootEnd' });
    })();
  }, [showModal]);

  const handleClose = () => {
    setShowModal({ show: false, ...(showModal.note ? { note: '' } : {}) });
    setNote('');
  };

  const { isModifierKeyPressed } = useKeyPressed({ monitorModifierKeys: true });

  // open links in editor with cmd/ctrl + click
  const handleAnchorClick = useCallback(ev => {
    const clickedEl = ev.target as HTMLElement;

    if (clickedEl.tagName === 'SPAN' && clickedEl.parentElement.tagName === 'A') {
      (async () => {
        await chrome.tabs.create({ url: (clickedEl.parentElement as HTMLAnchorElement).href, active: true });
      })();
    }
  }, []);

  // handle click in editor box after cmd is pressed
  useEffect(() => {
    if (!isModifierKeyPressed) return;
    const editorBox = editorContainerRef.current.querySelector('div[role="textbox"]');

    if (!editorBox) return;

    editorBox.addEventListener('click', handleAnchorClick);

    () => {
      if (!isModifierKeyPressed) {
        editorBox?.removeEventListener('click', handleAnchorClick);
      }
    };
  }, [isModifierKeyPressed, handleAnchorClick]);

  // check for data hint string for remainders
  useEffect(() => {
    // TODO -  debounce
    if (editorRef.current?.getMarkdown()?.length < 6) return;

    const res = parseStringForDateTimeHint(editorRef.current?.getMarkdown());

    // remove this date highlight class from other spans if applied
    const removeDateHighlightStyle = (removeAll = false) => {
      const allSpanWithClass = editorContainerRef.current?.querySelectorAll('span.add-note-date-highlight');

      if (allSpanWithClass?.length > (removeAll ? 0 : 1)) {
        for (const spanWithClass of allSpanWithClass) {
          // remove all the classes
          if (removeAll) {
            spanWithClass.classList.remove('add-note-date-highlight');
          } else {
            //  remove all expect the last one (last occurrence of date highlight)
            if (spanWithClass !== spanEl) {
              spanWithClass.classList.remove('add-note-date-highlight');
            }
          }
        }
      }
    };
    if (!res) {
      setRemainder('');
      removeDateHighlightStyle(true);
      return;
    }
    console.log('🚀 ~ useEffect ~ res:', res);

    // store the last occurrence of the date hint
    setRemainder(res.dateString);

    // find the date hint el and style it
    const span = document.evaluate(
      `//span[contains(., '${res.dateString}')]`,
      document,
      null,
      XPathResult.ANY_TYPE,
      null,
    );
    const spanEl = span.iterateNext();

    if (!spanEl) return;
    // add date highlight class
    (spanEl as HTMLSpanElement).classList.add('add-note-date-highlight');

    removeDateHighlightStyle();
  }, [note]);

  // animation
  const { bounce } = useCustomAnimation();

  return (
    <SlideModal title="New Note" isOpen={!showModal.show} onClose={handleClose}>
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
          <MDXEditor
            // eslint-disable-next-line jsx-a11y/no-autofocus
            autoFocus={{ defaultSelection: 'rootEnd' }}
            ref={editorRef}
            markdown={note}
            onChange={setNote}
            suppressHtmlProcessing={false}
            contentEditableClassName="prose !min-h-[16rem] !h-fit !max-h-[30rem] !w-full !px-[8px] !py-[6px] group"
            placeholder="Note..."
            plugins={[
              headingsPlugin({ allowedHeadingLevels: [1, 2, 3] }),
              quotePlugin(),
              listsPlugin(),
              linkPlugin(),
              thematicBreakPlugin(),
              markdownShortcutPlugin(),
            ]}
            className={`w-full h-fit !bg-brand-darkBgAccent/25 cc-scrollbar border border-transparent focus-within:border-slate-700/80 !overflow-y-auto rounded-md dark-theme [&_blockquote]:!text-slate-400 [&_strong]:!text-slate-300/80 [&_span:not(.add-note-date-highlight)]:!text-slate-300/80 [&_a>span]:!underline [&_p]:!my-0 [&_li]:!my-00 [&_blockquote]:!my-1.5 [&_h1]:!my-1 [&_h2]:!my-1 [&_h3]:!my-px [&_h4]:!my-px [&_h5]:!my-px [&_h6]:!my-px ${
              isModifierKeyPressed ? '[&_a]:!cursor-pointer [&_a]:!pointer-events-auto' : '[&_a]:!pointer-events-none'
            }`}
          />
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
              <label htmlFor="note-domain" className="text-slate-300 font-light text-[10xp] ml-1.5 select-none">
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
                ⏰ <span className="ml-[5px] text-slate-400/90 font-semibold text-[8px]">{remainder}</span>
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
            {snackbar.isLoading ? <Spinner size="sm" /> : 'Add Note'}
          </button>
        </form>
      </div>
    </SlideModal>
  );
};

export default NewNote;
