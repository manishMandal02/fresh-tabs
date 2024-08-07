import { CodeNode } from '@lexical/code';
import { useCallback, useRef, memo, useEffect } from 'react';
import { ListNode, ListItemNode } from '@lexical/list';
import { AutoLinkNode, LinkNode } from '@lexical/link';
import { $createQuoteNode, HeadingNode, QuoteNode } from '@lexical/rich-text';
import { HorizontalRuleNode } from '@lexical/react/LexicalHorizontalRuleNode';
import { $createLineBreakNode, $createParagraphNode, $createTextNode, $getRoot } from 'lexical';

import { debounce, logger } from '@root/src/utils';
import { LexicalEditor } from './lexical-editor/LexicalEditor';
import { parseStringForDateTimeHint } from '@root/src/utils/date-time/naturalLanguageToDate';

const EDITOR_NODES = [
  CodeNode,
  HeadingNode,
  AutoLinkNode,
  LinkNode,
  ListNode,
  ListItemNode,
  QuoteNode,
  HorizontalRuleNode,
];

type Props = {
  content: string;
  placeholder?: string;
  onChange: (content: string) => void;
  userSelectedText?: string;
  setRemainder?: (remainder: string) => void;
  rootDocument?: Document;
};

export const DATE_HIGHLIGHT_CLASS_NAME = 'add-note-date-highlight';

export const EDITOR_EMPTY_STATE =
  '{"root":{"children":[{"children":[],"direction":null,"format":"","indent":0,"type":"paragraph","version":1}],"direction":null,"format":"","indent":0,"type":"root","version":1}}';

const RichTextEditor = ({ content, onChange, userSelectedText, setRemainder, rootDocument, placeholder }: Props) => {
  const editorContainerRef = useRef<HTMLDivElement>(null);

  // remove date highlight class from other spans if applied
  const removeDateHighlightStyle = useCallback((spanElNode?: Node) => {
    const allSpanWithClass = editorContainerRef.current?.querySelectorAll(`span.${DATE_HIGHLIGHT_CLASS_NAME}`);

    if (allSpanWithClass?.length < 1) return;

    if (allSpanWithClass?.length > (!spanElNode ? 0 : 1)) {
      for (const spanWithClass of allSpanWithClass) {
        // remove classes from all span
        if (!spanElNode) {
          spanWithClass.classList.remove(DATE_HIGHLIGHT_CLASS_NAME);

          continue;
        }

        if (spanElNode && spanWithClass !== spanElNode) {
          //  remove all expect the last one (last occurrence of date highlight)
          spanWithClass.classList.remove(DATE_HIGHLIGHT_CLASS_NAME);
        }
      }
    }
  }, []);

  // add date highlight class
  const addDateHighlightStyle = useCallback(
    (dateString: string) => {
      const rootDocumentToSearch = rootDocument || document;

      // find the date hint el and style it
      const span = rootDocumentToSearch.evaluate(
        `//span[contains(., '${dateString}')]`,
        rootDocumentToSearch,
        null,
        XPathResult.ANY_TYPE,
        null,
      );
      const spanEl = span.iterateNext() as HTMLSpanElement;

      if (!spanEl) return null;

      // check if the "remind" keyword exists in the span text

      const text = spanEl.textContent?.toLowerCase() || '';

      removeDateHighlightStyle();

      if (text.toLowerCase().includes('remind')) {
        // add date highlight class
        spanEl.classList.add('add-note-date-highlight');

        return true;
      }

      return false;
    },
    [rootDocument, removeDateHighlightStyle],
  );

  const handleEditorChange = (note: string) => {
    // debounce  change handler
    onChange(note);

    if (!setRemainder) return;

    const res = parseStringForDateTimeHint(note);

    if (!res?.dateString) {
      // date hint not found, remove highlight class if added previously
      setRemainder('');
      removeDateHighlightStyle();
      return;
    }

    const dateHintString = res.dateString.replaceAll(' at ', ' @ ');

    // highlight the date hint
    let isHighlighted = false;

    const textHighlighted = addDateHighlightStyle(dateHintString);

    if (textHighlighted) {
      isHighlighted = true;
    } else {
      const textHighlightedTry2 = addDateHighlightStyle(dateHintString.replace(' @ ', ' at '));

      if (textHighlightedTry2) isHighlighted = true;
    }

    if (!isHighlighted) return;

    // set the last occurrence of the date hint

    setRemainder(dateHintString);
  };

  // check for data hint string for remainders
  const debouncedChangeHandler = debounce(handleEditorChange, 300);

  // add date highlight class for initial note content (edit/view note)
  useEffect(() => {
    if (!content) return;
    const res = parseStringForDateTimeHint(content);

    if (!res?.dateString) return;

    addDateHighlightStyle(res.dateString);
  }, []);

  return (
    <div
      id="editor-wrapper"
      ref={editorContainerRef}
      className={`relative prose h-full min-w-full prose-p:leading-[1.5rem] prose-a:text-slate-300/80 !caret-slate-200 prose-code:text-slate-400 prose-li:my-px prose-li:leading-[1.5rem] prose-ul:my-1 prose-hr:my-3 prose-hr:border-[1.1px]
                prose-hr:border-slate-700/80 prose-p:my-0 prose-headings:my-1 prose-blockquote:text-slate-400 prose-blockquote:my-[10px] text-slate-300/90  prose-headings:text-slate-300/80 prose-strong:!text-slate-300/80 prose-strong:!font-extrabold`}>
      <LexicalEditor
        onChange={debouncedChangeHandler}
        placeholder={placeholder || 'Note...'}
        config={{
          namespace: 'note-editor',
          nodes: EDITOR_NODES,
          editorState: !userSelectedText
            ? content
            : () => {
                const root = $getRoot();

                const quote = $createQuoteNode();

                const cleanedSelectedText = userSelectedText.replace(/(\n{3,})/gm, '\n\n');

                const quoteParagraphs = cleanedSelectedText.trim().split('\n');

                quoteParagraphs.forEach((para, idx) => {
                  const textNode = $createTextNode(para);
                  quote.append(textNode);
                  if (quoteParagraphs.length > 1 && idx !== quoteParagraphs.length - 1) {
                    quote.append($createLineBreakNode());
                  }
                });

                root.append(quote);

                const para = $createParagraphNode();

                para.append($createTextNode(''));

                root.append(para);

                root.selectEnd();
              },

          theme: {
            root: 'px-4 py-2 border-transparent bg-brand-darkBgAccent/20 border-2 cc-scrollbar overflow-y-auto rounded-md w-full h-full focus:outline-none focus-within:border-slate-600',
            link: 'cursor-pointer',
            text: {
              bold: 'font-semibold',
              underline: 'underline',
              italic: 'italic',
              strikethrough: 'line-through',
              underlineStrikethrough: 'underlined-line-through',
            },
            list: {
              listitemChecked: 'rich-text-editor__listItemChecked',
              listitemUnchecked: 'rich-text-editor__listItemUnchecked',
            },
          },

          onError: error => {
            logger.error({
              error,
              msg: 'LexicalEditor component onError callback',
              fileTrace: 'sidepanel/components/elements/rich-text-editor/RichTextEditor',
            });
          },
        }}
      />
    </div>
  );
};

export default memo(RichTextEditor);
